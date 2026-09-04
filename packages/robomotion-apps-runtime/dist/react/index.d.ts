import * as react from 'react';
import { ReactNode } from 'react';
import { A as AppClient, a as AppError } from '../links-Bbd1vUrW.js';
export { j as bindAction, k as bindCollection, t as markGesture } from '../links-Bbd1vUrW.js';
import { b as ActionProgress, e as ConnectionState, l as FileUploadOptions, F as FileRef } from '../types-BMEKkskn.js';

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
 */
declare function useAction<TParams = unknown, TData = unknown>(name: string): UseActionResult<TParams, TData>;
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

export { AppProvider, type AppProviderProps, type UseActionResult, type UseCollectionResult, type UseConnectionResult, type UseFileUploadResult, useAction, useAppClient, useCollection, useConnection, useEvent, useFileUpload, useMaybeAppClient };
