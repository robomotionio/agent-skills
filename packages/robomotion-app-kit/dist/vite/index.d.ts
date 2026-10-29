import { Plugin } from 'vite';

/** Mirror of the runtime's AppRuntimeConfig; snake_case matches rewrite.Env. */
interface AppRuntimeConfig {
    instance_id: string;
    app_id: string;
    ws_url: string;
    api_url: string;
    is_public: boolean;
    /** The builder behind a preview, as start_app_session wrote it. */
    user_id?: string;
    session_id?: string;
}
interface RobomotionAppKitOptions {
    /**
     * Path to app.json, relative to the Vite root. Default "../app.json": the
     * contract lives at the project root, one level above the screens, where
     * the robot reads it. An older checkout with app.json beside package.json
     * is still found.
     */
    contract?: string;
    /** Defaults for /__rm/config.json fields the query string does not set. */
    config?: Partial<AppRuntimeConfig>;
}
/**
 * The bridge posts to the parent frame:
 *   rm-app-ready       {screens: [{name, description, route}], loadId, reportsDrawn: true}
 *   rm-app-drawn       {loadId}   the mount point holds the app, not the placeholder
 *   rm-route-change    {path}
 *   rm-app-error       {message, stack, source}
 *   rm-action-invoked  {action, callId}                          (relayed from the runtime's DOM event)
 *   rm-action-settled  {action, callId, ok, code?, message?, ms} (relayed from rm:action-settled)
 *   rm-action-progress {action, callId, percent?, message?}      (relayed from rm:action-progress)
 *
 * The relayed events are marked `relayed` on their detail so the runtime's
 * links.ts, which also listens, does not post a second copy to the host.
 *
 * Region picking ("change this heading") and action links (which widget
 * runs which action) are deliberately NOT here. They are properties of the
 * app rather than of the dev server, so they live in @robomotion/apps-runtime
 * and ship in the build - see its inspect.ts and links.ts. A published app
 * has no Vite, and those features have to work there too.
 *
 * NB: the body below is a template literal, so an unrecognised escape collapses
 * on the way out (`\\s` becomes `s`). Every backslash that must reach the
 * emitted script - regex character classes above all - is doubled here.
 */
/**
 * The key a host must show to use this preview from another site (a Copilot
 * card): an HMAC of the preview's path under the builder computer's key,
 * which the agent hands to pi and pi to this dev server
 * (ROBOMOTION_PREVIEW_DRIVE_KEY). The agent works out the same key for the
 * person's card (robomotion-agent chat/preview_drive.go). The page is given
 * only its hash; "" when there is no machine key.
 */
declare function previewKeyHash(machineKey: string | undefined, base: string): string;
/**
 * The dev preview loop plus the resolution the kit needs wherever it lives.
 * Returns both plugins; Vite flattens an array in `plugins`.
 */
declare function robomotionAppKit(options?: RobomotionAppKitOptions): Plugin[];

export { type AppRuntimeConfig, type RobomotionAppKitOptions, robomotionAppKit as default, previewKeyHash, robomotionAppKit };
