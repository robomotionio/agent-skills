# `@robomotion/app-kit` component reference

The complete catalogue. Compose screens from these and Tailwind layout classes; there is nothing else, and nothing else is allowed. Every component is themed from `app.json`'s `theme.accent`, dark-mode aware, and accessible by default - you never write colors, focus rings, or ARIA by hand.

The knobs named here are the normative surface. For exact prop spellings beyond them, the authority is the package's own types in `node_modules/@robomotion/app-kit` - when `tsc` disagrees with a snippet here, trust `tsc`.

```tsx
import {
  AppShell, Screen, Button, Card, CardHeader, CardBody, CardFooter,
  DataTable, Form, Field, TextInput, NumberInput, TextArea, Select,
  Checkbox, RadioGroup, DatePicker, FileUpload, Progress, StatusBadge,
  EmptyState, ErrorState, Toast, useToast, Stack, Row, Grid, ConnectionBanner,
} from "@robomotion/app-kit";
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

`variant`: `primary` / `secondary` / `ghost` / `danger`. `loading` state is built in - feed it from the hook, never track your own spinner flag.

```tsx
const approve = useAction("approveInvoice");
<Button variant="primary" loading={approve.loading}
        onClick={() => approve.run({ number: invoice.number })}>
  Approve
</Button>
```

### `Progress`

Determinate and indeterminate, fed by action progress. Show it whenever an action has `progress: true` in the contract.

```tsx
const extract = useAction("extractInvoice");
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
            action={<Button variant="secondary" onClick={() => refresh.run({})}>Check again</Button>} />
```

### `ErrorState`

Message plus retry, driven by an `AppError`. Use it when a screen's data failed to load; the `retryable` flag on the error tells you whether to offer the retry.

```tsx
const refresh = useAction("refreshNow");
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

Columns, rows, sort, filter, empty state, row actions, pagination - all built in. This is the workhorse of three of the four archetypes. Give it the collection's records directly; never re-implement sorting or paging in the screen.

```tsx
const { records, loading } = useCollection("queue");
<DataTable
  columns={[
    { key: "number", label: "Invoice" },
    { key: "supplier", label: "Supplier" },
    { key: "amount", label: "Amount" },
  ]}
  rows={records}
  rowActions={(row) => <Button variant="ghost" onClick={() => open(row)}>Review</Button>}
  loading={loading}
  empty={<EmptyState title="No invoices waiting" />}
/>
```

## Input

### `Form` / `Field` and the inputs

`TextInput`, `NumberInput`, `TextArea`, `Select`, `Checkbox`, `RadioGroup`, `DatePicker`. Wired to a schema: the form validates against the action's params shape, so a required field or a wrong type never reaches the robot (the robot would reject it with `invalid_params` anyway - catch it in the form instead).

```tsx
const submit = useAction("submitExpense");
<Form onSubmit={(values) => submit.run(values)}>
  <Field name="category" label="Category">
    <Select options={["Travel", "Meals", "Supplies"]} />
  </Field>
  <Field name="amount" label="Amount">
    <NumberInput />
  </Field>
  <Field name="note" label="Note">
    <TextArea />
  </Field>
  <Button variant="primary" loading={submit.loading}>Submit</Button>
</Form>
```

### `FileUpload`

Drag-and-drop. Returns a `FileRef` via `useFileUpload`; the bytes go over REST, never through the action call. Pass the `FileRef` to the action.

```tsx
const { upload, uploading, progress } = useFileUpload();
const extract = useAction("extractInvoice");
<FileUpload
  onFile={async (file) => {
    const ref = await upload(file);
    extract.run({ file: ref });
  }}
  uploading={uploading}
  progress={progress}
/>
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

## The runtime hooks (`@robomotion/apps-runtime/react`)

Screens talk to the robot ONLY through these. Never `app.call` in a screen, never hand-rolled transport.

```tsx
import {
  AppProvider, useAction, useCollection, useEvent, useConnection, useFileUpload,
} from "@robomotion/apps-runtime/react";
```

| Hook | Returns | Use for |
|---|---|---|
| `useAction(name)` | `{ run, data, error, loading, progress, cancel }` | every button that makes the robot do something |
| `useCollection(name)` | `{ records, loading, error }` | every table or list backed by a collection; live-updates itself |
| `useEvent(name, cb)` | subscribes for the component's lifetime | toasts and refreshes when the robot announces something |
| `useConnection()` | `{ state, robotOnline }` | anything that must react to `"connecting" \| "ready" \| "offline" \| "robot_offline" \| "contract_mismatch"` |
| `useFileUpload()` | `{ upload, uploading, progress, error }` | getting a `FileRef` to pass into an action |

Action params and results are typed by `src/generated/actions.gen.ts` (which also exports `CONTRACT_HASH` and the `typedApp` wrapper). If `tsc` complains about a param, the contract changed - fix the call site or the contract, never cast.

Errors are `AppError { code, message, retryable, details }` with codes `invalid_params` · `unknown_action` · `contract_mismatch` · `robot_offline` · `queue_full` · `timeout` · `cancelled` · `concurrency_rejected` · `internal`. `robot_offline` and `queue_full` are retryable; `invalid_params` and `unknown_action` are not - those are contract bugs to fix, not to retry.
