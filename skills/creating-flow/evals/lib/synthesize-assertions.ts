/**
 * Auto-derive a Phase 2 assertion list from a golden template's `main.ts`.
 *
 * The golden is the truth — its node types and CSV columns define what a
 * passing agent output looks like. Assertions emitted here are plain JSON, so
 * the gen step's output can be hand-edited in evals.json without touching code.
 *
 * Per the plan, every entry gets:
 *   - validator-passes
 *   - must-import for helpers used in the golden's import line
 *   - must-contain for every distinct node type in the golden, in order
 *   - must-contain for every CSV column emitted by RunScript
 *   - regression-class negatives (Catch hallucination, GoTo casing, ScrapeList)
 *   - rubric describing the golden's shape (manual triage hint, never auto-fails)
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

export type Assertion =
  | { kind: 'validator-passes'; reason?: string }
  | { kind: 'must-contain'; value: string; reason?: string }
  | { kind: 'must-not-contain'; value: string; reason?: string }
  | { kind: 'must-contain-regex'; value: string; reason?: string }
  | { kind: 'must-not-contain-regex'; value: string; reason?: string }
  | { kind: 'must-import'; value: string[]; reason?: string }
  | { kind: 'rubric'; value: string; reason?: string };

const SDK_HELPERS = new Set([
  'flow',
  'subflow',
  'library',
  'Message',
  'Custom',
  'JS',
  'Global',
  'Flow',
  'Credential',
  'AI',
]);

const REGRESSION_NEGATIVES: Assertion[] = [
  {
    kind: 'must-not-contain',
    value: 'Core.Flow.Catch',
    reason:
      "Catch is a trigger (Core.Trigger.Catch). Core.Flow.Catch is the most common SKILL.md regression — it's a hallucination the SDK validator hard-rejects.",
  },
  {
    kind: 'must-not-contain',
    value: 'Core.Flow.Goto',
    reason: 'Real node ID is Core.Flow.GoTo (capital T). Lowercase variant is rejected.',
  },
  {
    kind: 'must-not-contain-regex',
    value: 'ScrapeList|ScrapeTable',
    reason:
      'Core.Browser.ScrapeList / ScrapeTable are forbidden — RunScript returning {columns, rows} JSON is the canonical pattern.',
  },
];

/**
 * Read the golden's import line and return the helpers actually referenced
 * elsewhere in the file. Bun won't flag dead imports, so we cross-check usage
 * to avoid asserting on unused names that the agent could legitimately drop.
 */
export function extractRequiredImports(body: string): string[] {
  const m = body.match(/import\s*\{([^}]*)\}\s*from\s*['"]@robomotion\/sdk['"]/);
  if (!m) return ['flow'];
  const declared = m[1]
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => SDK_HELPERS.has(s));
  // 'flow' / 'subflow' / 'library' are always required — the file is bound
  // around them. For the rest, only assert if the helper is actually called.
  const required: string[] = [];
  for (const sym of declared) {
    if (sym === 'flow' || sym === 'subflow' || sym === 'library') {
      required.push(sym);
      continue;
    }
    const re = new RegExp(`\\b${sym}\\(`);
    if (re.test(body)) required.push(sym);
  }
  // Always require flow at minimum.
  if (!required.includes('flow') && /\bflow\.create\(/.test(body)) required.unshift('flow');
  return required;
}

/**
 * Walk the file in source order and collect distinct node-type strings from
 * `f.node('id', 'TYPE', …)` and `.then('id', 'TYPE', …)` calls.
 */
/** Decorative or fixture-specific node types we don't require the agent to emit. */
const NON_REQUIRED_TYPES = new Set([
  'Core.Flow.Comment', // optText only, no runtime effect
]);

export function extractNodeTypes(body: string): string[] {
  const re = /(?:f\.node|\.then)\s*\(\s*['"][0-9a-fA-F]{6}['"]\s*,\s*['"]([^'"]+)['"]/g;
  const seen = new Set<string>();
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    const type = m[1];
    if (!type.startsWith('Core.') && !type.includes('.')) continue;
    if (NON_REQUIRED_TYPES.has(type)) continue;
    if (seen.has(type)) continue;
    seen.add(type);
    out.push(type);
  }
  return out;
}

/**
 * Pull the column-name literals out of `var columns = [...]` inside any
 * RunScript / Function `func` body. Returns deduped names in source order.
 *
 * Why string-parse: the func is itself a literal template string, so we treat
 * it as text rather than trying to eval. Single or double quoted, optional
 * whitespace.
 */
export function extractCsvColumns(body: string): string[] {
  // Match either `var columns = [...]` or `columns: [...]` literals — both
  // shapes appear in the templates corpus (some flows assign `var columns =`,
  // others build `{ columns: [...], rows }` inline).
  const seen = new Set<string>();
  const out: string[] = [];
  const patterns = [
    /var\s+columns\s*=\s*\[([^\]]+)\]/g,
    /\bcolumns\s*:\s*\[([^\]]+)\]/g,
  ];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(body)) !== null) {
      const inner = m[1];
      const reCol = /['"]([^'"]+)['"]/g;
      let c: RegExpExecArray | null;
      while ((c = reCol.exec(inner)) !== null) {
        const col = c[1];
        if (seen.has(col)) continue;
        seen.add(col);
        out.push(col);
      }
    }
  }
  return out;
}

/**
 * Combine main.ts and any subflows into a single string the regexes can scan.
 */
export function readGoldenBody(slugDir: string): string {
  const mainPath = join(slugDir, 'main.ts');
  if (!existsSync(mainPath)) throw new Error(`golden main.ts not found: ${mainPath}`);
  let body = readFileSync(mainPath, 'utf8');
  const sfDir = join(slugDir, 'subflows');
  if (existsSync(sfDir) && statSync(sfDir).isDirectory()) {
    for (const f of readdirSync(sfDir)) {
      if (!f.endsWith('.ts')) continue;
      body += '\n' + readFileSync(join(sfDir, f), 'utf8');
    }
  }
  return body;
}

export function synthesizeAssertions(slugDir: string): Assertion[] {
  const body = readGoldenBody(slugDir);
  const imports = extractRequiredImports(body);
  const types = extractNodeTypes(body);
  const columns = extractCsvColumns(body);

  const assertions: Assertion[] = [];
  assertions.push({ kind: 'validator-passes' });
  if (imports.length > 0) {
    assertions.push({
      kind: 'must-import',
      value: imports,
      reason: 'Every helper referenced in the body must appear on the line-1 import line.',
    });
  }
  for (const t of types) {
    assertions.push({ kind: 'must-contain', value: t });
  }
  for (const c of columns) {
    assertions.push({
      kind: 'must-contain',
      value: c,
      reason: 'CSV column from the golden — keeps agent output structurally compatible.',
    });
  }
  assertions.push(...REGRESSION_NEGATIVES);
  const usesBrowser = types.some((t) => t.startsWith('Core.Browser.'));
  const rubricBits = [`Linear chain ${types.join(' → ')}`];
  if (columns.length > 0) rubricBits.push(`${columns.length} CSV column(s)`);
  if (usesBrowser) {
    rubricBits.push(
      'Browser.Close runs even on empty results; outBrowserId from Open is reused on every browser node',
    );
  }
  assertions.push({ kind: 'rubric', value: rubricBits.join('; ') + '.' });
  return assertions;
}

// CLI: `bun run lib/synthesize-assertions.ts <slugDir>` prints assertions JSON.
if (import.meta.main) {
  const arg = process.argv[2];
  if (!arg) {
    console.error('usage: bun run synthesize-assertions.ts <path/to/template/slug>');
    process.exit(2);
  }
  const out = synthesizeAssertions(arg);
  console.log(JSON.stringify(out, null, 2));
}
