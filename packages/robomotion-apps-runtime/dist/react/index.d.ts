import * as react from 'react';
import { ReactNode } from 'react';
import { A as AppClient, a as AppError } from '../links-64_FaaHK.js';
export { m as bindAction, v as markGesture } from '../links-64_FaaHK.js';
import { b as ActionProgress, d as ConnectionState, j as FileUploadOptions, F as FileRef, V as Viewer } from '../types-BAJsXo2R.js';

interface AppProviderProps {
    app: AppClient;
    children?: ReactNode;
}
declare function AppProvider({ app, children }: AppProviderProps): react.FunctionComponentElement<react.ProviderProps<AppClient | null>>;
/** The client from the nearest AppProvider. Throws outside a provider. */
declare function useAppClient(): AppClient;
/** Like useAppClient but returns null outside a provider (used by app-kit). */
declare function useMaybeAppClient(): AppClient | null;
type WriteDoneListener = (name: string) => void;
/** Says a pressed action has settled, naming it. The kit's widgets call this. */
declare function announceWriteDone(name: string): void;
/** Listens for announced writes. Returns the unsubscribe. */
declare function onWriteDone(listen: WriteDoneListener): () => void;
/**
 * What a call asks, as a string two equal calls share: params with their keys
 * sorted, plus the options that change the call. Null when the params cannot
 * be compared (a File, a cycle) - such a call is never coalesced or braked.
 */
declare function callKey(params: unknown, opts?: RunOptions): string | null;
/** More than this many sends of one question inside the window trips the brake. */
declare const LOOP_LIMIT = 10;
declare const LOOP_WINDOW_MS = 30000;
/**
 * Stops one hook asking the same question in a loop. A screen whose effect
 * re-runs on every render sends the same call each time the last answer
 * lands; after LOOP_LIMIT sends of equal params inside LOOP_WINDOW_MS, with no
 * announced write in between, nothing more is sent and the hook shows an
 * error saying why. A person is never braked: a kit widget press announces
 * its write, which starts the count again, and eleven hand presses of the
 * same question inside thirty seconds, each waiting for its answer, is not a
 * person reading the answers. A different question starts afresh.
 */
declare class LoopBrake {
    private readonly name;
    private key;
    private starts;
    private epoch;
    tripped: boolean;
    error: AppError | undefined;
    constructor(name: string);
    /** Notes a send of `key`. True when it must not be sent. */
    note(key: string, now?: number): boolean;
}
interface RunOptions {
    timeoutMs?: number;
    /**
     * False when something else owns refreshing this call - a paged DataTable
     * re-asks for its page itself, and re-running here too fetched it twice.
     */
    refreshOnWrite?: boolean;
}
interface UseActionOptions {
    /**
     * True only for an action that changes nothing (mcp.json `read_only`). A
     * read hook asks its last question again after another action's announced
     * write, so a list loaded by hand shows the row a form beside it added.
     * Anything not known to be a read is never re-run: replaying a write
     * stores it again. Codegen sets this; screens do not.
     */
    readOnly?: boolean;
}
interface UseActionResult<TParams = unknown, TData = unknown> {
    run: (params?: TParams, opts?: RunOptions) => Promise<TData | undefined>;
    data: TData | undefined;
    error: AppError | undefined;
    loading: boolean;
    progress: ActionProgress | undefined;
    cancel: () => void;
    /** The action name, so a kit Button or bindAction can stamp the link. */
    name: string;
}
/**
 * Bind one action. `run` resolves with the result and also lands it in
 * `data`; failures land in `error` (the returned promise resolves undefined
 * instead of rejecting, so screens never need try/catch).
 *
 * `data` and `error` are mutually exclusive, and only the LATEST run may
 * write either. Both halves of that were bugs people saw:
 *
 * - A failure used to leave the previous `data` in place, so a website
 *   checker showed "Could not reach <url>" and "OK, the site is up, 200,
 *   641 ms" at the same time, for the same address (issue 30).
 * - A run aborts the one before it, and the aborted call's rejection landed
 *   AFTER the new run had cleared the error - so "The action was cancelled"
 *   sat above a correct answer for the rest of a session (issue 44's tail).
 *   The sequence number is what stops a call that nobody is waiting for from
 *   writing anything at all.
 */
declare function useAction<TParams = unknown, TData = unknown>(name: string, hookOpts?: UseActionOptions): UseActionResult<TParams, TData>;
/**
 * A call refused for want of the robot is asked again, once, when the robot
 * is back. Only that failure: a refusal the robot itself gave (bad
 * parameters, the app's own error) is an answer and stands until the person
 * acts.
 *
 * A call that was already SENT when the robot dropped out is not asked
 * again: the robot may have run it, and resending a write stores it twice.
 * That failure stays on screen for the person to judge.
 */
declare function shouldRetryOnReconnect(error: AppError | undefined, state: ConnectionState): boolean;
/** Subscribe to a server event for the component's lifetime. */
declare function useEvent<T = unknown>(name: string, cb: (payload: T) => void): void;
interface UseConnectionResult {
    state: ConnectionState;
    robotOnline: boolean;
}
/** Observe the connection state. */
declare function useConnection(): UseConnectionResult;
/**
 * Who the proxy says this page is: null until it has said, then a Viewer
 * whose userId is empty for an anonymous visitor (protocol.md section 2).
 */
declare function useViewer(): Viewer | null;
interface UseFileUploadResult {
    upload: (file: File, opts?: FileUploadOptions) => Promise<FileRef | undefined>;
    uploading: boolean;
    progress: number;
    error: AppError | undefined;
}
/** Upload files over /v1/artifacts.* and get FileRefs back. */
declare function useFileUpload(): UseFileUploadResult;
interface UseFileUrlResult {
    /** A URL the page can show, once there is one. */
    url: string | undefined;
    /** True while the URL is being asked for. */
    loading: boolean;
    error: AppError | undefined;
    /** Ask for a fresh URL, for one the browser was just refused with. */
    refresh: () => void;
}
/**
 * A FileRef as something an <img> can point at.
 *
 * A file the robot saved or a person uploaded has no address of its own, only
 * a signed link that lasts an hour. This asks for one (through
 * `app.files.previewUrl`, which remembers answers and shares questions, so a
 * wall of pictures costs one request per file and a re-render costs none) and
 * hands it over when it lands. A public file's permanent `url` is used as it
 * is. Outside an AppProvider - the kit's playground, a test - it resolves
 * nothing and says so with `url: undefined`, rather than throwing.
 */
declare function useFileUrl(ref: FileRef | null | undefined): UseFileUrlResult;
interface UseLiveOptions<TParams = unknown, TData = unknown> {
    /** Event names that mean "what you are showing is old": each one re-reads. */
    events: string[];
    /** Params for the read action. A change of params starts over. */
    params?: TParams;
    /** Re-read anyway after this long with no event. 0 turns it off. Default 5000. */
    pollMs?: number;
    /** Never re-read more often than this, however many events arrive. Default 500. */
    minIntervalMs?: number;
    /** True when the answer is final and polling can stop. Default: `data.done === true`. */
    isDone?: (data: TData) => boolean;
    /** False to hold off, e.g. until there is an id to ask about. Default true. */
    enabled?: boolean;
    timeoutMs?: number;
    /** Sees each event before the re-read: for a hint to animate, never for state to keep. */
    onEvent?: (event: string, payload: unknown) => void;
}
interface UseLiveResult<TData = unknown> {
    /** The latest answer; stays on screen while a newer one is fetched or fails. */
    data: TData | undefined;
    error: AppError | undefined;
    /** True until the first answer or failure. */
    loading: boolean;
    /** True while any read is out. */
    refreshing: boolean;
    /** True once the answer said it was final. */
    done: boolean;
    /** Ask now. */
    refresh: () => void;
    /** The action name, so a kit widget can stamp the link. */
    name: string;
}
/**
 * Keep a read action's answer current while the robot works.
 *
 * Events are not buffered: a page that reloads in the middle of a run hears
 * none of what it missed, and a screen that counts events is wrong from then
 * on. The state belongs to the robot. So a live view is a READ - `getRun`,
 * `listQueue` - and this hook keeps asking it at the right moments: when the
 * screen opens, when one of `events` arrives (a burst of them is one
 * question, at most one per `minIntervalMs`), when nothing has been heard for
 * `pollMs`, and when the connection comes back. It stops by itself when the
 * answer has `done: true`.
 *
 *   const run = useLive<{ id: string }, RunView>("getRun", {
 *     params: { id }, events: ["runProgress", "adAnalyzed", "runFinished"],
 *   });
 *
 * The action must be one that changes nothing: it is asked many times.
 */
declare function useLive<TParams = unknown, TData = unknown>(action: string | {
    name: string;
}, opts: UseLiveOptions<TParams, TData>): UseLiveResult<TData>;
interface AssistantMessage {
    id: string;
    role: "user" | "assistant";
    text: string;
    /** Names of the app actions the assistant ran for this reply. */
    tools?: string[];
    error?: string;
    /** True while the reply is still streaming. */
    streaming?: boolean;
}
interface UseAssistantResult {
    /** False until hello_ack says the app has an assistant. */
    available: boolean;
    greeting: string;
    messages: AssistantMessage[];
    busy: boolean;
    send: (text: string) => void;
    /**
     * Stop the reply that is streaming. What has arrived stays on screen, and
     * the robot is told, so the model stops working for nobody.
     */
    stop: () => void;
    clear: () => void;
}
/**
 * The app's assistant as React state: the transcript of this page, whether
 * a reply is streaming, and a send. The transcript is per page load; the
 * conversation itself lives with the agent, keyed per browser, so a reload
 * keeps the assistant's memory even though the list here starts empty.
 */
declare function useAssistant(): UseAssistantResult;

export { AppProvider, type AppProviderProps, type AssistantMessage, LOOP_LIMIT, LOOP_WINDOW_MS, LoopBrake, type RunOptions, type UseActionOptions, type UseActionResult, type UseAssistantResult, type UseConnectionResult, type UseFileUploadResult, type UseFileUrlResult, type UseLiveOptions, type UseLiveResult, announceWriteDone, callKey, onWriteDone, shouldRetryOnReconnect, useAction, useAppClient, useAssistant, useConnection, useEvent, useFileUpload, useFileUrl, useLive, useMaybeAppClient, useViewer };
