# Backup and restore: every app that keeps data

An app's data lives on the robot's own disk: the SQLite file the flow opens
(`$Home$/<app-slug>-<first 8 of app_id>.db`) and, for some apps, a folder of
files it writes. Every app that stores anything ships the same four things, on
its **Settings** screen, from the first build:

1. **Where the data is.** The database path and size, the files folder, the
   backups folder, and any file the flow reads a key from (its path and whether
   it is there, never its contents).
2. **Back up now.** A consistent copy of the database (and the files folder),
   zipped with a small manifest into the backups folder, answered with the
   zip's path: "Backup is ready: /home/you/<app-slug>-backups/…zip".
3. **Restore.** The robot lists the zips in the backups folder; the person picks
   one. Nothing is uploaded through the browser: an app can be gigabytes, and
   the robot is already on the machine that holds the file. To bring in a
   backup from elsewhere, the person drops the zip into the backups folder and
   it appears in the list.
4. **Remove a backup**, behind a confirm.

The person asked for this across every app (2026-09-28): "take db, take files,
zip them, save them into a folder, notify backup is ready, go to this path…
importing should be possible… putting the backup into a folder and selecting
the file from the UI". The recipe below is the one built and tested in Query
Mill that day; copy it, change the names.

## The contract

```jsonc
"types": {
  "BackupFile": { "type": "object", "properties": {
    "id": { "type": "string", "description": "The file name without .zip." },
    "name": { "type": "string" }, "path": { "type": "string" },
    "size": { "type": "number", "description": "Bytes." }, "created_at": { "type": "number" } },
    "required": ["id", "name", "path", "size", "created_at"] },
  "KeyFile": { "type": "object", "properties": {
    "label": { "type": "string" }, "path": { "type": "string" }, "present": { "type": "boolean" } },
    "required": ["label", "path", "present"] },
  "Storage": { "type": "object", "properties": {
    "data_dir": { "type": "string" }, "db_path": { "type": "string" }, "db_size": { "type": "number" },
    "backups_dir": { "type": "string" },
    "key_files": { "type": "array", "items": { "$ref": "#/types/KeyFile" } },
    "backups": { "type": "array", "items": { "$ref": "#/types/BackupFile" } } },
    "required": ["data_dir", "db_path", "db_size", "backups_dir", "key_files", "backups"] }
},
"actions": {
  "getStorage":    { "params": { "type": "object", "properties": {} }, "result": { "$ref": "#/types/Storage" } },
  "listBackups":   { "params": { "type": "object", "properties": {} },
                     "result": { "type": "object", "properties": { "rows": { "type": "array", "items": { "$ref": "#/types/BackupFile" } } }, "required": ["rows"] } },
  "createBackup":  { "params": { "type": "object", "properties": {} },
                     "result": { "type": "object", "properties": { "id": {…}, "name": {…}, "path": {…}, "size": {…}, "message": {…} }, "required": [...] },
                     "timeout_ms": 300000, "progress": true, "concurrency": { "mode": "queue", "limit": 1 } },
  "restoreBackup": { "params": { "type": "object", "properties": { "name": { "type": "string" } }, "required": ["name"] },
                     "result": { "type": "object", "properties": { "restored_from": {…}, "safety_backup": {…}, "message": {…} }, "required": [...] },
                     "timeout_ms": 300000, "progress": true, "concurrency": { "mode": "queue", "limit": 1 } },
  "removeBackup":  { "params": { "type": "object", "properties": { "id": { "type": "string" } }, "required": ["id"] },
                     "result": { "type": "object", "properties": { "id": { "type": "string" } }, "required": ["id"] } }
}
```

Name them exactly so. `robomotion app smoke` takes back what a pass created only
when **all three** hold, and each one cost a round of guessing to find:

- the create answers `{ id }`, and the id is the bare file name, **without
  `.zip`** (an id with the extension was reported as "no id");
- a `list<Thing>` action answers `{ rows }` whose rows carry that `id`, so the
  pass can see the record is new;
- the delete is `remove<Thing>` and takes `{ id }`, accepting the id with or
  without `.zip`.

`mcp.json`: `getStorage` and `listBackups` `read_only: true`; `createBackup`
`read_only: false`; `restoreBackup` and `removeBackup` `read_only: false,
destructive: true`, with "only when the person asks for that exact backup;
confirm first" in their sentence.

## The robot's side (the Settings subflow)

Add `f.addDependency('Robomotion.Compression', '<version>')` to `main.ts`
(`robomotion describe package Robomotion.Compression` names the version).

Paths, in the first Function of each action, built from `$Home$` in code
(system variables only resolve in Functions):

```js
var home = global.get('$Home$');

msg.db_file = '<app-slug>-<id8>.db';
msg.db_path = home + '/' + msg.db_file;
msg.db = 'Data Source=' + msg.db_path + ';Version=3;';
msg.backups_dir = home + '/<app-slug>-backups';
```

**Taking a backup** is one chain behind a `Core.Flow.Label` ("Take A Backup"),
reached by `createBackup` and by `restoreBackup` (for its safety copy):

| Step | Node | Notes |
|---|---|---|
| Where the copy goes | Function | `staging = backups_dir + '/.staging-' + Date.now().toString(36)`, `snapshot`, `manifest_path`, `zip_path`, the manifest text (`{ app, app_id, database, created_at }`) |
| Make sure the tables exist | `Robomotion.SQLite.NonQuery` | so a brand-new app has a file to copy |
| Make the backups folder | `Core.FileSystem.Create` `optType: 'directory'`, `continueOnError: true` | it fails when the folder exists; that is fine |
| Make a working folder | `Core.FileSystem.Create` directory | |
| Copy the database safely | `Robomotion.SQLite.NonQuery` `func: VACUUM INTO '{{{snapshot}}}'` | a consistent snapshot while the app keeps running; never copy the live file |
| Write what the backup is | `Core.FileSystem.WriteFile` `optMode: 'truncate'` | the manifest |
| Zip it | `Robomotion.Compression.Archive` `inArchiveType: 'Zip'`, `inSourcePath: Message('zip_sources')` (an **array** `[snapshot, manifest_path]`, plus the files folder when the app has one), `optMkdirAll: true` | an array keeps the files at the zip's root |
| Tidy the working folder | `Core.FileSystem.Delete` `optRecursive: true`, `continueOnError: true` | |
| Measure the backup | `Core.FileSystem.Stat` | `size` is on the result |
| Backup or restore | Function `outputs: 2` | output 0 answers `createBackup`, output 1 carries on the restore |

Name the file in **local time** (`<app-slug>-backup-YYYYMMDD-HHMMSS.zip`, built
with `getFullYear()`/`getHours()`…): `toISOString()` gives UTC, and a person
looking for "this afternoon's backup" does not find it.

**Restoring** checks first, saves second, swaps last:

1. The name must match `/^[A-Za-z0-9._-]+\.zip$/` and contain no `..`: a
   refusal otherwise. The robot only ever reads from the backups folder.
2. `Core.FileSystem.PathExists` on the zip; refuse when it is gone.
3. `Robomotion.Compression.Unarchive` into `backups_dir + '/.restore-<stamp>'`.
4. `PathExists` on the unpacked database: **a zip without it is not a backup of
   this app**. Tidy the unpacked folder and refuse, "Nothing was changed".
   Check before the safety backup, or every refused attempt leaves one more
   "before-restore" zip behind (seen live).
5. Only now, GoTo "Take A Backup" with the name
   `…-before-restore.zip`, so a restore can always be undone.
6. `Core.FileSystem.Delete` the live database, `Core.FileSystem.Move` the
   unpacked one into its place (and the files folder the same way), tidy.
7. Answer `{ restored_from, safety_backup, message }`.

No restart is needed: the SQLite nodes open the file by its connection string
on every step, so the next press reads the restored data. The screen offers
"Reload the app" so every open list shows it.

`listBackups` / `getStorage`: `Core.FileSystem.Create` the folder
(continueOnError), then `Core.FileSystem.List` with `inNameFilter:
Custom('\\.zip$')`, `optSort: 'modifiedlatest'`, `optTop: 0` (all),
`optSize`/`optModTime`/`optAbsolutePath: true`; skip directories, and read
`name`, `size`, `modTime` defensively (`f.size || f.Size`). `getStorage` adds a
`Core.FileSystem.Stat` of the database and a `PathExists` per key file.

Every `Robomotion.Apps.Progress` on a chain that more than one action or a
timer can reach gets `continueOnError: true`: a Progress with no call to report
to fails, and a failed step drops the message.

## The screen

A `BackupCard` component on Settings, loading `getStorage` on open:

- `DescriptionList` of the paths, each with a `CopyButton`, and a
  `StatusBadge` Found / Missing per key file.
- A primary "Back up now" button in the card header (`action={createBackup}`);
  on success a `toast` ("Backup is ready", the path, `durationMs: 10000`) and
  an `Alert` that stays, with the path and "Copy the path".
- A `DataTable` of the backups (name, made, size) with **Restore** and
  **Delete** buttons as columns, each opening a `ConfirmDialog` that carries
  the action. Restore's description says the current data is saved first.
- After a restore, an `Alert` with the message and a "Reload the app" button
  (`window.location.reload()`).
- The empty state names the backups folder: "put a backup zip into … and it
  shows up here".
- `Progress` from whichever of backup/restore is running.

Hide the card while `useConnection().state === "unconfigured"`: there is no disk
to describe before a robot exists.

## Checks to add to `request-checks.md`

- Settings shows the database path and size, the backups folder, and each key
  file as Found or Missing.
- Back up now answers with the zip's path; the zip holds the database and the
  manifest; no working folder is left in the backups folder.
- A record added after a backup is gone after restoring that backup, the app
  answers without a restart, and a "before-restore" zip exists.
- A zip without the database is refused and nothing changes (no new zip either);
  a name with `..` is refused.
- Remove takes a backup out of the list.
