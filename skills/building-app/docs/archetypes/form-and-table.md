# Archetype: form-and-table

## Choose it when

People ENTER records and SEE them accumulate: "submit expenses", "log support requests", "register visitors". The verbs are submit, add, log, register, plus a "see what's been entered". The robot's job on submit is usually to push the record somewhere real (a spreadsheet, an ERP, an email). If each record then waits for someone's yes/no, that's approval-queue; if the entry point is a document upload the robot must read, that's document-review.

## Screens

- **submit** (`/`): one `Form` built from the action's params - `Field`s with `Select` / `NumberInput` / `TextArea` / `DatePicker`, an optional `FileUpload` for a receipt or attachment, and one primary submit `Button`. On success: `useToast` confirmation and a cleared form.
  - **A picker over more than about twenty things is a `Combobox`, not a `Select`.** Customers, suppliers, countries, staff: a native select cannot be searched and stops being usable long before the list stops growing. `loadOptions` asks the flow as the person types, for a list too big to hand over at all.
  - **A record with a variable number of somethings is a `FieldArray`**: an expense with several lines, a booking with several guests, an order with several items. The form's value at that name is a real array and the contract declares it `{"type": "array", "items": {…}}`, so the flow loops over it. Never keep the rows in the screen's own `useState` beside the form.
  - Short free words that repeat (labels, tags, recipients) are a `TagInput`, which writes a string array - never a `TextInput` split on commas in the flow.
  - A form long enough that somebody would give up is a `Stepper`: two or three steps, the submit `Button` in the last one.
  - When the fields are **not fixed** - the person says the shape changes every time, or it varies by category - declare the action's `params` as the open shape (`{ "type": "object" }`) and give the form a `JsonInput` instead of inventing a field list that will be wrong. A form with three known fields and one free-form bag gets three real inputs and one `JsonInput`, not one `JsonInput` for the lot.
- **records** (`/records`): a `DataTable` of what's been submitted, fed by `source={{ action: listExpenses }}` and ordered newest first by the query, `StatusBadge` per row if records have a lifecycle.

Sample data: a `SAMPLE_RECORDS` const of 6-10 rows spanning the categories.

When the records are worked in batches rather than read one at a time, the records table takes `selectable` + `bulkActions` and `exportable`, the same as the approval-queue's.

## Backend shape

- One action: the submit. The robot validates nothing the form didn't already catch, does the real write, and responds with the stored record so the UI can show it instantly.
- The records live in a database the flow owns - `Robomotion.SQLite` by default, or the system they belong in (a spreadsheet, an ERP) when they belong somewhere - with the id minted by the ROBOT (the browser must never invent record ids). A second action, `listExpenses`, gives the table one page at a time. Whether the office sees one table or each person sees only their own is a condition in that query, decided by the flow from something it can trust and never from a value the screen sends; ask the user only if the request truly doesn't say.
- One broadcast event on submit is optional. The submitter's own table is refreshed by the submit button (`tableRef.refresh()`, in the kit reference), so the event is for everybody ELSE's screen. Add it when a colleague should see the new row without reloading.

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
    "listExpenses": {
      "description": "See the expenses that have been sent in, newest first.",
      "params": { "type": "object" },
      "result": { "type": "object" },
      "timeout_ms": 30000
    },
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
  "screens": {
    "submit":  { "description": "Fill in and send one expense.", "route": "/" },
    "records": { "description": "See everything that has been sent in.", "route": "/records" }
  }
}
```

The submit action is queued at 1 because the robot typically appends to one shared file or system; parallel appends to one spreadsheet lose rows. If the backend write is a true multi-client system, `{mode: "parallel", limit: 4}` is fine.
