import * as react from 'react';
import { ReactNode } from 'react';
import { A as AppClient, a as AppError } from '../links-_-nKGB9M.js';
export { j as bindAction, k as bindCollection, t as markGesture } from '../links-_-nKGB9M.js';
import { b as ActionProgress, e as ConnectionState, l as FileUploadOptions, F as FileRef } from '../types-CeiFtloU.js';

interface AppProviderProps {
    app: AppClient;
    children?: ReactNode;
}
declare function AppProvider({ app, children }: AppProviderProps): react.FunctionComponentElement<react.ProviderProps<AppClient | null>>;
/** The client from the nearest AppProvider. Throws outside a provider. */
declare function useAppClient(): AppClient;
/** Like useAppClient but returns null outside a provider (used by app-kit). */
declare function useMaybeAppClient(): AppClient | null;
interface UseActionResult<TParams = unknown, TData = unknown> {
    run: (params?: TParams, opts?: {
        timeoutMs?: number;
    }) => Promise<TData | undefined>;
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
declare function useAction<TParams = unknown, TData = unknown>(name: string): UseActionResult<TParams, TData>;
/**
 * A call refused for want of the robot is asked again, once, when the robot
 * is back. Only that failure: a refusal the robot itself gave (bad
 * parameters, the app's own error) is an answer and stands until the person
 * acts.
 */
declare function shouldRetryOnReconnect(error: AppError | undefined, state: ConnectionState): boolean;
interface UseCollectionResult<T = unknown> {
    records: T[];
    loading: boolean;
    error: AppError | undefined;
    /** The collection name, so bindCollection can stamp the link. */
    name: string;
}
/** Subscribe to a collection for the component's lifetime. */
declare function useCollection<T = unknown>(name: string): UseCollectionResult<T>;
/** Subscribe to a server event for the component's lifetime. */
declare function useEvent<T = unknown>(name: string, cb: (payload: T) => void): void;
interface UseConnectionResult {
    state: ConnectionState;
    robotOnline: boolean;
}
/** Observe the connection state. */
declare function useConnection(): UseConnectionResult;
interface UseFileUploadResult {
    upload: (file: File, opts?: FileUploadOptions) => Promise<FileRef | undefined>;
    uploading: boolean;
    progress: number;
    error: AppError | undefined;
}
/** Upload files over /v1/artifacts.* and get FileRefs back. */
declare function useFileUpload(): UseFileUploadResult;

export { AppProvider, type AppProviderProps, type UseActionResult, type UseCollectionResult, type UseConnectionResult, type UseFileUploadResult, shouldRetryOnReconnect, useAction, useAppClient, useCollection, useConnection, useEvent, useFileUpload, useMaybeAppClient };
