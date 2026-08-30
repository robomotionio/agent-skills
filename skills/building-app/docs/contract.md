# Authoring `app.json` well

`app.json` is read by three consumers at once: codegen (typed client for the SPA), the flow (one `App Action` trigger per action, param validation, timeouts), and the Designer (the human-readable action and screen lists). Write every line for all three. The machine-checkable rules live in the platform schema; this doc is about writing a GOOD contract, not merely a valid one.

## Skeleton

```jsonc
{
  "schema": "robomotion.app/v1",
  "app_id": "…",                    // written at scaffold time. NEVER edit.
  "flow_id": "…",                   // written at scaffold time. NEVER edit.
  "name": "Invoice Approvals",
  "description": "Review and approve supplier invoices pulled from the ERP.",
  "auth": "workspace",
  "theme": { "accent": "#FF4F00" },
  "types": { … },
  "actions": { … },
  "events": { … },
  "collections": { … },
  "screens": { … }
}
```

## Naming

- Actions, events, collections, screens: camelCase starting lowercase (`approveInvoice`, `queue`). Types: PascalCase (`Invoice`). The schema rejects anything else.
- Name actions as **the user's verb**: `approveInvoice`, `submitExpense`, `extractDocument`. Not `doApproval`, not `postDecision`, not `handleSubmit`. The name becomes a typed function the screens call and a line in the Designer; both read best as a verb phrase.
- Events are **past tense**: `invoiceApproved`, `expenseSubmitted`. An event announces something that already happened.
- Collections are the **noun the user says**: `queue`, `expenses`, `documents`.

## Action vs collection vs event

Choosing wrong here is the most expensive contract mistake, so decide deliberately:

- **Collection**: state that screens WATCH. Keyed records, live-updating, one snapshot ≤ 2000 records. "The invoices waiting", "this month's expenses". The robot maintains it with `App Update Data`; every subscribed screen sees the change without asking.
- **Action**: something the robot DOES once, on request. "Approve this one", "extract that PDF", "fetch page 3 of the archive". Anything bigger or more parameterized than a 2000-record snapshot is an action with paging params, not a collection.
- **Event**: a nudge that someone should REACT now, when a collection change alone doesn't say it. "An invoice over 10k arrived." If the screens would only use it to refetch data that a collection already delivers, you don't need the event.

`collections.<name>.key` must be a field that is genuinely unique per record (`number`, `id`). `scope`: `shared` is one dataset for everyone; `user` is one per identity ("my submissions"). Default to `shared`; use `user` only when two people must NOT see each other's records.

## Event audience

`connection` (the one socket that caused it) · `client` (every tab of that browser) · `user` (every device of that person) · `broadcast` (everyone on the app). Default `broadcast`. Pick narrower when the payload is only meaningful to the person who acted - a "your export is ready" belongs to `user`, not to the whole office.

## Timeouts, progress, cancellation

`timeout_ms` defaults to 30000, max 600000. Size it to what the robot actually does:

| The robot… | timeout_ms | progress | cancellable |
|---|---|---|---|
| looks something up, writes a record | default 30000 | false | false |
| drives a browser or desktop app | 120000 | true | false |
| reads/extracts a document | 120000-180000 | true | true |
| crunches a big batch | up to 600000 | true | true |

Set `progress: true` on anything that regularly runs past ~10 seconds, and actually send `App Progress` from the flow - a long silent wait looks broken even when it isn't. Set `cancellable: true` when the work is long AND the person may realistically change their mind (an upload-and-extract, a batch). Cancellation in v1 is soft: the robot's work finishes but its result is discarded, so don't promise "stopped the robot" - say "cancelled, I'll ignore the result".

## Concurrency

Default is `{mode: "parallel", limit: 4}`. Choose `{mode: "queue", limit: 1}` for any action that drives ONE shared resource - one browser session, one desktop app, one spreadsheet file. Two parallel calls racing over the same browser corrupt each other in ways that look random. Queued callers automatically see "queued (position n)" progress, so a queue of 1 degrades gracefully; a race does not. Exceeding `limit` in parallel mode rejects the call (`concurrency_rejected`), so a too-small parallel limit turns into user-visible errors - when in doubt between parallel-2 and queue-1, take queue-1.

## Descriptions are UI copy

Every `description` (app, action, event, collection, screen) is **one plain-language line shown to end users in the Designer**. The schema hard-rejects implementation words in them, and the platform bans "node", "trigger", "flow", "endpoint" outright. Write the line for the person who will click it:

- Good: `"Read a supplier invoice PDF and pull out the key fields."`
- Bad: `"Triggers the extraction flow via the OCR endpoint."`

If you can't describe an action in one plain line, the action is probably two actions.

## Types

- `types` is a bag of named JSON Schemas referenced as `#/types/<Name>`. Define a named type when the shape is the domain's core record or is used in more than one place; inline one-off shapes.
- `FileRef` is predefined and always available: `{artifact_id, name, size, mime}`. Files travel as `FileRef` in params/results; bytes go over REST via `useFileUpload` / `app.files`, never through an action payload.
- Only the schema subset exists: `object` / `array` / `string` / `number` / `integer` / `boolean` / `enum` / `$ref` / `required` / `format`. No `oneOf`, no `patternProperties`, no conditionals. If a shape seems to need them, flatten it: a status `enum` plus optional fields beats a union.

## Auth and theme

- `auth`: `workspace` (Robomotion session required - the default, and the right choice unless told otherwise) · `link` (anyone with the tokenized URL) · `public` (anyone at all). Never set `public` without the user explicitly choosing it after you've said in plain words what it means ("anyone with the address can open it").
- `theme.accent` is one hex color; every kit component picks it up. `theme.mode`: `light` / `dark` / `system` (default system).

## Screens

One entry per screen with a one-line description and a `route` starting with `/`. Keep routes short and human (`/`, `/review`); the screen list in the Designer is built from these lines.

## After every change

Changing `app.json` changes `contract_hash`. The sequence is always: edit `app.json` → regenerate (both `actions.gen.ts` files) → fix whatever `tsc` now flags in screens and flow → `push_app`. Skipping the regenerate step doesn't cause subtle bugs; it causes a hard `validate_app` failure, by design.
