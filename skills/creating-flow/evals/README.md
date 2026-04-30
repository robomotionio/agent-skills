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

## Phase 2 (not implemented yet)

The schema already carries `prompt` / `prompt_file`. A future runner extension will invoke Claude on each prompt, write the response to a temp directory, and run the same assertions against the agent's output. The current Phase 1 runner only validates pre-existing fixtures — that's what catches "we said the rule was X, did our examples actually obey X?".
