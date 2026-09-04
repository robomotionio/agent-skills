---
name: building-app
description: "Builds a Robomotion App - a real React web app plus a robot backend - by conversation with a non-technical person. Owns the full lifecycle: clarify → contract (app.json) → screens with sample data → live preview in ~90s → backend actions → publish. Use when the user wants an app, dashboard, portal, form, approval queue, or any screens people will click."
triggers: [an app, the app, my app, web app, webapp, a dashboard, dashboard for, approval queue, internal tool, a portal, user interface, a screen where, a page where, a form for, a form where, little app, small app, simple app, /\bapps?\b/, /\bdashboards?\b/, /\bportals?\b/]
---

# Robomotion App Builder

A Robomotion App is two artifacts a non-technical person creates by talking to you:

- a **frontend**: a real React SPA in its own repo (`app-<appID>`), composed only from `@robomotion/app-kit`
- a **backend**: a Robomotion flow running on their robot, one `App Action` trigger per action

They are joined by one file, **`app.json`**, and talk over a typed action-RPC. The robot is the differentiator: this app can open a browser, drive a desktop program, read a PDF. Lovable can't; Power Apps can't.

Two things decide whether this conversation goes well: **how fast the person sees the first pixel**, and **whether your words leak jargon**. Everything below serves those two. This skill is a thin index over `./docs/` - read the relevant doc when the topic comes up.

## The contract is the spine

`app.json` at the repo root is the **single source of truth** for actions, events, collections, types, and screens. Typegen ripples every change into both projects:

```
app/src/generated/actions.gen.ts     ← SPA: typed client + CONTRACT_HASH
flow/src/generated/actions.gen.ts    ← flow: param/result types per action
```

Any behavior change starts in `app.json`, then regenerate, then touch screens and flow. Changing `app.json` without regenerating leaves both sides referencing types that no longer exist, so `tsc` fails inside `validate_app` before anything ships. **Drift is a compile error, never a runtime surprise.** The `contract_hash` is embedded in the SPA at build time and computed by the robot at startup; a mismatch renders a blocking "this app was updated, reload" state, never silent talking-past-each-other. Authoring guide: `./docs/contract.md`.

## Workflow (tuned for time-to-first-pixel)

Narrate progress through `todo_write`, with items phrased in the user's language ("Design the review screen", "Teach the robot to read invoices") - never internal steps ("run typegen", "start dev server").

**The tools, in the order you need them:** `create_app` (once, first) -> `sync_app` -> `save_app` -> `create_app_robot` (only with a yes, see below) -> `start_app_session` -> `validate_app` -> `publish_app`. There is no `push_app` step: the app half of every save is sent to Robomotion when your turn ends, whether or not you ask, so calling it yourself only makes the person wait twice. `list_apps` finds an existing app; `app_dev_server` controls the preview process. Never write app or flow files before `create_app` has returned - there is no working copy to write into until it has.

0. **Create the app first.** Call `create_app` with a short human name and, WHEN YOU ARE ALREADY IN A FLOW, its id as `flowId` - in the Build view you always are, and omitting it binds the app to a different flow than the one on the user's screen. It returns `app_id`, `flow_id` and the local paths, and clones both working copies. Then `sync_app` before you read or write anything. Continuing an existing app instead? `list_apps`, then `sync_app`.

0b. **Clarify - at most 3 questions, total.** Use `ask_user_question` with quick replies, ONE question per turn. Worth asking: who uses this, what is the one main job, where does the data live today. Never ask about technology, hosting, colors, or frameworks. If the request already answers a question, don't ask it.
1. **Pick an archetype silently**: dashboard / approval-queue / form-and-table / document-review. Match by what the person wants to DO, not the words they used - the chooser table is in `./docs/archetypes/` (one file per archetype). Never say the archetype name to the user; say what you're building: "I'll make you an app with two screens: a queue of waiting invoices, and a page to approve each one."
2. **Write `app.json`** - read `./docs/contract.md` first. Every `description` line doubles as the Designer's UI copy, so write it for the end user.
2b. **Clear out the demo the app arrived with.** A new app already renders something, and every file of that demo is written against the seed's contract - it imports types from `src/generated/actions.gen`. Your `app.json` deletes those types, so **any leftover file fails `tsc` inside `validate_app`, including one that nothing imports any more**. Deleting the screens you noticed is not enough. After you have written your own screens, ask the checkout what is still pointing at the contract:

    grep -rl "generated/actions.gen" src/

    Anything it lists that you did not write is debris from the demo: delete it. `src/screens.tsx` tells you which screens the app actually mounts, so anything unreachable from there goes too, whether or not it still compiles.
3. **Generate the screens from the archetype, with sample data baked in.** Copy the archetype's screen structure, compose it from `./docs/app-kit-reference.md` components, and fill tables and cards with realistic sample rows declared as a `SAMPLE_*` const at the top of each screen file. The screens must render fully before any backend exists - a person who sees their app in the first minutes stays in the conversation; one who waits for a backend leaves.

3a. **Sample data is a FALLBACK, never a switch. Every button is wired to its
   real action from the first draft.** Write the sample rows as what the table
   shows when there is no answer yet:

   ```tsx
   const rows = search.data?.matches ?? SAMPLE_MATCHES;   // yes
   <Form action={search} ...>                             // always the real one
   ```

   Never a mode constant, and never anything that makes the action
   conditional:

   ```tsx
   const SAMPLE_MODE = true;                              // NO
   <Form action={SAMPLE_MODE ? undefined : search} ...>   // NO - dead button
   ```

   **The app template's `OverviewPage.tsx` does exactly this**, and it is the
   one thing in that file you must not copy. A build did copy it: `SAMPLE_MODE`
   stayed `true`, the Search button submitted nothing for ever, five invented
   rows sat in the table, and every check was green - `tsc`, `validate_app` and
   the model's own review all pass an app whose button is not connected to
   anything, because nothing about it is a type error. The person was told
   "those sample rows go away as soon as the robot is connected", which was
   not true and could never become true.

   There is nothing for a mode flag to do. Before a session exists the kit
   already shows "Not connected to your robot yet. The screens below show
   sample data." at the top of the app, and an action that cannot reach a
   robot fails honestly and says so. A wired button on a draft app is correct;
   an unwired one is a mockup you will tell somebody is an app.
3b. **Every view that waits on the robot renders THREE states, always: loading,
   empty, and failed.** Not two. A price-watch app built without the third one
   showed `Loading` under its table for ever after the backend stopped
   mid-action - no message, no retry, nothing to tell the person that the
   thing they were waiting for was never coming. Ten minutes later it still
   said `Loading`. The runtime times a call out after 30s and rejects the
   promise; if the screen has nowhere to put that rejection, the person is
   left with a spinner that means "broken" and reads as "nearly there".

   Use the kit's `ErrorState` for the failure and `EmptyState` for "nothing
   here yet" (`./docs/app-kit-reference.md`), and give the failure a button
   that tries again. A screen where the loading branch is the only branch is
   not finished.

4. **`save_app`.** It records the app's working copy and saves the flow behind it - the half the robot actually runs. The app's own copy goes to Robomotion when the turn ends, on its own; do not call `push_app` to make that happen sooner, because nothing between here and the end of the turn reads it. Then bring the preview up, tell the person to look at it, and say that the numbers are sample data until their robot is connected.
4b. **`robomotion app codegen`** whenever `app.json` changes, before writing code against it. Run it from the app folder; it regenerates both typed clients and prints the contract hash.

5. **Build the flow backend, one action at a time**, in the order the user will click them. For each action: `App Action` trigger → the real work → `App Respond` on EVERY path (an unresponded call only ends by timeout, which the user experiences as a hung button). Long work sends `App Progress`. The generated `flow/src/generated/actions.gen.ts` gives you the param/result types. Flow SDK mechanics (node grammar, browser, credentials) are the `creating-flow` skill - use it.

### The flow side, exactly

The general node grammar belongs to `creating-flow`, but these eight types ship
only in this package, and hunting for them costs a search round every build.
`f.node` takes the **type**, never the display name:

| Type | Shows as | What you actually set |
|---|---|---|
| `Robomotion.Apps.Action` | App Action | `optActionName` - the action's name in `app.json` |
| `Robomotion.Apps.Respond` | App Respond | nothing; it answers with `msg.result` |
| `Robomotion.Apps.RespondError` | App Respond Error | `optCode`, `optRetryable`, **`inMessage`** - the sentence the person reads, see below |
| `Robomotion.Apps.Progress` | App Progress | `optPercent` |
| `Robomotion.Apps.EmitEvent` | App Emit Event | `optEventName`, `optAudience` |
| `Robomotion.Apps.UpdateData` | App Update Data | `optCollection`, `optOperation`, `inRecord` - **never `inKey`**, see below |
| `Robomotion.Apps.GetFile` | App Get File | `optDownloadDir` |
| `Robomotion.Apps.SaveFile` | App Save File | nothing |

One complete action, start to finish:

```ts
import { flow, Message } from '@robomotion/sdk';

flow.create('<flowId>', '<Flow Name>', (f) => {
  f.addDependency('Robomotion.Apps', '0.1.5');

  f.node('a3c1f9', 'Robomotion.Apps.Action', 'Search Call', { optActionName: 'search' })
    .then('b8e274', 'Core.Programming.Function', 'Do The Work', {
      func: 'msg.result = { hits: [] };\nreturn msg;',
    })
    .then('c4d952', 'Robomotion.Apps.Respond', 'Send Results', {});
}).start();
```

The caller's arguments arrive as **`msg.params.<field>`**; the answer is whatever
sits on **`msg.result`** when `App Respond` runs. Both shapes are already typed
for you in `flow/src/generated/actions.gen.ts`.

`App Action` is a trigger, so it has no input port and the validator reports it
as an unreachable node. `App Respond` and `App Respond Error` end a path, so it
reports them as dead ends. Both warnings are expected on every app. Never
restructure the flow to silence either.

**`App Respond Error` needs a message.** Its message input defaults to empty,
and a build that left it empty put this on screen:

> **Couldn't work that out**
> [Try again]

with nothing between the two - a person told that something failed and never
told what, while the reason ("Charge to must be higher than charge now") sat in
the robot's log. Give it the reason, in the words the person would use:

```ts
.then('f9a4c6', 'Robomotion.Apps.RespondError', 'Say What Went Wrong', {
  optRetryable: true,
  inMessage: Message('error.message'),   // the caught error, or better:
})
```

Better still on a branch you can predict, write the sentence yourself -
`inMessage: Custom('Those percentages are the wrong way round.')` - because the
error text was written for you and the message is read by them. Never pass a
raw stack: `Error: x at main (main.js)` on a screen is a bug report, not an
answer.

An action that calls a website uses `Core.Net.HttpRequest`, which is not in this
package and is the one node worth naming here so you do not spend a search
round on it.

### Writing to a collection: leave `inKey` out

`App Update Data` with `optOperation: 'upsert'` takes the record's key **from
the record**, using the `key` field the collection declares in `app.json`. That
is the whole design - the node reads it for you.

```ts
.then('b1c2d3', 'Robomotion.Apps.UpdateData', 'Add To List', {
  optCollection: 'items',
  optOperation: 'upsert',
  inRecord: Message('result'),        // and nothing else
})
```

**Never write `inKey: Custom('id')`.** `Custom(x)` is a fixed value, not a field
selector, so that stores every record under the literal string `"id"`: each add
lands on the same record and replaces the one before it. The person sees only
the last thing they saved, a reload does not bring the others back, and nothing
in the flow or the robot's log looks wrong - the robot did exactly what it was
told. This has already destroyed a real app's data once.

When you do need a key - a DELETE is the case where it is the whole point -
it comes from the caller, and **the caller's fields arrive under `msg.params`**:

```ts
.then('d4e9f0', 'Robomotion.Apps.UpdateData', 'Remove From List', {
  optCollection: 'items',
  optOperation: 'delete',
  inKey: Message('params.id'),      // NOT Message('id') - that reads nothing
})
```

The key you send has to be the collection's **`key` field**, the same value the
record was stored under. From `Robomotion.Apps` 0.1.5 a delete whose key is not
one the collection holds **fails**, saying so:

    "jobs" has no record with the key "row-3", so nothing was deleted

That error is not a platform failure and there is nothing to retry. It means
the screen is sending a different value than the one the collection is keyed
by - the row's array index instead of its id, or a field the record does not
have. Fix the key at the screen, or fix the `key` field in `app.json`. Before
0.1.5 that same mistake removed nothing and answered ok, so the row stayed on
screen and no layer said a word; a loud error is the fix, not the fault.

### An upsert REPLACES the record. Half a record destroys it.

`optOperation: 'upsert'` writes the record it is given, whole. It does not
merge. So a button that changes one field of an existing row has to send
**every field that row has**, or the fields it left out are gone.

A build shipped exactly this. `app.json` declared `setPaid` with six params
(id, vehicle, work, date, cost, paid), the flow rebuilt the whole record from
them correctly, and the screen sent two:

```tsx
params: (row: Job) => ({ id: row.id, paid: true }),    // NO - four fields die
params: (row: Job) => ({ ...row, paid: true }),        // yes - the whole row
```

One press turned `Blue Van | Tyres | 2026-09-10 | 480.00` into
`- | - | - | 0.00`, and the totals line above it into "Unknown 0.00". It
survives a reload, because the robot did exactly what it was told. Nothing
failed: the action returned ok, no node errored, no log line looks wrong.

**So: a row action that toggles or edits a field spreads the row.** And when
you change what an action takes, change all three halves in the same breath -
`app.json`, the flow's record-building step, and every screen that calls it.
The one that was forgotten here was the screen, and it was forgotten in the
same turn the other two were deliberately changed to carry the whole row.
`validate_app` reports a call site that passes fewer fields than `app.json`
declares; do not wave that through.

`Message('id')` reads `msg.id`, which nothing has set, so the node deletes
nothing - and answers as if it had. One build shipped exactly that: the
person pressed Returned, every node in the path ran, the app said it was
done, and the row was still there after a reload. Nothing in the flow or the
robot's log looks wrong, because the robot did what it was told.
`validate_app` fails a literal `inKey` that names the collection's key field,
and `read_app_data` shows what each record is actually stored under - use it the
moment someone says an app is losing or not showing saved data, before touching
the screens.

Note what the example does **not** have: an ending. No `Core.Flow.Stop`, no
`Core.Flow.End`. The flow is the app's backend and stays up forever behind the
screens (hard rule 5) - the last node on every path is its `App Respond` or
`App Respond Error`. This is the single easiest way to ship an app that works
exactly once, so check for it before you save.
6. **`start_app_session`.** Creates a draft instance and starts the flow on the LOCAL robot; the preview's buttons now hit a real robot. Delete each `SAMPLE_*` const as its backend action comes alive. The buttons need no change, because step 3a wired them to the real action from the start; if changing one is what makes it work, the app was a mockup until now and you have just found that out later than the person would have.

6a. **If it says the app has no robot of its own, the question is a CARD, not a
   sentence.** This is the last question of the build, it arrives at the end of
   a long summary, and **five builds out of six have asked it in prose** -
   which leaves the person with a paragraph ending in a question mark and
   nothing to press. Call `ask_user_question`. Exactly this shape:

       ask_user_question
         header:    "Robot"
         question:  "Your app needs a robot to run on. Shall I set one up?"
         options:   "Yes, set it up"  /  "Not now"

   The **header** is a word the person reads too, and it is the one that got
   away: three builds asked with a card and one titled its card "App robot".
   The word is "Robot". Not "App robot", not "App-robot", not "Robot slot".

   Writing the same words into your reply instead is not a different spelling
   of the same thing, it is the fault. And the word is **"robot"** - never
   "app-robot", never "one of your app-robot slots", never "application_lc".
   The person owns robots; slots and types are our bookkeeping, and naming
   them here is the exact vocabulary that had to be removed from the run
   dialog. **The same holds in your closing summary**, which is where it came
   back: one build ended "it has its own robot now (2 of your 4 robot slots in
   use)". Nobody asked what it cost. Say what it costs only if they ask, and
   then say "robots", not "slots".
7. **`validate_app`.** Fix until clean. It compiles both projects against the contract, checks the schema, and checks the dependency allowlist.
8. **Offer to publish.** Never publish unasked. When the person says yes, `publish_app`.

## Stay inside your own app, and use the tools

`create_app` and `sync_app` return the paths for THIS app: `<apps>/<appId>/app`
and `<apps>/<appId>/flow`. Work only in those.

- **Never read, glob or grep another app's folder.** The apps directory holds
  every app on this machine. A pattern like `*/flow/main.ts` walks all of them,
  wastes the whole turn, and risks copying one person's app into another's.
  Anchor every path at the two you were given.
- **Never compute the contract hash yourself, and never shell out to `python`,
  `node -e` or `jq` to do it.** Run `robomotion app codegen` in the app folder:
  it writes both `actions.gen.ts` files from `app.json` and prints the hash.
  `robomotion app hash` prints just the hash. Hand-hashing gets a different
  answer than the server's canonicalisation, which blocks the app from
  connecting with `contract_mismatch` - and python is not installed on most
  people's machines. `robomotion` is the tool that is always present; do not
  reach for `bun run`, `npm run` or `npx` to do a job it already does.
- Prefer the app tools over raw shell generally: `sync_app`, `save_app`,
  `validate_app`, `app_dev_server` each do one job properly.
- **`archetypes/` in the app repo is reference material.** It is not compiled
  and not checked; leave it where it is. Never delete it and never edit
  `tsconfig.json` to work around it.
- **You cannot press the buttons.** The preview is signed in as the person,
  not as you, so the only way an action runs for real is that THEY press it.
  Never try to call an action yourself: no hand-written websocket message, no
  reading the runtime's compiled source to work out the wire format, and never
  open `credentials.yaml` or any other secret. To prove an action end to end,
  ask them to press it and watch with `poll_logs` on the `studio_id` that
  `start_app_session` returned - a Debug or Log step in the flow arrives there
  as a `debug` event, with the value in it. One observed build spent four
  minutes disassembling the runtime bundle to fake a call it was never going
  to be allowed to make.
- **When something fails, read the robot's error BEFORE explaining it.**
  `poll_logs` on the app session's `studio_id` carries the node that failed
  and why, in the robot's own words. Diagnosing from the shape of the symptom
  instead produces confident fiction. Observed, in full: a person said "I
  added a product but the table just says Loading and nothing happens", and
  the reply was

  > The connection between the app and the robot had dropped - when we
  > stopped the stuck task, the app's link went down with it, so your "add
  > product" press never reached the robot.

  The press had reached the robot. `Add Product`, `Build New Product` and
  `Save Product` had all run, and `Save Product` failed on `no such table:
  products`. The session was restarted, the person was asked to try again,
  and they hit the identical wall - now believing it had been fixed once
  already. A wrong explanation is worse than none: it spends their trust and
  sends them back into the same failure. If the logs say nothing, say that,
  and say what you are going to try next.

  **Read the logs BEFORE restarting anything.** `start_app_session` mints a
  NEW `studio_id`, and the failure the person is describing happened under
  the old one - restart first and you are polling a clean, empty log, which
  reads exactly like "the press never arrived". That is how the same wrong
  answer gets given three times in a row while the robot's own log has said
  `no such table: products` since the first attempt. Poll the session that
  was live when it broke; restart afterwards, if at all. `node_error` is a
  `poll_logs` event like any other - the failing node and its message are
  there for the asking.
- **Never show identifiers.** App ids, flow ids, commit shas, contract hashes,
  file names and node property names are yours, not the person's. "The app is
  created" - not "The app was created (id `0cfd...`)".

## Hard rules

Each rule carries its reason. The reason is why you don't route around the rule when it feels inconvenient.

0. **The harness installs the packages.** `create_app` and `sync_app` place `@robomotion/app-kit` and `@robomotion/apps-runtime` beside the app and run the install; their result carries a `packages_warning` if that did not work. Never symlink, copy or `bun install` packages by hand, and never borrow them from another app's checkout - if something looks missing, run `sync_app` and read its warning.
1. **Every control that runs an action declares it.** A button, upload zone or form that makes the robot do something takes the action through the kit's `action` prop (`<Button action={greet} params={{ name }}>`), or spreads `bindAction(greet)` when it must keep its own handler. Never write `onClick={() => greet.run(...)}` on its own: the Build view then cannot link the control to its step, the connections map reports the action as unlinked, and the person is told the button they can see does not exist. See `./docs/app-kit-reference.md`.
1. **Kit-only.** Compose `@robomotion/app-kit` components plus Tailwind classes for layout. Never write a new UI primitive, never add an npm dependency, never edit `vite.config.ts` or the dependency list. The allowlist is exactly: `react`, `react-dom`, `@robomotion/app-kit`, `@robomotion/apps-runtime`, and the dev toolchain - `validate_app` fails on anything else. Reason: a prompt-built app that can pull arbitrary packages becomes a codebase nobody can review; the kit is also what keeps every screen themed, dark-mode aware, and accessible without you doing anything.
2. **Actions only through the generated typed stubs.** `src/generated/actions.gen.ts` exports one hook per action, `use<Action>()` (for `greet`: `const greet = useGreet()`), plus `<Action>Params` / `<Action>Result` types; `greet.data` is typed and `<Form action={greet}>` / `<Button action={greet}>` link the control. Use those. Never write `useAction("name")` yourself - untyped, its `data` is `{}` and `tsc` fails on the first field you read. Collections and events use `useCollection` / `useEvent` with the generated types. Never hand-write transport, never invent a message format, never call `app.call` from screen code. Reason: the old app system died because clients hand-invented protocols over a raw channel and drift was discovered by users in production; the stubs make a contract change break `tsc` instead of a person.
3. **One component per file, flat directories, no barrel files.** `src/pages/Review.tsx`, `src/components/InvoiceCard.tsx` - that's the whole depth. Reason: "make that button green" must resolve to exactly one file from the route context; barrels and deep nesting break targeted edits and make hot reload touch more than it should.
4. **Never hand-edit generated files.** Anything under `src/generated/` is regenerated from `app.json`; edit `app.json` and regenerate. Reason: the next regeneration silently erases your edit, and an edited file no longer matches `contract_hash`, which blocks the app from connecting at all.
5. **An app flow never ends. It is the backend, not a script.** It comes up with the app session and stays up for as long as the app lives, serving every press of every button by every person. So no path may end it: **never `Core.Flow.Stop`, never `Core.Flow.End`**, and never a "finish", "cleanup" or "done" step that reaches one. Every path finishes at its `App Respond` or `App Respond Error` and goes no further; anything that has to happen after answering (closing a browser, deleting a temp file) belongs before that node, not after a stop. Reason: a flow that stops once it has answered leaves an app that looks perfect and is dead on the second press. The first person to try it gets their results; everyone after that is told "The robot for this app is not connected", which blames the robot for something the flow did to itself, and the screen keeps the previous results under the new question so the failure even reads as a success. This is not hypothetical: a search app returned ten real results, stopped itself, and refused every search after that.

   **An unhandled error ends the flow just as surely as a `Stop` node, so
   every app backend needs `Core.Trigger.Catch` wired to an `App Respond
   Error`.** Without it the first node that throws takes the whole app down -
   not that action, the app. A price-watch backend died on its very first
   press because one node hit `no such table: products`; every node in the
   flow then closed, the caller was never answered, and the screen sat on
   `Loading` for ever. One typo in one query, and an app that had just been
   built was permanently dead with nothing on screen to say so. Catch turns
   that into a message on the one action that failed, with the app still
   serving every other button.

6. **If the flow stores anything, it creates its own storage first.** The same
   price-watch backend wrote products into a SQLite file that had no
   `products` table, because nothing had made one. Whatever holds the data -
   a table, a file, a folder - is created on a path that runs before the
   first write and is safe to run again (`CREATE TABLE IF NOT EXISTS`, a
   directory check). An app whose first save is its first crash never gets a
   second chance from the person who just built it.

   **On every path that touches it, not one of them.** Told to fix exactly
   this, one build added `CREATE TABLE IF NOT EXISTS products` - and wired it
   into the "check prices" path only, while the failure was on "add product".
   The very next press failed identically. A person adds their first item
   before they ever run a check, so the path they reach first is the one that
   has to be ready. Either put the setup at the start of every path that
   reads or writes, or run it once where the flow comes up, before any
   trigger can be served.

   **And when a first save does nothing, read the flow before you read the
   session.** Asked twice more to fix that same app - once with the person
   saying in as many words "this is the very first thing I have done in this
   app; I have never pressed Check prices now" - the assistant spent both
   turns on sessions and restarts (32 shell calls, five log polls, zero reads
   of its own flow) and told them "nothing had ever successfully run, so the
   table had nothing to show". The robot's log had said
   `no such table: products` since the first press.

   A button that answers nothing on a brand-new app is a setup question until
   proved otherwise. Open the flow, follow the path that button runs, and
   check the storage it writes to is created on THAT path. That costs one
   read. Restarting the session costs the person another round trip and tells
   you nothing you did not already know.

7. **Saving is `save_flow` and `save_app`. Never git by hand.** `git add`,
   `git commit`, `git push`, `git reset` and the rest are refused inside the
   checkouts; reading (`git status`, `git log`, `git diff`) is free. Reason:
   the save tools commit the right files, write the message, and write the
   trailers that pair the app with the flow it was built against - which is
   what every check downstream reads. A commit made by hand writes none of
   that, so the checks then disagree about what was saved. Three of them once
   called a backend saved that git had never seen, and the next sync deleted
   it. Ten bash failures across three observed builds were this exact reach
   around the product.

## The preview loop

Full protocol: `./docs/preview-loop.md`. The short version:

- `app_dev_server` is your native tool: `start` (idempotent), `stop`, `status`, `logs`, `get_preview_errors`. The preview appears in the person's app preview panel by itself; never tell them to open a link, and never quote a `127.0.0.1` address (their robot may be on another machine). If they ask where the app lives, give the address from the tool result.
- **Route context.** When the person navigates the preview, the current route arrives silently prepended to their next message. "Make that button green" resolves against the screen they are LOOKING AT - use that route, don't guess across screens, and don't ask which screen when the context already says.
- **After EVERY edit batch, call `get_preview_errors` before telling the user you're done.** Reporting success on a preview that is throwing is worse than reporting the error. It answers in two parts - what the dev server compiled, and what the BROWSER reported (a wrong import name, a crash on first render, a rejected promise). The browser half is empty until the preview has actually loaded the screens, so "nothing from the browser" on a page nobody has opened is not a clean bill of health: say the build is clean and ask what they see.

## Say it like a person

Jargon leaking into narration is the single most common quality failure on this surface. The person sees screens, buttons, and a robot. Talk about those.

| Never say | Say instead |
|---|---|
| node, trigger node | a step, or name the work: "the robot reads the PDF" |
| flow | what the robot does: "the robot's side", "the automation" |
| component, widget | the actual thing: "the button", "the table", "the form" |
| endpoint, API, RPC | "where the data comes from", "the connection to the robot" |
| instance | "your app" |
| websocket, socket | "the connection" |
| validate, validation | "check that everything fits together" |
| headless | "in the background" |
| frontend, backend, SPA | "your app" / "the robot" |
| repo, commit, push | "saved" |
| collection, schema, contract | "your list of X", "the plan of your app" (or say nothing) |
| mock data | "sample data" |
| deploy | "make it live", "publish" |

Wrong: "I added a trigger node for the approve endpoint and validated the flow."
Right: "The Approve button works now. When you press it, the robot records the decision."

Wrong: "The websocket dropped so the component can't reach the backend instance."
Right: "Your app lost its connection to the robot. Reconnecting now."

Wrong: "I'll regenerate the contract types and restart the dev server."
Right: "One moment, I'm updating your app to match the change."

**Between steps, say only what you DID or are ABOUT TO DO.** Never think aloud
to the person: no "Let me check the pspec", no weighing of options, no quoting
your own rules back at them ("that satisfies 'renders fully before any backend
exists'"), and no plan items read out as narration. That reasoning belongs in
your thinking, which they never see. Every one of those lines was on screen in
a real build, in front of somebody who had asked for a bill splitter, and a
line they cannot act on reads as something having gone wrong.

**One answer on screen at a time.** When an action fails, the previous result
goes; when it succeeds, the previous error goes. The hooks do this for you -
`data` and `error` from an action hook are mutually exclusive - so render
whichever is set and never keep your own copy of the last result beside them.
A wrong answer sitting under a red error card is worse than no answer, and one
has been seen surviving a whole session.

## Ask vs decide

Ask ONLY when the request genuinely matches more than one thing: two screens both have a "Send" button, "the report" could be either of two tables, an "approve" could mean one item or all filtered items. Then `ask_user_question` with 2-4 quick replies, one question per turn. Everything else: pick the sensible default and say what you picked in one line ("I put the newest items at the top - tell me if you'd rather sort by amount"). A person asked three questions in a row stops answering; a person told what was chosen corrects you for free.

## An app for the flow that is already open

An app is a set of screens plus exactly ONE flow behind it. When a project is
already open, `flow_context` tells you which case you are in - decide from it,
do not ask blindly:

| `flow_context` says | What to do |
|---|---|
| `app_id` is set | This flow already backs an app. Continue THAT app - `list_apps` / `sync_app`, never `create_app`. |
| `node_count` is 0 | An empty project. Use it as the new app's backend: `create_app` with its `flowId`. |
| `node_count` > 0, no `app_id` | Genuinely ambiguous - **ask**. |

Only the third row earns a question, and it is a real one: that flow is somebody's
working automation with its own trigger, and giving it app screens means changing
how it starts. Put it in their terms, not ours - "Add screens to the automation
you have open, or start a fresh project with its own automation?" - with those two
as the quick replies. Never say "flow_context", "node_count" or "trigger".

If they choose the open automation, pass its flow id to `create_app` as `flowId`
so the app adopts it instead of scaffolding a second one.

## When things fail

| Situation | Do this |
|---|---|
| `get_preview_errors` returns a build error | Fix it, re-check, only then reply. Never paste a stack trace at the user; say "fixing a mistake I made on the review screen". |
| Runtime error in the preview (`rm-app-error`) | Same fix-and-recheck. The Designer already auto-retries at most twice per user message - work within that, don't loop forever. |
| An action times out | The call ALWAYS terminates (robot-side watchdog), so a hung button means a wrong `timeout_ms` or a path that never reaches `App Respond`. Long robot work (browser, PDF): raise `timeout_ms` in `app.json` and set `progress: true`, then send `App Progress` from the flow so the wait is visible. |
| Robot is offline (`robot_offline` state or error) | It's retryable and the kit's `ConnectionBanner` already shows it. Tell the person plainly: "Your robot is offline - start it and the buttons will work again." Do NOT rebuild or edit anything. |
| **The app's OWN robot shows as offline in `list_robots`** | **This is never the reason a button did nothing, so never give it as one.** Every app owns a robot of type `application_lc`, named after the app. Nothing ever connects as it - it is a quota row, and it is offline by design, permanently. The preview runs on the robot already connected to this computer. It is also the first thing anybody looking for a fault will find, which is why it has been given as a confident wrong answer three times in observed builds. Look at what actually failed instead: `poll_logs` on the app's session, and the robot's own log. |
| The buttons do nothing and the app says "The robot for this app is not connected" - about a robot that IS connected and running the flow | The chat path and the app path are different transports, and this message comes from the app one. Do not rebuild anything and do not blame the robot. The two causes seen live: the flow stopped itself (see rule 5 - an app flow never ends), or the robot's app connection was churning while the page's key exchange was in flight, in which case the robot's log says `dropping <type> for unknown conn ... (no key exchange yet)` and a reload of the app gets a fresh key. Say what you found; if it is the second, say the connection dropped and ask them to reload the preview. |
| `start_app_session` says the app has no robot of its own | Expected on a brand-new app: a draft does not get a robot until somebody asks to run it. **Ask with `ask_user_question`, then act** - question "Your app needs a robot to run on. Shall I set one up?", replies "Yes, set it up" / "Not now". **Prose is not an acceptable spelling of this question** (step 6a): asking it in a sentence at the end of your summary leaves the person nothing to press, and it is what five builds of six did. The word is "robot" - not "app-robot", not "app-robot slots". On yes: `create_app_robot` and then `start_app_session` **in the same turn** - the preview runs on the robot that is already on this computer, so there is nothing for them to start and nothing to wait for. Never end the turn on "now start that robot": one build did, and the person was sent looking in a tray for a robot that does not appear there and does not need to. On no: stop there and say the preview still shows the screens with sample data. Never call `create_app_robot` without the yes: it spends one of a small number of slots in their workspace. |
| `create_app_robot` says the workspace is full | Give them the numbers it returns and the one way out - deleting an app robot they no longer use frees a slot, from Manage robots. Do not delete anything yourself and do not retry. |
| `start_app_session` says the robot is busy | Another app's DRAFT preview is freed for you automatically, so if you still see this, what holds the robot is something else - a published app, a schedule, or a run the person started. Name it if the result does, ask whether to stop it, and stop it only if they say yes. |
| `start_app_session` did not start (robot not connected, or it did not take the run) | Say it in one sentence and **end your turn**: "Your robot isn't running - start it and tell me, and I'll connect the app." Do NOT retry, do NOT call `stop_flow`, do NOT inspect packages, the package server or the network: the tool result already says what happened, and one observed build spent six minutes and three retries proving the same thing. When the person says the robot is up, call `start_app_session` once more. |
| `queue_full` / `concurrency_rejected` | Backpressure, both retryable. If it recurs, the action's `concurrency` is wrong for how it's used - see `./docs/contract.md`. |
| `validate_app` fails with type errors naming generated types | You changed `app.json` without regenerating, or a generated file was hand-edited. Regenerate; never patch the generated file. |
| `validate_app` fails on a dependency | Something outside the allowlist crept into `package.json`. Remove it and compose from the kit instead. |
| `validate_app` fails on the schema | A field in `app.json` breaks a rule (naming, limits, banned words in descriptions). Fix per `./docs/contract.md`. |
| Preview shows the "app was updated, reload" state | The SPA and the robot hold different contract builds. Regenerate both sides from the current `app.json`, push, and bounce the session; the reload notice is the mismatch protection working, not a bug. |

## Docs

| Topic | Doc |
|---|---|
| Composing screens: every kit component with a usage example | `./docs/app-kit-reference.md` |
| Authoring `app.json`: naming, action vs collection, timeouts, concurrency, descriptions | `./docs/contract.md` |
| The preview loop in detail: dev server, route context, self-check, draft backend | `./docs/preview-loop.md` |
| Dashboard archetype | `./docs/archetypes/dashboard.md` |
| Approval-queue archetype | `./docs/archetypes/approval-queue.md` |
| Form-and-table archetype | `./docs/archetypes/form-and-table.md` |
| Document-review archetype | `./docs/archetypes/document-review.md` |

## Related skills

- `creating-flow` - the flow SDK grammar for the backend (node IDs, wiring, browser, credentials, data tables)
- `exploring-browser` - map a live website before the backend automates it
- `searching-packages` - find the right package/node for a backend action
