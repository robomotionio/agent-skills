# Archetype: approval-queue

## Choose it when

Things WAIT for a person's DECISION: "approve invoices", "sign off requests", "review and accept or decline". The verbs are approve, reject, review, sign off. There is a pile, and each item leaves the pile by a human yes/no. If the items arrive as uploaded documents that the robot must first read, prefer document-review; if nobody decides anything, it's a dashboard.

## Screens

- **queue** (`/`): a `DataTable` fed by `source={{ action: listQueue }}` so the flow filters and pages, with a `StatusBadge` per row and a row action opening the review screen. `EmptyState`: "Nothing waiting for you" - for this archetype the empty state is the GOAL state, make it feel like one.
  - **A pile is worked in batches.** Give the table `selectable` with a `rowKey` and a `bulkActions` entry per decision that can be made without reading the item ("Approve", "Reject"), so somebody who can see eighty routine ones clears them in one press instead of eighty. The action is handed either the ticked keys or `{allMatching, filter}` when the person chose "select all N" over a paged source; declare its params open and read whichever half arrived. `exportable` gives them the pile as a spreadsheet when somebody upstream asks what is waiting.
  - Never build a checkbox column and an array of ticked ids by hand: keyed selection is what keeps the ticks on the right records when the page turns.
- **review** (`/review`): one item in a `Card` - all fields, the document if there is one, and two buttons: Approve (`variant="primary"`) and Reject (`variant="danger"`, with a reason `TextArea`). A `Timeline` of what has already happened to the item earns its place here whenever the flow knows: who sent it, what the robot checked, why it was flagged.

Sample data: a `SAMPLE_QUEUE` const of 5-8 realistic waiting items.

## Backend shape

- The queue lives in a database the flow owns - `Robomotion.SQLite` when the items are the app's own, whichever database package fits when they already live somewhere. The robot fills it (from mail, ERP, folder watch) and marks each item decided as the decisions land; screens never write to it, they call the decision actions.
- Two read actions. `listQueue` gives the queue screen one page at a time, so the filtering and the ordering happen in the query; `getInvoice` gives the review screen the one item it is showing, so that screen still has its item after a reload.
- Two decision actions, approve and reject. They write the decision into one shared system of record, so queue them at limit 1: two decisions racing through one browser session corrupt each other.
- One broadcast event announces each decision, so every open queue screen asks again and the item leaves immediately, and colleagues don't double-review.

## `app.json` fragment

```jsonc
{
  "types": {
    "Invoice": {
      "type": "object",
      "properties": {
        "number":   { "type": "string" },
        "supplier": { "type": "string" },
        "amount":   { "type": "number" },
        "due_date": { "type": "string", "format": "date" },
        "document": { "$ref": "#/types/FileRef" }
      },
      "required": ["number", "supplier", "amount"]
    }
  },
  "actions": {
    "listQueue": {
      "description": "See the invoices that are still waiting for a decision.",
      "params": { "type": "object" },
      "result": { "type": "object" },
      "timeout_ms": 30000
    },
    "getInvoice": {
      "description": "Open one invoice with all of its details.",
      "params": {
        "type": "object",
        "properties": { "number": { "type": "string" } },
        "required": ["number"]
      },
      "result": { "$ref": "#/types/Invoice" },
      "timeout_ms": 30000
    },
    "approveInvoice": {
      "description": "Approve one invoice so it moves on for payment.",
      "params": {
        "type": "object",
        "properties": { "number": { "type": "string" } },
        "required": ["number"]
      },
      "result": {
        "type": "object",
        "properties": { "ok": { "type": "boolean" } }
      },
      "timeout_ms": 60000,
      "concurrency": { "mode": "queue", "limit": 1 }
    },
    "approveMany": {
      "description": "Approve everything that was ticked, or everything a filter matches.",
      "params": {
        "type": "object",
        "properties": {
          "ids":          { "type": "array", "items": { "type": "string" } },
          "all_matching": { "type": "boolean" },
          "filter":       { "type": "string" }
        }
      },
      "result": {
        "type": "object",
        "properties": { "approved": { "type": "integer" } },
        "required": ["approved"]
      },
      "timeout_ms": 120000,
      "concurrency": { "mode": "queue", "limit": 1 }
    },
    "rejectInvoice": {
      "description": "Reject one invoice and record why.",
      "params": {
        "type": "object",
        "properties": {
          "number": { "type": "string" },
          "reason": { "type": "string" }
        },
        "required": ["number", "reason"]
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
    "invoiceDecided": {
      "description": "Someone approved or rejected an invoice.",
      "payload": {
        "type": "object",
        "properties": {
          "number":   { "type": "string" },
          "decision": { "type": "string", "enum": ["approved", "rejected"] }
        }
      },
      "audience": "broadcast"
    }
  },
  "screens": {
    "queue":  { "description": "See every invoice waiting for a decision.", "route": "/" },
    "review": { "description": "Look at one invoice and approve or reject it.", "route": "/review" }
  }
}
```
