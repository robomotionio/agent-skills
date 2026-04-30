# `creating-flow` eval suite

Regression suite for the `creating-flow` skill. The single source of truth for "did a SKILL.md edit silently break flow generation?".

Two tiers under one schema:

- **Tier A — regression** (`tier: "regression"`): handcrafted, self-contained fixtures in `fixtures/`. Each pins one rule the trimmed SKILL.md has been losing — `Core.Trigger.Catch` vs `Core.Flow.Catch`, terminal-node chaining, GoTo casing, schema-only props, etc.
- **Tier B — integration** (`tier: "integration"`): live `main.ts` files under `<templates_root>/<slug>/`, paired with their `cases/<slug>.md` prompt. Verifies whole-flow shape against real production templates.

## Run

From the repo root (`agent-skills/`):

```bash
bun run skills/creating-flow/evals/run-evals.ts                    # everything
bun run skills/creating-flow/evals/run-evals.ts --tier regression  # Tier A only (fast)
bun run skills/creating-flow/evals/run-evals.ts --tier integration # Tier B only
bun run skills/creating-flow/evals/run-evals.ts --id 1,3,5         # cherry-pick
```

`robomotion` and `bun` must be on `PATH`. The runner shells out to `robomotion validate` for the `validator-passes` assertion — keep your `robomotion` install up to date or that line will silently rubber-stamp pspec violations.

Exit code is non-zero on any mechanical failure. `rubric` lines never fail the run; they print as `[manual]` notes for human review.

## Layout

```
evals/
  evals.json              spec — schema below
  fixtures/               Tier A self-contained flows (one rule each)
    01-error-handling.ts
    02-foreach-loop.ts
    …
    07-subflow/main.ts
    07-subflow/subflows/aaaaaa.ts
    …
  run-evals.ts            bun runner
  README.md               this file
```

Tier B fixtures are NOT copied here — they're read live from `<templates_root>/<slug>/main.ts`. If `templates_root` doesn't resolve, the runner skips Tier B with a warning rather than failing.

### Resolving `templates_root`

The default in `evals.json` is the public templates repo:

```json
"templates_root": "https://github.com/robomotionio/robomotion-templates"
```

The runner resolves it in this order:

1. `$ROBOMOTION_TEMPLATES_ROOT` env var — fastest, no network. Set it to your local checkout when iterating.
2. A relative or absolute path in `templates_root` — used as-is if it exists on disk.
3. A `https://` / `git@` URL — shallow-cloned into `.cache/templates/` (gitignored). Subsequent runs `git pull --ff-only` to refresh; if you're offline, the cached snapshot is used.

The clone keeps the repo portable across machines without leaking anyone's local layout.

## Schema

```jsonc
{
  "skill_name": "creating-flow",
  "templates_root": "https://github.com/robomotionio/robomotion-templates",
  "evals": [
    {
      "id": 1,
      "tier": "regression",                     // or "integration"
      "title": "Error handling with Catch trigger",
      "prompt": "Build a flow that …",          // Tier A: inline; Tier B: use prompt_file
      "prompt_file": "cases/<slug>.md",         // Tier B only — relative to templates_root
      "fixture": "fixtures/01-error-handling.ts", // Tier A only — relative to evals/
      "template_slug": "extract-top-headlines-espn", // Tier B only — directory under templates_root
      "source_template": "handle-errors",       // optional, Tier A — what real template inspired the fixture
      "assertions": [
        { "kind": "validator-passes" },
        { "kind": "must-contain", "value": "Core.Trigger.Catch" },
        { "kind": "must-not-contain", "value": "Core.Flow.Catch", "reason": "…" },
        { "kind": "must-contain-regex", "value": "f\\.edge\\(" },
        { "kind": "must-not-contain-regex", "value": "\\.then\\([^)]*Core\\.Flow\\.Log" },
        { "kind": "must-import", "value": ["flow", "Custom", "Message"] },
        { "kind": "rubric", "value": "Free-text expectation for a human reviewer …" }
      ]
    }
  ]
}
```

### Assertion kinds

| kind                       | what it checks                                                          |
|----------------------------|-------------------------------------------------------------------------|
| `validator-passes`         | `robomotion validate <fixture>` exits 0                                 |
| `must-contain`             | substring is present in the fixture body                                |
| `must-not-contain`         | substring is absent                                                     |
| `must-contain-regex`       | regex matches at least once                                             |
| `must-not-contain-regex`   | regex never matches                                                     |
| `must-import`              | every named symbol appears in the line-1 `import { … } from '@robomotion/sdk'` |
| `rubric`                   | free-text expectation; reported as `[manual]`, never fails the run      |

`reason` is optional but encouraged on negative assertions — it surfaces in failure output so the editor of SKILL.md sees *why* a rule exists.

## Adding a Tier A regression test

1. Pick the rule that's slipping. If a real template demonstrates it cleanly, copy that template's `main.ts` into `fixtures/NN-rule-name.ts` and trim everything irrelevant.
2. Append an entry to `evals.json`:
   - `id` is the next integer.
   - `tier: "regression"`.
   - `fixture: "fixtures/NN-rule-name.ts"`.
   - `assertions`: at minimum a `validator-passes`, the positive `must-contain` for the correct shape, and a negative `must-not-contain` (or regex) for the failure mode.
3. Validate the fixture: `robomotion validate skills/creating-flow/evals/fixtures/NN-rule-name.ts`.
4. Run the suite — Tier A only — with `--tier regression`.

Test-the-test before you commit: introduce the regression on purpose (e.g. swap `Core.Trigger.Catch` → `Core.Flow.Catch`) and confirm the suite fails. Then revert.

## Adding a Tier B integration test

1. Pick a slug that exists at the public templates repo root (https://github.com/robomotionio/robomotion-templates). Browse `.cache/templates/` after a first run to see what's there.
2. Confirm `<templates_root>/<slug>/main.ts` exists and that `robomotion validate <templates_root>/<slug>` passes locally.
3. Append an entry to `evals.json`:
   ```json
   {
     "id": 16,
     "tier": "integration",
     "title": "<one-line title>",
     "template_slug": "<slug>",
     "prompt": "Build a flow that …",
     "assertions": [
       { "kind": "validator-passes" },
       { "kind": "must-import", "value": ["flow", "Message", "Custom"] },
       { "kind": "must-contain", "value": "Core.Browser.Open" },
       { "kind": "must-contain", "value": "Core.CSV.WriteCSV" },
       { "kind": "must-not-contain", "value": "Core.Flow.Catch" },
       { "kind": "rubric", "value": "<what a human reviewer should look for>" }
     ]
   }
   ```
4. Run `--tier integration`. The runner should pass against the live template.

If the template ships with a `cases/<slug>.md` spec, prefer `prompt_file: "cases/<slug>.md"` over inline `prompt` so future Phase 2 generation has the richer source.

The recipe scales — the dominant template families (browser scrape → CSV, subflow patterns, vault-credential loops, REST endpoints) reuse the same node-set, so most new entries are a copy + tweak.

## What to do when `robomotion-templates` isn't reachable

The runner skips Tier B with a warning whenever it can't resolve `templates_root` (no env var, no local path, and `git clone` failed — most often offline). Tier A still runs and exits 0. To work around it: set `ROBOMOTION_TEMPLATES_ROOT` to your local checkout, or run once on a connection so the `.cache/templates` clone exists. Don't copy Tier B fixtures into `evals/fixtures/` — they're meant to drift in lockstep with production.

## Phase 2 — agent-driven generation (`--mode agent`)

Phase 1 (default) checks "do our golden flows still match the rules we claim?" Phase 2 checks the harder thing: **"when Claude is invoked headlessly with this skill loaded, does it produce flows that pass our assertions?"**

```bash
# from agent-skills/ root
bun run evals:agent                                 # all 15 evals (10 Tier A + 5 Tier B)
bun run evals:smoke                                 # Tier A only, parallel 3
bun run evals:agent --tier integration --id 11,13   # one-off
bun run evals:agent --budget-tokens 50000           # cost guard
bun run evals:agent --skip-existing                 # iterate on assertions
```

### Suite size

Phase 2 ships with **15 evals** (10 Tier A regression + 5 Tier B integration). That's the steady state — covers the rule classes (Catch trigger, GoTo casing, schema-only props, terminal chaining, vault credentials, subflows, REST endpoints) without burning ~$30+ per full run.

Want more coverage? `scripts/gen-tier-b.ts` can synthesize additional Tier B evals from any `[x]` template in `robomotion-templates/TODO.md`:

```bash
bun run evals:gen --dry-run    # preview which slugs would be picked
bun run evals:gen --merge      # append new entries into evals.json (idempotent)
```

The gen script runs `lib/extract-prompt.ts` (case-md → condensed user prompt) and `lib/synthesize-assertions.ts` (golden main.ts → assertion list). Pick families that exercise distinct skill paths and avoid sites with WAF bot detection (eBay/Akamai, Trendyol/PerimeterX, Airbnb, Redfin, Zapier) — those will block the headless browser even when the flow is structurally correct.

### What happens per eval

1. `mktemp -d` → workdir.
2. Symlink `<repo>/skills` into `<workdir>/.claude/skills`, copy `<repo>/.mcp.json` into the workdir. (User-facing install via `npx skills add` is the documented path; we shortcut for speed locally.)
3. Resolve the prompt:
   - Tier A and existing Tier B: inline `prompt` from `evals.json`.
   - Tier B (case-driven): `prompt_file: "cases/<slug>.md"` → run through `lib/extract-prompt.ts`, which strips marketing prose and keeps only H1, target URL, and column table — what a real user would type.
4. Spawn `claude -p "<prompt>" --output-format json --permission-mode bypassPermissions --allowedTools "Write,Edit,Read,Bash" --max-turns 150` in the workdir, 5-minute hard cap.
5. Capture `<workdir>/main.ts` (and `<workdir>/subflows/*.ts`) into `.cache/runs/<ISO-timestamp>/<slug>/` along with the full `claude -p` JSON as `transcript.json`.
6. Replay the existing assertion engine against the captured `main.ts`. `validator-passes` runs `robomotion validate <slug-dir>` so subflows are picked up.

### Output

```
.cache/runs/<ISO-timestamp>/
  results.jsonl        one line per eval (id, slug, pass/fail counts, tokens, durations)
  summary.md           human-readable per-eval summary
  <slug>/
    main.ts            what the agent generated
    subflows/*.ts      if produced
    transcript.json    full claude -p output (for failure debugging)
```

### Comparing two runs

```bash
bun run evals:compare \
  skills/creating-flow/evals/.cache/runs/<ts1>/results.jsonl \
  skills/creating-flow/evals/.cache/runs/<ts2>/results.jsonl
```

Prints regressions / improvements / still-failing diffs by id. Exit 1 if any pass-to-fail regression. Use it before merging a SKILL.md edit: snapshot `master`, switch branches, snapshot, diff.

### Adding a new agent eval

For a Tier A regression, the existing Phase 1 recipe still applies — Phase 2 picks up the same `prompt` field automatically.

For a Tier B integration test against an existing template:

1. `bun run evals:gen --dry-run` to see what would be picked.
2. Edit `scripts/gen-tier-b.ts` to add the slug to its family, or just hand-author an entry: `template_slug` + `prompt_file` are the agent-mode requirements (in addition to the `prompt`/`fixture` Phase 1 already understood).
3. `bun run evals:gen --merge` re-syncs new entries (idempotent — won't duplicate existing `template_slug` rows).
4. `bun run evals:agent --id <new>` smoke-tests it.

### Cost / flake guard

- `--budget-tokens N` — stop scheduling new agents once cumulative input+output exceeds N. Already-running agents finish; the rest are recorded as `budget-skipped` in `results.jsonl`.
- `--skip-existing` — reuse the most recent `<slug>/main.ts` from a prior run instead of spawning Claude. Useful when iterating on assertion text.
- `--parallel N` — bound concurrency. Defaults to 1; `--parallel 3` is fine for smoke runs.
- `--max-turns N` — forwarded to `claude -p`. Default 150. Case-driven scrapes routinely need many turns (read SKILL.md → plan → build → validate-fix loop); hitting the cap mid-flow burns the run's cost without producing a `main.ts`.

### CI

Not wired yet by design — Phase 2 is opt-in until cost / flake rates are characterised on real runs. The harness is already CI-friendly: exit code is 0 when all assertions pass, 1 otherwise; artifacts are self-contained under `.cache/runs/`. A `pull_request_target` workflow that runs `evals:smoke` and uploads `summary.md` + `results.jsonl` is a small follow-up.

## Phase 3 — live-data verification (`evals:verify`)

Phase 2 checks that the generated `main.ts` is **structurally** valid. Phase 3 actually executes it on a connected robot and reads the produced CSV — answering "does the agent's flow produce real data?".

```bash
# one-time setup
robomotion-deskbot connect \
  -i $ROBOMOTION_USER_EMAIL \
  -w $ROBOMOTION_WORKSPACE \
  -r $ROBOMOTION_ROBOT_ID \
  -t $ROBOMOTION_ROBOT_TOKEN

# then, after any `evals:agent` run:
bun run evals:verify                          # verify everything in the latest .cache/runs/<ts>/
bun run evals:verify --slug extract-news-items-hacker-news
bun run evals:verify --run .cache/runs/2026-04-30T14-04-51-270Z
```

What it does per artifact:
1. Reads `<slug>/main.ts` and extracts any `'…csv'` literal as a candidate output path.
2. Spawns `robomotion run main.ts --robot $ROBOMOTION_ROBOT_ID` from `<slug>/`.
3. Hard cap 5 minutes per flow.
4. After the run, looks in `$HOME` for the most recently written matching `.csv` (ignores files older than the run window so we don't pick up stale artifacts).
5. Records exit code, duration, CSV columns, and row count in `verify-results.jsonl` next to Phase 2's `results.jsonl`.

Outcomes:
- `pass` — flow exited 0 and produced a CSV with ≥ 1 row.
- `partial` — flow exited 0 but no CSV / 0-row CSV. Usually means a WAF blocked the page (eBay/Akamai), the selector didn't match anything, or the site returned an empty result. The skill produced something runnable; the real world isn't cooperating.
- `fail` — flow exited non-zero or timed out. That's the agent's fault.

### Credentials (`.env`)

Phase 3 needs `ROBOMOTION_API_KEY` and `ROBOMOTION_ROBOT_ID`. Put them in `agent-skills/.env` (gitignored — see `.env.example`). The verifier loads `.env` at startup and refuses to run without these two keys present.

**Never commit `.env`.** The root `.gitignore` excludes it explicitly and includes `!.env.example` so a placeholder template stays in version control. If you accidentally do commit credentials, rotate the API key + robot token immediately — git history can't be unwound for credentials that have already been leaked.

### Why Phase 3 is cheap

Phase 2 spends ~$0.50–$1.50 / eval on Claude tokens. Phase 3 spends nothing on tokens — it just runs the already-built flow. Per-flow wall time is dominated by browser / network I/O (3–30s per scrape). Use `--parallel 1` (default) — the robot serializes jobs anyway.
