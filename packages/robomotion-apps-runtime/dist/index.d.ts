export { A as AppClient, a as AppError, b as ArtifactAddress, c as AssistantTurnHandle, d as AssistantTurnHandlers, C as Collection, e as ConnectionInfo, F as FilesApi, I as InstallLinksOptions, L as LinkHandler, f as LinkKind, g as LinkMode, h as LinkNamespace, i as LinkSite, j as LinkState, k as LinksHandle, l as bindAction, m as bindCollection, n as createApp, o as currentCause, p as decodeArtifactId, q as encodeArtifactId, r as installLinks, s as isAppError, t as linkKey, u as lookupTag, v as markGesture, w as splitLinkKey, x as tagAction, y as tagCollection } from './links-BwOuoLyA.js';
import { a as AppRuntimeConfig, R as ResolvedInstance } from './types-C2XfxZIO.js';
export { b as ActionProgress, A as AppContract, c as AppErrorCode, C as CallOptions, d as CollectionOp, e as ConnectionState, f as ContractAction, g as ContractCollection, h as ContractEvent, i as ContractSchema, j as ContractScreen, k as CreateAppOptions, F as FileRef, l as FileUploadOptions, H as HelloAck, S as StorageLike, W as WebSocketLike, m as WireEnvelope, n as WireIdentity } from './types-C2XfxZIO.js';

/**
 * Load the runtime config (sdk.md "Runtime config").
 *
 * Production: robomotion-apps-web injects the config verbatim as window.env
 * (see rewrite.Env in robomotion-apps-web/rewrite/rewrite.go); we read it
 * straight off the page with zero round trips.
 *
 * Dev: the @robomotion/app-kit/vite plugin serves the identical shape at
 * /__rm/config.json, built from the preview iframe's query parameters. The
 * page's own query string is forwarded so the plugin can see them.
 *
 * Generated apps call this and never hand-roll config loading: a second
 * implementation would be a second thing to keep in sync with the Go struct.
 */
declare function loadRuntimeConfig(options?: {
    fetchFn?: typeof fetch;
}): Promise<AppRuntimeConfig>;

declare function isBase58(str: string): boolean;
declare function uuidToBase58(uuidStr: string): string;
declare function base58ToUuid(base58: string): string;

/**
 * Pull the instance UUID out of an app URL.
 *
 * The canonical app URL carries the instance id as a base58 path segment
 * (a 16 byte UUID encodes to 21 or 22 base58 characters). We also accept a
 * raw UUID segment and an explicit ?instance= query override, which the dev
 * preview uses.
 */
declare function instanceIdFromUrl(appUrl: string): string | null;
/**
 * Resolve the instance record over REST (GET /v1/apps.instance.get), giving
 * us the robot to talk to and the app id the durable client_id is keyed by.
 */
declare function resolveInstance(apiUrl: string, instanceUuid: string, fetchFn: typeof fetch): Promise<ResolvedInstance>;

/** What the user pointed at. */
interface InspectedElement {
    tag: string;
    text: string;
    id?: string;
    className?: string;
    role?: string;
    /** The screen they were on, as the app's own router sees it. */
    route?: string;
    /**
     * Where the element came from in the source.
     *
     * Read from React's `_debugSource`, which only development builds record.
     * A published app simply has no source map back to JSX, so this is absent
     * there and the pick travels on its tag, text and route - which is what
     * resolves it in practice anyway.
     */
    source?: {
        file: string;
        path: string;
        line: number;
    } | null;
}
interface InspectorHandle {
    /** Remove every listener and any overlay. Safe to call twice. */
    stop(): void;
}
/**
 * Install the region picker.
 *
 * A no-op outside a browser and outside a frame - an app opened directly has
 * no host to send a comment to. Idempotent: the second call returns the first
 * installation rather than stacking listeners.
 */
declare function installInspector(): InspectorHandle;

declare function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string;
declare function base64ToArrayBuffer(base64: string): ArrayBuffer;
/** UTF-8 safe base64 of a string (equivalent to js-base64's Base64.encode). */
declare function utf8ToBase64(text: string): string;
/** UTF-8 safe decode of a base64 string (equivalent to js-base64's Base64.decode). */
declare function base64ToUtf8(b64: string): string;
/** Encrypt a plaintext string; returns "base64(iv):base64(ciphertext)". */
declare function aesGcmEncrypt(key: CryptoKey, plaintext: string): Promise<string>;
/** Decrypt "base64(iv):base64(ciphertext)" back to the plaintext string. */
declare function aesGcmDecrypt(key: CryptoKey, encrypted: string): Promise<string>;
/**
 * Seal a JSON body for the `payload` field. The chat convention, exactly:
 * plaintext is base64(JSON.stringify(body)), then AES-256-GCM, serialized as
 * "base64(iv):base64(ciphertext)".
 */
declare function sealBody(key: CryptoKey, body: unknown): Promise<string>;
/** Open a `payload` field sealed by `sealBody` (or by the robot). */
declare function openBody(key: CryptoKey, payload: string): Promise<unknown>;

export { AppRuntimeConfig, type InspectedElement, type InspectorHandle, ResolvedInstance, aesGcmDecrypt, aesGcmEncrypt, arrayBufferToBase64, base58ToUuid, base64ToArrayBuffer, base64ToUtf8, installInspector, instanceIdFromUrl, isBase58, loadRuntimeConfig, openBody, resolveInstance, sealBody, utf8ToBase64, uuidToBase58 };
