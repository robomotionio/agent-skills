# `@robomotion/app-kit` component reference

The complete catalogue. Compose screens from these and Tailwind layout classes; there is nothing else, and nothing else is allowed. Every component is themed from `app.json`'s `theme.accent`, dark-mode aware, and accessible by default - you never write colors, focus rings, or ARIA by hand.

The knobs named here are the normative surface. For exact prop spellings beyond them, the authority is the package's own types in `node_modules/@robomotion/app-kit` - when `tsc` disagrees with a snippet here, trust `tsc`.

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
  RadioGroup, DatePicker, useFormValues, FileUpload,
  Progress, StatusBadge, EmptyState, ErrorState,
  Toast, useToast, toast, dismissToast,
  Stack, Row, Grid, cn, accentStyle, focusRing, DEFAULT_ACCENT,
} from "@robomotion/app-kit";

// Everything that reaches the robot. NONE of these are in the kit.
import {
  AppProvider, useAppClient, useMaybeAppClient,
  useAction, useCollection, useEvent, useConnection, useFileUpload,
  bindAction, bindCollection, markGesture,
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

Columns, rows, sort, filter, empty state, row actions, pagination - all built in. This is the workhorse of three of the four archetypes. Give it the collection's records directly (or a filtered or sorted copy of them; never a mapped one) and it knows which collection it shows; never re-implement sorting or paging in the screen. A row action that runs an action is written as `{ label, action, params }` with `params` built from the row; one that only navigates keeps `onSelect`.

```tsx
const { records, loading } = useCollection("queue");
const approve = useApproveInvoice();
<DataTable
  columns={[
    { key: "number", header: "Invoice" },
    { key: "supplier", header: "Supplier" },
    { key: "amount", header: "Amount" },
  ]}
  rows={records}
  rowActions={[
    { label: "Review", onSelect: (row) => navigate(`/review?id=${row.number}`) },
    { label: "Approve", action: approve, params: (row) => ({ number: row.number }) },
  ]}
  loading={loading}
  emptyState={<EmptyState title="No invoices waiting" />}
/>
```

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

The Build view shows a small badge on every widget that leads somewhere in the flow and jumps from it to the step that runs (and back). You get that for free by using `action` on `Button`, `FileUpload` and `Form`, and by handing tables the records straight from `useCollection` or an action hook's `.data`. Three helpers cover anything custom; the generated action hooks and `useCollection` results carry `name`, which is what they read. Never write `data-rm-*` attributes by hand.

```tsx
import { bindAction, bindCollection, markGesture } from "@robomotion/apps-runtime/react";

When the rows handed to `DataTable` were sorted or mapped into a new array, pass the hook result as `source={invoices}` so the table still links to the nodes that fill it; an empty derived array carries no identity.

// a custom widget that runs an action (a hand-made drop zone, a card, a link)
<div {...bindAction(upload)} onDrop={onDrop}>Drop an invoice PDF here</div>

// a hand-rolled list of a collection's records (mapping them loses the link)
<ul {...bindCollection(invoices)}>{invoices.records.map(…)}</ul>

// custom async code that finishes a person's click later: re-mark the widget
// right before calling the action, so the call still belongs to it
markGesture(zoneRef.current);
void extract.run({ file: ref });
```

## The runtime hooks (`@robomotion/apps-runtime/react`)

Screens talk to the robot ONLY through these. Never `app.call` in a screen, never hand-rolled transport.

```tsx
import {
  AppProvider, useAction, useCollection, useEvent, useConnection, useFileUpload,
  bindAction, bindCollection, markGesture,
} from "@robomotion/apps-runtime/react";
```

| Hook | Returns | Use for |
|---|---|---|
| `use<Action>()` (generated) | `{ run, data, error, loading, progress, cancel, name }`, typed from the contract | every button that makes the robot do something; pass the whole object to `Button`'s `action`. Import it from `@/generated/actions.gen`, never write `useAction("name")` yourself |
| `useCollection(name)` | `{ records, loading, error, name }` | every table or list backed by a collection; live-updates itself |
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

**Content**

```ts
Card:       { children?: ReactNode }
CardHeader: { title?: ReactNode, description?: ReactNode, children?: ReactNode }
CardBody:   { children?: ReactNode }
CardFooter: { children?: ReactNode }

DataTable<T>: { columns: DataTableColumn<T>[], rows: T[],
                rowKey?: (row: T) => string,
                filterable?: boolean, filterPlaceholder?: string,
                pageSize?: number /* default 10; 0 disables pagination */,
                rowActions?: DataTableRowAction<T>[], onRowClick?: (row: T) => void,
                caption?: string,
                emptyTitle?: ReactNode, emptyDescription?: ReactNode, emptyState?: ReactNode,
                loading?: boolean, source?: { name: string; records?: unknown } }

DataTableColumn<T>: { key: string, header: ReactNode, sortable?: boolean,
                      render?: (row: T) => ReactNode,
                      value?: (row: T) => string | number | null | undefined,
                      align?: "left"|"right"|"center", className?: string }

DataTableRowAction<T>: { label: string, danger?: boolean, disabled?: (row: T) => boolean }
                       & ( { onSelect: (row: T) => void }
                         | { action: ActionLike, params: (row: T) => unknown } )
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
