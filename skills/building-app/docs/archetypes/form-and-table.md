# Archetype: form-and-table

## Choose it when

People ENTER records and SEE them accumulate: "submit expenses", "log support requests", "register visitors". The verbs are submit, add, log, register, plus a "see what's been entered". The robot's job on submit is usually to push the record somewhere real (a spreadsheet, an ERP, an email). If each record then waits for someone's yes/no, that's approval-queue; if the entry point is a document upload the robot must read, that's document-review.

## Screens

- **submit** (`/`): one `Form` built from the action's params - `Field`s with `Select` / `NumberInput` / `TextArea` / `DatePicker`, an optional `FileUpload` for a receipt or attachment, and one primary submit `Button`. On success: `useToast` confirmation and a cleared form.
- **records** (`/records`): a `DataTable` of what's been submitted, newest first, `StatusBadge` per row if records have a lifecycle.

Sample data: a `SAMPLE_RECORDS` const of 6-10 rows spanning the categories.

## Backend shape

- One action: the submit. The robot validates nothing the form didn't already catch, does the real write, and responds with the stored record so the UI can show it instantly.
- One collection holds the records the table shows, keyed by an id the ROBOT mints (the browser must never invent record ids). `scope: "shared"` when the office sees one table; `scope: "user"` when each person should only see their own - ask the user only if the request truly doesn't say.
- One broadcast event on submit is optional; the collection delta already updates every open table. Add it only when someone should be actively nudged.

## `app.json` fragment

```jsonc
{
  "types": {
    "Expense": {
      "type": "object",
      "properties": {
        "id":           { "type": "string" },
        "category":     { "type": "string", "enum": ["Travel", "Meals", "Supplies", "Other"] },
        "amount":       { "type": "number" },
        "note":         { "type": "string" },
        "receipt":      { "$ref": "#/types/FileRef" },
        "submitted_at": { "type": "string", "format": "date-time" },
        "status":       { "type": "string", "enum": ["received", "booked"] }
      },
      "required": ["id", "category", "amount"]
    }
  },
  "actions": {
    "submitExpense": {
      "description": "Send in one expense with its receipt.",
      "params": {
        "type": "object",
        "properties": {
          "category": { "type": "string", "enum": ["Travel", "Meals", "Supplies", "Other"] },
          "amount":   { "type": "number" },
          "note":     { "type": "string" },
          "receipt":  { "$ref": "#/types/FileRef" }
        },
        "required": ["category", "amount"]
      },
      "result": { "$ref": "#/types/Expense" },
      "timeout_ms": 60000,
      "concurrency": { "mode": "queue", "limit": 1 }
    }
  },
  "events": {},
  "collections": {
    "expenses": {
      "description": "Every expense that has been sent in, newest first.",
      "record": { "$ref": "#/types/Expense" },
      "key": "id",
      "scope": "shared"
    }
  },
  "screens": {
    "submit":  { "description": "Fill in and send one expense.", "route": "/" },
    "records": { "description": "See everything that has been sent in.", "route": "/records" }
  }
}
```

The submit action is queued at 1 because the robot typically appends to one shared file or system; parallel appends to one spreadsheet lose rows. If the backend write is a true multi-client system, `{mode: "parallel", limit: 4}` is fine.
