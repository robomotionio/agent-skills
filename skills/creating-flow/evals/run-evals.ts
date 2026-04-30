#!/usr/bin/env bun
/**
 * Eval runner for the creating-flow skill.
 *
 * Usage:
 *   bun run run-evals.ts                  # run everything
 *   bun run run-evals.ts --tier regression
 *   bun run run-evals.ts --tier integration
 *   bun run run-evals.ts --id 1,3,5
 *
 * Phase 1: validates pre-generated fixtures against the eval spec. Phase 2
 * (Claude-driven generation) will be wired later — the schema already carries
 * `prompt` / `prompt_file` for that.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';

type Assertion =
  | { kind: 'validator-passes'; reason?: string }
  | { kind: 'must-contain'; value: string; reason?: string }
  | { kind: 'must-not-contain'; value: string; reason?: string }
  | { kind: 'must-contain-regex'; value: string; reason?: string }
  | { kind: 'must-not-contain-regex'; value: string; reason?: string }
  | { kind: 'must-import'; value: string[]; reason?: string }
  | { kind: 'rubric'; value: string; reason?: string };

interface Eval {
  id: number;
  tier: 'regression' | 'integration';
  title: string;
  prompt?: string;
  prompt_file?: string;
  fixture?: string;
  template_slug?: string;
  source_template?: string;
  assertions: Assertion[];
}

interface EvalsFile {
  skill_name: string;
  templates_root: string;
  evals: Eval[];
}

interface CheckResult {
  status: 'pass' | 'fail' | 'manual' | 'skip';
  detail?: string;
}

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

function resolveTemplatesRoot(raw: string | undefined, evalsDir: string): string | null {
  // 1. Env override wins — convenient for local development against an existing checkout.
  const envOverride = process.env.ROBOMOTION_TEMPLATES_ROOT;
  if (envOverride) {
    if (existsSync(envOverride)) return envOverride;
    console.log(
      `${YELLOW}!${RESET} ROBOMOTION_TEMPLATES_ROOT=${envOverride} does not exist — falling back to evals.json`,
    );
  }

  if (!raw) return null;

  // 2. Plain path (absolute or relative to evals.json).
  if (!/^https?:|^git@/i.test(raw)) {
    const abs = isAbsolute(raw) ? raw : resolve(evalsDir, raw);
    if (existsSync(abs)) return abs;
    console.log(`${YELLOW}!${RESET} templates_root not found: ${abs} — Tier B will be skipped`);
    return null;
  }

  // 3. Git URL — shallow-clone into a gitignored cache, refresh on subsequent runs.
  const cacheDir = resolve(evalsDir, '.cache/templates');
  mkdirSync(dirname(cacheDir), { recursive: true });
  if (!existsSync(cacheDir)) {
    console.log(`${DIM}cloning ${raw} → .cache/templates …${RESET}`);
    const r = spawnSync('git', ['clone', '--depth', '1', raw, cacheDir], { stdio: 'inherit' });
    if (r.status !== 0) {
      console.log(`${YELLOW}!${RESET} git clone failed — Tier B will be skipped`);
      return null;
    }
  } else {
    const r = spawnSync('git', ['-C', cacheDir, 'pull', '--ff-only', '--quiet'], {
      stdio: ['ignore', 'ignore', 'pipe'],
    });
    if (r.status !== 0) {
      console.log(
        `${YELLOW}!${RESET} could not refresh ${cacheDir} (offline?) — using cached snapshot`,
      );
    }
  }
  return existsSync(cacheDir) ? cacheDir : null;
}

function parseArgs() {
  const args = process.argv.slice(2);
  let tier: 'regression' | 'integration' | undefined;
  let ids: number[] | undefined;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--tier') tier = args[++i] as 'regression' | 'integration';
    else if (args[i] === '--id') ids = args[++i].split(',').map((n) => parseInt(n, 10));
  }
  return { tier, ids };
}

function resolveFixturePath(
  ev: Eval,
  evalsDir: string,
  templatesRoot: string | null,
): { path: string; missingTemplates: boolean } | null {
  if (ev.tier === 'regression') {
    if (!ev.fixture) return null;
    return { path: resolve(evalsDir, ev.fixture), missingTemplates: false };
  }
  if (ev.tier === 'integration') {
    if (!templatesRoot) return { path: '', missingTemplates: true };
    if (!ev.template_slug) return null;
    return { path: resolve(templatesRoot, ev.template_slug), missingTemplates: false };
  }
  return null;
}

function readFixtureText(fixturePath: string): string {
  const stat = statSync(fixturePath);
  if (stat.isDirectory()) {
    const main = resolve(fixturePath, 'main.ts');
    return readFileSync(main, 'utf8');
  }
  return readFileSync(fixturePath, 'utf8');
}

function runValidator(fixturePath: string): CheckResult {
  const result = spawnSync('robomotion', ['validate', fixturePath], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.error) {
    return { status: 'fail', detail: `failed to spawn robomotion: ${result.error.message}` };
  }
  if (result.status === 0) return { status: 'pass' };
  const out = (result.stderr || '') + (result.stdout || '');
  const firstLines = out.split('\n').slice(0, 8).join('\n');
  return { status: 'fail', detail: firstLines.trim() };
}

function snippet(text: string, needle: string, regex = false): string {
  const lines = text.split('\n');
  const re = regex ? new RegExp(needle) : null;
  for (let i = 0; i < lines.length; i++) {
    if (re ? re.test(lines[i]) : lines[i].includes(needle)) {
      return `line ${i + 1}: ${lines[i].trim().slice(0, 160)}`;
    }
  }
  return '(no match)';
}

function checkAssertion(a: Assertion, body: string, fixturePath: string): CheckResult {
  switch (a.kind) {
    case 'validator-passes':
      return runValidator(fixturePath);
    case 'must-contain':
      return body.includes(a.value)
        ? { status: 'pass' }
        : { status: 'fail', detail: `missing substring: ${JSON.stringify(a.value)}` };
    case 'must-not-contain':
      return body.includes(a.value)
        ? { status: 'fail', detail: `forbidden substring present — ${snippet(body, a.value)}` }
        : { status: 'pass' };
    case 'must-contain-regex': {
      const re = new RegExp(a.value);
      return re.test(body)
        ? { status: 'pass' }
        : { status: 'fail', detail: `regex did not match: /${a.value}/` };
    }
    case 'must-not-contain-regex': {
      const re = new RegExp(a.value);
      return re.test(body)
        ? {
            status: 'fail',
            detail: `forbidden regex matched — ${snippet(body, a.value, true)}`,
          }
        : { status: 'pass' };
    }
    case 'must-import': {
      const m = body.match(/import\s*\{([^}]*)\}\s*from\s*['"]@robomotion\/sdk['"]/);
      if (!m) return { status: 'fail', detail: `no @robomotion/sdk import line found` };
      const imported = new Set(m[1].split(',').map((s) => s.trim()).filter(Boolean));
      const missing = a.value.filter((sym) => !imported.has(sym));
      return missing.length === 0
        ? { status: 'pass' }
        : { status: 'fail', detail: `import line missing: ${missing.join(', ')}` };
    }
    case 'rubric':
      return { status: 'manual', detail: a.value };
  }
}

function fmt(line: string): string {
  return line;
}

function main() {
  const evalsPath = resolve(import.meta.dir, 'evals.json');
  const evalsDir = dirname(evalsPath);
  const file: EvalsFile = JSON.parse(readFileSync(evalsPath, 'utf8'));

  const templatesRoot = resolveTemplatesRoot(file.templates_root, evalsDir);
  const templatesAvailable = templatesRoot !== null;

  const { tier, ids } = parseArgs();
  let evals = file.evals;
  if (tier) evals = evals.filter((e) => e.tier === tier);
  if (ids) evals = evals.filter((e) => ids.includes(e.id));

  let passed = 0;
  let failed = 0;
  let skipped = 0;
  const manualNotes: string[] = [];

  for (const ev of evals) {
    const header = `${BOLD}#${ev.id}${RESET} [${ev.tier}] ${ev.title}`;
    const resolved = resolveFixturePath(ev, evalsDir, templatesAvailable ? templatesRoot : null);

    if (!resolved) {
      console.log(`${YELLOW}∘${RESET} ${header} ${DIM}— missing fixture/template_slug${RESET}`);
      skipped++;
      continue;
    }

    if (resolved.missingTemplates) {
      console.log(`${YELLOW}∘${RESET} ${header} ${DIM}— skipped (templates_root missing)${RESET}`);
      skipped++;
      continue;
    }

    const fixturePath = resolved.path;
    if (!existsSync(fixturePath)) {
      console.log(`${RED}✗${RESET} ${header}`);
      console.log(`    ${RED}fixture not found:${RESET} ${fixturePath}`);
      failed++;
      continue;
    }

    let body: string;
    try {
      body = readFixtureText(fixturePath);
    } catch (err: any) {
      console.log(`${RED}✗${RESET} ${header}`);
      console.log(`    ${RED}cannot read fixture:${RESET} ${err.message}`);
      failed++;
      continue;
    }

    const lineResults: { kind: string; res: CheckResult; reason?: string }[] = [];
    let evalFailed = false;
    for (const a of ev.assertions) {
      const res = checkAssertion(a, body, fixturePath);
      const reason = (a as { reason?: string }).reason;
      lineResults.push({ kind: a.kind, res, reason });
      if (res.status === 'fail') evalFailed = true;
    }

    if (evalFailed) {
      console.log(`${RED}✗${RESET} ${header}`);
      failed++;
    } else {
      console.log(`${GREEN}✓${RESET} ${header}`);
      passed++;
    }

    for (const { kind, res, reason } of lineResults) {
      if (res.status === 'fail') {
        console.log(`    ${RED}✗ ${kind}${RESET} — ${res.detail}`);
        if (reason) console.log(`      ${DIM}why: ${reason}${RESET}`);
      } else if (res.status === 'manual') {
        manualNotes.push(`#${ev.id} ${ev.title}: ${res.detail}`);
        console.log(`    ${YELLOW}[manual]${RESET} ${DIM}${res.detail}${RESET}`);
      } else if (!evalFailed) {
        // Don't spam pass lines unless something failed; keep output tight.
      } else {
        console.log(`    ${GREEN}✓ ${kind}${RESET}`);
      }
    }
  }

  console.log('');
  console.log(
    `${BOLD}${passed} passed, ${failed} failed, ${skipped} skipped${RESET} — ${manualNotes.length} rubric line(s) for manual review`,
  );

  process.exit(failed > 0 ? 1 : 0);
}

main();
