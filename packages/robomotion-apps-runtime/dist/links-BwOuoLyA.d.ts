import { d as CollectionOp, l as FileUploadOptions, F as FileRef, e as ConnectionState, k as CreateAppOptions, C as CallOptions, c as AppErrorCode } from './types-C2XfxZIO.js';

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
/** What a caller listens to on one assistant turn. */
interface AssistantTurnHandlers {
    onDelta?: (text: string) => void;
    onTool?: (tool: string) => void;
    onDone?: () => void;
    onError?: (message: string) => void;
}
interface AssistantTurnHandle {
    turnId: string;
    /** Stop listening. The robot and agent finish the turn on their own. */
    stop: () => void;
}
declare class ConnectionInfo {
    private _state;
    /**
     * Why the contract does not match, and what the robot said about it.
     *
     * A mismatch means one of two things and the screen used to say only one of
     * them. "This app was updated. Reload the page to continue" is right for a
     * stale page; when the robot is simply busy running ANOTHER app it is not
     * only wrong, it is a loop - the reload asks the same question and gets the
     * same answer. Carried here so the banner can say which, instead of
     * hard-coding a sentence and a button that cannot work.
     */
    private _mismatch;
    private cbs;
    get state(): ConnectionState;
    onChange(cb: (s: ConnectionState) => void): () => void;
    /** Set when `state === "contract_mismatch"`, null otherwise. */
    get mismatch(): {
        reason: string;
        message: string;
        runningAppName?: string;
    } | null;
    /** @internal */
    setMismatch(info: {
        reason: string;
        message: string;
        runningAppName?: string;
    } | null): void;
    /** @internal */
    set(state: ConnectionState): void;
    /**
     * Tell whatever framed this page how the app is connected.
     *
     * The Designer's preview panel cannot see inside the iframe, so until now
     * it could only tell whether the SCREENS were being served - never whether
     * the robot behind them was running. It painted "The preview isn't running"
     * over a live app, and framed an app with no backend at all as if pressing
     * its buttons would do something. The banner inside the app knew the
     * truth the whole time; this is how it gets out.
     *
     * A DOM event, relayed to the parent by the app-kit's vite bridge as
     * `rm-connection`, the same way action events already travel.
     */
    private announce;
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
    private readonly callConnectWaitMs;
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
    /** Throttles the instance re-resolve in reconnectIfRobotChanged. */
    private lastRobotRecheck;
    private robotRecheckTimer;
    private robotRecheckDelayMs;
    private pingTimer;
    private sendChain;
    private recvChain;
    private pending;
    private assistantTurns;
    private eventHandlers;
    private collections;
    constructor(options: CreateAppOptions);
    /**
     * Who this page is for. An explicit option wins; otherwise the served
     * config (window.env in production, the kit's /__rm/config.json in the
     * preview) names the person the serving tier vouched for; otherwise the
     * page is an anonymous visitor and registers as one. The session id falls
     * back to the per-browser client id so a registration is never nameless.
     */
    private identity;
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
    /**
     * Re-resolve the instance when the proxy says no robot is attached, and
     * reconnect if it now names a different one.
     *
     * An instance is created bound to the app's OWN application robot, which
     * exists as a quota row and never runs anything. A draft session started
     * from the Build view rewrites that binding to the robot the person
     * actually runs on. A preview page that resolved the instance before the
     * session started therefore holds the application robot's id, opens its
     * socket against a robot that will never connect, and waits for ever under
     * "the robot for this app is offline" while the real robot sits there
     * running the flow. Nothing recovered it but a full reload.
     *
     * Being told nothing is attached is exactly the moment to check, so this
     * costs one request in the case that was already broken and none in the
     * case that works.
     */
    private reconnectIfRobotChanged;
    /**
     * Start this app's backend on its robot.
     *
     * The page has always had exactly one thing to offer a person whose app is
     * not running: nothing. It said the robot was offline, which was usually
     * untrue, and there was no button. Starting is a request the signed-in
     * person is entitled to make, and the recheck loop above notices the
     * backend coming up, so success needs no further wiring.
     */
    startBackend(): Promise<void>;
    /** Begin asking, while we are waiting on a robot that may never come. */
    private startRobotRecheck;
    private scheduleRobotRecheck;
    /** Back off and go round again, unless we got somewhere. */
    private continueRobotRecheck;
    /**
     * Whether we are still waiting on something to appear on the other end.
     * Both states are a wait: one for the robot, one for its backend, and a
     * backend someone starts from the Designer has to be noticed either way.
     */
    private isWaitingForBackend;
    private stopRobotRecheck;
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
     * Whether the app has an assistant behind its chat widget. Known after
     * hello_ack: the robot answers from its mcp.json and whether an agent is
     * beside it. False until then, and false forever for an app whose robot
     * runs where no agent does.
     */
    assistantAvailable(): boolean;
    /** The widget's opening line, from the app's mcp.json. */
    assistantGreeting(): string;
    /**
     * Send one message to the assistant. Replies stream back through the
     * handlers; the returned handle identifies the turn and lets the caller
     * stop listening. The conversation is keyed per browser (session_key), so
     * the same person continues where they were after a reload.
     */
    sendAssistantPrompt(text: string, handlers: AssistantTurnHandlers): AssistantTurnHandle;
    private assistantSessionKey;
    /**
     * Resolve with the first connection state that is not "connecting", or
     * with "connecting" itself once `ms` have passed without one.
     */
    private waitWhileConnecting;
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

export { AppClient as A, Collection as C, FilesApi as F, type InstallLinksOptions as I, type LinkHandler as L, AppError as a, type ArtifactAddress as b, type AssistantTurnHandle as c, type AssistantTurnHandlers as d, ConnectionInfo as e, type LinkKind as f, type LinkMode as g, type LinkNamespace as h, type LinkSite as i, type LinkState as j, type LinksHandle as k, bindAction as l, bindCollection as m, createApp as n, currentCause as o, decodeArtifactId as p, encodeArtifactId as q, installLinks as r, isAppError as s, linkKey as t, lookupTag as u, markGesture as v, splitLinkKey as w, tagAction as x, tagCollection as y };
