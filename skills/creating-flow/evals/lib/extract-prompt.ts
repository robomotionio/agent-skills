/**
 * Condense a `cases/<slug>.md` marketing page down to the ~15 lines that a real
 * Robomotion user would actually type when asking for a flow.
 *
 * The case markdown is ~250 lines, but only three pieces carry signal:
 *   1. The H1 (after frontmatter)
 *   2. One target URL or query template
 *   3. The "What data does this … extract?" table — first column is field names
 *
 * Everything else is upsell prose, FAQ, footer, and related-robot links — none
 * of which a Phase 2 agent should be expected to parse.
 *
 * The extractor degrades gracefully: missing pieces are dropped from the prompt
 * rather than failing — the `canonicalHint` plus the H1 alone is usually enough
 * for the agent to produce a structurally correct flow.
 */

import { readFileSync, existsSync } from 'node:fs';

export interface ExtractedPrompt {
  title: string;
  url?: string;
  columns: string[];
  prompt: string;
}

const FRONTMATTER_RE = /^---\n[\s\S]*?\n---\n/;

export function stripFrontmatter(md: string): string {
  return md.replace(FRONTMATTER_RE, '');
}

export function extractH1(md: string): string | null {
  const lines = stripFrontmatter(md).split('\n');
  for (const line of lines) {
    const m = line.match(/^#\s+(.+?)\s*$/);
    if (m) return m[1].trim();
  }
  return null;
}

/**
 * Best-effort URL extraction. Looks for the first `https?://` token in the
 * stripped body, ignoring obvious noise (image CDNs, dashboards, related-robot
 * links).
 */
export function extractUrl(md: string): string | null {
  const body = stripFrontmatter(md);
  const reHttp = /https?:\/\/[^\s)\]>"']+/g;
  const blocked = [
    'cdn.prod.website-files.com',
    'browse.ai',
    'browseai.com',
    'rss.app',
    'webflow.com',
    'website-files.com',
  ];
  let m: RegExpExecArray | null;
  while ((m = reHttp.exec(body)) !== null) {
    const u = m[0].replace(/[.,;:!?]+$/, '');
    if (!blocked.some((b) => u.includes(b))) return u;
  }
  // Fallback — schemeless domain mentions in parentheses, e.g. "(news.ycombinator.com)".
  const reBare = /\(([a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s)]*)?)\)/g;
  while ((m = reBare.exec(body)) !== null) {
    const host = m[1];
    if (!host.includes('.') || host.endsWith('.png') || host.endsWith('.jpg')) continue;
    if (blocked.some((b) => host.includes(b))) continue;
    return `https://${host}`;
  }
  return null;
}

/**
 * Parse the column table under `## What data does …`. The expected shape is:
 *
 *     | Field   | What it contains       |
 *     | ---     | ---                    |
 *     | **Name**| Plain English          |
 *
 * The first non-separator data row's first cell is the column name; we strip
 * markdown emphasis. Returns the columns in document order.
 */
export function extractColumns(md: string): string[] {
  const body = stripFrontmatter(md);
  const headingIdx = body.search(/^##\s+What data does[\s\S]*?$/m);
  if (headingIdx === -1) return [];
  const tail = body.slice(headingIdx);
  const lines = tail.split('\n');
  const cols: string[] = [];
  let inTable = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line.startsWith('|')) {
      if (inTable) break; // table ended
      continue;
    }
    inTable = true;
    const cells = line.split('|').slice(1, -1).map((s) => s.trim());
    if (cells.length === 0) continue;
    // Skip header and separator rows.
    if (/^-+$/.test(cells[0]) || /^:?-+:?$/.test(cells[0])) continue;
    if (cells[0].toLowerCase() === 'field') continue;
    const cleaned = cells[0]
      .replace(/^\*\*(.*)\*\*$/, '$1')
      .replace(/^_(.*)_$/, '$1')
      .replace(/^`(.*)`$/, '$1')
      .trim();
    if (cleaned) cols.push(cleaned);
  }
  return cols;
}

const CANONICAL_HINT =
  "Use the canonical browser-scrape pattern (Browser.Open → OpenLink → WaitElement → " +
  "RunScript → Function → CSV.WriteCSV → Browser.Close → Stop). RunScript should " +
  "return JSON.stringify({columns, rows}).";

/**
 * Compose the condensed user-style prompt from the parsed pieces. Missing
 * sections are simply omitted; we never emit "(unknown)" placeholders that
 * would derail the agent.
 */
export function composePrompt(parts: { title: string; url?: string; columns: string[] }): string {
  const lines: string[] = [];
  lines.push('Build a Robomotion flow that does the following:');
  lines.push('');
  lines.push(parts.title);
  if (parts.url) {
    lines.push('');
    lines.push(`Target: ${parts.url}`);
  }
  if (parts.columns.length > 0) {
    lines.push('');
    lines.push('Output a CSV with these columns:');
    for (const c of parts.columns) lines.push(`- ${c}`);
  }
  lines.push('');
  lines.push(CANONICAL_HINT);
  return lines.join('\n');
}

export function extractPromptFromFile(path: string): ExtractedPrompt {
  if (!existsSync(path)) throw new Error(`case markdown not found: ${path}`);
  const md = readFileSync(path, 'utf8');
  const title = extractH1(md) ?? 'Untitled scrape';
  const url = extractUrl(md) ?? undefined;
  const columns = extractColumns(md);
  const prompt = composePrompt({ title, url, columns });
  return { title, url, columns, prompt };
}

// CLI: `bun run lib/extract-prompt.ts cases/<slug>.md` prints the condensed prompt.
if (import.meta.main) {
  const arg = process.argv[2];
  if (!arg) {
    console.error('usage: bun run extract-prompt.ts <path/to/case.md>');
    process.exit(2);
  }
  const out = extractPromptFromFile(arg);
  console.log(out.prompt);
}
