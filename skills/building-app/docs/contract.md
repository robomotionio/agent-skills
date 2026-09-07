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
  "screens": { … }
}
```

## Naming

- Actions, events, screens: camelCase starting lowercase (`approveInvoice`, `queue`). Types: PascalCase (`Invoice`). The schema rejects anything else.
- Name actions as **the user's verb**: `approveInvoice`, `submitExpense`, `extractDocument`. Not `doApproval`, not `postDecision`, not `handleSubmit`. The name becomes a typed function the screens call and a line in the Designer; both read best as a verb phrase.
- Events are **past tense**: `invoiceApproved`, `expenseSubmitted`. An event announces something that already happened.
- An action that hands a screen its rows is named for the noun the user says: `listQueue`, `listExpenses`, `listDocuments`.

## Action vs event

There are only these two, and choosing wrong is the most expensive contract mistake, so decide deliberately:

- **Action**: something the robot DOES on request - including "give me the rows I should be showing". "Approve this one", "extract that PDF", "the invoices waiting, page 3". Everything a screen displays arrives as some action's result; there is no other door in.
- **Event**: a nudge that someone should REACT now, aimed at a screen that is not going to ask again by itself. "An invoice over 10k arrived", "your export is ready". If the only thing a screen would do with it is refetch what its own table re-asks for anyway after that action runs, you don't need the event.

**State the app has to remember is not a third kind of entry.** It lives in a database the FLOW owns - `Robomotion.SQLite` for something local to the robot, one of the database packages (Postgres, MySQL, MongoDB, Google Sheets and the rest) for something bigger or shared - and it reaches the screens through an ordinary action, like every other thing the robot can reach. So a list is an action that answers a page of it: `DataTable`'s `source` calls that action with `{filter, sort, offset, limit}` and reads `{rows, total}` back (the kit reference has the exact shape), which puts the filtering and the ordering in the query rather than in the browser. Who is allowed to see which rows is part of that query too, decided by the flow from something it can trust - never by a value the screen sends.

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

Every `description` (app, action, event, screen) is **one plain-language line shown to end users in the Designer**. The schema hard-rejects implementation words in them, and the platform bans "node", "trigger", "flow", "endpoint" outright. Write the line for the person who will click it:

- Good: `"Read a supplier invoice PDF and pull out the key fields."`
- Bad: `"Triggers the extraction flow via the OCR endpoint."`

If you can't describe an action in one plain line, the action is probably two actions.

## Types

- `types` is a bag of named JSON Schemas referenced as `#/types/<Name>`. Define a named type when the shape is the domain's core record or is used in more than one place; inline one-off shapes.
- `FileRef` is predefined and always available: `{artifact_id, name, size, mime}`. Files travel as `FileRef` in params/results; bytes go over REST via `useFileUpload` / `app.files`, never through an action payload.
- Only the schema subset exists: `object` / `array` / `string` / `number` / `integer` / `boolean` / `enum` / `$ref` / `required` / `format`. No `oneOf`, no `patternProperties`, no conditionals. If a shape seems to need them, flatten it: a status `enum` plus optional fields beats a union.

## Open shapes

`params` and `result` do not have to spell out fields. Two spellings are legal, and both generate a type a screen can use:

| Written as | Means | Typed as |
|---|---|---|
| `{ "type": "object" }` | any object | `Record<string, unknown>` |
| `{}` | any value at all | `unknown` |

Reach for one when the payload really is open, and not before:

- **Pass-through payloads** - the screen assembles something and the flow hands it straight on, to a webhook, a spreadsheet row, another system's API. Naming fields nobody reads only makes the contract lie.
- **Dynamic forms** - the fields are not known when you write the app. The kit's `JsonInput` parses what the person typed and hands the form a real object, so `<Form action={run}>` sends it as the params.
- **A result the flow decides** - a report, a lookup against a system whose response shape is not yours. The kit's `JsonView` renders it without the screen knowing its shape.

Still write the `description`: it is all the person, the Designer and an MCP client have to go on. The call site is unchecked, so `run({ ...payload })` compiles - that is the point, and also the cost. **Type what you know, open what you don't**: an action with three known fields and one free-form bag declares the three and puts the bag in a property, rather than opening the whole thing.

`additionalProperties` is **not** in the subset and is not needed. The open object is exactly `{ "type": "object" }`; `validate_app` rejects any key outside the list above plus `description` and `default`.

## Auth and theme

- `auth`: `workspace` (Robomotion session required - the default, and the right choice unless told otherwise) · `link` (anyone with the tokenized URL) · `public` (anyone at all). Never set `public` without the user explicitly choosing it after you've said in plain words what it means ("anyone with the address can open it").
- `theme.accent` is one hex color; every kit component picks it up. `theme.mode`: `light` / `dark` / `system` (default system).

## Screens

One entry per screen with a one-line description and a `route` starting with `/`. Keep routes short and human (`/`, `/review`); the screen list in the Designer is built from these lines.

## After every change

Changing `app.json` changes `contract_hash`. The sequence is always: edit `app.json` → regenerate (both `actions.gen.ts` files) → fix whatever `tsc` now flags in screens and flow → `push_app`. Skipping the regenerate step doesn't cause subtle bugs; it causes a hard `validate_app` failure, by design.
