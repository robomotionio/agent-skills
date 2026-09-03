import { ClassValue } from 'clsx';
import * as react from 'react';
import { CSSProperties, HTMLAttributes, ReactNode, ButtonHTMLAttributes, MouseEvent, InputHTMLAttributes, FormHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
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

interface ActionLike<P = unknown> {
    /** The action name; becomes data-rm-action on the widget. */
    name: string;
    /** True while a call is in flight. */
    loading: boolean;
    /** Method syntax keeps typed actions assignable to ActionLike<unknown>. */
    run(params?: P): Promise<unknown>;
}
/** Params for an action-bound widget: a value, or a function of the triggering event. */
type ParamsOf<P, E = unknown> = P | ((event: E) => P);

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

interface DataTableColumn<T> {
    /** Property key on the row; also the default sort/filter accessor. */
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
 * Where the rows came from, for rows that were sorted or mapped into a new
 * array: the useCollection() or useAction() result itself. Identity tags do
 * not survive that, and an empty derived array has nothing to tag at all.
 */
interface DataTableSource {
    name: string;
    records?: unknown;
}
interface DataTableProps<T> {
    columns: DataTableColumn<T>[];
    rows: T[];
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
    /** The hook result the rows came from, when they were sorted or mapped into a new array. */
    source?: DataTableSource;
}
declare function DataTable<T>({ columns, rows, rowKey, source, filterable, filterPlaceholder, pageSize, rowActions, onRowClick, caption, emptyTitle, emptyDescription, emptyState, loading, className, }: DataTableProps<T>): react.JSX.Element;

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
     */
    action?: ActionLike;
    disabled?: boolean;
    children?: ReactNode;
}
declare function Form({ schema, initialValues, values: controlledValues, onChange, onSubmit, action, disabled, children, className, ...props }: FormProps): react.JSX.Element;
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
declare function ConnectionBanner({ state, className }: ConnectionBannerProps): react.JSX.Element;

export { type ActionLike, AppShell, type AppShellNavItem, type AppShellProps, Button, type ButtonProps, Card, CardBody, CardFooter, CardHeader, type CardHeaderProps, type CardProps, Checkbox, type CheckboxProps, ConnectionBanner, type ConnectionBannerProps, DEFAULT_ACCENT, DataTable, type DataTableColumn, type DataTableProps, type DataTableRowAction, type DataTableRowCallbackAction, type DataTableRowLinkedAction, type DataTableSource, DatePicker, type DatePickerProps, EmptyState, type EmptyStateProps, ErrorState, type ErrorStateProps, Field, type FieldProps, FileUpload, type FileUploadProps, Form, type FormProps, type FormValues, Grid, type GridProps, NumberInput, type NumberInputProps, type ParamsOf, Progress, type ProgressProps, RadioGroup, type RadioGroupProps, Row, type RowProps, Screen, type ScreenProps, Select, type SelectOption, type SelectProps, Spinner, Stack, type StackProps, StatusBadge, type StatusBadgeProps, type StatusBadgeStatus, TextArea, type TextAreaProps, TextInput, type TextInputProps, Toast, type ToastOptions, type ToastProps, type UseToastResult, accentStyle, cn, dismissToast, focusRing, toast, useFormValues, useToast };
