# Archetype: document-review

## Choose it when

A DOCUMENT goes in, the ROBOT reads it, a PERSON checks and fixes the result: "upload invoices and pull out the numbers", "read the CVs and let me check them", "extract the contract details". The tell is upload + extract + confirm. This is the archetype that most shows off the robot (Power Apps cannot read a PDF). If there's no human confirmation step, it may just be a form-and-table with a `FileUpload`; if the human step is a pure yes/no on already-clean data, it's an approval-queue.

## Screens

- **inbox** (`/`): a `FileUpload` drop zone on top, a `DataTable` of processed documents below fed by `source={{ action: listDocuments }}`, with a `StatusBadge` (`pending` while extracting, `warn` when ready to check, `ok` when confirmed). Uploading immediately calls the extract action; show `Progress` fed by the action's progress while the robot reads.
- **review** (`/review`): the extracted fields as an editable `Form` (`Field` per extracted value, low-confidence ones visually flagged) next to the document's name, and one primary Confirm `Button` that calls the save action with the corrected values.
  - **The three moments are a `Stepper`**: upload, being read, check and confirm. This archetype's whole shape is a job with stages, and drawing them is what tells somebody halfway through where they are and what is still to come. Drive it from the screen's own state with `controls={false}`; the Confirm `Button` lives in the last `<Step>` (a `Stepper` runs no action of its own).
  - **What happened to this document is a `Timeline`**: uploaded, read, "the date was hard to read", confirmed. The table answers "which one" and this answers "what happened next", which is the question in front of somebody deciding whether to trust what was read. `status` on each entry colours the dot the same amber the rest of the app uses for a warning.
  - A document whose lines were extracted (an invoice's items, a delivery note's rows) gets a `FieldArray`, so the person can fix a line the robot mis-read, add one it missed and remove one it invented.

Sample data: a `SAMPLE_DOCUMENTS` const with a few rows in mixed statuses, so both screens render before any backend exists.

## Backend shape

- Extract is THE long action: `progress: true` (the robot narrates "reading page 2 of 5"), `cancellable: true` (people re-upload the wrong file constantly), a generous timeout, and `queue`/1 because one extraction engine or browser does the reading. The file travels as a `FileRef`; the flow fetches the bytes with `App Get File`.
- Save is a quick second action that writes the human-corrected fields to the system of record and flips the document's status.
- The flow records each thing that happens to a document as it happens (received, read, flagged, confirmed) and hands the list back with the document, so the review screen's `Timeline` shows what really happened rather than three moments the browser guessed.
- The documents and how far along each one is live in a database the flow owns (`Robomotion.SQLite` unless they belong in a system of record); the robot writes each one's state as it works. `listDocuments` hands the inbox one page at a time, and `documentReady` is what makes an inbox nobody is touching ask again.

## `app.json` fragment

```jsonc
{
  "types": {
    "FieldValue": {
      "type": "object",
      "properties": {
        "label":      { "type": "string" },
        "value":      { "type": "string" },
        "confidence": { "type": "number" }
      },
      "required": ["label", "value"]
    },
    "ReviewDoc": {
      "type": "object",
      "properties": {
        "id":     { "type": "string" },
        "file":   { "$ref": "#/types/FileRef" },
        "fields": { "type": "array", "items": { "$ref": "#/types/FieldValue" } },
        "status": { "type": "string", "enum": ["extracting", "ready", "confirmed"] }
      },
      "required": ["id", "file", "status"]
    }
  },
  "actions": {
    "listDocuments": {
      "description": "See the documents that have been dropped in and how far along each one is.",
      "params": { "type": "object" },
      "result": { "type": "object" },
      "timeout_ms": 30000
    },
    "extractDocument": {
      "description": "Read an uploaded document and pull out the key details for checking.",
      "params": {
        "type": "object",
        "properties": { "file": { "$ref": "#/types/FileRef" } },
        "required": ["file"]
      },
      "result": { "$ref": "#/types/ReviewDoc" },
      "timeout_ms": 180000,
      "concurrency": { "mode": "queue", "limit": 1 },
      "progress": true,
      "cancellable": true
    },
    "saveDocument": {
      "description": "Save the checked details so the document is done.",
      "params": {
        "type": "object",
        "properties": {
          "id":     { "type": "string" },
          "fields": { "type": "array", "items": { "$ref": "#/types/FieldValue" } }
        },
        "required": ["id", "fields"]
      },
      "result": {
        "type": "object",
        "properties": { "ok": { "type": "boolean" } }
      },
      "timeout_ms": 60000,
      "concurrency": { "mode": "queue", "limit": 1 }
    }
  },
  "events": {
    "documentReady": {
      "description": "The details of an uploaded document are ready to check.",
      "payload": {
        "type": "object",
        "properties": { "id": { "type": "string" } }
      },
      "audience": "broadcast"
    }
  },
  "screens": {
    "inbox":  { "description": "Drop documents in and watch the robot work through them.", "route": "/" },
    "review": { "description": "Check the details the robot found and fix anything wrong.", "route": "/review" }
  }
}
```
