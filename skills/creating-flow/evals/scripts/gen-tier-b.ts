#!/usr/bin/env bun
/**
 * Generate the 30 stratified Tier B entries for evals.json.
 *
 * Pipeline:
 *   1. Read TODO.md, parse `- [x] <slug> — …` rows.
 *   2. Stratify by template family (per the plan's quotas — keeps rule-coverage
 *      diverse instead of 30 near-identical scrapers).
 *   3. For each picked slug:
 *        a. Confirm `cases/<slug>.md` and `<slug>/main.ts` exist in the
 *           templates checkout.
 *        b. Build a `prompt_file` reference (extract-prompt runs at eval time).
 *        c. Synthesize assertions from the golden's main.ts.
 *   4. Print or merge into evals.json.
 *
 * Usage:
 *   bun run scripts/gen-tier-b.ts --dry-run               # print picked slugs
 *   bun run scripts/gen-tier-b.ts --print                 # print full JSON entries
 *   bun run scripts/gen-tier-b.ts --merge                 # append into evals.json (idempotent)
 *
 * Templates checkout location resolves the same way the runner does:
 * `$ROBOMOTION_TEMPLATES_ROOT` env wins, then evals.json `templates_root`,
 * then `<evals>/.cache/templates`.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname, isAbsolute } from 'node:path';
import { synthesizeAssertions, type Assertion } from '../lib/synthesize-assertions.ts';

interface FamilyQuota {
  name: string;
  count: number;
  slugs: string[];
}

// Per the plan — chosen to maximise rule-coverage diversity, not popularity.
// `slugs` is the curated pick, in priority order. We take the first `count`
// that actually exist on disk (cases/ + golden main.ts both present).
const FAMILIES: FamilyQuota[] = [
  // News / aggregators / blogs — Substack and Ghost serve plain HTML; HN has no
  // anti-bot. Indie Hackers (Cloudflare) was dropped in favour of Substack.
  {
    name: 'news',
    count: 3,
    slugs: [
      'extract-news-items-hacker-news',
      'extract-creators-search-ghost-explore-page',
      'extract-top-posts-substack-publication',
    ],
  },
  { name: 'search', count: 1, slugs: ['extract-related-search-results-duckduckgo'] },
  // Crypto — CMC and Binance Cloudflare-protected but generally accessible.
  {
    name: 'crypto',
    count: 3,
    slugs: [
      'extract-coinmarketcap-coins-list-prices',
      'extract-single-crypto-coin-details-coinmarketcap',
      'extract-coins-list-info-binance',
    ],
  },
  // Companies — YC is fully open; SimilarWeb (anti-bot) replaced with Built In.
  {
    name: 'companies',
    count: 2,
    slugs: ['extract-companies-yc-startup-directory', 'extract-top-companies-built-in'],
  },
  {
    name: 'jobs-list',
    count: 3,
    slugs: [
      'extract-job-postings-y-combinator',
      'extract-jobs-justremote',
      'extract-jobs-we-work-remotely',
    ],
  },
  // Jobs (detail) — RemoteOK (Cloudflare) replaced with WWR detail.
  {
    name: 'jobs-detail',
    count: 2,
    slugs: ['extract-job-details-justremote', 'extract-job-details-we-work-remotely'],
  },
  // Real estate / travel was the worst-affected family — Redfin/Airbnb both
  // PerimeterX. Replaced with Eventbrite (events list + detail), which serves
  // plain HTML and is the closest "user-supplied location → list of items + per-
  // item detail page" structural analogue we have under [x].
  {
    name: 'real-estate-travel',
    count: 2,
    slugs: ['scrape-eventbrite-online-events', 'extract-online-event-details-eventbrite'],
  },
  // E-commerce — eBay (Akamai) and Trendyol (PerimeterX) both swapped for
  // Chrome Web Store (extension list + review) which is the same shape and
  // open. AppSumo stays.
  {
    name: 'ecommerce',
    count: 3,
    slugs: [
      'scrape-products-list-appsumo',
      'scrape-extension-info-chrome-web-store',
      'scrape-extension-review-chrome-web-store',
    ],
  },
  // AI / SaaS — Zapier (Cloudflare) replaced with Futurepedia detail page.
  {
    name: 'ai-saas',
    count: 3,
    slugs: [
      'extract-tools-keyword-future-tools',
      'extract-trending-ai-tools-futurepedia',
      'extract-ai-tool-details-futurepedia',
    ],
  },
  {
    name: 'templates-courses-movies',
    count: 3,
    slugs: [
      'extract-popular-movies-genre-imdb',
      'extract-courses-topic-udemy',
      'extract-templates-framer-category',
    ],
  },
  {
    name: 'web-utility',
    count: 2,
    slugs: ['extract-sitemap-links-sitemap-index', 'extract-headings-paragraphs-from-webpage'],
  },
  {
    name: 'video-social',
    count: 3,
    slugs: [
      'extract-channel-info-youtube',
      'extract-videos-youtube-channel',
      'scrape-youtube-video-info',
    ],
  },
];

const TIER_A_TITLE_FALLBACK = 'integration scrape';

function parseDoneSlugs(todoPath: string): Map<string, string> {
  // Map: slug → "<rest of line after slug>" (used as title hint).
  const out = new Map<string, string>();
  if (!existsSync(todoPath)) return out;
  for (const line of readFileSync(todoPath, 'utf8').split('\n')) {
    const m = line.match(/^- \[x\]\s+([\w-]+)\s*(?:—\s*(.+))?$/);
    if (m) out.set(m[1], (m[2] ?? '').trim());
  }
  return out;
}

function resolveTemplatesRoot(rawFromEvals: string | undefined, evalsDir: string): string | null {
  const envOverride = process.env.ROBOMOTION_TEMPLATES_ROOT;
  if (envOverride && existsSync(envOverride)) return envOverride;
  if (rawFromEvals) {
    if (!/^https?:|^git@/i.test(rawFromEvals)) {
      const abs = isAbsolute(rawFromEvals) ? rawFromEvals : resolve(evalsDir, rawFromEvals);
      if (existsSync(abs)) return abs;
    }
  }
  const cache = resolve(evalsDir, '.cache/templates');
  if (existsSync(cache)) return cache;
  return null;
}

interface BuiltEntry {
  id: number;
  tier: 'integration';
  title: string;
  template_slug: string;
  prompt_file: string;
  assertions: Assertion[];
}

function titleFromSlug(slug: string, hint: string): string {
  if (hint) {
    // Cap the hint to keep titles readable.
    const trimmed = hint.split(',')[0].trim();
    return `${slug} — ${trimmed}`;
  }
  return slug.replace(/-/g, ' ');
}

function buildEntries(
  templatesRoot: string,
  doneSlugs: Map<string, string>,
  startId: number,
): { picked: BuiltEntry[]; missing: string[] } {
  const picked: BuiltEntry[] = [];
  const missing: string[] = [];
  let nextId = startId;

  for (const fam of FAMILIES) {
    let taken = 0;
    for (const slug of fam.slugs) {
      if (taken >= fam.count) break;
      if (!doneSlugs.has(slug)) {
        missing.push(`${slug} (not in TODO.md [x])`);
        continue;
      }
      const slugDir = join(templatesRoot, slug);
      const casePath = join(templatesRoot, 'cases', `${slug}.md`);
      if (!existsSync(slugDir)) {
        missing.push(`${slug} (no <root>/${slug}/ dir)`);
        continue;
      }
      if (!existsSync(join(slugDir, 'main.ts'))) {
        missing.push(`${slug} (no main.ts)`);
        continue;
      }
      if (!existsSync(casePath)) {
        missing.push(`${slug} (no cases/${slug}.md)`);
        continue;
      }
      const assertions = synthesizeAssertions(slugDir);
      picked.push({
        id: nextId++,
        tier: 'integration',
        title: titleFromSlug(slug, doneSlugs.get(slug) ?? TIER_A_TITLE_FALLBACK),
        template_slug: slug,
        prompt_file: `cases/${slug}.md`,
        assertions,
      });
      taken++;
    }
    if (taken < fam.count) {
      missing.push(`family ${fam.name}: only ${taken}/${fam.count} candidates resolved`);
    }
  }
  return { picked, missing };
}

interface EvalsFileShape {
  skill_name: string;
  templates_root: string;
  evals: { id: number; template_slug?: string; [k: string]: any }[];
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const printJson = args.includes('--print');
  const merge = args.includes('--merge');

  const evalsDir = resolve(import.meta.dir, '..');
  const evalsJsonPath = join(evalsDir, 'evals.json');
  const file = JSON.parse(readFileSync(evalsJsonPath, 'utf8')) as EvalsFileShape;

  const templatesRoot = resolveTemplatesRoot(file.templates_root, evalsDir);
  if (!templatesRoot) {
    console.error(
      'templates_root unresolved — set ROBOMOTION_TEMPLATES_ROOT or run the runner once to seed .cache/templates.',
    );
    process.exit(2);
  }

  const todoPath = join(templatesRoot, 'TODO.md');
  const doneSlugs = parseDoneSlugs(todoPath);
  if (doneSlugs.size === 0) {
    console.error(`no [x] rows parsed from ${todoPath}`);
    process.exit(2);
  }

  const existingSlugs = new Set(file.evals.map((e) => e.template_slug).filter(Boolean) as string[]);
  const startId = file.evals.reduce((m, e) => Math.max(m, e.id), 0) + 1;

  const { picked, missing } = buildEntries(templatesRoot, doneSlugs, startId);
  const fresh = picked.filter((e) => !existingSlugs.has(e.template_slug));

  if (dryRun) {
    console.log(`${picked.length} candidate slugs picked, ${fresh.length} new (not in evals.json):`);
    for (const e of picked) {
      const tag = existingSlugs.has(e.template_slug) ? '(already in evals.json)' : '(NEW)';
      console.log(`  #${e.id} ${e.template_slug} ${tag}`);
    }
    if (missing.length > 0) {
      console.log('\nNotes:');
      for (const m of missing) console.log(`  ${m}`);
    }
    return;
  }

  if (printJson) {
    console.log(JSON.stringify(fresh, null, 2));
    return;
  }

  if (merge) {
    if (fresh.length === 0) {
      console.log('nothing to merge — all candidates already present in evals.json');
      return;
    }
    file.evals.push(...fresh);
    writeFileSync(evalsJsonPath, JSON.stringify(file, null, 2) + '\n');
    console.log(`merged ${fresh.length} new entries into ${evalsJsonPath}`);
    if (missing.length > 0) {
      console.log('\nNotes:');
      for (const m of missing) console.log(`  ${m}`);
    }
    return;
  }

  console.log('pass --dry-run to preview, --print for JSON, --merge to write into evals.json');
}

main();
