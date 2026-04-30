/**
 * Spawn `claude -p` headlessly inside an isolated workdir, capture whatever
 * `main.ts` (and `subflows/*.ts`) the agent produces, and return everything
 * the runner needs to score the eval.
 *
 * Mirrors the published bootstrap (npx skills add → drop .mcp.json → claude -p)
 * via a fast local symlink: skills/ in this repo is symlinked into the workdir
 * as `.claude/skills`, and the repo's `.mcp.json` is copied alongside.
 */

import { spawn } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  statSync,
  symlinkSync,
  copyFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export interface SpawnAgentOptions {
  prompt: string;
  slug: string;
  /** Repo root that contains `skills/` and `.mcp.json` (the agent-skills checkout). */
  repoRoot: string;
  /** Per-eval hard cap (ms). Default 5 minutes per the plan. */
  timeoutMs?: number;
  /** Forwarded to `claude -p --max-turns`. Default 150 — case-driven scrapes
   *  routinely need many turns for read-skill + plan + build + validate-fix
   *  loops; hitting the cap mid-flow wastes the entire run's tokens. */
  maxTurns?: number;
  /** Optional model override; if unset claude picks its default. */
  model?: string;
}

export interface SpawnAgentResult {
  workdir: string;
  mainTs: string | null;
  subflows: { name: string; body: string }[];
  /** Parsed `claude -p --output-format json` payload, if it parsed cleanly. */
  transcript: unknown;
  /** Raw stdout (for debugging when JSON parsing fails). */
  stdout: string;
  stderr: string;
  durationMs: number;
  exitCode: number | null;
  timedOut: boolean;
  tokensInput?: number;
  tokensOutput?: number;
  numTurns?: number;
  stopReason?: string;
}

/**
 * Build the workdir layout `claude -p` will run inside:
 *
 *   <tmp>/
 *     .claude/skills -> <repoRoot>/skills    (symlink)
 *     .mcp.json                              (copy)
 *
 * Symlinking keeps local iteration fast — editing SKILL.md and re-running picks
 * up the change without copying. The user-facing install path (`npx skills add`)
 * stays as documented; we just don't exercise it here.
 */
export function prepareWorkdir(repoRoot: string, slug: string): string {
  const workdir = mkdtempSync(join(tmpdir(), `creating-flow-eval-${slug}-`));
  const claudeDir = join(workdir, '.claude');
  mkdirSync(claudeDir, { recursive: true });
  const skillsSrc = join(repoRoot, 'skills');
  if (!existsSync(skillsSrc)) {
    throw new Error(`repoRoot/skills not found: ${skillsSrc}`);
  }
  symlinkSync(skillsSrc, join(claudeDir, 'skills'), 'dir');
  const mcpSrc = join(repoRoot, '.mcp.json');
  if (existsSync(mcpSrc)) {
    copyFileSync(mcpSrc, join(workdir, '.mcp.json'));
  }
  return workdir;
}

function readIfExists(path: string): string | null {
  return existsSync(path) ? readFileSync(path, 'utf8') : null;
}

/**
 * Locate the agent's main.ts. The skill teaches `<workdir>/main.ts` but agents
 * commonly nest under `flow/`, `workdir/`, or `<slug>/`. Walk depth ≤ 2 and
 * pick the first match, ignoring our own `.claude/` symlink.
 */
function findMainTs(workdir: string): { path: string; subflowsDir: string } | null {
  const direct = join(workdir, 'main.ts');
  if (existsSync(direct)) return { path: direct, subflowsDir: join(workdir, 'subflows') };
  for (const child of readdirSync(workdir)) {
    if (child.startsWith('.') || child === 'node_modules') continue;
    const childPath = join(workdir, child);
    if (!statSync(childPath).isDirectory()) continue;
    const mainPath = join(childPath, 'main.ts');
    if (existsSync(mainPath)) {
      return { path: mainPath, subflowsDir: join(childPath, 'subflows') };
    }
  }
  return null;
}

function collectSubflows(subflowsDir: string): { name: string; body: string }[] {
  if (!existsSync(subflowsDir) || !statSync(subflowsDir).isDirectory()) return [];
  return readdirSync(subflowsDir)
    .filter((f) => f.endsWith('.ts'))
    .map((f) => ({ name: f, body: readFileSync(join(subflowsDir, f), 'utf8') }));
}

/**
 * Pull token counts out of the `claude -p --output-format json` payload.
 * The shape has shifted across CLI versions; check the common keys defensively
 * and fall through silently if nothing matches.
 */
function extractTokens(transcript: unknown): { input?: number; output?: number } {
  if (!transcript || typeof transcript !== 'object') return {};
  const t = transcript as Record<string, any>;
  const usage = t.usage ?? t.tokens ?? t.total_usage ?? null;
  if (usage && typeof usage === 'object') {
    const inp =
      usage.input_tokens ?? usage.prompt_tokens ?? usage.input ?? usage.cache_read_input_tokens;
    const out = usage.output_tokens ?? usage.completion_tokens ?? usage.output;
    return {
      input: typeof inp === 'number' ? inp : undefined,
      output: typeof out === 'number' ? out : undefined,
    };
  }
  return {};
}

export async function spawnAgent(opts: SpawnAgentOptions): Promise<SpawnAgentResult> {
  const timeoutMs = opts.timeoutMs ?? 5 * 60_000;
  const maxTurns = opts.maxTurns ?? 150;
  const workdir = prepareWorkdir(opts.repoRoot, opts.slug);

  const args = [
    '-p',
    opts.prompt,
    '--output-format',
    'json',
    '--permission-mode',
    'bypassPermissions',
    '--allowedTools',
    'Write,Edit,Read,Bash',
    '--max-turns',
    String(maxTurns),
  ];
  if (opts.model) args.push('--model', opts.model);

  const start = Date.now();
  let stdout = '';
  let stderr = '';
  let exitCode: number | null = null;
  let timedOut = false;

  await new Promise<void>((resolve) => {
    const child = spawn('claude', args, { cwd: workdir, env: process.env });
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
      // Force-kill after a grace window if the process refuses to exit.
      setTimeout(() => child.kill('SIGKILL'), 5_000).unref();
    }, timeoutMs);
    child.stdout.on('data', (b) => (stdout += b.toString()));
    child.stderr.on('data', (b) => (stderr += b.toString()));
    child.on('close', (code) => {
      clearTimeout(timer);
      exitCode = code;
      resolve();
    });
  });

  const durationMs = Date.now() - start;
  let transcript: unknown = null;
  try {
    transcript = JSON.parse(stdout);
  } catch {
    // Non-fatal — caller can still inspect stdout / mainTs to score the eval.
  }
  const tokens = extractTokens(transcript);

  const found = findMainTs(workdir);
  return {
    workdir,
    mainTs: found ? readIfExists(found.path) : null,
    subflows: found ? collectSubflows(found.subflowsDir) : [],
    transcript,
    stdout,
    stderr,
    durationMs,
    exitCode,
    timedOut,
    tokensInput: tokens.input,
    tokensOutput: tokens.output,
    numTurns:
      transcript && typeof transcript === 'object'
        ? ((transcript as Record<string, any>).num_turns as number | undefined)
        : undefined,
    stopReason:
      transcript && typeof transcript === 'object'
        ? ((transcript as Record<string, any>).subtype as string | undefined) ??
          ((transcript as Record<string, any>).stop_reason as string | undefined)
        : undefined,
  };
}

// CLI: `bun run lib/spawn-agent.ts <slug> "<prompt>" [repoRoot]` for one-off testing.
if (import.meta.main) {
  const [slug, prompt, repoRoot] = process.argv.slice(2);
  if (!slug || !prompt) {
    console.error('usage: bun run spawn-agent.ts <slug> "<prompt>" [repoRoot]');
    process.exit(2);
  }
  const root = repoRoot ?? join(import.meta.dir, '..', '..', '..', '..');
  spawnAgent({ slug, prompt, repoRoot: root }).then((r) => {
    console.log(`workdir: ${r.workdir}`);
    console.log(`exit: ${r.exitCode}, duration: ${r.durationMs}ms, timedOut: ${r.timedOut}`);
    console.log(`main.ts: ${r.mainTs ? `${r.mainTs.length} bytes` : '(missing)'}`);
    console.log(`subflows: ${r.subflows.length}`);
    console.log(`tokens: in=${r.tokensInput} out=${r.tokensOutput}`);
  });
}
