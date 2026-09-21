# `@robomotion/app-kit` component reference

The complete catalogue. Compose screens from these and Tailwind layout classes; there is nothing else, and nothing else is allowed. Every component is themed from `app.json`'s `theme.accent`, dark-mode aware, and accessible by default - you never write colors, focus rings, or ARIA by hand.

This file is COMPLETE for everything it names. Do not open the packages' own
files to check it - not the `.d.ts`, not the built `dist/` bundle, not
`package.json`; nothing under `node_modules/@robomotion/**` at all. On
2026-09-06 a build spent eight shell calls and about ninety seconds walking
`node_modules/@robomotion/apps-runtime/dist/**` to find out one thing this
page already says - and the person watching got six identical "Checked how to
build it" rows for it. On 2026-09-08 another one read the rule, skipped the
`.d.ts` it names, and grepped `@robomotion/app-kit/dist/index.js` for its
exports instead: the list of exports is the code block below, and a `grep`
that finds it there has cost the person a row on screen to learn what they
were already told. `tsc` is the check, not a `grep`: write the screen,
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
  AppShell, Screen, PageHeader, ConnectionBanner, Breadcrumbs, AssistantWidget, ThemeToggle,
  Button, Spinner, Icon, Badge, Kbd, Card, CardHeader, CardBody, CardFooter, DataTable,
  Toolbar, SearchInput, Pagination, SegmentedControl, Separator, DescriptionList,
  Form, Field, FieldArray, TextInput, NumberInput, TextArea, Select, Combobox,
  Checkbox, Switch, RadioGroup, DatePicker, TimePicker, DateRangePicker,
  TagInput, Slider, Rating, JsonInput, useFormValues, FileUpload,
  Progress, Skeleton, StatusBadge, Stat, Sparkline, Alert, CopyButton, EmptyState, ErrorState,
  Toast, useToast, toast, dismissToast,
  Dialog, ConfirmDialog, Drawer, Popover, Tabs, Tab, TabPanel, Stepper, Step,
  Accordion, AccordionItem, Menu, MenuItem, Tooltip,
  Chart, Kanban, KanbanColumn, KanbanCard, Calendar, Timeline, TimelineItem,
  Avatar, AvatarGroup, Thread, Message, Composer, Markdown, JsonView,
  Image, ImageGrid, Lightbox, ImageCompare, ImageMarkup, MarkList, useMarkHistory,
  Meter, BarList, AnimatedNumber, ProgressSteps,
  Stack, Row, Grid, ScrollRow, cn, accentStyle, focusRing, inputBase, DEFAULT_ACCENT,
  tk, textStyles, ICON_NAMES, setTheme, useTheme,
} from "@robomotion/app-kit";

// Everything that reaches the robot. NONE of these are in the kit.
import {
  AppProvider, useAppClient, useMaybeAppClient,
  useAction, useEvent, useConnection, useFileUpload, useFileUrl, useLive,
  bindAction, markGesture,
} from "@robomotion/apps-runtime/react";
```

## Design language

The kit is a design system, not a pile of widgets. A screen composes it and
adds layout; it never chooses a colour, draws a picture or invents a
primitive. `validate_app`'s `kit-only` check reports each of the things
below by file and line, in these words.

**Colours a screen may write.** The kit's Tailwind preset gives every screen
these names, and each is a token the kit's own components paint with, so a
screen written with them matches the kit in light and in dark without a
`dark:` variant: `bg-background`, `bg-card`, `bg-muted`, `bg-muted/50`,
`bg-primary`, `bg-primary/10`, `bg-secondary`, `bg-sidebar`, `text-foreground`,
`text-muted-foreground`, `text-primary`, `text-primary-foreground`,
`text-destructive`, `text-success`, `text-warning`, `text-info`,
`border-border`, `border-input`, `ring-ring`, `bg-chart-1` to `bg-chart-5`,
`bg-accent-50` to `bg-accent-950` (the app's accent as a ramp), `rounded-lg`
(the app's radius), `shadow-sm` / `shadow-md` / `shadow-lg`.

**Colours a screen may never write:** a Tailwind palette name
(`text-gray-500`, `bg-green-50`, `border-red-200`), `text-white` or
`bg-black`, any `dark:` variant, a hex or rgb in brackets (`bg-[#f5f5f5]`),
or `style={{ color: ... }}`. A state is a `StatusBadge` or a `Badge`; a
warning is an `Alert`; a quieter line is `text-muted-foreground`; the accent
is `text-primary`. There is no fifth grey.

**Type.** The scale lives in the components: `Screen` sets the page title,
`CardHeader` the card title, `Stat` the number, `Dialog` its heading.
`text-sm` is the body, `text-xs text-muted-foreground` a caption,
`tabular-nums` any column of numbers. Never a heading with its own
`text-4xl font-black`, never a `font-` class: the kit ships Inter and every
screen is set in it.

**Icons.** `<Icon name="plus" />`, from the `## Icons` list at the end of this
file and from nowhere else; a wrong name is a `tsc` error, which is the
loop you already run. Every nav item has one (`icon` in `src/screens.tsx`);
`Button`, `Stat`, `EmptyState`, `CardHeader`, `Tab`, a `Menu` item,
`PageHeader` and `Badge` take an `icon` prop. Never an inline `<svg>`, never
an emoji standing in for an icon.

**Badge vocabulary.** `success` means done, `warning` means needs attention,
`danger` means failed, `info` means in progress, `neutral` means waiting or
not started, `accent` marks the one thing to look at. Write the mapping from
the app's own words to these once, in `src/lib/status.ts`, and read it from
every screen, so "paid" is the same green in the table, on the record page
and in the timeline.

**What a good screen has.** One `Screen` per route, with a `description`
and its `actions` (the primary button on the right); a `Grid` of `Stat`
tiles above a list when the person cares about numbers; a `Toolbar` with a
`SearchInput` above any list that can be filtered; three states for anything
that waits on the robot (loading, empty with one button, failed with Try
again); the sidebar, with an icon on every item, from two screens on; `Card`
for grouping and never a card inside a card; `Grid cols={1} mdCols={2}
lgCols={4}` for tiles, so a phone gets one column. Spacing is the kit's:
`Stack gap={6}` between sections, `gap={4}` inside one.

## Frame

### `AppShell`

The page frame: a sidebar with an icon rail (the default once the app has two or more screens), or a top bar; the content slot; the connection banner and the toast viewport built in. One per app, at the root, and the template's `src/main.tsx` already mounts it, so a screen never writes one. The nav comes from `src/screens.tsx`: give every screen an `icon` and, when there are many, a `group`.

```tsx
<AppShell title="Invoice Approvals" nav={[
  { label: "Queue", path: "/", icon: "inbox", badge: 3 },
  { label: "Suppliers", path: "/suppliers", icon: "building-2" },
  { label: "Settings", path: "/settings", icon: "settings", group: "Setup" },
]} activePath={usePath()} onNavigate={navigate}>
  {/* routed screens render here */}
</AppShell>
```

The brand tile shows the first letter of the name. An app that ships an icon at `src/icon.png` (or `.svg`/`.webp`) gets it there instead: the template picks the file up and passes `logoSrc`, and a picture that cannot load falls back to the letter, so a screen never has to handle a missing icon. `logo` replaces the whole tile and overrides `logoSrc`.

On a phone the sidebar becomes a menu button and a drawer; the person can fold the sidebar to its icons and the choice is remembered. `layout="topbar"` keeps the old top bar, and `app.json`'s `theme.layout` sets it for the app; `headerRight` and `topbar` put controls in the top bar (a search box, a period picker). When the app is opened on its own the sidebar's foot holds a `ThemeToggle`; inside the Designer the host decides the theme and none is shown.

### `Screen`

One routed screen with a title and description. One `Screen` per file under `src/pages/`, and every file under `src/pages/` opens with one (`kit-only` reports a page that does not). It renders a `PageHeader`: an `icon`, a `badge`, `breadcrumbs` or a `backPath` for a detail page, `actions` on the right, and `tabs` under the title for a screen in sections.

```tsx
<Screen title="Queue" description="Invoices waiting for a decision." icon="inbox"
        actions={<Button icon="plus">Add an invoice</Button>}>
{/* The shell's title is the app's name and it is already on screen. A screen's
    title says what THIS screen does ("Queue", "Work out the cost"), and a
    card's title what the card holds ("Total") - never the app's name again.
    A one-screen app that repeats its name on the shell, the screen and the
    card reads as a template. */}
  {/* content */}
</Screen>
```

### `PageHeader`

The top of a screen on its own, for a screen that lays itself out (a split view, a full-height board) and cannot be a `Screen`. The same props: `title`, `description`, `icon`, `badge`, `breadcrumbs`, `backPath`, `actions`, `tabs`.

```tsx
<PageHeader title={invoice.number} badge={<StatusBadge status="pending" />} backPath="/"
            breadcrumbs={[{ label: "Invoices", path: "/" }, { label: invoice.number }]}
            actions={<Button variant="danger" icon="trash-2" onClick={() => setConfirming(invoice)}>Remove</Button>} />
```

### `ThemeToggle`

Light or dark, chosen by the person and remembered. The shell already places one where it belongs; put one in a settings screen only when the person asked for the choice there.

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

**An absolute path written by hand is always wrong**, however innocent it looks:

```tsx
<a href="/">Go to Trips</a>          // ✗ the SITE root, not your first screen
<Link to="/trips">All trips</Link>   // ✗ same
window.location.href = "/settings";  // ✗ same
```

Each of those leaves the app's base and lands the WHOLE page on the serving
tier's "not found", from which the only way back is reloading the Designer.
It works everywhere except the one place the app actually runs, so nothing but
pressing the link finds it. Write `screenHref("/")` for an href and
`navigate("/trips")` in a handler. `validate_app`'s `screen-links` check
refuses the three spellings above; a link that really does leave the app needs
a full URL with its scheme.

## Actions and feedback

### `Button`

`variant`: `primary` / `secondary` / `outline` / `ghost` / `danger`; `size`: `sm` / `md` / `lg` / `icon` (a square for one icon and an `aria-label`). `icon` puts a kit icon before the label and `iconRight` after it: `<Button icon="plus">Add a supplier</Button>`. A button that makes the robot do something takes the action through `action` (the object the generated `use<Action>()` hook returns) and its `params` (a value, or a function of the click event). The click runs it, the spinner shows and the button is disabled while it runs, and the Build view can jump from the button to the step in the flow. Never write your own `onClick={() => run(...)}` plus `loading` plus `disabled` for that.

```tsx
const approve = useApproveInvoice();
<Button variant="primary" action={approve} params={{ number: invoice.number }}>
  Approve
</Button>
```

`loading` still exists for a button whose busy state comes from somewhere else, and `onClick` still runs first when both are given. Inside a `<Form action={…}>` the submit button takes no `action` of its own; the form runs it. `Spinner` is the same spinner on its own, for the rare busy state no `Button` owns - never draw one with a `border animate-spin` div.

### `Badge`

A small label with a meaning: a state, a category, a count. `variant`: `neutral` (waiting) / `accent` (the one to look at) / `success` (done) / `warning` (needs attention) / `danger` (failed) / `info` (in progress) / `outline`. `dot` puts a coloured dot first, `icon` an icon, `onRemove` a small × (a filter chip in a `Toolbar`). Never a coloured `span` of your own.

```tsx
<Badge variant={STATUS[row.status].variant} dot>{STATUS[row.status].label}</Badge>
<Badge variant="outline" icon="filter" onRemove={() => setStage(undefined)}>Stage: won</Badge>
```

### `Kbd`

A key on the keyboard, for a hint like "Press <Kbd>Enter</Kbd> after each one".

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

Exactly four states: `ok` / `warn` / `error` / `pending`, drawn as `Badge`'s success / warning / danger / neutral, so a state here and a `Badge` elsewhere cannot disagree. Map your domain onto them; do not invent a fifth. A domain with more meanings than four (in progress, on hold) uses `Badge` with the vocabulary above.

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

`trend` is a plain list of recent numbers, oldest first, drawn as a small line under the value; `icon` puts a kit icon in a tinted chip in the corner (`icon="clock"` for hours saved). `loading` shows a placeholder instead of a misleading zero.

On a live dashboard give it a NUMBER and `animate`: the value rolls from the last one to the new one (and jumps when the person asks for reduced motion; a screen reader only ever hears the final value). `emphasis="inverted"` is the filled tile for the one or two headline numbers at the top of a page - do not invert a whole row.

```tsx
<Stat label="Collected" value={run.collected} animate emphasis="inverted" />
```

### `Sparkline`

The trend line on its own, for a table cell or a record page: `<Sparkline values={row.last_30_days} />`. No axes, no labels; the number beside it says what it is.

### `Meter`

One value against a scale, as a labelled bar: a confidence, a quota, a score. `segments` draws the scale as cells, which is how a 0-3 score reads (`value={2} max={3} segments={3}`). `uncertain` hatches the bar and says "low confidence" to a screen reader - use it when the number is a guess, not to colour a bad number (that is `tone="danger"`). **Never hand-build a bar out of two divs.**

```tsx
<Meter label="Hook strength" value={2} max={3} segments={3} valueLabel="2 of 3" />
<Meter label="Confidence" value={a.confidence} trailing={pct(a.confidence)} uncertain={a.confidence < 0.6} />
```

### `BarList`

A ranking: the top referrers, the most common error types, how many of each category. Sorted biggest first unless told otherwise, `limit` with a "Show all" toggle, `onSelect` makes each row a button (a filter, a drill-down), `animate` slides rows into their new places when the counts change under a live view. Prefer it to a bar `Chart` whenever the labels are words.

```tsx
<BarList label="Hooks" items={hooks.map((h) => ({ key: h.id, label: h.name, value: h.count }))} limit={6} animate onSelect={(i) => setFilter(i.key)} />
```

### `AnimatedNumber`

The rolling number `Stat animate` uses, on its own for a sentence or a table cell: `<AnimatedNumber value={spend} format={{ style: "currency", currency: "USD" }} />`.

### `ProgressSteps`

What the robot is doing, step by step: Fetch · Read · Match · File. It is a STATUS rail - nobody presses it; `Stepper` is the wizard a person walks through. Each step is `pending`, `active`, `done`, `failed` or `skipped`; the active one is announced when it changes. Feed it from `progress.data` while the call runs and from the result when it lands.

```tsx
<ProgressSteps label="Import" steps={[
  { key: "fetch", label: "Fetch", status: "done", detail: "12 files" },
  { key: "read", label: "Read", status: "active" },
  { key: "file", label: "File", status: "pending" },
]} />
```

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

Icon, title, one action. Every table and list MUST have a designed empty state - a blank screen reads as broken. `icon` is a kit icon name (`"inbox"` by default; `"file-text"` for documents, `"users"` for people, `"search"` for no matches); the description says what to do first.

```tsx
<EmptyState icon="inbox" title="No invoices waiting" description="Ones the robot finds will show up here."
            action={<Button variant="secondary" icon="refresh-cw" action={refresh} params={{}}>Check again</Button>} />
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
  { label: "Export everything", icon: "download", action: exportAll, params: {} },
  { label: "Clear the list", icon: "trash-2", danger: true, onSelect: () => setConfirming("all") },
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

Grouping. A dashboard stat, a detail panel, a form section. `CardHeader` takes a `title`, a `description`, an `icon` and `actions` (a `Badge`, a `Menu`, a small `Button`) on the right; `interactive` on a `Card` lifts it on hover for a card that opens something. Never a card inside a card.

```tsx
<Card>
  <CardHeader title={`Invoice ${invoice.number}`} icon="file-text" actions={<StatusBadge status="pending" />} />
  <CardBody>{invoice.supplier} · {invoice.amount}</CardBody>
  <CardFooter><Button variant="danger">Reject</Button></CardFooter>
</Card>
```

### `DescriptionList`

Label-and-value pairs: the properties of a record, the details of an order. `items` is `{ label, value }[]`; `columns={2}` at wide widths, `inline` puts the label beside the value, `dense` tightens the rows, and an empty value prints as a dash rather than nothing. Never a hand-made grid of two `div`s per row.

```tsx
<DescriptionList columns={2} items={[
  { label: "Supplier", value: invoice.supplier },
  { label: "Amount", value: invoice.amount },
  { label: "Due", value: invoice.due_date },
  { label: "Note", value: invoice.note, wide: true },
]} />
```

### `Separator`

A rule between two things, in the kit's border colour. `label="or"` puts words in the middle; `orientation="vertical"` for a toolbar.

### `DataTable`

Columns, rows, sort, filter, empty state, row actions, pagination - all built in. This is the workhorse of most archetypes, and **never re-implement sorting or paging in the screen**. A row action that runs an action is written as `{ label, action, params }` with `params` built from the row; one that only navigates keeps `onSelect`.

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

**A button on every row.** Everything in `rowActions` goes into the row's "More" menu, and nothing else: the person has to open the menu to find it. When they ask for a button beside each row by name - "a Cancel button on every booking", "Return next to each item" - the menu is not what they asked for. Render it as a column, and keep a destructive one behind `ConfirmDialog` as above:

```tsx
const [cancelling, setCancelling] = useState<Booking | null>(null);
<DataTable
  columns={[
    { key: "date", header: "Date" },
    { key: "name", header: "Name" },
    { key: "cancel", header: "", render: (row) => (
      <Button size="sm" variant="secondary" onClick={() => setCancelling(row)}>Cancel</Button>
    ) },
  ]}
  source={{ action: listBookings }}
/>
<ConfirmDialog open={cancelling !== null} onClose={() => setCancelling(null)}
  title="Cancel this booking?" confirmLabel="Cancel it" danger
  action={cancelBooking} params={() => ({ id: cancelling?.id })} />
```

`rowActions` is for the things nobody asked to see on every row - export this one, copy its link. A button that only navigates goes in a column the same way, with `navigate(...)` in its `onClick`.

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

**Never wrap the table in the action's own `loading` or `error`.** A `source`-driven `DataTable` owns both: it shows its own busy state, its own empty state and its own error with a Try again. Gating it unmounts the table while its own fetch is in flight, and since a fresh mount always fetches, the screen never stops:

```tsx
// WRONG - an endless loop. mount -> fetch -> loading true -> the skeleton
// replaces the table -> the call lands -> loading false -> the table mounts
// again -> fetch. Every turn is a real run on the robot.
{list.loading ? <Skeleton /> : <DataTable source={{ action: list }} columns={cols} />}

// RIGHT - the table handles loading, empty and error itself.
<DataTable source={{ action: list }} columns={cols}
  emptyState={<EmptyState title="Nothing here yet" />} />
```

The same applies to any key or prop that changes on every render: a remounted table is a refetching table. The kit stops a list that asks the same question more than twenty times in two seconds and says so on the screen, but that is a brake on a screen that is already wrong, not a licence to write one.

The table refetches on its own when the person filters, sorts or turns a page, and when that same action finishes a run somebody else started - so a row added by another button appears without a reload.

It also refetches after a write **it ran itself** - a `bulkActions` entry, or a `rowActions` entry carrying an `action` - and a bulk action unticks afterwards, because the rows it referred to have just changed. A row action that only navigates (`onSelect`) writes nothing and costs no fetch.

And it refetches after a write run by **any other kit widget on the screen**: a `Form` carrying an `action`, a `ConfirmDialog`, a `Button`, a `Menu` item, a `FileUpload`. Adding a supplier from a dialog and removing one from a confirm are different actions from the one the table reads with, and every widget that runs an action announces it when the call **settles**, so the list asks again at the right moment.

A list you load yourself with a generated hook (`const items = useListItems()`, `useEffect(() => { void items.run({}); }, [])`, rows passed by hand) asks again on the same announcement **only when its action is marked `"read_only": true` in `mcp.json`**, and only after `robomotion app codegen` has run with that `mcp.json` in place: codegen then binds the hook as a read. A hook whose action is not marked read-only is never re-run, because running a write again stores it again. So mark every action that only reads as `read_only`, and never mark one that changes anything.

**So do not wire refreshing into the screen.** In particular, never hang a refresh off `onClick`, `onSubmit` or `onConfirm`:

```tsx
// WRONG - onClick, onSubmit and onConfirm all run BEFORE the action does,
// so this re-reads the OLD rows and the new one never appears.
<Button action={addOrder} params={draft} onClick={() => setTimeout(() => table.current?.refresh(), 0)}>Add</Button>

// RIGHT - the kit already knows the write happened.
<Button action={addOrder} params={draft}>Add</Button>
```

A `tableRef` is only for a write the SCREEN made itself, by calling `action.run` in its own handler - then nothing rendered it, so nothing can announce it:

```tsx
const table = useRef<DataTableApi | null>(null);
<DataTable columns={cols} source={{ action: listOrders }} tableRef={table} />
// await, THEN refresh - the order is the whole point.
async function importRows() {
  await addOrder.run(draft);
  table.current?.refresh();
}
```

**Loading a screen.** Only a table with `source={{ action }}` asks for its rows by itself, on mount. Every other screen that shows an answer - a detail page, a row of counters, a dropdown fed by a list - has to ask when it opens, in ONE effect, and `validate_app`'s `screen-loads` check names each one that does not:

```tsx
// RIGHT - asked on open; the person sees their data without pressing anything.
const summary = useGetSummary();
const customers = useListCustomers();
useEffect(() => { void summary.run({}); void customers.run({}); }, []);

// WRONG - run only after an add, so the screen opens empty over rows that are there.
async function onAdd() { await addCustomer.run(draft); await customers.run({}); }
```

The effect's dependency array is `[]`, or the values that should ask again (an id). Never the hook object or a function made during render: both are new on every render, so the effect asks after every answer and the screen shows Loading for ever. `validate_app`'s `effect-loop` check names it.

```tsx
// WRONG - `customers` is a new object every render: asks, re-renders, asks again, for ever.
useEffect(() => { void customers.run({}); }, [customers]);
// RIGHT
useEffect(() => { void customers.run({}); }, []);
```

A form that creates a record must bring the list that shows it up to date. When that list is a `DataTable` with `source={{ action }}` on the same screen, the kit does it: the form announces its write when it settles and the table asks again. A list you render yourself, a dropdown or a counter, loaded by a generated hook whose action `mcp.json` marks `read_only`, asks again the same way. Anywhere else - a read not marked read-only, or a write the screen ran itself with `run` rather than through a kit widget - run the read again after the `await` of your own `run`, never before it, or hand the table a `tableRef` and call `refresh()` as above.

A date and a time typed in two inputs are one value to the contract. Join them before `run` (a template such as `${date}T${time}:00`, or whatever shape `app.json` declares) - a form that sends `date` and `time` as two fields to an action that wants `starts_at` is refused by the input check and the person sees nothing happen.

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

### `Toolbar` / `SearchInput`

The strip above a list: a `SearchInput` first, filters beside it (a `Popover`, a `Select`, a `SegmentedControl`, removable `Badge` chips for the filters in force), and the actions at the `end`. A `DataTable` with `filterable` draws its own; a list the screen lays out itself gets this one, so every list in the app reads the same.

```tsx
<Toolbar end={<Button icon="plus">Add a lead</Button>}>
  <SearchInput value={q} onChange={setQ} placeholder="Search leads" />
  <SegmentedControl value={view} onChange={setView} label="View"
    options={[{ value: "list", label: "List", icon: "list" }, { value: "board", label: "Board", icon: "kanban" }]} />
  {stage && <Badge variant="outline" onRemove={() => setStage(undefined)}>Stage: {stage}</Badge>}
</Toolbar>
```

### `Pagination`

"Page 2 of 13", Previous and Next, and "26 to 50 of 312 items" when the total is known. `DataTable`'s pager is this component; a screen that pages a `Grid` of cards by hand uses it too.

```tsx
<Pagination page={page} pageCount={Math.ceil(total / 24)} onChange={setPage} total={total} pageSize={24} noun="items" />
```

### `SegmentedControl`

Two to five choices that change what is on screen right now: list or board, week or month, all or mine. One is always chosen. `Tabs` are sections of a page; this is a setting of a view, and it sits in a `Toolbar`.

### `Tabs` / `Tab` / `TabPanel`

Sections of one screen, when splitting them into routed screens would be too much. The strip is one stop in the tab order and the arrow keys move between the tabs, which is the part a hand-rolled row of buttons never gets right.

```tsx
<Tabs defaultValue="waiting" label="Invoices">
  <Tab value="waiting" icon="hourglass" badge={waiting.length}>Waiting</Tab>
  <Tab value="done" icon="circle-check">Done</Tab>
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

`bar`, `line`, `area`, `pie` or `donut` (a pie with the total in the middle), drawn as inline SVG to the width of its card. **Never write your own SVG and never reach for a charting library** - neither is allowed, and this is why the kit has one.

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

`xKind="time"` lays the points out to scale and puts them in date order however the flow answered; leave it out and dates are detected anyway. `stacked` stacks bars instead of standing them side by side. Colours come from the kit's chart palette (the app's accent first, then four hues far enough apart to tell), so nobody picks any; `color` on a series overrides one when a colour carries meaning ("red is the overdue line").

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

The action is called with `{ key, from, to }` - which card, which column it left, which one it landed in. Declare the move action's params as those three names: a board whose action expects `{ id, stage }` passes every check and answers "invalid parameters" on the first drag.

**Never write your own dragging beside this.** `draggable` / `onDragStart` / `onDrop` is HTML5 drag: mouse only, nothing on a touch screen, and no keyboard path at all. This component is the one place an app gets dragging from.

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

`attachments` lets the person add files (a paperclip button, paste or drop): each one uploads as soon as it is added and travels as a `FileRef`, Send waits for any upload still out, and the call becomes `{ text, files }` (`params(text, files)` when given). `{ accept: "image/*", max: 3 }` narrows it. `controls` puts your own small control - a quality `Select`, a model picker - left of Send. Both need an `AppProvider` (every app has one); without `attachments` nothing changes.

```tsx
<Composer attachments={{ accept: "image/*" }} controls={<Select aria-label="Quality" value={q} onChange={setQ} options={QUALITIES} />}
  action={edit} params={(text, files) => ({ versionId, instruction: text, attachments: files })} />
```

## Pictures

### `Image`

Every picture on a screen - a product photo, a scanned receipt, a screenshot the robot took. **Never write `<img>`.** It keeps the picture's shape from the first frame (`aspect`), shows a grey placeholder or a tiny blurred preview (`placeholder`, a data URL of a few hundred bytes that came with the row) until the real one lands, shows a quiet "no picture" tile instead of the browser's broken glyph, and `zoomable` opens it full screen.

A file the robot saved (App Save File) or a person uploaded is a `FileRef`, not a URL: pass it as `file` and the kit turns it into a link (and renews the link if it has run out). Never call `downloadUrl` yourself to feed an image.

```tsx
<Image file={ad.image} placeholder={ad.thumb} alt={ad.headline} aspect="4:5" zoomable />
<Image src={product.photo_url} alt={product.name} aspect="1:1" fit="contain" />
```

### `ImageGrid`

Many pictures: a gallery, a picker, a wall that fills as the robot works, a strip of versions. Arrow keys move, Enter picks; `selectable` ticks several. `layout="strip"` is one row that scrolls sideways. `fill` shrinks the tiles until every one fits the box with no scrolling (give the box a height: `className="h-96"`), and `total` draws the empty slots still to come - the two together are the "whole category at once" wall. `highlightNew` fades the newest in. `source={{ action, pageSize }}` makes it fetch its own pages (`{ rows, total }`, each row an `ImageGridItem`).

```tsx
<ImageGrid label="Ads" items={ads.map((a) => ({ key: a.id, src: a.thumb, alt: a.brand }))} fill total={run.total} highlightNew={4} density="mosaic" className="h-80" />
<ImageGrid label="Versions" layout="strip" aspect="4:5" items={versions} selectedKey={current} onSelect={(v) => setCurrent(v.key)} />
```

### `Lightbox`

The full-screen viewer `Image zoomable` opens, for a screen that opens it itself - over a whole set, with Previous/Next. Wheel and pinch zoom, drag pans; the keyboard has all of it (arrows, + - 0, Home/End, Escape). `actions` puts buttons in its header.

```tsx
<Lightbox open={open} onClose={() => setOpen(false)} items={photos} defaultIndex={i} actions={(p) => <Button size="sm" onClick={() => use(p)}>Use this</Button>} />
```

### `ImageCompare`

Before and after: a slider over the two, `mode="hold"` (show "before" while pressed), or `"side-by-side"`. The slider is a real slider from the keyboard.

```tsx
<ImageCompare before={{ file: v.previous, alt: "Before" }} after={{ file: v.current, alt: "After" }} />
```

### `ImageMarkup` / `MarkList` / `useMarkHistory`

Point at parts of a picture and say something about each: a defect on an inspection photo, the part of a design to redo, the button in a screenshot that does nothing. Pin, box, arrow, freehand and a wide brush for painting a region; every gesture has a key (Enter on the picture places the current tool's mark at the centre; Tab walks the marks; arrows move one, Alt+arrows resize, Delete removes, Enter writes its note). **Drawing is never hand-rolled** - no `<canvas>`, no `<svg>`, no pointer handlers of your own.

`marks` is data the screen owns, every coordinate a fraction (0-1) of the picture, so it means the same on any screen and on the robot. Keep it in `useMarkHistory()` for undo/redo, and put `MarkList` beside it - the numbered notes, bound to the same list. When a model must read the marks, rasterise them in the browser through the handle and upload the result: `exportAnnotated()` burns them into a copy in magenta (`#FF00FF`, never your accent - the reader is a model), `exportMask()` is a PNG whose transparent part is the painted region.

```tsx
const history = useMarkHistory();
const markup = useRef<ImageMarkupHandle>(null);
const { upload } = useFileUpload();
const [tool, setTool] = useState<MarkTool>("box");

<ImageMarkup ref={markup} file={version.image} alt="Current version" tool={tool} onToolChange={setTool}
  marks={history.marks} onMarksChange={history.setMarks}
  onUndo={history.undo} onRedo={history.redo} canUndo={history.canUndo} canRedo={history.canRedo} />
<MarkList marks={history.marks} onMarksChange={history.setMarks} />

const send = async (text: string) => {
  const annotated = await upload(new File([await markup.current!.exportAnnotated()], "annotated.png", { type: "image/png" }));
  await edit.run({ versionId, marks: history.marks, annotatedFile: annotated, instruction: text });
  history.reset();
};
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

### `ScrollRow`

A row that scrolls sideways - review cards, a strip of chips - with the ends fading and arrow buttons while there is more that way; the row itself takes Left/Right/Home/End. `label` names it. **Never write `overflow-x-auto` for this.**

```tsx
<ScrollRow label="Waiting for review" gap={3} snap>
  {queue.map((q) => <ReviewCard key={q.id} item={q} />)}
</ScrollRow>
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
  AppProvider, useAction, useEvent, useConnection, useFileUpload, useFileUrl, useLive,
  bindAction, markGesture,
} from "@robomotion/apps-runtime/react";
```

| Hook | Returns | Use for |
|---|---|---|
| `use<Action>()` (generated) | `{ run, data, error, loading, progress, cancel, name }`, typed from the contract | every button that makes the robot do something; pass the whole object to `Button`'s `action`. Import it from `@/generated/actions.gen`, never write `useAction("name")` yourself |
| `useEvent(name, cb)` | subscribes for the component's lifetime | toasts and refreshes when the robot announces something |
| `useConnection()` | `{ state, robotOnline }` | anything that must react to `"connecting" \| "ready" \| "offline" \| "robot_offline" \| "contract_mismatch"` |
| `useFileUpload()` | `{ upload, uploading, progress, error }` | getting a `FileRef` to pass into an action |
| `useFileUrl(ref)` | `{ url, loading, error, refresh }` | a `FileRef` as a URL, for the rare custom surface. `Image` and the picture components already do this - never call it to feed them |
| `useLive(action, { events, params?, pollMs? })` | `{ data, error, loading, refreshing, done, refresh, name }` | anything the robot is still changing: a run's counters, a queue. Asks the read action on open, again when one of `events` arrives (a burst is one question), by the clock when nothing is heard, and stops polling at `done: true` |

**Events are not buffered.** A page that reloads mid-run hears none of what it missed, so never keep a count by adding events up in state. The robot keeps the state (SQLite), a read action returns it, and `useLive` keeps that read current:

```tsx
const run = useLive<{ id: string }, RunView>("getRun", { params: { id }, events: ["runProgress", "runFinished"] });
<Stat label="Analysed" value={run.data?.analyzed ?? 0} animate />
```

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
AppShell:         { title: ReactNode, subtitle?: ReactNode, accent?: string, logo?: ReactNode,
                    logoSrc?: string,
                    nav?: { label: string; path: string; icon?: IconName | ReactNode; group?: string;
                            badge?: ReactNode; exact?: boolean }[],
                    activePath?: string, onNavigate?: (path: string) => void,
                    connectionState?: ConnectionState, headerRight?: ReactNode, topbar?: ReactNode,
                    layout?: "sidebar"|"topbar" /* default: sidebar at 2+ items */,
                    collapsible?: boolean /* default true */, defaultCollapsed?: boolean,
                    sidebarFooter?: ReactNode, contentWidth?: "default"|"wide"|"full", children?: ReactNode }
Screen:           { title: ReactNode, description?: ReactNode, actions?: ReactNode,
                    icon?: IconName | ReactNode, badge?: ReactNode,
                    breadcrumbs?: { label: ReactNode; path?: string }[], backPath?: string,
                    tabs?: ReactNode, children?: ReactNode }
PageHeader:       { the same as Screen minus children, plus onNavigate?: (path: string) => void }
ThemeToggle:      { showLabel?: boolean /* default false */ }
ConnectionBanner: { state?: ConnectionState, className?: string }
Breadcrumbs:      { items: { label: ReactNode; path?: string }[] /* the last one has no path */,
                    onNavigate?: (path: string) => void, label?: string /* default "Breadcrumb" */ }
AssistantWidget:  { title?: string /* default "Assistant" */, placeholder?: string }
```

**Actions and feedback**

```ts
Button:      { variant?: "primary"|"secondary"|"outline"|"ghost"|"danger", size?: "sm"|"md"|"lg"|"icon",
               icon?: IconName | ReactNode, iconRight?: IconName | ReactNode,
               loading?: boolean, action?: ActionLike, params?: unknown | ((e) => unknown),
               type?: "button"|"submit", children?: ReactNode }
Spinner:     { className?: string }
Icon:        { name: IconName, size?: 12|14|16|18|20|24|28|32 /* default 16 */,
               strokeWidth?: number /* default 2 */, label?: string /* names it; otherwise decorative */ }
Badge:       { variant?: "neutral"|"accent"|"success"|"warning"|"danger"|"info"|"outline",
               size?: "sm"|"md", dot?: boolean, icon?: IconName | ReactNode,
               onRemove?: () => void, removeLabel?: string, children?: ReactNode }
Kbd:         { children?: ReactNode }
Progress:    { value?: number /* 0-100; omit for indeterminate */, label?: string,
               showValue?: boolean }
StatusBadge: { status: "ok"|"warn"|"error"|"pending", children?: ReactNode }
Stat:        { label: ReactNode, value: ReactNode, unit?: ReactNode,
               delta?: number /* percent */, deltaLabel?: ReactNode,
               upIsGood?: boolean /* default true */, trend?: number[] /* oldest first */,
               icon?: IconName | ReactNode, loading?: boolean, card?: boolean /* default true */,
               animate?: boolean /* a number value rolls to its new value */,
               emphasis?: "default"|"inverted" }
AnimatedNumber: { value: number, durationMs?: number /* default 600 */,
               format?: Intl.NumberFormatOptions, locale?: string }
Meter:       { label: ReactNode, value: number /* 0-1, or 0-max */, max?: number,
               segments?: number /* draw the scale as this many cells */,
               tone?: "default"|"success"|"warning"|"danger", uncertain?: boolean,
               uncertainLabel?: string /* default "low confidence" */,
               valueLabel?: ReactNode, trailing?: ReactNode, size?: "sm"|"md" }
BarList:     { items: { key: string; label: ReactNode; value: number; color?: string; href?: string }[],
               max?: number, sort?: "desc"|"asc"|"none" /* default "desc" */,
               limit?: number /* then "Show all" */, formatValue?: (v: number, item) => ReactNode,
               onSelect?: (item) => void, selectedKey?: string, animate?: boolean,
               source?: DataTableSource, emptyState?: ReactNode, label?: string }
ProgressSteps: { steps: { key: string; label: string;
                          status: "pending"|"active"|"done"|"failed"|"skipped"; detail?: ReactNode }[],
               orientation?: "horizontal"|"vertical" /* default "horizontal" */, label?: string,
               statusLabels?: Partial<Record<status, string>> }
Sparkline:   { values: number[], width?: number /* 120 */, height?: number /* 28 */,
               area?: boolean /* default true */, color?: string, label?: string }
Alert:       { variant?: "info"|"success"|"warning"|"error" /* default "info" */,
               title?: ReactNode, onDismiss?: () => void, action?: ReactNode,
               children?: ReactNode }
CopyButton:  { value: string, children?: ReactNode, label?: string /* default "Copy" */,
               toastTitle?: ReactNode, size?: "sm"|"md", disabled?: boolean }
Skeleton:    { variant?: "text"|"rect"|"circle" /* default "text" */, lines?: number,
               width?: string | number, height?: string | number }
EmptyState:  { title: ReactNode, description?: ReactNode, icon?: IconName | ReactNode /* default "inbox" */,
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
Tab:           { value: string, disabled?: boolean, icon?: IconName | ReactNode, badge?: ReactNode,
                 children?: ReactNode }
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
MenuItem:      { icon?: IconName | ReactNode, danger?: boolean, action?: ActionLike,
                 params?: unknown | ((e) => unknown), onSelect?: () => void, disabled?: boolean,
                 children?: ReactNode }
Tooltip:       { content: ReactNode, side?: "top"|"bottom"|"left"|"right" /* default "top" */,
                 children: ReactNode /* exactly one element */ }

MenuItemDef:   { label: ReactNode, icon?: IconName | ReactNode, danger?: boolean, disabled?: boolean,
                 onSelect?: () => void, action?: ActionLike, params?: unknown }
```

**Content**

```ts
Card:       { interactive?: boolean, children?: ReactNode }
CardHeader: { title?: ReactNode, description?: ReactNode, icon?: IconName | ReactNode,
              actions?: ReactNode, children?: ReactNode }
CardBody:   { children?: ReactNode }
CardFooter: { children?: ReactNode }
DescriptionList: { items: { label: ReactNode; value: ReactNode; wide?: boolean }[],
                   columns?: 1|2|3, inline?: boolean, dense?: boolean, emptyText?: ReactNode }
Separator:  { orientation?: "horizontal"|"vertical", label?: ReactNode }
Toolbar:    { end?: ReactNode, children?: ReactNode }
SearchInput: { value?: string, onChange?: (v: string) => void, placeholder?: string,
               label?: string /* default "Search" */, clearable?: boolean /* default true */ }
Pagination: { page: number /* 1-based */, pageCount: number, onChange: (page: number) => void,
              total?: number, pageSize?: number, noun?: string /* default "rows" */,
              label?: string, size?: "sm"|"md" }
SegmentedControl: { options: { value: string; label: ReactNode; icon?: IconName | ReactNode; disabled?: boolean }[],
                    value: string, onChange: (v: string) => void, label?: string, size?: "sm"|"md" }

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

Chart:      { kind: "bar"|"line"|"area"|"pie"|"donut",
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
Composer:     { onSend?: (text: string, files?: FileRef[]) => void, action?: ActionLike,
                params?: (text: string, files?: FileRef[]) => unknown, placeholder?: string,
                busy?: boolean, disabled?: boolean, sendLabel?: string,
                attachments?: boolean | { accept?: string; max?: number /* default 8 */ },
                controls?: ReactNode /* left of Send */ }
                /* Thread takes attachments and controls too, and passes them down */

ThreadMessage: { body: string /* markdown */, id?: string, author?: string, avatarUrl?: string,
                 at?: string, own?: boolean, streaming?: boolean }

Image:        { alt: string, src?: string, file?: FileRef | null /* src wins */,
                placeholder?: string /* tiny data URL, shown blurred */,
                aspect?: "auto"|"1:1"|"4:3"|"3:4"|"4:5"|"3:2"|"2:3"|"16:9"|"9:16"|number /* default "auto" */,
                fit?: "cover"|"contain" /* default "cover" */, radius?: "none"|"sm"|"md"|"lg" /* default "md" */,
                zoomable?: boolean, caption?: ReactNode, loading?: "lazy"|"eager" /* default "lazy" */,
                crossOrigin?: "anonymous"|"use-credentials", fallback?: ReactNode,
                onLoad?: (size: { width; height }) => void, onError?: () => void }
ImageGrid:    { items?: ImageGridItem[], layout?: "grid"|"strip" /* default "grid" */,
                columns?: number | { base: number; md?: number; lg?: number } /* 1-8 */,
                density?: "mosaic"|"compact"|"comfortable" /* default "comfortable" */,
                aspect?: Image["aspect"] /* default "1:1" */,
                selectedKey?: string, onSelect?: (item: ImageGridItem) => void,
                selectable?: boolean, selection?: string[], onSelectionChange?: (keys: string[]) => void,
                fill?: boolean /* the box needs a height */, total?: number, highlightNew?: number,
                source?: DataTableSource, emptyState?: ReactNode, label?: string /* default "Pictures" */ }
ImageGridItem: { key: string, alt: string, src?: string, file?: FileRef | null, placeholder?: string,
                 caption?: string, badge?: ReactNode, dimmed?: boolean }
Lightbox:     { open: boolean, onClose: () => void,
                items: { key?: string; src?: string; file?: FileRef | null; alt: string; caption?: ReactNode }[],
                index?: number, defaultIndex?: number, onIndexChange?: (i: number) => void,
                actions?: ReactNode | ((item, index: number) => ReactNode) }
ImageCompare: { before: { src?: string; file?: FileRef | null; alt: string; label?: string },
                after: /* the same */, mode?: "slider"|"hold"|"side-by-side" /* default "slider" */,
                aspect?: Image["aspect"] /* default "4:3" */, fit?: "cover"|"contain" /* default "contain" */,
                position?: number /* 0-1 */, defaultPosition?: number /* 0.5 */,
                onPositionChange?: (p: number) => void }
ImageMarkup:  { alt: string, src?: string, file?: FileRef | null,
                marks: Mark[], onMarksChange: (marks: Mark[]) => void,
                tool: "select"|"pin"|"box"|"arrow"|"freehand"|"brush",
                onToolChange?: (tool) => void /* gives it its own tool bar */, tools?: MarkTool[],
                readOnly?: boolean, numbered?: boolean /* default true */,
                selectedId?: string, onSelect?: (id?: string) => void, maxMarks?: number,
                noteOnCreate?: boolean, tone?: "default"|"danger" /* for new marks */,
                brushWidth?: number /* fraction of the width, default 0.06 */,
                onUndo?: () => void, onRedo?: () => void, canUndo?: boolean, canRedo?: boolean,
                maxHeight?: number | string /* default "70vh" */, ref?: Ref<ImageMarkupHandle> }
ImageMarkupHandle: { exportAnnotated(opts?: { maxSize?: number /* 2048 */; type?: "image/png"|"image/jpeg";
                                             hideNumbers?: boolean }): Promise<Blob>,
                     exportMask(opts?: { kinds?: MarkKind[] /* ["brush","box"] */; feather?: number;
                                         dilate?: number; invert?: boolean; maxSize?: number }): Promise<Blob>,
                     naturalSize(): { width: number; height: number } }
Mark:         { id: string, n: number /* 1, 2, 3 in order */, kind: "pin"|"box"|"arrow"|"freehand"|"brush",
                at?: [x, y] /* pin */, rect?: [x, y, w, h] /* box */,
                points?: [x, y][] /* arrow: [tail, tip]; freehand, brush: the stroke */,
                width?: number /* brush */, note?: string, tone?: "default"|"danger" }
                /* every coordinate is a fraction of the picture, 0-1 */
MarkList:     { marks: Mark[], onMarksChange: (marks: Mark[]) => void,
                selectedId?: string, onSelect?: (id?: string) => void, readOnly?: boolean,
                notePlaceholder?: string, emptyState?: ReactNode }
useMarkHistory(initial?: Mark[]): { marks, setMarks, undo, redo, canUndo, canRedo, reset(marks?) }

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
ScrollRow: { label: string, gap?: Gap, snap?: boolean, arrows?: boolean /* default true */,
             fade?: boolean /* default true */ }
```

**Helpers**

```ts
cn(...classes)            // class merge
accentStyle(accent)       // the accent's tokens as inline style, for a custom surface
focusRing                 // the focus classes, when a custom control needs them
inputBase                 // the shared input classes, when a Field wraps something unusual
DEFAULT_ACCENT            // the brand orange
tk                        // the kit's own token classes (tk.bgCard, tk.fgMuted, ...), for the rare custom surface
textStyles                // the type scale (textStyles.pageTitle, .cardTitle, .muted, .stat), the same
ICON_NAMES                // every icon name, as a list, for a picker
useTheme()                // "light" | "dark", the theme the page is painted in
setTheme(theme)           // choose one and remember it; ThemeToggle does this
```

## Icons

The complete list. `<Icon name="..." />`, `icon="..."` on a component, or
`icon: "..."` on a screen entry take exactly one of these; anything else is a
`tsc` error. Pick by meaning, not by looks: `inbox` for a queue, `list` for
a list screen, `table` for records, `kanban` for a board, `layout-dashboard`
for the overview, `settings` for settings, `users` for people,
`building-2` for companies, `mail` for email, `calendar` for dates,
`file-text` for documents, `banknote` for money.

Navigation: `home`, `layout-dashboard`, `list`, `table`, `kanban`, `calendar`, `calendar-days`, `calendar-clock`, `calendar-check`, `clock`, `inbox`, `mail`, `mail-open`, `mail-check`, `message-square`, `message-circle`, `bell`, `settings`, `sliders-horizontal`, `search`, `filter`, `filter-x`, `menu`, `panel-left`, `panel-left-close`, `log-in`, `log-out`.

Actions: `plus`, `minus`, `x`, `check`, `check-check`, `pencil`, `trash-2`, `copy`, `save`, `refresh-cw`, `rotate-cw`, `undo-2`, `redo-2`, `play`, `pause`, `square`, `send`, `reply`, `forward`, `upload`, `download`, `cloud-upload`, `import`, `paperclip`, `printer`, `share-2`, `external-link`, `link`, `unlink`, `eye`, `eye-off`, `maximize-2`, `minimize-2`, `grip-vertical`, `power`.

Arrows and trends: `arrow-up`, `arrow-down`, `arrow-left`, `arrow-right`, `arrow-up-right`, `arrow-down-right`, `arrow-up-down`, `chevron-up`, `chevron-down`, `chevron-left`, `chevron-right`, `chevrons-up-down`, `chevrons-left`, `chevrons-right`, `trending-up`, `trending-down`.

Status: `circle-check`, `circle-x`, `circle-alert`, `circle-help`, `circle-minus`, `circle-plus`, `triangle-alert`, `info`, `circle`, `circle-dot`, `loader`, `loader-circle`, `hourglass`, `timer`, `history`, `archive`, `flag`, `pin`, `star`, `heart`, `bookmark`, `tag`, `tags`, `hash`, `at-sign`, `lightbulb`, `target`, `award`.

People and organisations: `user`, `users`, `user-plus`, `user-check`, `user-x`, `contact`, `building-2`, `briefcase`, `handshake`, `shield`, `shield-check`, `lock`, `lock-open`, `key`.

Files and data: `folder`, `folder-open`, `file`, `file-text`, `file-plus`, `file-check`, `file-spreadsheet`, `file-down`, `file-up`, `clipboard`, `clipboard-check`, `image`, `database`, `server`, `layers`, `box`, `package`.

Commerce and places: `shopping-cart`, `credit-card`, `receipt`, `wallet`, `banknote`, `coins`, `dollar-sign`, `percent`, `calculator`, `truck`, `map-pin`, `map`, `globe`, `phone`, `landmark`, `gift`, `megaphone`.

Charts and machines: `chart-bar`, `chart-line`, `chart-pie`, `chart-column`, `activity`, `zap`, `sparkles`, `bot`, `cpu`.

Devices and theme: `sun`, `moon`, `monitor`, `smartphone`, `wifi`, `wifi-off`, `plug`, `qr-code`, `scan`, `languages`.

Layout: `ellipsis`, `ellipsis-vertical`, `list-checks`, `layout-grid`, `columns-3`, `rows-3`, `columns-2`.

Pictures and marking them up: `image-off`, `images`, `crop`, `scaling`, `zoom-in`, `zoom-out`, `chevrons-left-right`, `mouse-pointer-2`, `square-dashed`, `move-up-right`, `pen-line`, `brush`, `eraser`, `message-circle-plus`, `circle-dashed`.

## A form runs its action once

`<Form action={addItem}>` runs `addItem.run(values)` itself, after `onSubmit`.
So `onSubmit` must never call `run` - a screen that does (`onSubmit={async (v) =>
{ await addItem.run({...v}); navigate("/") }}`) runs the flow twice for every
press, and every record it adds arrives twice. Shape the values in the flow's
first step or with `onChange`; do what must follow the call - navigate, a toast -
in a `useEffect` on `addItem.data`. `validate_app` reports the shape as
`form-runs-once`, and kit 0.1.6 ignores its own run when `onSubmit` already ran
the action, but an app carries the kit it was built with.
