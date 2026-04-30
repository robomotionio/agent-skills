#!/usr/bin/env bun
/**
 * Phase 3 — live-data verification.
 *
 * Phase 2 already produced `main.ts` per eval under `.cache/runs/<ts>/<slug>/`.
 * This script picks up where Phase 2 left off:
 *
 *   1. Loads `.env` (gitignored — never committed) for robot credentials.
 *   2. Walks the latest run dir (or one passed via --run).
 *   3. For each <slug>/main.ts, spawns `robomotion run main.ts --robot <ROBOT_ID>`
 *      from that directory (the working dir matters — robomotion picks up the
 *      flow file relative to cwd).
 *   4. Captures exit code + duration. Looks for a CSV that the flow wrote into
 *      $HOME and records its row/column shape if present.
 *   5. Writes `verify-results.jsonl` next to Phase 2's `results.jsonl`.
 *
 * Why this is cheap: no agent generation, no LLM tokens — just the robot
 * running the already-built flow. Most flows finish in 3-30s of browser time.
 *
 * Usage:
 *   # run all artifacts in the latest run dir
 *   bun run scripts/verify-data.ts
 *
 *   # target a specific run
 *   bun run scripts/verify-data.ts --run .cache/runs/2026-04-30T14-04-51-270Z
 *
 *   # one-off
 *   bun run scripts/verify-data.ts --slug extract-news-items-hacker-news
 *
 *   # parallelism — robot serializes jobs anyway, but multiple --robot ids could fan out
 *   bun run scripts/verify-data.ts --parallel 1
 */

import { spawn } from 'node:child_process';
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

interface CliArgs {
  run?: string;
  slug?: string;
  parallel: number;
  timeoutMs: number;
}

interface VerifyOutcome {
  slug: string;
  run_exit_code: number | null;
  duration_ms: number;
  timed_out: boolean;
  csv_path?: string;
  csv_columns?: string[];
  csv_row_count?: number;
  notes: string[];
  status: 'pass' | 'fail' | 'partial';
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const out: CliArgs = { parallel: 1, timeoutMs: 5 * 60_000 };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--run') out.run = args[++i];
    else if (a === '--slug') out.slug = args[++i];
    else if (a === '--parallel') out.parallel = parseInt(args[++i], 10);
    else if (a === '--timeout') out.timeoutMs = parseInt(args[++i], 10) * 1000;
  }
  return out;
}

function loadEnv(repoRoot: string): void {
  // Tiny .env loader — Bun's --env-file isn't available everywhere, and we
  // want this script to feel self-contained.
  const envPath = join(repoRoot, '.env');
  if (!existsSync(envPath)) {
    console.error(
      `${RED}!${RESET} ${envPath} not found — copy .env.example and fill in credentials`,
    );
    process.exit(2);
  }
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq <= 0) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
  for (const key of ['ROBOMOTION_API_KEY', 'ROBOMOTION_ROBOT_ID']) {
    if (!process.env[key]) {
      console.error(`${RED}!${RESET} ${key} missing from .env`);
      process.exit(2);
    }
  }
}

function findLatestRunDir(evalsDir: string): string | null {
  const runsRoot = join(evalsDir, '.cache', 'runs');
  if (!existsSync(runsRoot)) return null;
  const stamps = readdirSync(runsRoot)
    .filter((d) => statSync(join(runsRoot, d)).isDirectory())
    .sort()
    .reverse();
  return stamps.length > 0 ? join(runsRoot, stamps[0]) : null;
}

function listSlugs(runDir: string, only?: string): string[] {
  return readdirSync(runDir)
    .filter((d) => {
      const p = join(runDir, d);
      if (!statSync(p).isDirectory()) return false;
      if (!existsSync(join(p, 'main.ts'))) return false;
      if (only && d !== only) return false;
      return true;
    })
    .sort();
}

/**
 * Pull the CSV destination out of the agent's main.ts so we know where to
 * look after the run. Most flows follow the canonical pattern:
 *
 *     msg.csv_path = global.get('$Home$') + '/<name>.csv';
 *
 * We accept any `'<...>.csv'` literal in the file as a candidate — the most
 * recently modified one in $HOME within the run window is the actual output.
 */
function extractCsvCandidates(mainTs: string): string[] {
  const out: string[] = [];
  const re = /['"]([^'"]*\.csv)['"]/g;
  let m: RegExpExecArray | null;
  const seen = new Set<string>();
  while ((m = re.exec(mainTs)) !== null) {
    const v = m[1];
    if (seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

function resolveCsvPaths(candidate: string): string[] {
  // The agent's flow concatenates `global.get('$Home$') + '/<name>.csv'`,
  // so the literal we extract from main.ts is just `/<name>.csv`. We can't
  // tell from static analysis alone whether that's an absolute path or an
  // about-to-be-prepended-with-$Home basename — so probe both.
  const out: string[] = [];
  if (candidate.includes('$Home$')) {
    out.push(candidate.replace('$Home$', homedir()));
    return out;
  }
  if (candidate.startsWith('/')) {
    out.push(candidate);
    out.push(join(homedir(), candidate.replace(/^\/+/, '')));
    return out;
  }
  out.push(join(homedir(), candidate.replace(/^\.?\//, '')));
  return out;
}

function readCsvShape(path: string): { columns: string[]; rowCount: number } | null {
  if (!existsSync(path)) return null;
  const body = readFileSync(path, 'utf8');
  const lines = body.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length === 0) return null;
  // Naive split — good enough for header inspection. A spec column called
  // "Job Title, Company" with embedded commas would need a real CSV parser.
  const columns = lines[0].split(',').map((s) => s.trim().replace(/^"|"$/g, ''));
  return { columns, rowCount: Math.max(0, lines.length - 1) };
}

async function runOne(
  slug: string,
  slugDir: string,
  args: CliArgs,
): Promise<VerifyOutcome> {
  const mainTs = readFileSync(join(slugDir, 'main.ts'), 'utf8');
  const csvCandidates = extractCsvCandidates(mainTs);
  const start = Date.now();
  let stdout = '';
  let stderr = '';
  let exitCode: number | null = null;
  let timedOut = false;

  await new Promise<void>((resolveAll) => {
    const child = spawn(
      'robomotion',
      ['run', 'main.ts', '--robot', process.env.ROBOMOTION_ROBOT_ID!],
      { cwd: slugDir, env: process.env },
    );
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
      setTimeout(() => child.kill('SIGKILL'), 5_000).unref();
    }, args.timeoutMs);
    child.stdout.on('data', (b) => (stdout += b.toString()));
    child.stderr.on('data', (b) => (stderr += b.toString()));
    child.on('close', (code) => {
      clearTimeout(timer);
      exitCode = code;
      resolveAll();
    });
  });

  const durationMs = Date.now() - start;
  const notes: string[] = [];
  if (timedOut) notes.push('run timed out');
  if (exitCode !== 0) notes.push(`robomotion run exited ${exitCode}`);

  // Look for the CSV the flow produced. Probe every candidate path in
  // freshness order; pick the one modified most recently.
  let csvPath: string | undefined;
  let csvShape: { columns: string[]; rowCount: number } | null = null;
  let bestMtime = 0;
  for (const cand of csvCandidates) {
    for (const p of resolveCsvPaths(cand)) {
      if (!existsSync(p)) continue;
      const m = statSync(p).mtimeMs;
      if (m < start - 60_000) continue; // ignore stale files older than the run window
      if (m > bestMtime) {
        const shape = readCsvShape(p);
        if (shape) {
          csvPath = p;
          csvShape = shape;
          bestMtime = m;
        }
      }
    }
  }

  let status: 'pass' | 'fail' | 'partial' = 'pass';
  if (exitCode !== 0 || timedOut) status = 'fail';
  else if (!csvShape) {
    status = 'partial';
    notes.push('flow ran but no CSV detected in $HOME');
  } else if (csvShape.rowCount === 0) {
    status = 'partial';
    notes.push('CSV produced but empty (0 rows) — likely WAF / selector / no-data');
  }

  // Surface stderr tail when the run failed — usually the most useful debug.
  if (status !== 'pass' && stderr) {
    const tail = stderr.trim().split('\n').slice(-5).join(' | ');
    if (tail) notes.push(`stderr: ${tail.slice(0, 200)}`);
  }
  // unused but capturing for completeness
  void stdout;

  return {
    slug,
    run_exit_code: exitCode,
    duration_ms: durationMs,
    timed_out: timedOut,
    csv_path: csvPath,
    csv_columns: csvShape?.columns,
    csv_row_count: csvShape?.rowCount,
    notes,
    status,
  };
}

async function main() {
  const evalsDir = resolve(import.meta.dir, '..');
  const repoRoot = resolve(evalsDir, '..', '..', '..');
  loadEnv(repoRoot);

  const args = parseArgs();
  const runDir = args.run
    ? resolve(args.run)
    : findLatestRunDir(evalsDir);
  if (!runDir || !existsSync(runDir)) {
    console.error(`${RED}!${RESET} no run dir found — generate one with \`evals:agent\` first`);
    process.exit(2);
  }
  console.log(`${DIM}verifying ${runDir}${RESET}`);

  const slugs = listSlugs(runDir, args.slug);
  if (slugs.length === 0) {
    console.error(`${YELLOW}!${RESET} no <slug>/main.ts found under ${runDir}`);
    process.exit(2);
  }

  const outcomes: VerifyOutcome[] = [];
  const queue = slugs.map((s) => ({ slug: s, dir: join(runDir, s) }));
  let inFlight = 0;

  await new Promise<void>((doneAll) => {
    const dispatch = () => {
      if (queue.length === 0 && inFlight === 0) return doneAll();
      while (inFlight < Math.max(1, args.parallel) && queue.length > 0) {
        const { slug, dir } = queue.shift()!;
        inFlight++;
        runOne(slug, dir, args)
          .then((o) => {
            outcomes.push(o);
            const mark =
              o.status === 'pass'
                ? `${GREEN}✓`
                : o.status === 'partial'
                  ? `${YELLOW}~`
                  : `${RED}✗`;
            const shapeStr = o.csv_columns
              ? `${o.csv_columns.length} cols × ${o.csv_row_count} rows`
              : 'no csv';
            console.log(
              `${mark}${RESET} ${BOLD}${slug}${RESET} ${DIM}— ${o.duration_ms}ms, ${shapeStr}${RESET}`,
            );
            for (const n of o.notes) console.log(`    ${DIM}${n}${RESET}`);
          })
          .catch((err) => {
            console.error(`${RED}${slug} crashed:${RESET} ${err.message}`);
          })
          .finally(() => {
            inFlight--;
            dispatch();
          });
      }
    };
    dispatch();
  });

  outcomes.sort((a, b) => a.slug.localeCompare(b.slug));
  const resultsPath = join(runDir, 'verify-results.jsonl');
  writeFileSync(resultsPath, outcomes.map((o) => JSON.stringify(o)).join('\n') + '\n');

  const passed = outcomes.filter((o) => o.status === 'pass').length;
  const partial = outcomes.filter((o) => o.status === 'partial').length;
  const failed = outcomes.filter((o) => o.status === 'fail').length;
  console.log('');
  console.log(
    `${BOLD}${passed} passed, ${partial} partial, ${failed} failed${RESET} — ${resultsPath}`,
  );
  process.exit(failed > 0 ? 1 : 0);
}

main();
