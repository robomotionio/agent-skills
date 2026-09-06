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
    /** Path to app.json, relative to the Vite root. Default "app.json", falling back to "../app.json". */
    contract?: string;
    /** Defaults for /__rm/config.json fields the query string does not set. */
    config?: Partial<AppRuntimeConfig>;
}
/**
 * The dev preview loop plus the resolution the kit needs wherever it lives.
 * Returns both plugins; Vite flattens an array in `plugins`.
 */
declare function robomotionAppKit(options?: RobomotionAppKitOptions): Plugin[];

export { type AppRuntimeConfig, type RobomotionAppKitOptions, robomotionAppKit as default, robomotionAppKit };
