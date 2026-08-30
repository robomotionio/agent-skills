# Archetype: approval-queue

## Choose it when

Things WAIT for a person's DECISION: "approve invoices", "sign off requests", "review and accept or decline". The verbs are approve, reject, review, sign off. There is a pile, and each item leaves the pile by a human yes/no. If the items arrive as uploaded documents that the robot must first read, prefer document-review; if nobody decides anything, it's a dashboard.

## Screens

- **queue** (`/`): a `DataTable` of everything waiting, with a `StatusBadge` per row and a row action opening the review screen. `EmptyState`: "Nothing waiting for you" - for this archetype the empty state is the GOAL state, make it feel like one.
- **review** (`/review`): one item in a `Card` - all fields, the document if there is one, and two buttons: Approve (`variant="primary"`) and Reject (`variant="danger"`, with a reason `TextArea`).

Sample data: a `SAMPLE_QUEUE` const of 5-8 realistic waiting items.

## Backend shape

- One shared collection is the queue itself, keyed by the item's business id. The robot fills it (from mail, ERP, folder watch) and removes items as decisions land - screens never mutate the queue directly, they call the decision actions.
- Two actions, approve and reject. They write the decision into one shared system of record, so queue them at limit 1: two decisions racing through one browser session corrupt each other.
- One broadcast event announces each decision, so every open queue screen sees the item leave immediately and colleagues don't double-review.

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
  "collections": {
    "queue": {
      "description": "Invoices waiting for a decision.",
      "record": { "$ref": "#/types/Invoice" },
      "key": "number",
      "scope": "shared"
    }
  },
  "screens": {
    "queue":  { "description": "See every invoice waiting for a decision.", "route": "/" },
    "review": { "description": "Look at one invoice and approve or reject it.", "route": "/review" }
  }
}
```
