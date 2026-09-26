---
name: validating-flow
description: Validates a compiled Robomotion flow against pspec schemas via `robomotion validate <flow-dir>`. Exits 0 on clean, 1 on error with node-by-node report on stderr; no stdout output (composes in shell pipelines). Use when the user says "validate this flow", "check the flow", "is this correct", or before running. Does NOT run the flow — for behavioral tests use testing-flow.
---

# Validating a Robomotion Flow

Build + validate a flow against pspec schemas, including all subflows.

## When to use

- After writing or editing a flow with the TypeScript SDK
- Before running or committing a flow
- In a tight validate-then-fix loop while iterating

## Usage

```bash
robomotion validate <flow-dir>           # e.g. robomotion validate write-to-clipboard
robomotion validate                       # defaults to main.ts in cwd
robomotion validate path/to/main.ts       # also accepts a file
```

On success, exits 0 with `✔ <folder> validated` on stderr — `<folder>` is the name of the folder holding `main.ts`, not the flow's name — and **no stdout**. Composes cleanly:

```bash
robomotion validate write-to-clipboard/ && robomotion run write-to-clipboard/
```

On failure, exits 1 and prints structured node-by-node errors on stderr. Designer side files (`*.designer.ts`) are NOT written on validate — use `robomotion build` when you want JSON output or designer refresh. (Like `build`, it does delete a `subflows/<id>.ts` that no SubFlow node refers to, and says so.)

## What it checks

- Node ids are 6 lowercase hex characters and unique
- Node types exist in their package's pspec
- Node property names against pspec schemas (catches typos, wrong casing, invented properties)
- Port numbers (a wire into a node with no input, or out of a port the node does not have)
- `f.addDependency()` namespaces and versions against the package index
- **The Designer can read the file** — one `@robomotion/sdk` import, nodes written inside the `create` callback, no spreads or helper functions: "the Flow Designer cannot read it"
- **Function code is written for a person** — "several statements on one line", "a whole block on one line", the same block pasted into several Functions

## What it does NOT check

- **That the path from the trigger reaches `Core.Flow.Stop`.** A flow with no Stop, or with a Stop nothing wires to, validates clean and then runs for ever on the robot (the next run is refused as busy). Check it yourself — see the checklist. (The Designer's Build with AI validator does check this; the CLI does not.)
- A leaf (`Debug`, `Log`) fanned out beside the path to `Stop` — it validates, but Stop can end the flow before the leaf runs
- Loop wiring patterns (Goto→Label) — manual review
- Missing required properties — manual review
- Variable references (`Message('varName')` matching upstream writes) — manual review
- Business logic correctness

## Validate-then-fix loop

```bash
robomotion validate write-to-clipboard/    # exit 1, error report on stderr
# read the error, edit main.ts to fix, then:
robomotion validate write-to-clipboard/    # exit 0
```

## Common errors and fixes

| Error fragment | Fix |
|----------------|-----|
| `Unknown property 'inCode'` | Use `robomotion describe node <type>` to see the real property list. |
| `Node type X not found in pspec` | Use `robomotion get nodes <keyword>` to find the correct name. |
| `Invalid output port N` | Check node's output count with `robomotion describe node <type>`. |
| `Could not load pspec for Package` | Verify namespace spelling; use `robomotion get packages <keyword>`. |
| `the Flow Designer cannot read it` | Write the file as a declaration: one `@robomotion/sdk` import, every node inside the `create` callback, no spreads. See `creating-flow`'s `docs/reference/project-format.md`. |
| `several statements on one line` / `a whole block on one line` | Put each statement of the Function's `func` on its own line. See `creating-flow`'s `docs/reference/function-nodes.md`. |

## Pre-run checklist

- [ ] `robomotion validate` exits 0 — which also means the Designer can read the file and every Function is formatted
- [ ] **The path from the trigger reaches `Core.Flow.Stop`** (manual check — validate does not): follow the wires from the trigger; every path ends at the Stop, and a `Debug`/`Log` leaf hangs off the node *before* the last step, never beside the Stop. No Stop at all is right for exactly two kinds of flow: an app backend (`Robomotion.Apps.Action`, every path ends at `App Respond`) and a chat flow (`Robomotion.ChatAssistant.ChatIn`, every turn ends at `Chat Out`)
- [ ] Loops have Goto→Label wiring (manual check)
- [ ] Required properties set (manual check)
- [ ] Port numbers correct for multi-output nodes

## Related Skills

- `creating-flow` — generate a flow
- `running-flow` — execute after validation
- `searching-packages` — find correct node types / packages
