import { A as AppContract } from '../types-BAJsXo2R.js';

declare function canonicalizeJson(text: string): string;
/** Compute "sha256:<hex>" over the canonical form of a JSON text. */
declare function contractHashOf(text: string): Promise<string>;

interface GenerateResult {
    contract: AppContract;
    contractHash: string;
    /** app/src/generated/actions.gen.ts contents (SPA side). */
    spaSource: string;
    /** flow/src/generated/actions.gen.ts contents (flow side). */
    flowSource: string;
}
/**
 * `mcpText` is the app's mcp.json, when there is one. Only its
 * `tools.<action>.read_only: true` is read here: the hook for such an action
 * is generated with `{ readOnly: true }`, so it re-asks after another write
 * (a list loaded by hand stays current). An action not marked read-only, a
 * missing or unreadable mcp.json, all generate a hook that never re-runs.
 */
declare function generate(contractText: string, mcpText?: string): Promise<GenerateResult>;
/** Names mcp.json marks `read_only: true`. Anything unreadable is no names. */
declare function readOnlyActions(mcpText: string | undefined): Set<string>;

export { type GenerateResult, canonicalizeJson, contractHashOf, generate, readOnlyActions };
