#!/usr/bin/env bun
/**
 * Diff two `results.jsonl` runs by id. Use it to gate SKILL.md edits:
 *
 *   # snapshot master
 *   bun run skills/creating-flow/evals/run-evals.ts --mode agent
 *   #   → .cache/runs/<ts1>/results.jsonl
 *
 *   # check the branch
 *   git checkout my-branch
 *   bun run skills/creating-flow/evals/run-evals.ts --mode agent
 *   #   → .cache/runs/<ts2>/results.jsonl
 *
 *   bun run skills/creating-flow/evals/scripts/compare-runs.ts \
 *     .cache/runs/<ts1>/results.jsonl \
 *     .cache/runs/<ts2>/results.jsonl
 *
 * Exits 1 if the second run shows any pass-to-fail regression.
 */

import { existsSync, readFileSync } from 'node:fs';

interface Outcome {
  id: number;
  slug: string;
  tier: string;
  validate_pass: boolean;
  assertions_total: number;
  assertions_pass: number;
  assertions_fail: number;
  fail_summary: string[];
  tokens_input?: number;
  tokens_output?: number;
  duration_ms: number;
  status: 'pass' | 'fail' | 'no-output' | 'budget-skipped';
}

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

function loadJsonl(path: string): Map<number, Outcome> {
  if (!existsSync(path)) {
    console.error(`not found: ${path}`);
    process.exit(2);
  }
  const out = new Map<number, Outcome>();
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t) continue;
    try {
      const o = JSON.parse(t) as Outcome;
      out.set(o.id, o);
    } catch (err) {
      console.error(`malformed line in ${path}: ${t.slice(0, 80)}`);
    }
  }
  return out;
}

function passed(o: Outcome | undefined): boolean {
  return !!o && o.status === 'pass';
}

function main() {
  const [a, b] = process.argv.slice(2);
  if (!a || !b) {
    console.error('usage: bun run compare-runs.ts <baseline.jsonl> <candidate.jsonl>');
    process.exit(2);
  }
  const left = loadJsonl(a);
  const right = loadJsonl(b);

  const ids = Array.from(new Set([...left.keys(), ...right.keys()])).sort((x, y) => x - y);

  const regressions: string[] = [];
  const improvements: string[] = [];
  const stillFailing: string[] = [];
  const stillPassing: string[] = [];
  const changedAssertions: string[] = [];
  const onlyA: number[] = [];
  const onlyB: number[] = [];

  for (const id of ids) {
    const x = left.get(id);
    const y = right.get(id);
    if (x && !y) {
      onlyA.push(id);
      continue;
    }
    if (!x && y) {
      onlyB.push(id);
      continue;
    }
    if (!x || !y) continue;

    const px = passed(x);
    const py = passed(y);
    const slug = y.slug || x.slug;
    if (px && !py) {
      regressions.push(
        `#${id} ${slug} — was pass, now ${y.status} (${y.assertions_pass}/${y.assertions_total})`,
      );
      for (const f of y.fail_summary.slice(0, 3)) regressions.push(`    - ${f}`);
    } else if (!px && py) {
      improvements.push(
        `#${id} ${slug} — was ${x.status}, now pass (${y.assertions_pass}/${y.assertions_total})`,
      );
    } else if (!px && !py) {
      stillFailing.push(`#${id} ${slug} — still ${y.status}`);
      const newFails = y.fail_summary.filter((s) => !x.fail_summary.includes(s));
      const goneFails = x.fail_summary.filter((s) => !y.fail_summary.includes(s));
      for (const f of newFails) stillFailing.push(`    + ${f}`);
      for (const f of goneFails) stillFailing.push(`    - ${f}`);
    } else {
      stillPassing.push(`#${id} ${slug}`);
      if (x.assertions_pass !== y.assertions_pass) {
        changedAssertions.push(
          `#${id} ${slug} — ${x.assertions_pass}/${x.assertions_total} → ${y.assertions_pass}/${y.assertions_total}`,
        );
      }
    }
  }

  const sumIn = (m: Map<number, Outcome>) =>
    Array.from(m.values()).reduce((s, o) => s + (o.tokens_input ?? 0), 0);
  const sumOut = (m: Map<number, Outcome>) =>
    Array.from(m.values()).reduce((s, o) => s + (o.tokens_output ?? 0), 0);

  console.log(`${BOLD}${a}${RESET}`);
  console.log(`  ${DIM}${left.size} eval(s), ${sumIn(left)}/${sumOut(left)} tokens${RESET}`);
  console.log(`${BOLD}${b}${RESET}`);
  console.log(`  ${DIM}${right.size} eval(s), ${sumIn(right)}/${sumOut(right)} tokens${RESET}`);
  console.log('');

  if (regressions.length > 0) {
    console.log(`${RED}${BOLD}Regressions (${regressions.filter((l) => l.startsWith('#')).length})${RESET}`);
    for (const r of regressions) console.log(`  ${r}`);
    console.log('');
  }
  if (improvements.length > 0) {
    console.log(`${GREEN}${BOLD}Improvements (${improvements.length})${RESET}`);
    for (const r of improvements) console.log(`  ${r}`);
    console.log('');
  }
  if (stillFailing.length > 0) {
    console.log(
      `${YELLOW}${BOLD}Still failing (${stillFailing.filter((l) => l.startsWith('#')).length})${RESET}`,
    );
    for (const r of stillFailing) console.log(`  ${r}`);
    console.log('');
  }
  if (changedAssertions.length > 0) {
    console.log(`${DIM}${BOLD}Still passing but assertion count changed${RESET}`);
    for (const r of changedAssertions) console.log(`  ${DIM}${r}${RESET}`);
    console.log('');
  }
  if (onlyA.length > 0) console.log(`${DIM}only in baseline: ${onlyA.join(', ')}${RESET}`);
  if (onlyB.length > 0) console.log(`${DIM}only in candidate: ${onlyB.join(', ')}${RESET}`);
  if (
    regressions.length === 0 &&
    improvements.length === 0 &&
    stillFailing.length === 0
  ) {
    console.log(`${GREEN}no changes${RESET}`);
  }

  const regressionCount = regressions.filter((l) => l.startsWith('#')).length;
  process.exit(regressionCount > 0 ? 1 : 0);
}

main();
