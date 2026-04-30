#!/usr/bin/env bun
/**
 * Eval runner for the creating-flow skill.
 *
 * Two modes share the same assertion engine:
 *
 *   --mode static  (default)  Phase 1 — validate pre-written fixtures in place.
 *                             Fast, free, deterministic. Every-PR gate.
 *   --mode agent              Phase 2 — spawn `claude -p` per eval inside a
 *                             clean workdir with .claude/skills symlinked from
 *                             this repo, validate the agent's main.ts, run the
 *                             same assertions. Opt-in (cost guard via
 *                             --budget-tokens).
 *
 * Usage:
 *   bun run run-evals.ts                                # static, all evals
 *   bun run run-evals.ts --tier regression
 *   bun run run-evals.ts --id 1,3,5
 *   bun run run-evals.ts --mode agent --tier regression --parallel 3
 *   bun run run-evals.ts --mode agent --skip-existing   # rerun assertions on cached output
 */

import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, isAbsolute, resolve, join } from 'node:path';

import { spawnAgent } from './lib/spawn-agent.ts';

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

interface CliArgs {
  mode: 'static' | 'agent';
  tier?: 'regression' | 'integration';
  ids?: number[];
  parallel: number;
  maxTurns: number;
  budgetTokens?: number;
  skipExisting: boolean;
  keepArtifacts: boolean;
  model?: string;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const out: CliArgs = {
    mode: 'static',
    parallel: 1,
    maxTurns: 150,
    skipExisting: false,
    keepArtifacts: true,
  };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--mode') out.mode = args[++i] as 'static' | 'agent';
    else if (a === '--tier') out.tier = args[++i] as 'regression' | 'integration';
    else if (a === '--id') out.ids = args[++i].split(',').map((n) => parseInt(n, 10));
    else if (a === '--parallel') out.parallel = parseInt(args[++i], 10);
    else if (a === '--max-turns') out.maxTurns = parseInt(args[++i], 10);
    else if (a === '--budget-tokens') out.budgetTokens = parseInt(args[++i], 10);
    else if (a === '--skip-existing') out.skipExisting = true;
    else if (a === '--no-keep-artifacts') out.keepArtifacts = false;
    else if (a === '--keep-artifacts') out.keepArtifacts = true;
    else if (a === '--model') out.model = args[++i];
  }
  return out;
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

function evaluateAssertions(
  ev: Eval,
  body: string,
  fixturePath: string,
): { failed: boolean; lines: { kind: string; res: CheckResult; reason?: string }[] } {
  const lines: { kind: string; res: CheckResult; reason?: string }[] = [];
  let failed = false;
  for (const a of ev.assertions) {
    const res = checkAssertion(a, body, fixturePath);
    const reason = (a as { reason?: string }).reason;
    lines.push({ kind: a.kind, res, reason });
    if (res.status === 'fail') failed = true;
  }
  return { failed, lines };
}

function printEvalResult(
  header: string,
  failed: boolean,
  lines: { kind: string; res: CheckResult; reason?: string }[],
  manualNotes: string[],
  evId: number,
  evTitle: string,
) {
  if (failed) console.log(`${RED}✗${RESET} ${header}`);
  else console.log(`${GREEN}✓${RESET} ${header}`);
  for (const { kind, res, reason } of lines) {
    if (res.status === 'fail') {
      console.log(`    ${RED}✗ ${kind}${RESET} — ${res.detail}`);
      if (reason) console.log(`      ${DIM}why: ${reason}${RESET}`);
    } else if (res.status === 'manual') {
      manualNotes.push(`#${evId} ${evTitle}: ${res.detail}`);
      console.log(`    ${YELLOW}[manual]${RESET} ${DIM}${res.detail}${RESET}`);
    } else if (failed) {
      console.log(`    ${GREEN}✓ ${kind}${RESET}`);
    }
  }
}

// ---- static mode (Phase 1) ------------------------------------------------

function runStatic(file: EvalsFile, evalsDir: string, args: CliArgs): number {
  const templatesRoot = resolveTemplatesRoot(file.templates_root, evalsDir);
  const templatesAvailable = templatesRoot !== null;

  let evals = file.evals;
  if (args.tier) evals = evals.filter((e) => e.tier === args.tier);
  if (args.ids) evals = evals.filter((e) => args.ids!.includes(e.id));

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

    const { failed: evFailed, lines } = evaluateAssertions(ev, body, fixturePath);
    printEvalResult(header, evFailed, lines, manualNotes, ev.id, ev.title);
    if (evFailed) failed++;
    else passed++;
  }

  console.log('');
  console.log(
    `${BOLD}${passed} passed, ${failed} failed, ${skipped} skipped${RESET} — ${manualNotes.length} rubric line(s) for manual review`,
  );
  return failed > 0 ? 1 : 0;
}

// ---- agent mode (Phase 2) -------------------------------------------------

interface AgentRunOutcome {
  id: number;
  slug: string;
  tier: 'regression' | 'integration';
  validate_pass: boolean;
  assertions_total: number;
  assertions_pass: number;
  assertions_fail: number;
  fail_summary: string[];
  tokens_input?: number;
  tokens_output?: number;
  num_turns?: number;
  stop_reason?: string;
  duration_ms: number;
  fixture_path: string;
  transcript_path: string;
  status: 'pass' | 'fail' | 'no-output' | 'budget-skipped';
}

function findRepoRoot(evalsDir: string): string {
  // evals/ → creating-flow/ → skills/ → <repoRoot>
  return resolve(evalsDir, '..', '..', '..');
}

function evalSlug(ev: Eval): string {
  if (ev.template_slug) return ev.template_slug;
  if (ev.fixture) {
    const base = ev.fixture.split('/').pop() ?? `eval-${ev.id}`;
    return base.replace(/\.ts$/, '');
  }
  return `eval-${ev.id}`;
}

function resolvePromptText(ev: Eval, templatesRoot: string | null): string | null {
  if (ev.prompt) return ev.prompt;
  if (ev.prompt_file && templatesRoot) {
    const path = resolve(templatesRoot, ev.prompt_file);
    if (!existsSync(path)) return null;
    // Lazy-import the case-md extractor so static mode doesn't pay for it.
    const { extractPromptFromFile } = require('./lib/extract-prompt.ts');
    return extractPromptFromFile(path).prompt;
  }
  return null;
}

/**
 * Find the most recent .cache/runs/<ts>/ directory that has artifacts for the
 * given slug. Used by --skip-existing to iterate on assertions without
 * re-spawning Claude.
 */
function findExistingRun(
  runsRoot: string,
  slug: string,
  excludeRunDir?: string,
): { mainTs: string; transcriptPath: string; runDir: string } | null {
  if (!existsSync(runsRoot)) return null;
  const stamps = readdirSync(runsRoot)
    .filter((d) => {
      const dir = join(runsRoot, d);
      if (!statSync(dir).isDirectory()) return false;
      if (excludeRunDir && dir === excludeRunDir) return false;
      return true;
    })
    .sort()
    .reverse();
  for (const stamp of stamps) {
    const dir = join(runsRoot, stamp, slug);
    const mainPath = join(dir, 'main.ts');
    if (existsSync(mainPath)) {
      return {
        mainTs: readFileSync(mainPath, 'utf8'),
        transcriptPath: join(dir, 'transcript.json'),
        runDir: dir,
      };
    }
  }
  return null;
}

async function runAgentForOne(
  ev: Eval,
  args: CliArgs,
  templatesRoot: string | null,
  repoRoot: string,
  runDir: string,
  runsRoot: string,
  manualNotes: string[],
): Promise<AgentRunOutcome | null> {
  const slug = evalSlug(ev);
  const header = `${BOLD}#${ev.id}${RESET} [${ev.tier}] ${ev.title} ${DIM}(${slug})${RESET}`;
  const slugDir = join(runDir, slug);
  mkdirSync(slugDir, { recursive: true });

  const prompt = resolvePromptText(ev, templatesRoot);
  if (!prompt) {
    console.log(`${YELLOW}∘${RESET} ${header} ${DIM}— no prompt / prompt_file unresolved${RESET}`);
    return null;
  }

  let mainTs: string | null = null;
  let transcriptPath = join(slugDir, 'transcript.json');
  let durationMs = 0;
  let tokensInput: number | undefined;
  let tokensOutput: number | undefined;
  let numTurns: number | undefined;
  let stopReason: string | undefined;

  if (args.skipExisting) {
    const cached = findExistingRun(runsRoot, slug, runDir);
    if (cached) {
      mainTs = cached.mainTs;
      transcriptPath = cached.transcriptPath;
      // Mirror the cached main.ts into this run so subsequent --skip-existing
      // calls keep finding it without reaching back to the older stamp dir.
      writeFileSync(join(slugDir, 'main.ts'), mainTs);
      console.log(`${DIM}↻${RESET} ${header} ${DIM}— reusing ${cached.runDir}${RESET}`);
    }
  }

  if (mainTs === null) {
    const result = await spawnAgent({
      prompt,
      slug,
      repoRoot,
      maxTurns: args.maxTurns,
      model: args.model,
    });
    durationMs = result.durationMs;
    tokensInput = result.tokensInput;
    tokensOutput = result.tokensOutput;
    numTurns = result.numTurns;
    stopReason = result.stopReason;
    mainTs = result.mainTs;
    writeFileSync(transcriptPath, JSON.stringify(result.transcript ?? result.stdout, null, 2));
    if (mainTs) writeFileSync(join(slugDir, 'main.ts'), mainTs);
    if (result.subflows.length > 0) {
      const sfDir = join(slugDir, 'subflows');
      mkdirSync(sfDir, { recursive: true });
      for (const sf of result.subflows) writeFileSync(join(sfDir, sf.name), sf.body);
    }
    if (result.timedOut) {
      console.log(`${YELLOW}![timeout]${RESET} ${header} ${DIM}— exceeded per-eval cap${RESET}`);
    }
  }

  if (!mainTs) {
    const reasonNote = stopReason ? ` ${DIM}[${stopReason}, ${numTurns ?? '?'} turns]${RESET}` : '';
    console.log(`${RED}✗${RESET} ${header}${reasonNote}`);
    console.log(`    ${RED}agent produced no main.ts${RESET}`);
    return {
      id: ev.id,
      slug,
      tier: ev.tier,
      validate_pass: false,
      assertions_total: ev.assertions.length,
      assertions_pass: 0,
      assertions_fail: ev.assertions.length,
      fail_summary: [
        stopReason
          ? `agent produced no main.ts (${stopReason} after ${numTurns ?? '?'} turns)`
          : 'agent produced no main.ts',
      ],
      tokens_input: tokensInput,
      tokens_output: tokensOutput,
      num_turns: numTurns,
      stop_reason: stopReason,
      duration_ms: durationMs,
      fixture_path: '',
      transcript_path: transcriptPath,
      status: 'no-output',
    };
  }

  // Assertions run against slugDir so `validator-passes` picks up subflows too.
  const fixturePath = slugDir;
  const { failed, lines } = evaluateAssertions(ev, mainTs, fixturePath);
  const turnsNote =
    numTurns !== undefined ? ` ${DIM}[${numTurns} turns${stopReason ? `, ${stopReason}` : ''}]${RESET}` : '';
  printEvalResult(header + turnsNote, failed, lines, manualNotes, ev.id, ev.title);

  const failSummary: string[] = [];
  let pass = 0;
  let fail = 0;
  let validatePass = true;
  for (const { kind, res } of lines) {
    if (res.status === 'pass') pass++;
    else if (res.status === 'fail') {
      fail++;
      failSummary.push(`${kind}: ${res.detail ?? 'failed'}`);
      if (kind === 'validator-passes') validatePass = false;
    }
  }

  return {
    id: ev.id,
    slug,
    tier: ev.tier,
    validate_pass: validatePass,
    assertions_total: ev.assertions.length,
    assertions_pass: pass,
    assertions_fail: fail,
    fail_summary: failSummary,
    tokens_input: tokensInput,
    tokens_output: tokensOutput,
    num_turns: numTurns,
    stop_reason: stopReason,
    duration_ms: durationMs,
    fixture_path: join(slug, 'main.ts'),
    transcript_path: join(slug, 'transcript.json'),
    status: failed ? 'fail' : 'pass',
  };
}

function writeSummary(runDir: string, outcomes: AgentRunOutcome[]) {
  const totalIn = outcomes.reduce((s, o) => s + (o.tokens_input ?? 0), 0);
  const totalOut = outcomes.reduce((s, o) => s + (o.tokens_output ?? 0), 0);
  const passed = outcomes.filter((o) => o.status === 'pass').length;
  const failed = outcomes.filter((o) => o.status === 'fail' || o.status === 'no-output').length;
  const skipped = outcomes.filter((o) => o.status === 'budget-skipped').length;

  const lines: string[] = [];
  lines.push(`# Agent eval run — ${new Date().toISOString()}`);
  lines.push('');
  lines.push(`- **${passed}** passed · **${failed}** failed · **${skipped}** skipped`);
  lines.push(`- Tokens: **${totalIn}** input / **${totalOut}** output`);
  lines.push('');
  lines.push('## Per-eval results');
  lines.push('');
  for (const o of outcomes) {
    const mark = o.status === 'pass' ? '✓' : o.status === 'budget-skipped' ? '∘' : '✗';
    lines.push(
      `- ${mark} **#${o.id}** \`${o.slug}\` (${o.tier}) — ` +
        `${o.assertions_pass}/${o.assertions_total} assertions, ` +
        (o.num_turns !== undefined ? `${o.num_turns} turns, ` : '') +
        `${o.duration_ms}ms` +
        (o.tokens_input ? `, ${o.tokens_input}+${o.tokens_output} tokens` : '') +
        (o.stop_reason && o.stop_reason !== 'success' ? ` [${o.stop_reason}]` : ''),
    );
    if (o.fail_summary.length > 0) {
      for (const f of o.fail_summary) lines.push(`    - ${f}`);
    }
  }
  writeFileSync(join(runDir, 'summary.md'), lines.join('\n') + '\n');
}

async function runAgent(file: EvalsFile, evalsDir: string, args: CliArgs): Promise<number> {
  const templatesRoot = resolveTemplatesRoot(file.templates_root, evalsDir);
  const repoRoot = findRepoRoot(evalsDir);

  let evals = file.evals;
  if (args.tier) evals = evals.filter((e) => e.tier === args.tier);
  if (args.ids) evals = evals.filter((e) => args.ids!.includes(e.id));

  const runsRoot = join(evalsDir, '.cache', 'runs');
  mkdirSync(runsRoot, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const runDir = join(runsRoot, stamp);
  mkdirSync(runDir, { recursive: true });
  console.log(`${DIM}artifacts → ${runDir}${RESET}`);

  const manualNotes: string[] = [];
  const outcomes: AgentRunOutcome[] = [];
  const resultsPath = join(runDir, 'results.jsonl');

  let tokensSoFar = 0;
  let budgetExhausted = false;

  // Worker pool — at most args.parallel agents in flight.
  const queue = [...evals];
  let inFlight = 0;
  await new Promise<void>((resolveAll) => {
    const dispatch = () => {
      if (queue.length === 0 && inFlight === 0) return resolveAll();
      while (
        !budgetExhausted &&
        inFlight < Math.max(1, args.parallel) &&
        queue.length > 0
      ) {
        const ev = queue.shift()!;
        if (args.budgetTokens && tokensSoFar >= args.budgetTokens) {
          budgetExhausted = true;
          const slug = evalSlug(ev);
          console.log(
            `${YELLOW}∘${RESET} ${BOLD}#${ev.id}${RESET} ${ev.title} ${DIM}— budget exceeded, skipping${RESET}`,
          );
          outcomes.push({
            id: ev.id,
            slug,
            tier: ev.tier,
            validate_pass: false,
            assertions_total: ev.assertions.length,
            assertions_pass: 0,
            assertions_fail: 0,
            fail_summary: ['skipped: token budget exceeded'],
            duration_ms: 0,
            fixture_path: '',
            transcript_path: '',
            status: 'budget-skipped',
          });
          continue;
        }
        inFlight++;
        runAgentForOne(ev, args, templatesRoot, repoRoot, runDir, runsRoot, manualNotes)
          .then((o) => {
            if (o) {
              outcomes.push(o);
              tokensSoFar += (o.tokens_input ?? 0) + (o.tokens_output ?? 0);
              writeFileSync(
                resultsPath,
                outcomes.map((x) => JSON.stringify(x)).join('\n') + '\n',
              );
            }
          })
          .catch((err) => {
            console.error(`${RED}eval #${ev.id} crashed:${RESET}`, err.message);
          })
          .finally(() => {
            inFlight--;
            dispatch();
          });
      }
      // If budget cut off the queue, drain remaining as skipped synchronously.
      if (budgetExhausted && inFlight === 0) {
        while (queue.length > 0) {
          const ev = queue.shift()!;
          outcomes.push({
            id: ev.id,
            slug: evalSlug(ev),
            tier: ev.tier,
            validate_pass: false,
            assertions_total: ev.assertions.length,
            assertions_pass: 0,
            assertions_fail: 0,
            fail_summary: ['skipped: token budget exceeded'],
            duration_ms: 0,
            fixture_path: '',
            transcript_path: '',
            status: 'budget-skipped',
          });
        }
        return resolveAll();
      }
    };
    dispatch();
  });

  // Stable id-sort for downstream comparison.
  outcomes.sort((a, b) => a.id - b.id);
  writeFileSync(resultsPath, outcomes.map((x) => JSON.stringify(x)).join('\n') + '\n');
  writeSummary(runDir, outcomes);

  const passed = outcomes.filter((o) => o.status === 'pass').length;
  const failed = outcomes.filter((o) => o.status === 'fail' || o.status === 'no-output').length;
  const skipped = outcomes.filter((o) => o.status === 'budget-skipped').length;
  console.log('');
  console.log(
    `${BOLD}${passed} passed, ${failed} failed, ${skipped} skipped${RESET} — ${manualNotes.length} rubric line(s) for manual review`,
  );
  console.log(`${DIM}results: ${resultsPath}${RESET}`);
  if (budgetExhausted) {
    console.log(
      `${YELLOW}!${RESET} budget exceeded — ${skipped} eval(s) skipped (set/raise --budget-tokens)`,
    );
  }
  return failed > 0 ? 1 : 0;
}

// ---- entry ---------------------------------------------------------------

async function main() {
  const evalsPath = resolve(import.meta.dir, 'evals.json');
  const evalsDir = dirname(evalsPath);
  const file: EvalsFile = JSON.parse(readFileSync(evalsPath, 'utf8'));
  const args = parseArgs();

  let exit = 0;
  if (args.mode === 'agent') {
    exit = await runAgent(file, evalsDir, args);
  } else {
    exit = runStatic(file, evalsDir, args);
  }
  process.exit(exit);
}

main();
