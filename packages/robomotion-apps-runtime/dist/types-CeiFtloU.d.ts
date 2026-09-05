/** Connection state observable on `app.connection.state` (sdk.md "Connection"). */
type ConnectionState = "connecting" | "ready" | "offline" | "robot_offline"
/**
 * The robot is there; this app's backend is not running on it.
 *
 * These look identical from the socket - the proxy says "no robot is
 * attached to this instance" either way - and for a long time the page
 * said the robot was offline for both. It was routinely untrue: a backend
 * with no App Action node runs to the end and exits in a second, so it is
 * never resident, so no robot is ever attached, and the person was shown
 * "The robot for this app is offline. Waiting for it to come back" about a
 * robot that was connected and idle, with nothing to press and nothing to
 * wait for. The instance record knows which of the two it is.
 */
 | "app_not_running" | "contract_mismatch"
/**
 * No backend is configured for this app yet - there is no instance to talk
 * to, so there is nothing to connect TO.
 *
 * Distinct from "offline" on purpose. "Offline" means a connection dropped
 * and retrying may fix it; this means one was never possible, and retrying
 * can only produce a misleading "Connection lost. Reconnecting." forever.
 * In the preview this is the normal state until the agent starts a draft
 * session; in production it means the serving tier injected no instance.
 */
 | "unconfigured";
/**
 * A file passed by reference in action params and results (protocol.md section 10).
 * Bytes never travel over the socket; they move over the /v1/artifacts.* REST API.
 */
interface FileRef {
    artifact_id: string;
    name: string;
    size: number;
    mime: string;
}
/** protocol.md section 4.3. Every code carries an explicit retryable flag. */
type AppErrorCode = "invalid_params" | "unknown_action" | "contract_mismatch" | "robot_offline" | "queue_full" | "timeout" | "cancelled" | "concurrency_rejected" | "internal";
/** A progress tick for one in-flight action call (protocol.md section 4.2). */
interface ActionProgress {
    percent?: number;
    message?: string;
    data?: unknown;
}
/** Options for `app.call()` (sdk.md "Calling actions"). */
interface CallOptions {
    onProgress?: (p: ActionProgress) => void;
    signal?: AbortSignal;
    /** Defaults to the manifest value for the action, else 30000. */
    timeoutMs?: number;
}
/** One op inside a `data_change` delta (protocol.md section 4.2). */
interface CollectionOp<T = unknown> {
    op: string;
    key: string;
    record?: T;
}
/** The JSON Schema subset app.json is allowed to use (draft 2020-12 subset). */
interface ContractSchema {
    type?: "object" | "array" | "string" | "number" | "integer" | "boolean" | "null";
    properties?: Record<string, ContractSchema>;
    items?: ContractSchema;
    required?: readonly string[];
    enum?: readonly unknown[];
    format?: string;
    description?: string;
    default?: unknown;
    $ref?: string;
}
interface ContractAction {
    description: string;
    params: ContractSchema;
    result: ContractSchema;
    timeout_ms?: number;
    concurrency?: {
        mode?: "parallel" | "queue";
        limit?: number;
    };
    progress?: boolean;
    cancellable?: boolean;
}
interface ContractEvent {
    description: string;
    payload: ContractSchema;
    audience?: "connection" | "client" | "user" | "broadcast";
}
interface ContractCollection {
    description: string;
    record: ContractSchema;
    key: string;
    scope?: "shared" | "user";
    max_records?: number;
}
interface ContractScreen {
    description?: string;
    route?: string;
}
/** The app.json contract (contract.md). */
interface AppContract {
    schema: "robomotion.app/v1";
    app_id: string;
    flow_id?: string;
    name: string;
    description?: string;
    auth?: "public" | "link" | "workspace";
    theme?: {
        accent?: string;
        mode?: "light" | "dark" | "system";
    };
    types?: Record<string, ContractSchema>;
    actions: Record<string, ContractAction>;
    events?: Record<string, ContractEvent>;
    collections?: Record<string, ContractCollection>;
    screens?: Record<string, ContractScreen>;
}
/** Identity block, stamped by the proxy on robot-bound envelopes (protocol.md section 2). */
interface WireIdentity {
    conn_id: string;
    client_id: string;
    user_id: string;
    workspace_id: string;
    is_public: boolean;
}
/** The cleartext routing shell every app message travels in (protocol.md section 3). */
interface WireEnvelope {
    type: string;
    mode: "app";
    app_id?: string;
    instance_id?: string;
    contract_hash?: string;
    target_ui_guid?: string;
    audience?: string;
    identity?: WireIdentity;
    /** AES-GCM: "<b64 iv>:<b64 ciphertext>" of the JSON body. */
    payload?: string;
    call_id?: string;
    robot_id?: string;
    code?: string;
    message?: string;
    retryable?: boolean;
    [k: string]: unknown;
}
/** Body of `hello_ack` (protocol.md section 4.2). */
interface HelloAck {
    contract_hash: string;
    manifest_summary?: {
        name?: string;
        actions?: Record<string, {
            timeout_ms?: number;
            progress?: boolean;
            cancellable?: boolean;
        }>;
        [k: string]: unknown;
    };
    server_time?: string | number;
}
/**
 * Runtime config injected by the serving tier (sdk.md "Runtime config").
 *
 * snake_case is deliberate and load-bearing: robomotion-apps-web emits this
 * object verbatim as window.env, and the field names MUST match rewrite.Env
 * in robomotion-apps-web/rewrite/rewrite.go byte for byte:
 *
 *   InstanceID string `json:"instance_id"`
 *   AppID      string `json:"app_id"`
 *   WSURL      string `json:"ws_url"`
 *   APIURL     string `json:"api_url"`
 *   IsPublic   bool   `json:"is_public"`
 */
interface AppRuntimeConfig {
    instance_id: string;
    app_id: string;
    /** WebSocket base including the /ws path, e.g. "wss://amq.robomotion.io/ws". */
    ws_url: string;
    api_url: string;
    is_public: boolean;
}
/** The instance an app URL resolves to (GET /v1/apps.instance.get). */
interface ResolvedInstance {
    id: string;
    appId: string;
    robotId: string;
    workspaceId?: string;
    isPublic?: boolean;
    runId?: string;
    flowId?: string;
    name?: string;
    /** Whether the app's backend is running on that robot right now. */
    isRunning?: boolean;
}
/** Minimal WebSocket surface the client needs; the browser WebSocket satisfies it. */
interface WebSocketLike {
    readyState: number;
    send(data: string): void;
    close(code?: number, reason?: string): void;
    onopen: ((ev?: unknown) => void) | null;
    onmessage: ((ev: {
        data: string;
    }) => void) | null;
    onerror: ((ev?: unknown) => void) | null;
    onclose: ((ev?: unknown) => void) | null;
}
/** Minimal localStorage surface for the durable client_id. */
interface StorageLike {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}
interface CreateAppOptions {
    /**
     * The runtime config from the serving tier (primary form): pass the result
     * of loadRuntimeConfig(). When omitted, appUrl is the fallback and the
     * instance is resolved from its base58 path segment.
     */
    config?: AppRuntimeConfig;
    /** Fallback: the page URL; the instance is resolved from its base58 path segment. Defaults to window.location.href. */
    appUrl?: string;
    /** Contract hash embedded at build time (from actions.gen.ts). */
    contractHash: string;
    /** Optional contract for per-action timeout defaults before hello_ack arrives. */
    contract?: AppContract;
    /** REST API base. Defaults to window.env.API_URL, else https://api.robomotion.io. */
    apiUrl?: string;
    /** WebSocket proxy base. Defaults to window.env.PROXY_URL, else wss://amq.robomotion.io. */
    proxyUrl?: string;
    /** Skip URL resolution entirely (dev harness, tests). */
    instance?: {
        id: string;
        appId: string;
        robotId: string;
        workspaceId?: string;
    };
    /** Identity used for the artifacts REST calls when there is no cookie session. */
    identity?: {
        userId?: string;
        sessionId?: string;
    };
    /** Injectables for tests. */
    webSocketFactory?: (url: string) => WebSocketLike;
    fetchFn?: typeof fetch;
    storage?: StorageLike;
    reconnectDelayMs?: number;
    pingIntervalMs?: number;
    /**
     * How long a call made while the page is still connecting waits for the
     * connection before it is refused. A person who presses a button in the
     * first second after a reload is not pressing it "while the robot is
     * offline"; they are pressing it while the handshake is in flight, and the
     * honest answer is to send the call once it lands. Defaults to 8000; 0
     * refuses at once (the old behaviour).
     */
    callConnectWaitMs?: number;
}
interface FileUploadOptions {
    onProgress?: (percent: number) => void;
    isPublic?: boolean;
}

export type { AppContract as A, CallOptions as C, FileRef as F, HelloAck as H, ResolvedInstance as R, StorageLike as S, WebSocketLike as W, AppRuntimeConfig as a, ActionProgress as b, AppErrorCode as c, CollectionOp as d, ConnectionState as e, ContractAction as f, ContractCollection as g, ContractEvent as h, ContractSchema as i, ContractScreen as j, CreateAppOptions as k, FileUploadOptions as l, WireEnvelope as m, WireIdentity as n };
