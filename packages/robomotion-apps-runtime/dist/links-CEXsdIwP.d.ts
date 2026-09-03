import { d as CollectionOp, l as FileUploadOptions, F as FileRef, e as ConnectionState, k as CreateAppOptions, C as CallOptions, c as AppErrorCode } from './types-D-1fQGTm.js';

/**
 * A live view over one server-side collection (sdk.md "Collections",
 * protocol.md sections 4.2 and 8).
 *
 * The robot numbers every change with a per-collection `seq`. A snapshot
 * carries the seq it represents; a delta must be exactly lastSeq + 1 to be
 * applied. Anything at or below lastSeq is a duplicate and is dropped;
 * anything above lastSeq + 1 means we missed a delta and must ask again
 * from lastSeq (the robot answers with the missing deltas, or a fresh
 * snapshot when the gap exceeds its retained window).
 *
 * Record identity is the `key` carried on every op (and derived from the
 * contract's key field for snapshot records). We keep a `keys` array in
 * lockstep with `records` so deletes reindex in O(n).
 */
declare class Collection<T = unknown> {
    readonly name: string;
    /** The current record array. Treat as read-only. */
    records: T[];
    /** True until the first snapshot lands. */
    loading: boolean;
    /** Highest seq applied so far; 0 before the first snapshot. */
    lastSeq: number;
    /** Wire subscription bookkeeping, driven by the client. */
    desired: number;
    wireSubscribed: boolean;
    private keys;
    private index;
    private changeCbs;
    private readonly requestSubscribe;
    private readonly requestUnsubscribe;
    constructor(name: string, requestSubscribe: (col: Collection<T>, sinceSeq: number) => void, requestUnsubscribe: (col: Collection<T>) => void);
    /**
     * Stamp the array and every record with the collection's identity, so a
     * table fed these objects (or a filtered subset of them) can say which
     * collection it shows without the author writing anything.
     */
    private tagRecords;
    /**
     * Declare interest. Returns an unsubscribe function; the wire subscription
     * is reference counted, so several screens can share one collection.
     */
    subscribe(): () => void;
    /** Drop every subscription and tell the robot to stop sending. */
    unsubscribe(): void;
    /** Fires after every applied snapshot or delta. Returns an off function. */
    onChange(cb: () => void): () => void;
    applySnapshot(seq: number, records: T[], keyOf: (r: T) => string): void;
    /**
     * Apply one data_change. Returns:
     *  - "applied": in-order, records updated
     *  - "stale":   duplicate (seq <= lastSeq), dropped
     *  - "gap":     out of order (seq > lastSeq + 1), caller must resubscribe
     */
    applyChange(seq: number, ops: CollectionOp<T>[]): "applied" | "stale" | "gap";
    private emit;
}

/**
 * File transfer over the existing /v1/artifacts.* REST endpoints
 * (protocol.md section 10). Bytes never travel over the socket.
 *
 * The artifacts API is keyed by (app, instance, user, session, filename,
 * version). protocol.md defines FileRef as {artifact_id, name, size, mime},
 * so we fold the addressable coordinates into an opaque artifact_id:
 *
 *   artifact_id = base64url(JSON with sorted keys {"f":filename,"s":session_id,"u":user_id,"v":version})
 *
 * base64url is base64 with "+" -> "-", "/" -> "_" and padding stripped.
 * The Go side (Robomotion.Apps node package) must build and parse the same
 * string: marshal the four fields with keys in the order f, s, u, v and no
 * insignificant whitespace, then base64.RawURLEncoding.
 */
interface ArtifactAddress {
    f: string;
    s: string;
    u: string;
    v: number;
}
declare function encodeArtifactId(addr: ArtifactAddress): string;
declare function decodeArtifactId(artifactId: string): ArtifactAddress | null;
interface FilesContext {
    apiUrl: string;
    appId: string;
    instanceId: string;
    userId: string;
    sessionId: string;
    fetchFn: typeof fetch;
}
declare class FilesApi {
    private readonly ctx;
    constructor(ctx: () => FilesContext);
    /**
     * Upload one browser File and get back a FileRef to pass in action params.
     * Three steps: presigned upload URL, PUT the bytes to S3, confirm.
     */
    upload(file: File, opts?: FileUploadOptions): Promise<FileRef>;
    /** Resolve a FileRef to a short-lived download URL. */
    downloadUrl(ref: FileRef): Promise<string>;
    private postJson;
}

/** Observable connection state (sdk.md "Connection"). */
declare class ConnectionInfo {
    private _state;
    private cbs;
    get state(): ConnectionState;
    onChange(cb: (s: ConnectionState) => void): () => void;
    /** @internal */
    set(state: ConnectionState): void;
}
/**
 * The core app client (docs/apps/sdk.md, docs/apps/protocol.md).
 *
 * Lifecycle: resolve instance from the base58 URL path, open the WebSocket,
 * register with mode "app", run the RSA/AES key exchange, send hello (or
 * resume after a reconnect), then exchange encrypted app envelopes.
 */
declare class AppClient {
    readonly connection: ConnectionInfo;
    readonly files: FilesApi;
    readonly contractHash: string;
    private readonly opts;
    private readonly storage;
    private readonly apiUrl;
    /** WebSocket base including the /ws path segment. */
    private readonly wsBase;
    private readonly fetchFn;
    private readonly reconnectDelayMs;
    private readonly pingIntervalMs;
    private instance;
    private connId;
    private clientId;
    private ws;
    private aesKey;
    private robotPublicKey;
    private manifestSummary;
    private helloSentOnce;
    private closed;
    private reconnectTimer;
    private pingTimer;
    private sendChain;
    private recvChain;
    private pending;
    private eventHandlers;
    private collections;
    constructor(options: CreateAppOptions);
    get appId(): string;
    get instanceId(): string;
    /**
     * Start (or restart) the connection. Never throws on transport failure:
     * failures surface through connection state and typed call rejections.
     */
    connect(): void;
    private connectInner;
    /** Tear the client down for good. In-flight calls reject as cancelled. */
    close(): void;
    private onSocketDown;
    private scheduleReconnect;
    private clearReconnect;
    private startPing;
    private stopPing;
    private buildWsUrl;
    /** Durable per-browser identity under rm.app.<app_id>.client_id (protocol.md section 1). */
    private ensureClientId;
    private handleMessage;
    private isAppType;
    private handleRobotStatus;
    private doKeyExchange;
    /** First connection sends hello; every reconnect sends resume (protocol.md section 8). */
    private sendHelloOrResume;
    private handleAppEnvelope;
    private failInFlight;
    private sendRaw;
    /**
     * Seal a body and send it in an app envelope. Sends are chained so the
     * async crypto cannot reorder hello ahead of key_exchange or interleave
     * two calls' envelopes.
     */
    private sendEnvelope;
    /**
     * Invoke one action (sdk.md "Calling actions"). Resolves with the action
     * result; rejects with AppError using the protocol.md section 4.3 codes.
     */
    call<T = unknown>(action: string, params?: unknown, opts?: CallOptions): Promise<T>;
    private defaultTimeout;
    private settle;
    /** Subscribe to a server event by name. Returns an off function. */
    on(event: string, handler: (payload: unknown) => void): () => void;
    /** Get (or create) the shared handle for one collection. */
    collection<T = unknown>(name: string): Collection<T>;
}
/**
 * Create, connect and return an AppClient (sdk.md "Creating a client").
 * Never throws on transport failure: connection state is observable, and
 * calls made while offline reject with a typed error.
 */
declare function createApp(options: CreateAppOptions): AppClient;

/**
 * The one error type every rejected call carries (sdk.md "Calling actions",
 * protocol.md section 4.3). `retryable` is always explicit so callers never
 * have to guess whether re-issuing is safe.
 */
declare class AppError extends Error {
    readonly code: AppErrorCode;
    readonly retryable: boolean;
    readonly details?: unknown;
    /** The call this error settled, when it came from one (action links use it). */
    callId?: string;
    constructor(code: AppErrorCode, message: string, retryable: boolean, details?: unknown);
    static from(input: {
        code?: string;
        message?: string;
        retryable?: boolean;
        details?: unknown;
    }): AppError;
}
declare function isAppError(e: unknown): e is AppError;

type LinkMode = "off" | "hover" | "all";
type LinkState = "linked" | "running" | "ok" | "failed" | "missing";
type LinkKind = "declared" | "inferred" | "screen" | "hook";
type LinkNamespace = "action" | "collection" | "event";
/** What the host knows about one link key. */
interface LinkHandler {
    title: string;
    state?: LinkState;
    note?: string;
    writers?: unknown;
}
/** One place in the app that leads somewhere in the flow. */
interface LinkSite {
    key: string;
    id: string;
    label: string;
    kind: LinkKind;
    /** Present when repeated controls collapsed into this one entry. */
    count?: number;
    action?: string;
    collection?: string;
    event?: string;
}
interface LinksHandle {
    /** Remove every listener and overlay. Safe to call twice. */
    stop(): void;
}
interface InstallLinksOptions {
    /** The app id, read lazily; keys the remembered inferred links per app. */
    appId?: () => string;
}
declare function linkKey(ns: LinkNamespace, name: string): string;
/** "action:approveInvoice" -> {ns: "action", name: "approveInvoice"}. A bare name is an action. */
declare function splitLinkKey(key: string): {
    ns: LinkNamespace;
    name: string;
};
/** Tag a records array, or one record, as belonging to a collection. */
declare function tagCollection(value: unknown, name: string): void;
/** Tag an action's result, progress or error object with its action. */
declare function tagAction(value: unknown, name: string): void;
/** The link key an object was tagged with, if any. */
declare function lookupTag(value: unknown): {
    key: string;
} | undefined;
type Named = string | {
    name: string;
};
/** Spread on any element to declare "this runs action X". */
declare function bindAction(action: Named): {
    "data-rm-action": string;
};
/** Spread on any element to declare "this shows collection X". */
declare function bindCollection(collection: Named): {
    "data-rm-collection": string;
};
/** The link key of whatever caused the current code to run, if recent. */
declare function currentCause(): {
    key: string;
} | undefined;
/**
 * Re-arm the gesture from async kit code: an upload or a confirm step that
 * finishes later still attributes its call to the widget the user touched.
 */
declare function markGesture(el: Element | null | undefined): void;
/**
 * Install the link registry, inference and badge painter.
 *
 * A no-op outside a browser and outside a frame. Idempotent. Inert until a
 * host sends rm-links-mode: gestures are remembered cheaply from the start,
 * but nothing is written to the DOM and nothing is posted before that.
 */
declare function installLinks(options?: InstallLinksOptions): LinksHandle;

export { AppClient as A, Collection as C, FilesApi as F, type InstallLinksOptions as I, type LinkHandler as L, AppError as a, type ArtifactAddress as b, ConnectionInfo as c, type LinkKind as d, type LinkMode as e, type LinkNamespace as f, type LinkSite as g, type LinkState as h, type LinksHandle as i, bindAction as j, bindCollection as k, createApp as l, currentCause as m, decodeArtifactId as n, encodeArtifactId as o, installLinks as p, isAppError as q, linkKey as r, lookupTag as s, markGesture as t, splitLinkKey as u, tagAction as v, tagCollection as w };
