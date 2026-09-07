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
  AppShell, Screen, ConnectionBanner, Breadcrumbs, AssistantWidget,
  Button, Spinner, Card, CardHeader, CardBody, CardFooter, DataTable,
  Form, Field, FieldArray, TextInput, NumberInput, TextArea, Select, Combobox,
  Checkbox, Switch, RadioGroup, DatePicker, TimePicker, DateRangePicker,
  TagInput, Slider, Rating, JsonInput, useFormValues, FileUpload,
  Progress, Skeleton, StatusBadge, Stat, Alert, CopyButton, EmptyState, ErrorState,
  Toast, useToast, toast, dismissToast,
  Dialog, ConfirmDialog, Drawer, Popover, Tabs, Tab, TabPanel, Stepper, Step,
  Accordion, AccordionItem, Menu, MenuItem, Tooltip,
  Chart, Kanban, KanbanColumn, KanbanCard, Calendar, Timeline, TimelineItem,
  Avatar, AvatarGroup, Thread, Message, Composer, Markdown, JsonView,
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

### `Breadcrumbs`

Where the person is, and one press back to anywhere above them. A detail screen reached from a list needs this and the shell's nav cannot give it: the nav says which section, the crumbs say which record. The last crumb is the page they are already on, so it carries no `path` and is not a link.

```tsx
<Breadcrumbs
  items={[{ label: "Invoices", path: "/" }, { label: invoice.supplier, path: `/supplier?id=${invoice.supplier_id}` }, { label: invoice.number }]}
  onNavigate={navigate}
/>
```

### `AssistantWidget`

The app's own assistant, in the corner of every screen. It talks to the flow through the app's MCP server, so it can answer questions about the app's own data and run its actions; it is not a general chatbot bolted on. Mount it once, beside the routed screens inside `AppShell`. Only add it when the person asked for one.

```tsx
<AppShell title="Invoice Approvals" nav={nav} onNavigate={navigate}>
  {screen}
  <AssistantWidget title="Ask about these invoices" />
</AppShell>
```

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

`loading` still exists for a button whose busy state comes from somewhere else, and `onClick` still runs first when both are given. Inside a `<Form action={…}>` the submit button takes no `action` of its own; the form runs it. `Spinner` is the same spinner on its own, for the rare busy state no `Button` owns - never draw one with a `border animate-spin` div.

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

### `Stat`

One number said properly: what it is, what it is now, whether that is better or worse than last time, and the shape of how it got there. Every dashboard opens with a row of these, so **never hand-write a tile with your own colours** - `upIsGood={false}` is what makes a rise in "Errors" read as red rather than green.

```tsx
<Grid cols={1} mdCols={2} lgCols={4}>
  {metrics.map((m) => (
    <Stat
      key={m.id}
      label={m.label}
      value={m.value.toLocaleString()}
      unit={m.unit}
      delta={m.change_pct}
      deltaLabel="vs last week"
      upIsGood={m.up_is_good}
      trend={m.recent}
    />
  ))}
</Grid>
```

`trend` is a plain list of recent numbers, oldest first, drawn as a small line under the value. `loading` shows a placeholder instead of a misleading zero.

### `Alert`

An inline message that STAYS on the page: "three rows could not be read", "the robot runs this at 6am", "nothing was saved". A `Toast` disappears after five seconds, which is right for "Saved" and wrong for anything the person still has to act on. `variant`: `info` / `success` / `warning` / `error`.

```tsx
{skipped > 0 && (
  <Alert variant="warning" title={`${skipped} rows were skipped`} onDismiss={() => setSkipped(0)}>
    They had no email address on them.
  </Alert>
)}
```

### `CopyButton`

Copy a reference number, a link, or a whole answer the robot wrote. It falls back to the older clipboard command on the pages where the modern one is refused (plain http, some embedded frames) and says what happened either way, which a hand-written `navigator.clipboard.writeText` does not.

```tsx
<CopyButton value={invoice.number}>Copy the reference</CopyButton>
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

### `Popover`

A small panel hung off a control: a set of filters, an explanation with a link in it, a preset chooser. A `Tooltip` is one sentence on hover and nothing in it can be clicked; a `Dialog` takes over the screen. This is the thing in between. It portals out to the page root, so **never hand-roll one** - an absolutely positioned `div` is clipped by the first card with `overflow-hidden`.

```tsx
<Popover trigger="Filters" title="Show me">
  <Stack gap={2}>
    <Checkbox label="Only unpaid" checked={unpaid} onChange={setUnpaid} />
    <Checkbox label="Over 1,000" checked={large} onChange={setLarge} />
  </Stack>
</Popover>
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

The table refetches on its own when the person filters, sorts or turns a page, and when that same action finishes a run somebody else started - so a row added by another button appears without a reload.

It also refetches after a write **it ran itself** - a `bulkActions` entry, or a `rowActions` entry carrying an `action` - and a bulk action unticks afterwards, because the rows it referred to have just changed. The table rendered that button and made that call, so asking again is its job and **not something to wire in the screen**. A row action that only navigates (`onSelect`) writes nothing and costs no fetch. Only a control the SCREEN wrote needs a `tableRef`:

```tsx
const table = useRef<DataTableApi | null>(null);
<DataTable columns={cols} source={{ action: listOrders }} tableRef={table} />
<Button action={addOrder} params={draft} onClick={() => setTimeout(() => table.current?.refresh(), 0)}>Add</Button>
```

**Ticking a run of rows and doing one thing to all of them.** `selectable` puts a tick box on every row, and `rowKey` becomes required when you use it - the selection belongs to RECORDS, not to row positions, and without a key turning the page silently reassigns the ticks to different rows. `bulkActions` are the buttons that appear above the table once something is ticked. **Never build a checkbox column and an array of ticked ids by hand**: that is where the page-turning bugs live.

```tsx
const archiveLeads = useArchiveLeads();
<DataTable
  columns={cols}
  source={{ action: listLeads, pageSize: 25 }}
  rowKey={(row) => row.id}
  selectable
  filterable
  exportable
  exportFilename="leads.csv"
  bulkActions={[
    { label: "Archive", danger: true, action: archiveLeads,
      params: (s) => ({ ids: s.keys, all_matching: s.allMatching, filter: s.filter }) },
  ]}
/>
```

A bulk action is handed the selection, and it comes in two shapes:

```ts
{ keys: string[], rows: T[], filter: string, count: number }   // these rows
{ allMatching: true, filter: string, count: number }           // everything this filter matches
```

The second is what "Select all N" produces over a paged `source`: the flow is told the filter and does the work, because forty thousand keys in a browser is not a selection. Declare the action's params open (`{"type": "object"}`) and read whichever half arrived. A bulk action with a plain callback is `{ label, onSelect }` instead, like a row action.

**Taking the list away.** `exportable` adds an Export CSV button. Over a paged source it asks the SAME action with `limit: 0`, which the page contract already defines as "no paging: all of them" - so an export needs no second action and no extra contract. Cells come from a column's `value` or the row's own property, never from `render`, so give any rendered column a `value` if it should appear in the file.

`tableRef` also carries `selection()` and `clearSelection()`, for a screen that must read the ticks itself: `table.current?.selection<Lead>()`.

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

### `Stepper` / `Step`

A long job broken into steps: "upload the file", "check what we read", "confirm and send". One question at a time is the difference between a form somebody finishes and a form of thirty fields somebody abandons. `<Stepper>` reads its children the way `<Tabs>` does, and only the current `<Step>`'s content is on screen. A step ahead of the person cannot be jumped to; one behind them can.

```tsx
<Stepper label="Send an invoice">
  <Step title="Who"><Field name="customer" label="Customer"><Combobox options={customers} /></Field></Step>
  <Step title="What"><FieldArray name="lines">{…}</FieldArray></Step>
  <Step title="Send"><Button action={sendInvoice} params={draft}>Send it</Button></Step>
</Stepper>
```

There is **no `action` prop**: the last step holds an ordinary `<Button action={…}>` or a `<Form action={…}>`, which keeps the run in one place and out of the double-run trap. `controls={false}` hides the Back/Next pair when the screen's own state drives `value`.

### `Accordion` / `AccordionItem`

Sections that fold away: a long form's optional parts, an FAQ, the detail under each row of a summary. `type="single"` closes the others when one opens; the default keeps as many open as the person wants. The arrow keys move between the headers, which is the part a `<div onClick>` with a chevron never gets right.

```tsx
<Accordion type="single" defaultValue={["delivery"]}>
  <AccordionItem value="delivery" title="Delivery" description="Where it goes">…</AccordionItem>
  <AccordionItem value="payment" title="Payment" meta={<StatusBadge status="ok">Paid</StatusBadge>}>…</AccordionItem>
</Accordion>
```

### `Chart`

`bar`, `line`, `area` or `pie`, drawn as inline SVG in the app's own accent. **Never write your own SVG and never reach for a charting library** - neither is allowed, and this is why the kit has one.

**One series** is `data`, which is `{label, value}[]` - the shape a flow hands back with nothing to convert.

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

**Several series** is `series`, and it is what makes "us against them over time" expressible at all - a rank tracker, a price watcher, this month against last, one line per branch. Each entry is `{ name, points: {x, y}[] }`; `name` is what the key says, `x` is a category or a date. One chart, several lines: **never draw one chart per thing being compared.**

```tsx
const ranks = useWeeklyRanks();
<Chart
  kind="line"
  xKind="time"
  title="Where we come up in search"
  series={ranks.data?.series ?? SAMPLE_SERIES}
  source={{ action: ranks }}
  legend
/>
```

`xKind="time"` lays the points out to scale and puts them in date order however the flow answered; leave it out and dates are detected anyway. `stacked` stacks bars instead of standing them side by side. Colours come from the app's accent at descending opacities, so nobody picks any; `color` on a series overrides one when a colour carries meaning ("red is the overdue line").

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

### `Timeline` / `TimelineItem`

What happened, in order: an audit trail, a document's history, the steps a robot took. A `DataTable` of the same rows answers "which one" and this answers "what happened next". The dot colours are `StatusBadge`'s, so a `warn` here is the same amber as a `warn` anywhere else. An ISO timestamp in `at` is read as a date in the person's own locale; words are left alone.

```tsx
<Timeline>
  {doc.history.map((e, i) => (
    <TimelineItem key={i} at={e.at} title={e.title} body={e.note} status={e.status} />
  ))}
</Timeline>
```

### `Avatar` / `AvatarGroup`

Who did this: a face beside a row, a comment or an approval, with their initials when there is no picture - which is most of the time, and is the case a bare `<img>` gets wrong. `AvatarGroup` overlaps them and counts the ones that did not fit.

```tsx
<AvatarGroup max={3}>
  {reviewers.map((r) => <Avatar key={r.id} name={r.name} src={r.photo_url} />)}
</AvatarGroup>
```

### `Thread` / `Message` / `Composer`

A conversation on a screen: notes on a case, comments on an approval, messages with a robot that answers them. It holds no messages of its own and opens no socket - the screen keeps the list (from an action's result, appended to by `useEvent`) and hands it over. Bodies render through `Markdown`, so a robot answering in bullet points arrives as bullet points. `Message` and `Composer` are the halves, for a screen that lays out its own.

```tsx
const notes = useCaseNotes();
const addNote = useAddNote();
const [messages, setMessages] = useState<ThreadMessage[]>([]);
useEvent<Note>("noteAdded", (n) => setMessages((m) => [...m, { id: n.id, author: n.by, at: n.at, body: n.text }]));

<Thread messages={messages} action={addNote} params={(text) => ({ caseId, note: text })} />
```

Enter sends and Shift+Enter starts a new line. Pass `readOnly` for a history with nothing to add.

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

`TextInput`, `NumberInput`, `TextArea`, `Select`, `Combobox`, `Checkbox`, `Switch`, `RadioGroup`, `DatePicker`, `TimePicker`, `DateRangePicker`, `TagInput`, `Slider`, `Rating`, `FieldArray`.

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

### `FieldArray`

A repeating group of fields: an invoice's lines, a booking's guests, a shipment's parcels. The form's value at `name` is a REAL array of objects, which is exactly what `{"type": "array", "items": {…}}` declares in `app.json` and what the flow loops over. **Never keep the rows in the screen's own `useState` beside the form** - that is a second copy, and the add/remove bugs all live in keeping the two in step.

The fields inside a row use plain names (`"description"`), never `"lines.0.description"`: the array puts them in the right row, which is why the same `<Field><TextInput/></Field>` pair works inside a row and outside one.

```tsx
<Form values={values} onChange={setValues} schema={SendInvoiceParamsSchema} action={sendInvoice}>
  <FieldArray name="lines" label="Lines" newItem={() => ({ description: "", qty: 1 })} addLabel="Add a line">
    {() => (
      <Row gap={3} align="start">
        <Field name="description" label="What" className="flex-1"><TextInput /></Field>
        <Field name="qty" label="How many" className="w-28"><NumberInput /></Field>
      </Row>
    )}
  </FieldArray>
  <Button type="submit">Send it</Button>
</Form>
```

Rows can be moved up and down and removed; `min` and `max` bound how many there can be. A schema error inside a row lands on that row's own field.

### `Combobox`

A `Select` you can type in. A native select is fine up to about twenty options and unusable past it, and "pick the customer" or "pick the country" is never twenty. Three shapes, one component: search a list, pick several (`multiple`, and the form value is then a string ARRAY), or ask the robot as you type (`loadOptions`, for a list that lives in a database and is too big to hand over).

```tsx
<Field name="customer" label="Customer">
  <Combobox options={customerOptions} placeholder="Start typing" />
</Field>

<Field name="labels" label="Send to">
  <Combobox multiple options={teamOptions} />
</Field>

<Field name="supplier" label="Supplier">
  <Combobox loadOptions={async (q) => (await searchSuppliers.run({ q })).rows.map((r) => ({ value: r.id, label: r.name }))} />
</Field>
```

`options` are `{ value, label }` objects and `value` is always a string, the same as `Select`. `loadOptions` is debounced, so typing is one question to the robot, not one per keystroke.

### `DateRangePicker`

"Between these two dates" as one control, with the answers people actually ask for one press away (last 7 / 30 / 90 days, this month, this quarter). Almost every report, chart and export is over a period, and two `DatePicker`s are not this: the second date has to be after the first, and "last 30 days" has to be counted backwards by hand. The value is `{ from, to }`, both ISO `"yyyy-mm-dd"`.

```tsx
const [period, setPeriod] = useState<DateRange>({ from: "2026-08-01", to: "2026-08-31" });
<DateRangePicker value={period} onChange={setPeriod} />
```

Pass `presets={false}` to hide the quick answers, or your own list to replace them.

### `Switch`

On or off for a setting that takes effect as soon as it is flipped: "email me when this finishes", "pause the robot". A `Checkbox` is for a value a form is about to submit; a `Switch` is for a thing that is either on or off right now, and the two read differently to everybody.

```tsx
<Switch checked={paused} onChange={setPaused} label="Pause the robot" description="Nothing runs until this is back on." />
```

### `TagInput`

Short strings typed one at a time: labels on a lead, recipients on a send, skills on a role. The form value is a string ARRAY, which is what the contract's array type wants and what a flow can loop over. **Never use a `TextInput` and split on commas in the flow** - every one of those got the trimming wrong.

```tsx
<Field name="labels" label="Labels" help="Press Enter after each one.">
  <TagInput placeholder="urgent, vip" />
</Field>
```

### `Slider`

A number chosen by dragging: a threshold, a confidence, a budget. It writes a NUMBER, and shows the value beside the track.

```tsx
<Field name="threshold" label="How sure the robot must be">
  <Slider min={50} max={100} formatValue={(v) => `${v}%`} minLabel="Loose" maxLabel="Strict" />
</Field>
```

### `Rating`

"How did that go?" as one control: stars for a satisfaction score, or a numbered scale for an NPS-style question. It is one radiogroup with one stop in the tab order and the arrow keys between the values, which a row of clickable star glyphs never is.

```tsx
<Field name="score" label="How did we do?"><Rating /></Field>
<Field name="nps" label="How likely are you to recommend us?">
  <Rating variant="scale" min={0} max={10} />
</Field>
```

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
Breadcrumbs:      { items: { label: ReactNode; path?: string }[] /* the last one has no path */,
                    onNavigate?: (path: string) => void, label?: string /* default "Breadcrumb" */ }
AssistantWidget:  { title?: string /* default "Assistant" */, placeholder?: string }
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
Stat:        { label: ReactNode, value: ReactNode, unit?: ReactNode,
               delta?: number /* percent */, deltaLabel?: ReactNode,
               upIsGood?: boolean /* default true */, trend?: number[] /* oldest first */,
               icon?: ReactNode, loading?: boolean, card?: boolean /* default true */ }
Alert:       { variant?: "info"|"success"|"warning"|"error" /* default "info" */,
               title?: ReactNode, onDismiss?: () => void, action?: ReactNode,
               children?: ReactNode }
CopyButton:  { value: string, children?: ReactNode, label?: string /* default "Copy" */,
               toastTitle?: ReactNode, size?: "sm"|"md", disabled?: boolean }
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
Popover:       { trigger: ReactNode, title?: ReactNode,
                 side?: "top"|"bottom"|"left"|"right" /* default "bottom" */,
                 align?: "start"|"center"|"end" /* default "start" */,
                 open?: boolean, onOpenChange?: (open: boolean) => void,
                 label?: string, width?: number /* default 288 */,
                 triggerClassName?: string, children?: ReactNode }
Tabs:          { value?: string, defaultValue?: string, onChange?: (v: string) => void,
                 label?: string, children?: ReactNode }
Tab:           { value: string, disabled?: boolean, badge?: ReactNode, children?: ReactNode }
TabPanel:      { value: string, children?: ReactNode }
Stepper:       { value?: number, defaultValue?: number, onChange?: (i: number) => void,
                 label?: string, controls?: boolean /* default true */,
                 backLabel?: string, nextLabel?: string, nextDisabled?: boolean,
                 nonLinear?: boolean, children?: ReactNode }   // no `action` prop, on purpose
Step:          { title: ReactNode, description?: ReactNode, optional?: boolean,
                 disabled?: boolean, children?: ReactNode }
Accordion:     { type?: "single"|"multiple" /* default "multiple" */, value?: string[],
                 defaultValue?: string[], onChange?: (v: string[]) => void,
                 children?: ReactNode }
AccordionItem: { value: string, title: ReactNode, description?: ReactNode,
                 meta?: ReactNode, disabled?: boolean, children?: ReactNode }
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
                tableRef?: MutableRefObject<DataTableApi | null>,
                // selection: `rowKey` is REQUIRED once `selectable` is set
                selectable?: boolean, selectedKeys?: string[], defaultSelectedKeys?: string[],
                onSelectionChange?: (keys: string[], rows: T[]) => void,
                bulkActions?: DataTableBulkAction<T>[],
                // export
                exportable?: boolean, exportFilename?: string /* default "export.csv" */ }

DataTableSource: { action: ActionLike, pageSize?: number }   // paged: the table fetches
                 | { name: string, records?: unknown }       // an identity tag for rows you hold
DataTableApi:    { refresh: () => void, selection: <T>() => DataTableSelection<T>,
                   clearSelection: () => void }

DataTableSelection<T>: { keys?: string[], rows?: T[], allMatching?: boolean,
                         filter: string, count: number }
DataTableBulkAction<T>: { label: string, danger?: boolean,
                          disabled?: (s: DataTableSelection<T>) => boolean }
                        & ( { onSelect: (s: DataTableSelection<T>) => void }
                          | { action: ActionLike, params?: (s: DataTableSelection<T>) => unknown } )

// what a paged action is called with, and what it must answer
PageRequest: { filter: string, sort?: { key: string, dir: "asc"|"desc" },
               offset: number, limit: number }
PageReply<T>: { rows: T[], total: number }

DataTableColumn<T>: { key: string, header: ReactNode, sortable?: boolean,
                      render?: (row: T) => ReactNode,
                      value?: (row: T) => string | number | null | undefined,
                      align?: "left"|"right"|"center", className?: string,
                      noExport?: boolean }

DataTableRowAction<T>: { label: string, danger?: boolean, disabled?: (row: T) => boolean }
                       & ( { onSelect: (row: T) => void }
                         | { action: ActionLike, params: (row: T) => unknown } )

Chart:      { kind: "bar"|"line"|"area"|"pie",
              data?: ChartDatum[],        // one series, the short way
              series?: ChartSeries[],     // several; wins when both are given
              xKind?: "category"|"time",  // default: "time" when every x parses as a date
              legend?: boolean,           // default: on for a pie and for >1 series
              stacked?: boolean,          // bar only
              title?: string, description?: string, height?: number /* default 220 */,
              formatValue?: (v: number) => string, formatX?: (x: string | number) => string,
              emptyState?: ReactNode, source?: DataTableSource }

ChartDatum:  { label: string, value: number }
ChartPoint:  { x: string | number /* a name, or a date: "2026-04", "2026-04-17" */, y: number }
ChartSeries: { name: string, points: ChartPoint[], color?: string }
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
Timeline:     { children?: ReactNode }
TimelineItem: { title: ReactNode, at?: ReactNode /* ISO reads as a date */, body?: ReactNode,
                status?: "ok"|"warn"|"error"|"pending" /* default "pending" */,
                by?: ReactNode /* usually an Avatar */, children?: ReactNode }
Avatar:       { name?: string, src?: string, size?: "xs"|"sm"|"md"|"lg" /* default "md" */,
                fallback?: ReactNode }
AvatarGroup:  { max?: number /* default 4 */, size?: "xs"|"sm"|"md"|"lg", children?: ReactNode }
Thread:       { messages: ThreadMessage[], onSend?: (text: string) => void,
                action?: ActionLike, params?: (text: string) => unknown,
                placeholder?: string, busy?: boolean, emptyState?: ReactNode,
                height?: number /* default 360 */, readOnly?: boolean, sendLabel?: string }
Message:      { message: ThreadMessage }
Composer:     { onSend?: (text: string) => void, action?: ActionLike,
                params?: (text: string) => unknown, placeholder?: string,
                busy?: boolean, disabled?: boolean, sendLabel?: string }

ThreadMessage: { body: string /* markdown */, id?: string, author?: string, avatarUrl?: string,
                 at?: string, own?: boolean, streaming?: boolean }

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
FieldArray:  { name: string, label?: ReactNode, help?: ReactNode,
               newItem?: () => FormValues /* default {} */, addLabel?: string,
               min?: number, max?: number, reorder?: boolean /* default true */,
               emptyText?: ReactNode,
               children: (item: FormValues, index: number) => ReactNode }  // writes an ARRAY
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
TimePicker:  { value?: string /* 24-hour "hh:mm" */, onChange?: (v: string) => void }
DateRangePicker: { value?: DateRange, onChange?: (r: DateRange) => void,
               presets?: boolean | DateRangePreset[] /* default true */,
               min?: string, max?: string, fromLabel?: ReactNode, toLabel?: ReactNode }
Combobox:    { options?: SelectOption[], loadOptions?: (q: string) => Promise<SelectOption[]>,
               value?: string | string[], onChange?: (v: string | string[]) => void,
               multiple?: boolean, searchable?: boolean /* default true */,
               placeholder?: string, emptyText?: string }   // multiple writes an ARRAY
Switch:      { checked?: boolean, onChange?: (checked: boolean) => void,
               label?: ReactNode, description?: ReactNode }
TagInput:    { value?: string[], onChange?: (v: string[]) => void, placeholder?: string,
               unique?: boolean /* default true */, max?: number }   // writes an ARRAY
Slider:      { value?: number, onChange?: (v: number) => void,
               min?: number /* default 0 */, max?: number /* default 100 */, step?: number,
               showValue?: boolean /* default true */, formatValue?: (v: number) => ReactNode,
               minLabel?: ReactNode, maxLabel?: ReactNode }   // writes a NUMBER
Rating:      { value?: number, onChange?: (v: number) => void,
               max?: number /* default 5 */, min?: number /* default 1; 0 for NPS */,
               variant?: "star"|"scale" /* default "star" */, readOnly?: boolean,
               label?: string, describeValue?: (v: number) => string }
JsonInput:   { value?: Record<string, unknown>,
               onChange?: (v: Record<string, unknown> | undefined) => void,
               formatOnBlur?: boolean /* default true */, invalidMessage?: string,
               rows?: number }                          // writes an OBJECT, not a string
FileUpload:  { action?: ActionLike, params?: Record<string, unknown> | (() => Record<string, unknown>),
               onUpload?: (ref: FileRef) => void, onError?: (e: AppError) => void,
               accept?: string, label?: string, hint?: string,
               isPublic?: boolean, disabled?: boolean }

SelectOption:  { value: string, label: ReactNode, disabled?: boolean }
DateRange:     { from: string /* ISO "yyyy-mm-dd" */, to: string }
DateRangePreset: { label: string, range: () => DateRange }
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
