# Archetype: document-review

## Choose it when

A DOCUMENT goes in, the ROBOT reads it, a PERSON checks and fixes the result: "upload invoices and pull out the numbers", "read the CVs and let me check them", "extract the contract details". The tell is upload + extract + confirm. This is the archetype that most shows off the robot (Power Apps cannot read a PDF). If there's no human confirmation step, it may just be a form-and-table with a `FileUpload`; if the human step is a pure yes/no on already-clean data, it's an approval-queue.

## Screens

- **inbox** (`/`): a `FileUpload` drop zone on top, a `DataTable` of processed documents below with a `StatusBadge` (`pending` while extracting, `warn` when ready to check, `ok` when confirmed). Uploading immediately calls the extract action; show `Progress` fed by the action's progress while the robot reads.
- **review** (`/review`): the extracted fields as an editable `Form` (`Field` per extracted value, low-confidence ones visually flagged) next to the document's name, and one primary Confirm `Button` that calls the save action with the corrected values.

Sample data: a `SAMPLE_DOCUMENTS` const with a few rows in mixed statuses, so both screens render before any backend exists.

## Backend shape

- Extract is THE long action: `progress: true` (the robot narrates "reading page 2 of 5"), `cancellable: true` (people re-upload the wrong file constantly), a generous timeout, and `queue`/1 because one extraction engine or browser does the reading. The file travels as a `FileRef`; the flow fetches the bytes with `App Get File`.
- Save is a quick second action that writes the human-corrected fields to the system of record and flips the document's status.
- One shared collection holds the documents with their extraction state; the robot updates it as it works, so the inbox updates live for everyone.

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
  "collections": {
    "documents": {
      "description": "Uploaded documents and how far along each one is.",
      "record": { "$ref": "#/types/ReviewDoc" },
      "key": "id",
      "scope": "shared"
    }
  },
  "screens": {
    "inbox":  { "description": "Drop documents in and watch the robot work through them.", "route": "/" },
    "review": { "description": "Check the details the robot found and fix anything wrong.", "route": "/review" }
  }
}
```
