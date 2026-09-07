# `@robomotion/app-kit` component reference

The complete catalogue. Compose screens from these and Tailwind layout classes; there is nothing else, and nothing else is allowed. Every component is themed from `app.json`'s `theme.accent`, dark-mode aware, and accessible by default - you never write colors, focus rings, or ARIA by hand.

This file is COMPLETE for everything it names. Do not open the packages' own
`.d.ts` files to check it. On 2026-09-06 a build spent eight shell calls and
about ninety seconds walking
`node_modules/@robomotion/apps-runtime/dist/**` to find out one thing this
page already says - and the person watching got six identical "Checked how to
build it" rows for it. `tsc` is the check, not a `grep`: write the screen,
run the typecheck, and read what it says. Only if `tsc` disagrees with a
snippet here does the package's own type win, and then it is `tsc` telling
you, not a file you went looking for.

Two facts that page-walk was after, so nobody goes after them again:

- `useConnection()` returns `{ state, robotOnline }`, and `state` is a plain
  **string union**, not an enum: `state === "ready"` is how you compare it.
  The type is `ConnectionState`, exported from `@robomotion/apps-runtime` -
  but a screen almost never needs to name it.
- The runtime's hooks come from `@robomotion/apps-runtime/react` (that exact
  specifier - it is a package export, not a folder to go and find).

A screen imports from **two** packages, and which name lives in which is not
guessable. Everything visual comes from the kit; everything that talks to the
robot comes from the runtime. Importing a runtime name from the kit is not a
type error you will see in a review - it is a blank white preview and
`does not provide an export named '<name>'` in the browser console.

```tsx
// Everything you can render. There is nothing else, and nothing else is allowed.
import {
  AppShell, Screen, ConnectionBanner,
  Button, Spinner, Card, CardHeader, CardBody, CardFooter, DataTable,
  Form, Field, TextInput, NumberInput, TextArea, Select, Checkbox,
  RadioGroup, DatePicker, JsonInput, useFormValues, FileUpload,
  Progress, Skeleton, StatusBadge, EmptyState, ErrorState,
  Toast, useToast, toast, dismissToast,
  Dialog, ConfirmDialog, Drawer, Tabs, Tab, TabPanel, Menu, MenuItem, Tooltip,
  Chart, Kanban, KanbanColumn, KanbanCard, Calendar, Markdown, JsonView,
  Stack, Row, Grid, cn, accentStyle, focusRing, inputBase, DEFAULT_ACCENT,
} from "@robomotion/app-kit";

// Everything that reaches the robot. NONE of these are in the kit.
import {
  AppProvider, useAppClient, useMaybeAppClient,
  useAction, useEvent, useConnection, useFileUpload,
  bindAction, markGesture,
} from "@robomotion/apps-runtime/react";
```

## Frame

### `AppShell`

The page frame: header, optional nav, content slot, and the connection banner built in. One per app, at the root.

```tsx
<AppShell title="Invoice Approvals" nav={[
  { label: "Queue", path: "/" },
  { label: "Review", path: "/review" },
]} activePath={usePath()} onNavigate={navigate}>
  {/* routed screens render here */}
</AppShell>
```

### `Screen`

One routed screen with a title and description. One `Screen` per file under `src/pages/`.

```tsx
<Screen title="Queue" description="Invoices waiting for a decision.">
{/* The shell's title is the app's name and it is already on screen. A screen's
    title says what THIS screen does ("Queue", "Work out the cost"), and a
    card's title what the card holds ("Total") - never the app's name again.
    A one-screen app that repeats its name on the shell, the screen and the
    card reads as a template. */}
  {/* content */}
</Screen>
```

### `ConnectionBanner`

Renders the robot-offline and contract-mismatch states. `AppShell` already includes it; only place it yourself in a screen that must show connection state inline. Never build your own offline warning.

### Routing (`src/lib/router.tsx`)

The scaffold ships a tiny History API router; it is not a package and there is nothing to install. Screens are real paths that match the `route` of each screen in `app.json`: `/`, `/review`, never `#/review`. A link to a screen is an ordinary URL that can be shared and reloaded.

```tsx
import { navigate, usePath, useSearch, screenHref } from "@/lib/router";

navigate("/review?id=7");          // go to a screen, optionally with a query
const path = usePath();            // "/review" - the screen, without the query
const id = new URLSearchParams(useSearch()).get("id");
<a href={screenHref("/review")}>   // an href for a plain link
```

Never read `window.location.hash` and never build URLs by hand; the app is mounted under a prefix (`/<app id>/` when published, `/preview/<instance>/` in the preview) that only `screenHref` and `navigate` know about.

## Actions and feedback

### `Button`

`variant`: `primary` / `secondary` / `ghost` / `danger`. A button that makes the robot do something takes the action through `action` (the object the generated `use<Action>()` hook returns) and its `params` (a value, or a function of the click event). The click runs it, the spinner shows and the button is disabled while it runs, and the Build view can jump from the button to the step in the flow. Never write your own `onClick={() => run(...)}` plus `loading` plus `disabled` for that.

```tsx
const approve = useApproveInvoice();
<Button variant="primary" action={approve} params={{ number: invoice.number }}>
  Approve
</Button>
```

`loading` still exists for a button whose busy state comes from somewhere else, and `onClick` still runs first when both are given. Inside a `<Form action={…}>` the submit button takes no `action` of its own; the form runs it.

### `Progress`

Determinate and indeterminate, fed by action progress. Show it whenever an action has `progress: true` in the contract.

```tsx
const extract = useExtractInvoice();
{extract.loading && <Progress value={extract.progress?.percent} />}
```

### `Skeleton`

The grey shape that stands where the content will be, on first load. It is what a screen shows instead of an empty page or a spinner floating in the middle of nowhere: the person sees the shape of what is coming, and nothing jumps when the answer lands.

```tsx
{orders.loading
  ? <Skeleton variant="text" lines={5} />
  : <DataTable columns={cols} rows={orders.data?.rows ?? []} />}
```

### `StatusBadge`

Exactly four states: `ok` / `warn` / `error` / `pending`. Map your domain onto them; do not invent a fifth.

```tsx
<StatusBadge status={invoice.approved ? "ok" : "pending"} />
```

### `Toast` / `useToast`

Transient feedback after an action completes. Success gets a toast; failure gets an `ErrorState` or a toast with the plain-language message.

```tsx
const toast = useToast();
await approve.run({ number });
toast("Invoice approved");
```

### `EmptyState`

Icon, title, one action. Every table and list MUST have a designed empty state - a blank screen reads as broken.

```tsx
<EmptyState title="No invoices waiting"
            action={<Button variant="secondary" action={refresh} params={{}}>Check again</Button>} />
```

### `ErrorState`

Message plus retry, driven by an `AppError`. Use it when a screen's data failed to load; the `retryable` flag on the error tells you whether to offer the retry.

```tsx
const refresh = useRefreshNow();
{refresh.error && <ErrorState error={refresh.error} onRetry={() => refresh.run({})} />}
```

## Overlays

### `Dialog` and `ConfirmDialog`

A modal, done properly: it portals out to the page root so no card can clip it, traps focus inside itself, closes on Escape and on the backdrop, and puts focus back on whatever opened it. **Never hand-roll one** - a `fixed inset-0` div with your own close button has none of that, and a person on a keyboard gets stuck behind it.

```tsx
const [open, setOpen] = useState(false);
<Dialog open={open} onClose={() => setOpen(false)} title="Supplier details"
        footer={<Button variant="secondary" onClick={() => setOpen(false)}>Close</Button>}>
  <Stack gap={2}>
    <div>{supplier.name}</div>
    <div>{supplier.phone}</div>
  </Stack>
</Dialog>
```

`ConfirmDialog` is the one every destructive button needs. It takes the action itself, so the confirm button carries the link to the step in the flow, and the dialog stays up with a spinner until the robot has actually finished rather than closing over a job still running.

```tsx
const removeSupplier = useRemoveSupplier();
const [confirming, setConfirming] = useState<Supplier | null>(null);

<DataTable
  columns={cols}
  rows={rows}
  rowActions={[{ label: "Remove", danger: true, onSelect: (row) => setConfirming(row) }]}
/>
<ConfirmDialog
  open={confirming !== null}
  onClose={() => setConfirming(null)}
  title="Remove this supplier?"
  description="They will come off the list. You cannot undo this."
  confirmLabel="Remove"
  danger
  action={removeSupplier}
  params={() => ({ id: confirming?.id })}
/>
```

The row action only opens the dialog; the action hangs off the confirm button. A row action that runs the delete AND opens a confirmation has already deleted it.

### `Drawer`

The same overlay anchored to a side, for detail that is too long for a centred box: a record's full history, a filter panel. Same focus trap, same Escape.

```tsx
<Drawer open={!!selected} onClose={() => setSelected(null)} title="History" side="right">
  <Stack gap={3}>{selected?.events.map((e) => <div key={e.id}>{e.what}</div>)}</Stack>
</Drawer>
```

### `Menu` / `MenuItem`

The three-dot menu button, with the keyboard behaviour built in: arrows roam the items, Home and End jump to the ends, Escape closes and gives focus back, a click outside closes it. This is the same menu `DataTable` uses for its row actions, so a menu anywhere else on a screen behaves identically.

```tsx
const exportAll = useExportAll();
<Menu items={[
  { label: "Export everything", action: exportAll, params: {} },
  { label: "Clear the list", danger: true, onSelect: () => setConfirming("all") },
]} />
```

Or as children, when an item needs more than a label:

```tsx
<Menu label="More" align="start">
  <MenuItem action={exportAll} params={{ format: "csv" }}>Export as CSV</MenuItem>
  <MenuItem onSelect={() => navigate("/settings")}>Settings</MenuItem>
</Menu>
```

### `Tooltip`

A short hint on hover **and** on keyboard focus, described to a screen reader through the control itself. It holds a phrase; anything the person has to read twice belongs in `Field`'s `help` or in the copy on the page.

```tsx
<Tooltip content="Only invoices over 1,000">
  <Button variant="ghost" onClick={() => setBig(!big)}>Big ones only</Button>
</Tooltip>
```

## Content

### `Card` / `CardHeader` / `CardBody` / `CardFooter`

Grouping. A dashboard stat, a detail panel, a form section.

```tsx
<Card>
  <CardHeader>Invoice {invoice.number}</CardHeader>
  <CardBody>{invoice.supplier} · {invoice.amount}</CardBody>
  <CardFooter><Button variant="danger">Reject</Button></CardFooter>
</Card>
```

### `DataTable`

Columns, rows, sort, filter, empty state, row actions, pagination - all built in. This is the workhorse of three of the four archetypes, and **never re-implement sorting or paging in the screen**. A row action that runs an action is written as `{ label, action, params }` with `params` built from the row; one that only navigates keeps `onSelect`.

There are two ways to feed it, and picking the wrong one is the difference between a table that works and a table that stalls on the tenth thousand row.

**Everything is already here.** Rows the screen already holds go straight into `rows` - an action's result, or a filtered or sorted copy of it; never a mapped one, which loses the link back to the step that produced them. The table filters, sorts and pages them in the browser. Right for the page of results the flow has just answered with; wrong for anything that keeps growing.

```tsx
const queue = useListQueue();
const approve = useApproveInvoice();
<DataTable
  columns={[
    { key: "number", header: "Invoice" },
    { key: "supplier", header: "Supplier" },
    { key: "amount", header: "Amount" },
  ]}
  rows={queue.data?.rows ?? []}
  rowActions={[
    { label: "Review", onSelect: (row) => navigate(`/review?id=${row.number}`) },
    { label: "Approve", action: approve, params: (row) => ({ number: row.number }) },
  ]}
  loading={queue.loading}
  emptyState={<EmptyState title="No invoices waiting" />}
/>
```

**The robot has it and there is too much of it.** `source={{ action }}` turns the same table into a paged one: it asks the flow for one page at a time, and the filter box and the sortable headers go with the question instead of running in the browser. Reach for this whenever the rows live in a system the flow queries - a database, a spreadsheet, an API with paging - which is where everything an app remembers between visits lives.

```tsx
const listOrders = useListOrders();
<DataTable
  columns={[
    { key: "number", header: "Order", sortable: true },
    { key: "customer", header: "Customer" },
    { key: "total", header: "Total", align: "right" },
  ]}
  source={{ action: listOrders, pageSize: 25 }}
  filterable
  emptyState={<EmptyState title="No orders match that" />}
/>
```

The action is called with, and must answer with, exactly this - so declare both sides open in `app.json` (`"params": { "type": "object" }`, `"result": { "type": "object" }`) and let the kit supply the shape:

```ts
{ filter: string, sort?: { key: string, dir: "asc" | "desc" }, offset: number, limit: number }
  -> { rows: T[], total: number }
```

`filter` is whatever is in the filter box (`""` when it is empty), `sort.key` is a column's `key`, and `total` is how many rows there are **altogether**, not how many are in this page - that is what the pager counts. The flow does the filtering and the ordering; a flow that ignores `offset` and returns everything every time has a table that looks right and gets slower with every row.

The table refetches on its own when the person filters, sorts or turns a page, and when that same action finishes a run somebody else started - so a row added by another button appears without a reload. To re-ask by hand, keep a `tableRef`:

```tsx
const table = useRef<DataTableApi | null>(null);
<DataTable columns={cols} source={{ action: listOrders }} tableRef={table} />
<Button action={addOrder} params={draft} onClick={() => setTimeout(() => table.current?.refresh(), 0)}>Add</Button>
```

### `Tabs` / `Tab` / `TabPanel`

Sections of one screen, when splitting them into routed screens would be too much. The strip is one stop in the tab order and the arrow keys move between the tabs, which is the part a hand-rolled row of buttons never gets right.

```tsx
<Tabs defaultValue="waiting" label="Invoices">
  <Tab value="waiting" badge={waiting.length}>Waiting</Tab>
  <Tab value="done">Done</Tab>
  <TabPanel value="waiting"><DataTable columns={cols} rows={waiting} /></TabPanel>
  <TabPanel value="done"><DataTable columns={cols} rows={done} /></TabPanel>
</Tabs>
```

### `Chart`

`bar`, `line` or `pie`, drawn as inline SVG in the app's own accent. **Never write your own SVG or reach for a charting library** - neither is allowed, and this is why the kit has one. `data` is `{label, value}[]`, which is the shape a flow hands back with nothing to convert.

```tsx
const year = useMonthlyTotals();
<Card>
  <CardHeader title="This year" />
  <CardBody>
    <Chart
      kind="bar"
      title="Takings by month"
      data={(year.data?.months ?? SAMPLE_MONTHS).map((m) => ({ label: m.name, value: m.total }))}
      source={{ action: year }}
      formatValue={(v) => v.toLocaleString(undefined, { style: "currency", currency: "GBP" })}
    />
  </CardBody>
</Card>
```

Say what the chart shows in `title`; it becomes the accessible name, so a screen reader gets "Takings by month" rather than "graphic". `source` links the chart to the step that produced the numbers, the way a table's does.

### `Kanban` / `KanbanColumn` / `KanbanCard`

A board of columns you move cards between, when the person's real job is "move this along" rather than "fill this in". Dragging works with a mouse, a trackpad and a touch screen, and a focused card also moves with the Left and Right arrow keys - so it is not a board only some people can use.

```tsx
const moveCard = useMoveCard();
<Kanban action={moveCard} onMove={(m) => toast(`Moved to ${m.to}`)}>
  {stages.map((stage) => (
    <KanbanColumn key={stage.id} id={stage.id} title={stage.name}>
      {cardsIn(stage.id).map((c) => (
        <KanbanCard key={c.id} id={c.id}>{c.title}</KanbanCard>
      ))}
    </KanbanColumn>
  ))}
</Kanban>
```

The action is called with `{ key, from, to }` - which card, which column it left, which one it landed in. That is the whole payload, so the action's params can be declared open.

### `Calendar`

A month at a time, with `{date, label}` events on the days. Dates are ISO `"yyyy-mm-dd"`, which is what a flow hands back; the month and weekday names come from the person's own locale.

```tsx
<Calendar
  events={(visits.data?.rows ?? SAMPLE_VISITS).map((v) => ({ date: v.on, label: v.who }))}
  onSelect={(date, dayEvents) => setChosen({ date, dayEvents })}
/>
```

### `Markdown`

Markdown the robot produced - a summary, a written-up report - rendered as prose rather than printed as a wall of asterisks. It sanitises what it renders, which is why text that came back from a website or a document goes here and never into `dangerouslySetInnerHTML`.

```tsx
<Card><CardBody><Markdown>{report.data?.text ?? SAMPLE_REPORT}</Markdown></CardBody></Card>
```

### `JsonView`

Free-form JSON coming **out**. When an action's `result` is the open shape, the screen does not know what came back - this shows it as a collapsible tree with a copy button, instead of `[object Object]` or a screen that quietly shows nothing.

```tsx
const inspect = useInspectPayload();
<JsonView value={inspect.data} maxDepth={2} emptyState="Send one over and it will show up here." />
```

It is a viewer, not a formatter. When the screen DOES know the shape, show the fields with real labels and keep `JsonView` for the parts it does not.

## Input

### `Form` / `Field` and the inputs

`TextInput`, `NumberInput`, `TextArea`, `Select`, `Checkbox`, `RadioGroup`, `DatePicker`.

**Always pass `schema`.** It is the generated params schema for the action, and
without it the form checks nothing at all. The types in `actions.gen.ts` are
gone by run time, and a form's values are a bag of unknowns, so `schema` is the
only thing that connects the fields to the contract. Skip it and a `Select`
writing the string `"20"` into a field the contract declares as a `number`
compiles, passes `validate_app`, and comes back from the robot as
**"invalid parameters"** with no step having run and nothing in the robot's log
to read. A type mismatch between a screen and its contract has no other net.

```tsx
import { useSubmitExpense, SubmitExpenseParamsSchema } from "../generated/actions.gen";

const submit = useSubmitExpense();
<Form action={submit} schema={SubmitExpenseParamsSchema}>
  <Field name="category" label="Category">
    <Select options={[
      { value: "travel", label: "Travel" },
      { value: "meals", label: "Meals" },
    ]} />
  </Field>
  <Field name="amount" label="Amount">
    <NumberInput />
  </Field>
  <Field name="note" label="Note">
    <TextArea />
  </Field>
  <Button type="submit" variant="primary" loading={submit.loading}>Submit</Button>
</Form>
```

**One place for a failure.** A `Form` given an `action` shows that action's
failure under its fields by itself. If the screen also renders
`<ErrorState error={action.error} />` for the same action, the person reads
the same sentence twice, one above the other - pass `hideError` to the `Form`
when the screen shows the failure elsewhere, and otherwise render nothing of
your own for it.

**The form spaces itself.** Its direct children - each `Field`, the submit
`Button`, a row of fields - sit one gap apart, so write them as siblings and
add no margins of your own: a button wrapped in a `div` with `mt-1`, or a
field with `mb-0`, breaks the rhythm every other form in the app keeps. Two
fields on one row are ONE child: wrap those two in
`<div className="grid grid-cols-2 gap-4">`.

**`Select` options are `{ value, label }` objects, and `value` is always a
string** - a bare array of strings does not compile. So a picker feeding a
numeric parameter needs the number made somewhere: either declare that
parameter as a string in `app.json` and convert in the flow, or convert on the
way in with the form's `onSubmit`. Decide which when you write the contract,
not after the robot refuses the call.

Every input's props are in **Props, in full** at the foot of this file. The
two that trip people up:

```ts
NumberInput: { value?: number, onChange?: (v: number | undefined) => void }   // writes a NUMBER
Select:      { options: { value: string; label: ReactNode; disabled?: boolean }[],
               value?: string, onChange?: (v: string) => void, placeholder?: string }  // writes a STRING
```

A control given its own `value`/`onChange` is yours, not the form's: it writes
to the form only when it changes, so an untouched picker submits **nothing**
for that field. Give the `Form` an `initialValues` covering it, or leave the
control uncontrolled and let the form hold it.

`action` runs `submit.run(values)` once the values validate, after `onSubmit` if you also gave one, and links the submit button to the step in the flow. When the screen checks the fields by hand before calling (trimming, custom messages), keep `onSubmit` and spread `bindAction(submit)` on the submit button instead so the link is still declared.

### `JsonInput`

Free-form JSON going **in**, for an action whose `params` are the open shape. It is a `Field`-compatible input like any other: it parses what was typed, hands the form a real object rather than a string the flow would have to parse again, and says so in place when the text is not JSON yet. It does not complain while somebody is still typing.

```tsx
const send = useSendPayload();
<Form action={send}>
  <Field name="payload" label="The bundle" help="Paste it in as it arrived.">
    <JsonInput rows={10} />
  </Field>
  <Button type="submit">Send it</Button>
</Form>
```

Use it when the fields genuinely are not known when you write the app. A form with three known fields and one free-form bag gets three real inputs and one `JsonInput`, not one `JsonInput` for the lot.

### `FileUpload`

Drag-and-drop. It uploads by itself and hands back a `FileRef`; the bytes go over REST, never through the action call. Give it the action the file feeds through `action`: once the upload lands it runs `extract.run({ file: ref, ...params })`, and the drop zone is linked to that step in the flow. `onUpload(ref)` still fires first for anything else the screen needs to do (show a "reading" state, say).

```tsx
const extract = useExtractInvoice();
<FileUpload action={extract} accept="application/pdf" hint="PDF works best." />
```

## Layout

### `Stack`, `Row`, `Grid`

Layout without hand-rolled flex classes. `Stack` for vertical, `Row` for horizontal, `Grid` for the dashboard tile wall. Reach for Tailwind only for spacing tweaks these don't cover.

```tsx
<Grid>
  <Card>…</Card>
  <Card>…</Card>
  <Card>…</Card>
</Grid>
```

## Action links

The Build view shows a small badge on every widget that leads somewhere in the flow and jumps from it to the step that runs (and back). You get that for free by using `action` on `Button`, `FileUpload` and `Form`, and by handing tables their rows straight from an action hook's `.data`. Two helpers cover anything custom; the generated action hooks carry `name`, which is what they read. Never write `data-rm-*` attributes by hand.

When the rows handed to `DataTable` were sorted or mapped into a new array, pass the hook result as `source={invoices}` so the table still links to the steps that fill it; an empty derived array carries no identity.

```tsx
import { bindAction, markGesture } from "@robomotion/apps-runtime/react";

// a custom widget that runs an action (a hand-made drop zone, a card, a link)
<div {...bindAction(upload)} onDrop={onDrop}>Drop an invoice PDF here</div>

// a hand-rolled list of the rows an action answered with (mapping them loses the link)
<ul {...bindAction(invoices)}>{invoices.data?.rows.map(…)}</ul>

// custom async code that finishes a person's click later: re-mark the widget
// right before calling the action, so the call still belongs to it
markGesture(zoneRef.current);
void extract.run({ file: ref });
```

## The runtime hooks (`@robomotion/apps-runtime/react`)

Screens talk to the robot ONLY through these. Never `app.call` in a screen, never hand-rolled transport.

```tsx
import {
  AppProvider, useAction, useEvent, useConnection, useFileUpload,
  bindAction, markGesture,
} from "@robomotion/apps-runtime/react";
```

| Hook | Returns | Use for |
|---|---|---|
| `use<Action>()` (generated) | `{ run, data, error, loading, progress, cancel, name }`, typed from the contract | every button that makes the robot do something; pass the whole object to `Button`'s `action`. Import it from `@/generated/actions.gen`, never write `useAction("name")` yourself |
| `useEvent(name, cb)` | subscribes for the component's lifetime | toasts and refreshes when the robot announces something |
| `useConnection()` | `{ state, robotOnline }` | anything that must react to `"connecting" \| "ready" \| "offline" \| "robot_offline" \| "contract_mismatch"` |
| `useFileUpload()` | `{ upload, uploading, progress, error }` | getting a `FileRef` to pass into an action |

`data` and `error` are mutually exclusive, and only the latest `run` writes
either: a failure clears the previous answer, a success clears the previous
failure, and a run that has been superseded writes nothing at all. So a screen
renders `error` when it is set and `data` when it is set, and never has to
guard against both. Do not keep your own copy of the last result alongside
them - that copy is exactly what used to leave a stale answer under a red
error card.

Action params and results are typed by `src/generated/actions.gen.ts` (which also exports `CONTRACT_HASH` and the `typedApp` wrapper). If `tsc` complains about a param, the contract changed - fix the call site or the contract, never cast.

Errors are `AppError { code, message, retryable, details }` with codes `invalid_params` · `unknown_action` · `contract_mismatch` · `robot_offline` · `queue_full` · `timeout` · `cancelled` · `concurrency_rejected` · `internal`. `robot_offline` and `queue_full` are retryable; `invalid_params` and `unknown_action` are not - those are contract bugs to fix, not to retry.

## Props, in full

The complete surface, so nothing here is worth a `grep` through
`node_modules`. Every component also takes the native props of the element it
renders (`className`, `id`, `aria-*`, and so on) unless the row says
otherwise; only the kit's own props are listed.

Every prop type is exported alongside its component (`ButtonProps`,
`NumberInputProps`, `SelectProps`, …), so a screen that needs one can import
it by name from `@robomotion/app-kit`.

**Frame**

```ts
AppShell:         { title: ReactNode, accent?: string, logo?: ReactNode,
                    nav?: { label: string; path: string }[], activePath?: string,
                    onNavigate?: (path: string) => void, connectionState?: ConnectionState,
                    headerRight?: ReactNode, children?: ReactNode }
Screen:           { title: ReactNode, description?: ReactNode, actions?: ReactNode,
                    children?: ReactNode }
ConnectionBanner: { state?: ConnectionState, className?: string }
```

**Actions and feedback**

```ts
Button:      { variant?: "primary"|"secondary"|"ghost"|"danger", size?: "sm"|"md"|"lg",
               loading?: boolean, action?: ActionLike, params?: unknown | ((e) => unknown),
               type?: "button"|"submit", children?: ReactNode }
Spinner:     { className?: string }
Progress:    { value?: number /* 0-100; omit for indeterminate */, label?: string,
               showValue?: boolean }
StatusBadge: { status: "ok"|"warn"|"error"|"pending", children?: ReactNode }
Skeleton:    { variant?: "text"|"rect"|"circle" /* default "text" */, lines?: number,
               width?: string | number, height?: string | number }
EmptyState:  { title: ReactNode, description?: ReactNode, icon?: ReactNode,
               action?: ReactNode /* usually a Button */ }
ErrorState:  { error: unknown /* AppError, Error or string */, title?: ReactNode,
               onRetry?: () => void, retryLabel?: string }
Toast:       { className?: string }        // the viewport; AppShell mounts one already
useToast():  { toast: (o: ToastOptions) => string, dismiss: (id: string) => void }
                                           // or the standalone toast() / dismissToast()

ToastOptions: { title: ReactNode, description?: ReactNode,
                variant?: "default"|"success"|"error",
                durationMs?: number /* default 5000; 0 keeps it until closed */ }
```

**Overlays**

```ts
Dialog:        { open: boolean, onClose: () => void, title?: ReactNode,
                 description?: ReactNode, footer?: ReactNode,
                 size?: "sm"|"md"|"lg" /* default "md" */, hideClose?: boolean,
                 static?: boolean /* ignore backdrop clicks */, children?: ReactNode }
ConfirmDialog: { open: boolean, onClose: () => void, title: ReactNode,
                 description?: ReactNode, confirmLabel?: string, cancelLabel?: string,
                 danger?: boolean, action?: ActionLike,
                 params?: unknown | (() => unknown), onConfirm?: () => void,
                 children?: ReactNode }
Drawer:        { open: boolean, onClose: () => void, title?: ReactNode,
                 description?: ReactNode, side?: "left"|"right" /* default "right" */,
                 size?: "sm"|"md"|"lg", footer?: ReactNode, hideClose?: boolean,
                 children?: ReactNode }
Tabs:          { value?: string, defaultValue?: string, onChange?: (v: string) => void,
                 label?: string, children?: ReactNode }
Tab:           { value: string, disabled?: boolean, badge?: ReactNode, children?: ReactNode }
TabPanel:      { value: string, children?: ReactNode }
Menu:          { items?: MenuItemDef[], trigger?: ReactNode, label?: string /* default "More" */,
                 align?: "start"|"end" /* default "end" */, menuLabel?: string,
                 disabled?: boolean, children?: ReactNode }
MenuItem:      { danger?: boolean, action?: ActionLike, params?: unknown | ((e) => unknown),
                 onSelect?: () => void, disabled?: boolean, children?: ReactNode }
Tooltip:       { content: ReactNode, side?: "top"|"bottom"|"left"|"right" /* default "top" */,
                 children: ReactNode /* exactly one element */ }

MenuItemDef:   { label: ReactNode, danger?: boolean, disabled?: boolean,
                 onSelect?: () => void, action?: ActionLike, params?: unknown }
```

**Content**

```ts
Card:       { children?: ReactNode }
CardHeader: { title?: ReactNode, description?: ReactNode, children?: ReactNode }
CardBody:   { children?: ReactNode }
CardFooter: { children?: ReactNode }

DataTable<T>: { columns: DataTableColumn<T>[], rows?: T[],
                rowKey?: (row: T) => string,
                filterable?: boolean, filterPlaceholder?: string,
                pageSize?: number /* default 10; 0 disables pagination */,
                rowActions?: DataTableRowAction<T>[], onRowClick?: (row: T) => void,
                caption?: string,
                emptyTitle?: ReactNode, emptyDescription?: ReactNode, emptyState?: ReactNode,
                loading?: boolean, source?: DataTableSource,
                tableRef?: MutableRefObject<DataTableApi | null> }

DataTableSource: { action: ActionLike, pageSize?: number }   // paged: the table fetches
                 | { name: string, records?: unknown }       // an identity tag for rows you hold
DataTableApi:    { refresh: () => void }

// what a paged action is called with, and what it must answer
PageRequest: { filter: string, sort?: { key: string, dir: "asc"|"desc" },
               offset: number, limit: number }
PageReply<T>: { rows: T[], total: number }

DataTableColumn<T>: { key: string, header: ReactNode, sortable?: boolean,
                      render?: (row: T) => ReactNode,
                      value?: (row: T) => string | number | null | undefined,
                      align?: "left"|"right"|"center", className?: string }

DataTableRowAction<T>: { label: string, danger?: boolean, disabled?: (row: T) => boolean }
                       & ( { onSelect: (row: T) => void }
                         | { action: ActionLike, params: (row: T) => unknown } )

Chart:      { kind: "bar"|"line"|"pie", data: { label: string; value: number }[],
              title?: string, description?: string, height?: number /* default 220 */,
              formatValue?: (v: number) => string, emptyState?: ReactNode,
              source?: DataTableSource }
Kanban:       { onMove?: (m: { key: string; from: string; to: string }) => void,
                action?: ActionLike, children?: ReactNode }
KanbanColumn: { id: string, title: ReactNode, meta?: ReactNode, emptyState?: ReactNode,
                children?: ReactNode }
KanbanCard:   { id: string, column?: string, disabled?: boolean, children?: ReactNode }
Calendar:   { month?: string /* "yyyy-mm" */, defaultMonth?: string,
              onMonthChange?: (m: string) => void,
              events?: { date: string /* "yyyy-mm-dd" */; label: ReactNode }[],
              selected?: string, onSelect?: (date: string, events: CalendarEvent[]) => void,
              weekStartsOn?: "monday"|"sunday" /* default "monday" */, maxPerDay?: number }
Markdown:   { children?: string, streaming?: boolean }
JsonView:   { value: unknown, maxDepth?: number /* default 2 */, copyable?: boolean,
              emptyState?: ReactNode, label?: string }
```

**Input**

```ts
Form:        { action?: ActionLike, schema?: ContractSchema, values?: FormValues,
               initialValues?: FormValues, onChange?: (v: FormValues) => void,
               onSubmit?: (v: FormValues) => void | Promise<void>,
               disabled?: boolean, children?: ReactNode }
Field:       { name: string, label: ReactNode, help?: ReactNode, required?: boolean,
               error?: ReactNode, children?: ReactNode }   // it is `help`, NOT `hint`
TextInput:   { value?: string, onChange?: (v: string) => void,
               type?: "text"|"email"|"password"|"url"|"tel"|"search" }
NumberInput: { value?: number, onChange?: (v: number | undefined) => void }   // writes a NUMBER
TextArea:    { value?: string, onChange?: (v: string) => void, rows?: number }
Select:      { options: SelectOption[], value?: string, onChange?: (v: string) => void,
               placeholder?: string }                                        // writes a STRING
Checkbox:    { checked?: boolean, onChange?: (checked: boolean) => void, label?: ReactNode }
RadioGroup:  { options: SelectOption[], value?: string, onChange?: (v: string) => void,
               name?: string, disabled?: boolean }
DatePicker:  { value?: string /* ISO "yyyy-mm-dd" */, onChange?: (v: string) => void }
JsonInput:   { value?: Record<string, unknown>,
               onChange?: (v: Record<string, unknown> | undefined) => void,
               formatOnBlur?: boolean /* default true */, invalidMessage?: string,
               rows?: number }                          // writes an OBJECT, not a string
FileUpload:  { action?: ActionLike, params?: Record<string, unknown> | (() => Record<string, unknown>),
               onUpload?: (ref: FileRef) => void, onError?: (e: AppError) => void,
               accept?: string, label?: string, hint?: string,
               isPublic?: boolean, disabled?: boolean }

SelectOption:  { value: string, label: ReactNode, disabled?: boolean }
useFormValues(): FormValues            // the current bag, inside a Form
```

**Layout**

```ts
type Gap   = 0 | 1 | 2 | 3 | 4 | 6 | 8            // no 5, no 10, no 12
type Align = "start" | "center" | "end" | "stretch"

Stack: { gap?: Gap /* default 4 */, align?: Align }
Row:   { gap?: Gap, align?: Align /* default "center" */,
         justify?: "start"|"center"|"end"|"between", wrap?: boolean }
Grid:  { gap?: Gap, cols?: 1|2|3|4|6 /* default 1 */, mdCols?: 1|2|3|4|6, lgCols?: 1|2|3|4|6 }
```

**Helpers**

```ts
cn(...classes)            // class merge
accentStyle(accent)       // the --rm-accent CSS variable, for a custom surface
focusRing                 // the focus classes, when a custom control needs them
inputBase                 // the shared input classes, when a Field wraps something unusual
DEFAULT_ACCENT            // the brand orange
```

## A form runs its action once

`<Form action={addItem}>` runs `addItem.run(values)` itself, after `onSubmit`.
So `onSubmit` must never call `run` - a screen that does (`onSubmit={async (v) =>
{ await addItem.run({...v}); navigate("/") }}`) runs the flow twice for every
press, and every record it adds arrives twice. Shape the values in the flow's
first step or with `onChange`; do what must follow the call - navigate, a toast -
in a `useEffect` on `addItem.data`. `validate_app` reports the shape as
`form-runs-once`, and kit 0.1.6 ignores its own run when `onSubmit` already ran
the action, but an app carries the kit it was built with.
