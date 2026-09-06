import { A as AppContract } from '../types-yhl7P3Mb.js';

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
declare function generate(contractText: string): Promise<GenerateResult>;

export { type GenerateResult, canonicalizeJson, contractHashOf, generate };
