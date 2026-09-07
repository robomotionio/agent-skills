import { ClassValue } from 'clsx';
import * as react from 'react';
import { CSSProperties, HTMLAttributes, ReactNode, ButtonHTMLAttributes, MouseEvent, MutableRefObject, InputHTMLAttributes, FormHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { ConnectionState, ContractSchema, FileRef, AppError } from '@robomotion/apps-runtime';
import * as class_variance_authority_types from 'class-variance-authority/types';
import { VariantProps } from 'class-variance-authority';

/** Merge Tailwind class lists, later classes winning (shadcn convention). */
declare function cn(...inputs: ClassValue[]): string;

/** The Robomotion brand orange; app.json's theme.accent overrides it. */
declare const DEFAULT_ACCENT = "#FF4F00";
/**
 * Every component takes its accent from the --rm-accent CSS variable, so one
 * style attribute (set by AppShell from app.json's theme.accent) themes the
 * whole tree.
 */
declare function accentStyle(accent?: string): CSSProperties;
/** Shared focus ring, visible in both themes, driven by the accent. */
declare const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--rm-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-950";
/** Base classes shared by all text-like inputs. */
declare const inputBase: string;

/** The two themes an app paints in. */
type AppTheme = "light" | "dark";
/**
 * Apply a theme to the document, exactly as index.html's inline bootstrap
 * does, so the two can never disagree.
 *
 * `colorScheme` matters as much as the class: native controls, scrollbars and
 * date pickers follow it and nothing else, so without it a dark app keeps
 * white dropdowns and a white scrollbar.
 */
declare function applyTheme(theme: AppTheme): void;
/**
 * Keep the app's theme in step with whatever framed it.
 *
 * index.html paints the first frame in the right theme; this keeps it right
 * afterwards. Two things it handles that the bootstrap cannot:
 *
 *   - The host CHANGES theme while the app is open. Someone working in the
 *     Build view switches the Designer to light and the app beside it should
 *     follow, without reloading - a reload would cost them everything they
 *     had typed.
 *   - The app loads AFTER the host announced its theme. The host cannot know
 *     when this document exists, so waiting to be told would lose the race on
 *     a slow boot. The app announces itself instead and is answered.
 *
 * A theme pushed by the host is deliberately NOT remembered. It describes the
 * page the app is embedded in, not a preference of the person using it: an
 * app opened on its own later should follow their operating system, the way
 * it always has.
 */
declare function useThemeBridge(): void;

interface ActionLike<P = unknown> {
    /** The action name; becomes data-rm-action on the widget. */
    name: string;
    /** True while a call is in flight. */
    loading: boolean;
    /** The last call's failure, when there was one; a Form shows it. */
    error?: unknown;
    /** Method syntax keeps typed actions assignable to ActionLike<unknown>. */
    run(params?: P): Promise<unknown>;
}
/** Params for an action-bound widget: a value, or a function of the triggering event. */
type ParamsOf<P, E = unknown> = P | ((event: E) => P);

/** Rows the widget fetches for itself, one page per call. */
interface ActionDataSource {
    /** The action to call (the object from useAction). */
    action: ActionLike;
    /** Rows per page; falls back to the widget's own pageSize. */
    pageSize?: number;
}
/** An identity tag for rows the screen already holds. */
interface RecordsDataSource {
    name: string;
    records?: unknown;
}
type AnyDataSource = ActionDataSource | RecordsDataSource;
/** What a paged action is called with. */
interface PageRequest {
    /** The text in the filter box, "" when empty. */
    filter: string;
    /** The column the person sorted by, absent when nothing is sorted. */
    sort?: {
        key: string;
        dir: "asc" | "desc";
    };
    /** Rows to skip. */
    offset: number;
    /** Rows to return. 0 means "no paging: all of them". */
    limit: number;
}
/** What it must answer with. */
interface PageReply<T> {
    rows: T[];
    /** Rows there are in total, across every page. */
    total: number;
}

interface AppShellNavItem {
    label: string;
    path: string;
}
interface AppShellProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
    /** App name, from app.json's name. */
    title: ReactNode;
    /** Accent color, from app.json's theme.accent. Defaults to the brand orange. */
    accent?: string;
    logo?: ReactNode;
    /** Optional top navigation, one item per screen. */
    nav?: AppShellNavItem[];
    activePath?: string;
    /** SPA navigation callback; without it nav items render as plain links. */
    onNavigate?: (path: string) => void;
    /** Forwarded to ConnectionBanner; omit to read it from AppProvider. */
    connectionState?: ConnectionState;
    headerRight?: ReactNode;
    children?: ReactNode;
}
/**
 * Page frame: header, optional nav, content slot, connection banner
 * (sdk.md). Also sets the accent CSS variable and mounts the toast viewport.
 */
declare function AppShell({ title, accent, logo, nav, activePath, onNavigate, connectionState, headerRight, children, className, style, ...props }: AppShellProps): react.JSX.Element;

interface ScreenProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
    /** Screen title, rendered as the page heading. */
    title: ReactNode;
    description?: ReactNode;
    /** Right-aligned header actions (buttons etc.). */
    actions?: ReactNode;
    children?: ReactNode;
}
/** One routed screen with title and description (sdk.md). */
declare function Screen({ title, description, actions, children, className, ...props }: ScreenProps): react.JSX.Element;

declare const buttonVariants: (props?: ({
    variant?: "primary" | "secondary" | "ghost" | "danger" | null | undefined;
    size?: "sm" | "md" | "lg" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
    /** Shows a spinner and disables the button while true. Defaults to `action.loading` when an action is given. */
    loading?: boolean;
    /**
     * The action this button runs (the object from useAction). A click runs
     * it with `params`, the spinner shows and the button is disabled while it
     * runs, and the widget is linked to the action's node in the flow.
     */
    action?: ActionLike;
    /** Params for `action`: a value, or a function of the click event. */
    params?: ParamsOf<unknown, MouseEvent<HTMLButtonElement>>;
    children?: ReactNode;
}
declare const Button: react.ForwardRefExoticComponent<ButtonProps & react.RefAttributes<HTMLButtonElement>>;
declare function Spinner({ className }: {
    className?: string;
}): react.JSX.Element;

interface MenuItemDef {
    label: ReactNode;
    /** Red styling, for an item that removes something. */
    danger?: boolean;
    disabled?: boolean;
    /** A plain callback: navigate, open a dialog, set some state. */
    onSelect?: () => void;
    /** The action this item runs (the object from useAction). */
    action?: ActionLike;
    /** Params for `action`. */
    params?: unknown;
}
interface MenuProps {
    /** Declared items. Omit to write <MenuItem> children instead. */
    items?: MenuItemDef[];
    children?: ReactNode;
    /** Trigger content. Defaults to the three-dot glyph. */
    trigger?: ReactNode;
    /** Accessible name of the trigger. Default "More". */
    label?: string;
    /** Which edge the panel hangs from. Default "end" (right). */
    align?: "start" | "end";
    /** Accessible name of the menu itself. Default "Actions". */
    menuLabel?: string;
    disabled?: boolean;
    className?: string;
}
declare function Menu({ items, children, trigger, label, align, menuLabel, disabled, className, }: MenuProps): react.JSX.Element;
interface MenuItemProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "onSelect"> {
    danger?: boolean;
    /** The action this item runs (the object from useAction). */
    action?: ActionLike;
    /** Params for `action`: a value, or a function of the click event. */
    params?: ParamsOf<unknown, MouseEvent<HTMLButtonElement>>;
    /** A plain callback, for an item that does not run an action. */
    onSelect?: () => void;
    children?: ReactNode;
}
declare const MenuItem: react.ForwardRefExoticComponent<MenuItemProps & react.RefAttributes<HTMLButtonElement>>;

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    children?: ReactNode;
}
declare function Card({ className, ...props }: CardProps): react.JSX.Element;
interface CardHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
    /** Optional title shortcut; children render below or instead of it. */
    title?: ReactNode;
    description?: ReactNode;
}
declare function CardHeader({ className, title, description, children, ...props }: CardHeaderProps): react.JSX.Element;
declare function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>): react.JSX.Element;
declare function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>): react.JSX.Element;

interface DialogProps {
    open: boolean;
    /** Called on Escape, on the backdrop, and on the close button. */
    onClose: () => void;
    title?: ReactNode;
    description?: ReactNode;
    /** Buttons along the bottom. */
    footer?: ReactNode;
    size?: "sm" | "md" | "lg";
    /** Hide the × in the corner (the dialog still closes on Escape). */
    hideClose?: boolean;
    /** Ignore clicks on the backdrop, for a dialog that must be answered. */
    static?: boolean;
    className?: string;
    children?: ReactNode;
}
declare function Dialog({ open, onClose, title, description, footer, size, hideClose, static: isStatic, className, children, }: DialogProps): react.JSX.Element | null;
interface ConfirmDialogProps {
    open: boolean;
    onClose: () => void;
    title: ReactNode;
    /** What will happen, in the person's own words. */
    description?: ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    /** Red confirm button, for something that removes or overwrites. */
    danger?: boolean;
    /**
     * The action confirming runs (the object from useAction). The confirm
     * button carries its link, so the Build view can draw the line from this
     * dialog to the step behind it, and the dialog stays up with a spinner
     * until the call settles rather than closing over a robot still working.
     */
    action?: ActionLike;
    /** Params for `action`: a value, or a function called at confirm time. */
    params?: ParamsOf<unknown, undefined>;
    /** Runs before the action, for a confirm that changes local state too. */
    onConfirm?: () => void;
    children?: ReactNode;
}
/**
 * "Are you sure?" as one component, because a destructive button without one
 * is a support ticket. The confirm button is the only way out apart from
 * cancelling, and it declares the action it runs.
 */
declare function ConfirmDialog({ open, onClose, title, description, confirmLabel, cancelLabel, danger, action, params, onConfirm, children, }: ConfirmDialogProps): react.JSX.Element;

interface DrawerProps {
    open: boolean;
    onClose: () => void;
    title?: ReactNode;
    description?: ReactNode;
    /** Which edge it slides from. Default "right". */
    side?: "left" | "right";
    size?: "sm" | "md" | "lg";
    footer?: ReactNode;
    hideClose?: boolean;
    className?: string;
    children?: ReactNode;
}
declare function Drawer({ open, onClose, title, description, side, size, footer, hideClose, className, children, }: DrawerProps): react.JSX.Element | null;

interface TabsProps {
    /** Controlled selection. */
    value?: string;
    /** Uncontrolled starting selection; defaults to the first Tab. */
    defaultValue?: string;
    onChange?: (value: string) => void;
    /** Accessible name for the strip. */
    label?: string;
    className?: string;
    children?: ReactNode;
}
declare function Tabs({ value, defaultValue, onChange, label, className, children }: TabsProps): react.JSX.Element;
interface TabProps {
    value: string;
    disabled?: boolean;
    /** A count or dot to the right of the label. */
    badge?: ReactNode;
    className?: string;
    children?: ReactNode;
}
declare function Tab({ value, disabled, badge, className, children }: TabProps): react.JSX.Element;
interface TabPanelProps {
    value: string;
    className?: string;
    children?: ReactNode;
}
declare function TabPanel({ value, className, children }: TabPanelProps): react.JSX.Element | null;

interface TooltipProps {
    /** The text shown. */
    content: ReactNode;
    /** Which side it sits on. Default "top". */
    side?: "top" | "bottom" | "left" | "right";
    className?: string;
    /** Exactly one element: the control the hint describes. */
    children: ReactNode;
}
declare function Tooltip({ content, side, className, children }: TooltipProps): react.JSX.Element;

interface DataTableColumn<T> {
    /** Property key on the row; also the default sort/filter accessor, and the `sort.key` a paged action is asked for. */
    key: string;
    header: ReactNode;
    sortable?: boolean;
    /** Custom cell renderer. */
    render?: (row: T) => ReactNode;
    /** Value used for sorting and filtering when the cell is rendered. */
    value?: (row: T) => string | number | null | undefined;
    align?: "left" | "right" | "center";
    /** Extra classes for the cells of this column. */
    className?: string;
}
interface DataTableRowActionBase<T> {
    label: string;
    danger?: boolean;
    disabled?: (row: T) => boolean;
}
/** A row action with a plain callback. */
interface DataTableRowCallbackAction<T> extends DataTableRowActionBase<T> {
    onSelect: (row: T) => void;
}
/** A row action that runs an action (from useAction) with params built from the row; linked to its node. */
interface DataTableRowLinkedAction<T> extends DataTableRowActionBase<T> {
    action: ActionLike;
    params: (row: T) => unknown;
}
type DataTableRowAction<T> = DataTableRowCallbackAction<T> | DataTableRowLinkedAction<T>;
/**
 * Where the rows come from. Either an identity tag for rows the screen
 * already holds - the useCollection() or useAction() result itself, for rows
 * that were sorted or mapped into a new array and lost their tag - or an
 * action the table calls for one page at a time.
 */
type DataTableSource = AnyDataSource;
/** What `tableRef` hands back, for a screen that must re-ask by hand. */
interface DataTableApi {
    /** Ask the paged action for the current page again. */
    refresh: () => void;
}
interface DataTableProps<T> {
    columns: DataTableColumn<T>[];
    /** The rows to show. Omit when `source` is a paged action: the table fetches them. */
    rows?: T[];
    /** Stable row identity; falls back to the row index. */
    rowKey?: (row: T) => string;
    /** Show a text filter box above the table. */
    filterable?: boolean;
    filterPlaceholder?: string;
    /** Rows per page. 0 disables pagination. Default 10. */
    pageSize?: number;
    rowActions?: DataTableRowAction<T>[];
    onRowClick?: (row: T) => void;
    /** Accessible table description. */
    caption?: string;
    emptyTitle?: ReactNode;
    emptyDescription?: ReactNode;
    /** Full custom empty state; overrides emptyTitle/emptyDescription. */
    emptyState?: ReactNode;
    loading?: boolean;
    className?: string;
    /** Where the rows came from: an identity tag, or a paged action. */
    source?: DataTableSource;
    /** Receives `{ refresh }` for a paged table. */
    tableRef?: MutableRefObject<DataTableApi | null>;
}
declare function DataTable<T>({ columns, rows, rowKey, source, filterable, filterPlaceholder, pageSize, rowActions, onRowClick, caption, emptyTitle, emptyDescription, emptyState, loading, className, tableRef, }: DataTableProps<T>): react.JSX.Element;

interface ChartDatum {
    label: string;
    value: number;
}
interface ChartProps {
    kind: "bar" | "line" | "pie";
    data: ChartDatum[];
    /** What the chart shows, for the accessible name. */
    title?: string;
    /** A longer sentence for a screen reader. */
    description?: string;
    /** Drawing height in pixels. Default 220. */
    height?: number;
    /** Format a value for the labels; defaults to the locale's own number format. */
    formatValue?: (value: number) => string;
    /** Shown instead of the chart when there is no data. */
    emptyState?: ReactNode;
    /** Where the numbers came from, so the Build view can link the chart to its step. */
    source?: AnyDataSource;
    className?: string;
}
declare function Chart({ kind, data, title, description, height, formatValue, emptyState, source, className, }: ChartProps): react.JSX.Element;

interface KanbanMove {
    /** The moved card's id. */
    key: string;
    /** The column it came from. */
    from: string;
    /** The column it was dropped on. */
    to: string;
}
interface KanbanProps {
    /** Called with every move the person makes. */
    onMove?: (move: KanbanMove) => void;
    /** The action a move runs (the object from useAction), called with the move. */
    action?: ActionLike;
    className?: string;
    /** <KanbanColumn> children. */
    children?: ReactNode;
}
declare function Kanban({ onMove, action, className, children }: KanbanProps): react.JSX.Element;
interface KanbanColumnProps {
    /** Column id; a move reports it as `from` or `to`. */
    id: string;
    title: ReactNode;
    /** A count or a badge beside the title. */
    meta?: ReactNode;
    /** Shown when the column has no cards. */
    emptyState?: ReactNode;
    className?: string;
    /** <KanbanCard> children. */
    children?: ReactNode;
}
declare function KanbanColumn({ id, title, meta, emptyState, className, children }: KanbanColumnProps): react.JSX.Element;
interface KanbanCardProps {
    /** Card id; a move reports it as `key`. */
    id: string;
    /** The column this card is in. Omit inside a KanbanColumn: it is taken from there. */
    column?: string;
    disabled?: boolean;
    className?: string;
    children?: ReactNode;
}
declare function KanbanCard({ id, column, disabled, className, children }: KanbanCardProps): react.JSX.Element;

interface CalendarEvent {
    /** ISO date, "yyyy-mm-dd". */
    date: string;
    label: ReactNode;
    /** Anything the screen wants back in onSelect. */
    [key: string]: unknown;
}
interface CalendarProps {
    /** Controlled month, "yyyy-mm". */
    month?: string;
    /** Uncontrolled starting month; defaults to the month of today. */
    defaultMonth?: string;
    onMonthChange?: (month: string) => void;
    events?: CalendarEvent[];
    /** The highlighted day, "yyyy-mm-dd". */
    selected?: string;
    /** Clicking a day; without it the days are not buttons. */
    onSelect?: (date: string, events: CalendarEvent[]) => void;
    /** Monday first (the default) or Sunday first. */
    weekStartsOn?: "monday" | "sunday";
    /** Events shown per day before "+n more". Default 2. */
    maxPerDay?: number;
    className?: string;
}
declare function Calendar({ month, defaultMonth, onMonthChange, events, selected, onSelect, weekStartsOn, maxPerDay, className, }: CalendarProps): react.JSX.Element;

interface MarkdownProps {
    /** The markdown source. */
    children?: string;
    /** True while the text is still arriving, so a half-written line stays readable. */
    streaming?: boolean;
    className?: string;
}
declare function Markdown({ children, streaming, className }: MarkdownProps): react.JSX.Element;

interface JsonViewProps {
    /** Whatever the action answered. */
    value: unknown;
    /** How many levels start open. Default 2. */
    maxDepth?: number;
    /** Show the copy button. Default true. */
    copyable?: boolean;
    /** Shown when there is nothing to show. */
    emptyState?: ReactNode;
    /** Accessible name for the tree. */
    label?: string;
    className?: string;
}
declare function JsonView({ value, maxDepth, copyable, emptyState, label, className, }: JsonViewProps): react.JSX.Element;

type FormValues = Record<string, unknown>;
interface FormProps extends Omit<FormHTMLAttributes<HTMLFormElement>, "onSubmit" | "onChange" | "action"> {
    /** JSON Schema (subset) for the value bag, usually an action's params. */
    schema?: ContractSchema;
    initialValues?: FormValues;
    /** Controlled mode. */
    values?: FormValues;
    onChange?: (values: FormValues) => void;
    /** Called with the values once they validate. */
    onSubmit?: (values: FormValues) => void | Promise<void>;
    /**
     * The action a submit runs (the object from useAction): `action.run(values)`
     * once they validate, after `onSubmit`. The submit button, or the form when
     * it has none, is linked to the action's node in the flow.
     *
     * An `onSubmit` that runs the action itself is honoured and the form does
     * not run it a second time. A screen wrote `onSubmit={async (v) => { await
     * addPlant.run({...v, ...}) }}` beside `action={addPlant}` and every plant
     * it added arrived twice, through a flow that ran twice for one press.
     */
    action?: ActionLike;
    disabled?: boolean;
    /**
     * A form shows its action's failure under the fields on its own. A screen
     * that navigated away on success and rendered nothing on failure left the
     * person pressing Add book at a form that simply stayed, while the robot
     * refused every press. Pass `hideError` when the screen shows it elsewhere.
     */
    hideError?: boolean;
    children?: ReactNode;
}
declare function Form({ schema, initialValues, values: controlledValues, onChange, onSubmit, action, disabled, hideError, children, className, ...props }: FormProps): react.JSX.Element;
/** Read the surrounding form's values and errors (advanced layouts). */
declare function useFormValues(): FormValues;
interface FieldProps {
    name: string;
    label: ReactNode;
    help?: ReactNode;
    required?: boolean;
    /** Error override; the form's schema validation fills this automatically. */
    error?: ReactNode;
    className?: string;
    children?: ReactNode;
}
declare function Field({ name, label, help, required, error, className, children }: FieldProps): react.JSX.Element;
type NativeInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type">;
interface TextInputProps extends NativeInputProps {
    value?: string;
    onChange?: (value: string) => void;
    type?: "text" | "email" | "password" | "url" | "tel" | "search";
}
declare function TextInput({ value, onChange, className, id, disabled, type, ...props }: TextInputProps): react.JSX.Element;
interface NumberInputProps extends NativeInputProps {
    value?: number;
    onChange?: (value: number | undefined) => void;
}
declare function NumberInput({ value, onChange, className, id, disabled, ...props }: NumberInputProps): react.JSX.Element;
interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange"> {
    value?: string;
    onChange?: (value: string) => void;
}
declare function TextArea({ value, onChange, className, id, disabled, rows, ...props }: TextAreaProps): react.JSX.Element;
interface SelectOption {
    value: string;
    label: ReactNode;
    disabled?: boolean;
}
interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "value" | "onChange"> {
    options: SelectOption[];
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
}
declare function Select({ options, value, onChange, placeholder, className, id, disabled, ...props }: SelectProps): react.JSX.Element;
interface CheckboxProps extends Omit<NativeInputProps, "checked"> {
    checked?: boolean;
    onChange?: (checked: boolean) => void;
    /** Inline label to the right of the box. */
    label?: ReactNode;
}
declare function Checkbox({ checked, onChange, label, className, id, disabled, ...props }: CheckboxProps): react.JSX.Element;
interface RadioGroupProps {
    options: SelectOption[];
    value?: string;
    onChange?: (value: string) => void;
    /** Group name; defaults to the surrounding Field's name. */
    name?: string;
    className?: string;
    disabled?: boolean;
}
declare function RadioGroup({ options, value, onChange, name, className, disabled }: RadioGroupProps): react.JSX.Element;
interface DatePickerProps extends NativeInputProps {
    /** ISO date, "yyyy-mm-dd". */
    value?: string;
    onChange?: (value: string) => void;
}
/** Native date input: keyboard operable and localized by the browser. */
declare function DatePicker({ value, onChange, className, id, disabled, ...props }: DatePickerProps): react.JSX.Element;

interface JsonInputProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange"> {
    /** Controlled value. Inside a Field the form's own value is used instead. */
    value?: Record<string, unknown>;
    onChange?: (value: Record<string, unknown> | undefined) => void;
    /** Pretty-print the text on blur once it parses. Default true. */
    formatOnBlur?: boolean;
    /** Message under the field when the text is not JSON. */
    invalidMessage?: string;
}
declare function JsonInput({ value, onChange, formatOnBlur, invalidMessage, className, id, disabled, rows, placeholder, ...props }: JsonInputProps): react.JSX.Element;

interface FileUploadProps {
    /** Called with the FileRef once the upload lands. */
    onUpload?: (ref: FileRef) => void;
    onError?: (error: AppError) => void;
    /** Accept filter, same syntax as the native input. */
    accept?: string;
    label?: string;
    hint?: string;
    disabled?: boolean;
    /** Upload as a publicly accessible artifact. */
    isPublic?: boolean;
    /**
     * The action the upload feeds (the object from useAction). Once the upload
     * lands it runs with `{file: ref, ...params}`, after `onUpload`, and the
     * drop zone is linked to the action's node in the flow.
     */
    action?: ActionLike;
    /** Extra params merged next to `file`: a value, or a function returning one. */
    params?: Record<string, unknown> | (() => Record<string, unknown>);
    className?: string;
}
/**
 * Drag-and-drop file upload; returns a FileRef via useFileUpload (sdk.md).
 * Needs an AppProvider above it. Bytes travel over /v1/artifacts.*, never
 * over the socket.
 */
declare function FileUpload({ onUpload, onError, accept, label, hint, disabled, isPublic, action, params, className, }: FileUploadProps): react.JSX.Element;

interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
    /** 0 to 100. Omit for an indeterminate bar. */
    value?: number;
    label?: string;
    /** Also print "NN%" next to the label. */
    showValue?: boolean;
}
/**
 * Determinate and indeterminate progress (sdk.md), fed by onProgress ticks.
 * The indeterminate animation ships its own keyframes so it works without
 * Tailwind config additions.
 */
declare function Progress({ value, label, showValue, className, ...props }: ProgressProps): react.JSX.Element;

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
    /** "text" is a line of type; "rect" a block; "circle" an avatar. Default "text". */
    variant?: "text" | "rect" | "circle";
    /** Lines to draw, for variant "text". Default 1. */
    lines?: number;
    /** Any CSS width ("12rem", "60%"). Defaults to the full width of the parent. */
    width?: string | number;
    /** Any CSS height. Defaults to the variant's own. */
    height?: string | number;
}
declare function Skeleton({ variant, lines, width, height, className, style, ...props }: SkeletonProps): react.JSX.Element;

type StatusBadgeStatus = "ok" | "warn" | "error" | "pending";
interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
    status: StatusBadgeStatus;
    children?: ReactNode;
}
declare function StatusBadge({ status, children, className, ...props }: StatusBadgeProps): react.JSX.Element;

interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
    icon?: ReactNode;
    title: ReactNode;
    description?: ReactNode;
    /** One action (sdk.md), usually a Button. */
    action?: ReactNode;
}
declare function EmptyState({ icon, title, description, action, className, ...props }: EmptyStateProps): react.JSX.Element;

interface ErrorStateProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
    /** An AppError from the runtime, any Error, or a plain message. */
    error: unknown;
    title?: ReactNode;
    /** Shown as a "Try again" button. */
    onRetry?: () => void;
    retryLabel?: string;
}
/** Message plus retry, driven by an AppError (sdk.md). */
declare function ErrorState({ error, title, onRetry, retryLabel, className, ...props }: ErrorStateProps): react.JSX.Element;

interface ToastOptions {
    title: ReactNode;
    description?: ReactNode;
    variant?: "default" | "success" | "error";
    /** Milliseconds before auto-dismiss. 0 keeps it until closed. Default 5000. */
    durationMs?: number;
}
/** Show a toast. Returns its id for programmatic dismissal. */
declare function toast(opts: ToastOptions): string;
declare function dismissToast(id: string): void;
interface UseToastResult {
    toast: (opts: ToastOptions) => string;
    dismiss: (id: string) => void;
}
declare function useToast(): UseToastResult;
interface ToastProps {
    className?: string;
}
/** The toast viewport. Mount it once; AppShell already includes it. */
declare function Toast({ className }: ToastProps): react.JSX.Element | null;

type Gap = 0 | 1 | 2 | 3 | 4 | 6 | 8;
declare const ALIGN: {
    readonly start: "items-start";
    readonly center: "items-center";
    readonly end: "items-end";
    readonly stretch: "items-stretch";
};
declare const JUSTIFY: {
    readonly start: "justify-start";
    readonly center: "justify-center";
    readonly end: "justify-end";
    readonly between: "justify-between";
};
interface StackProps extends HTMLAttributes<HTMLDivElement> {
    gap?: Gap;
    align?: keyof typeof ALIGN;
}
/** Vertical flex layout. */
declare function Stack({ className, gap, align, ...props }: StackProps): react.JSX.Element;
interface RowProps extends HTMLAttributes<HTMLDivElement> {
    gap?: Gap;
    align?: keyof typeof ALIGN;
    justify?: keyof typeof JUSTIFY;
    wrap?: boolean;
}
/** Horizontal flex layout. */
declare function Row({ className, gap, align, justify, wrap, ...props }: RowProps): react.JSX.Element;
type Cols = 1 | 2 | 3 | 4 | 6;
interface GridProps extends HTMLAttributes<HTMLDivElement> {
    gap?: Gap;
    /** Column count at the base breakpoint. */
    cols?: Cols;
    /** Column count from the md breakpoint up. */
    mdCols?: Cols;
    /** Column count from the lg breakpoint up. */
    lgCols?: Cols;
}
/** Responsive grid layout. */
declare function Grid({ className, gap, cols, mdCols, lgCols, ...props }: GridProps): react.JSX.Element;

interface ConnectionBannerProps {
    /**
     * Explicit state. When omitted the banner reads the client from the
     * nearest AppProvider and renders nothing outside one.
     */
    state?: ConnectionState;
    className?: string;
}
/** Renders robot-offline / contract-mismatch states (sdk.md). */
declare function ConnectionBanner({ state, className }: ConnectionBannerProps): react.JSX.Element | null;

interface AssistantWidgetProps {
    /** Label on the bubble and the panel header. Defaults to "Assistant". */
    title?: string;
    /** Placeholder in the composer. */
    placeholder?: string;
    className?: string;
}
declare function AssistantWidget({ title, placeholder, className }: AssistantWidgetProps): react.JSX.Element | null;

export { type ActionDataSource, type ActionLike, type AnyDataSource, AppShell, type AppShellNavItem, type AppShellProps, type AppTheme, AssistantWidget, type AssistantWidgetProps, Button, type ButtonProps, Calendar, type CalendarEvent, type CalendarProps, Card, CardBody, CardFooter, CardHeader, type CardHeaderProps, type CardProps, Chart, type ChartDatum, type ChartProps, Checkbox, type CheckboxProps, ConfirmDialog, type ConfirmDialogProps, ConnectionBanner, type ConnectionBannerProps, DEFAULT_ACCENT, DataTable, type DataTableApi, type DataTableColumn, type DataTableProps, type DataTableRowAction, type DataTableRowCallbackAction, type DataTableRowLinkedAction, type DataTableSource, DatePicker, type DatePickerProps, Dialog, type DialogProps, Drawer, type DrawerProps, EmptyState, type EmptyStateProps, ErrorState, type ErrorStateProps, Field, type FieldProps, FileUpload, type FileUploadProps, Form, type FormProps, type FormValues, Grid, type GridProps, JsonInput, type JsonInputProps, JsonView, type JsonViewProps, Kanban, KanbanCard, type KanbanCardProps, KanbanColumn, type KanbanColumnProps, type KanbanMove, type KanbanProps, Markdown, type MarkdownProps, Menu, MenuItem, type MenuItemDef, type MenuItemProps, type MenuProps, NumberInput, type NumberInputProps, type PageReply, type PageRequest, type ParamsOf, Progress, type ProgressProps, RadioGroup, type RadioGroupProps, type RecordsDataSource, Row, type RowProps, Screen, type ScreenProps, Select, type SelectOption, type SelectProps, Skeleton, type SkeletonProps, Spinner, Stack, type StackProps, StatusBadge, type StatusBadgeProps, type StatusBadgeStatus, Tab, TabPanel, type TabPanelProps, type TabProps, Tabs, type TabsProps, TextArea, type TextAreaProps, TextInput, type TextInputProps, Toast, type ToastOptions, type ToastProps, Tooltip, type TooltipProps, type UseToastResult, accentStyle, applyTheme, cn, dismissToast, focusRing, inputBase, toast, useFormValues, useThemeBridge, useToast };
