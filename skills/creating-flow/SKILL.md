---
name: creating-flow
description: "Creates Robomotion automation flows with the @robomotion/sdk TypeScript builder. Owns the full lifecycle: requirements → plan → build → validate → deploy. Also use when the user has a plan ready and wants the flow code written."
---

# Robomotion Flow Builder

Robomotion is an RPA platform with a TypeScript SDK and a visual node editor. This skill is a thin index over the reference docs in `./docs/`. Read the relevant doc when a topic comes up — don't try to memorize it from this file.

## Hard Rules (SDK rejects violations at validate time)

The SDK enforces these. Violations throw at `robomotion validate` / `build` with descriptive messages, so the agent never silently produces broken flows:

1. **Node IDs MUST be 6-char lowercase hex** — `/^[0-9a-f]{6}$/`. `f.node()`, `.then()`, `f.edge()` reject non-hex IDs (`'begin'`, `'label'`, `'maps'`, uppercase) at registration. Pick fresh hex per node. See `./docs/reference/id-format.md`.
2. **Subflow node ID = `subflows/<id>.ts` filename, exactly.** Both must be 6-hex. The Designer's "enter subflow" UX depends on the match.
3. **`f.addDependency(namespace, version)` is validated against the live package index.** `version` must be concrete (`'latest'` is rejected) and must exist in the package's published `versions` list. `namespace` must exist in `https://packages.robomotion.io/stable/index.json`. Run `robomotion get packages <ns>` or `robomotion describe package <ns>` to resolve real versions before calling `addDependency`. Never invent a version.
4. **Terminal nodes (`Debug`, `Log`, `Stop`, `GoTo`, `End`, `WaitGroup.Done`) have 0 outputs** — wire TO them via `f.edge()`, never `.then()` from them.
5. **Every `Core.Flow.GoTo` references a `Core.Flow.Label` id that exists in the same flow file.**

## Required First Line

Every flow file (`main.ts` and every `subflows/*.ts`) starts with this exact import — copy verbatim, including helpers you don't currently use (Bun won't flag dead imports, but missing ones become runtime `ReferenceError`):

```ts
import { flow, Message, Custom, JS, Global, Flow, Credential, AI } from '@robomotion/sdk';
```

For library files swap `flow` for `library` / `subflow`. Full reference: `./docs/reference/imports.md`.

## Builder grammar

- `f.node(id, type, name, props)` — param order. Only emit non-default props (Go runtime fills defaults from pspec).
- `.then()` for sequential, `.edge()` for multi-port wiring.
- `Message(name)` for variables · `Custom(literal)` for literal strings · `JS(expr)` for one-line JS · `Credential({vaultId, itemId})` for secrets.
- `func` is a literal string (NOT `JS()`). Enum props are plain strings (NOT `Custom()`).
- Common node props are literal values: `delayBefore: 2`, `continueOnError: true`.
- ES5-only inside `func`: no `=>`, no template literals, no `const`/`let`, no destructuring. No `require()` / `fs` / `Buffer` / `process` (pure JS sandbox).
- Loops: `Label → ForEach → body → GoTo`. `Stop` is standalone, wired via `f.edge()` on ForEach port 1.
- Library projects use `library.create(id, name, fn)` with `Begin`/`End` nodes (no `.start()`). Inline subflows use `subflow.create(name, fn)`.
- Every flow ends with `.start()`. Every flow has a `Core.Flow.Stop` node.
- For non-`Core.*` packages, call `f.addDependency(ns, ver)`. When updating an existing flow, NEVER bump existing `addDependency` versions; only add missing ones.

Full grammar: `./docs/sdk-grammar.md`. Architecture: `./docs/architecture.md`.

## Diagnostic map

Map an error symptom to the doc that fixes it. When `validate_flow` fails, look up the symptom here before reading the full failure trace.

| Symptom | Likely cause | Fix |
|---|---|---|
| `[SDK] Invalid node ID '<x>' in f.node('<x>', …)` | Semantic / non-hex ID | `./docs/reference/id-format.md` — pick 6-hex |
| `[SDK] Invalid subflow filename '<x>.ts'` | Subflow filename non-hex | Rename file + update parent SubFlow node ID to match |
| `version must be concrete; 'latest' and empty are not allowed` | `f.addDependency(ns, 'latest')` | `robomotion describe package <ns>` → pin a real version |
| `package '<ns>' not found in repository` | Hallucinated namespace | `robomotion get packages <kw>` → use the real namespace |
| `version '<v>' is not published for <ns>` | Wrong version pinned | Pick from `available_versions` returned by validator |
| `Cannot chain from node (outputs=0)` | `.then()` after `Debug`/`Log`/`Stop`/`GoTo`/`End` | Wire TO terminals via `f.edge()`, never FROM them |
| `Invalid input port 0. Node has 0 input(s)` on a Label | Wired into `Core.Flow.Label` (Label has 0 inputs in some pspecs) | Use `Core.Flow.GoTo` with `optNodes.ids: [<labelId>]` to jump to the Label |
| `Vault has to be selected` at runtime | Missing `optCredentials` on `Core.Vault.GetItem` | `./docs/patterns/credentials.md` |
| `inLabel` property not found on GoTo | Wrong property | `optNodes: { ids: [...], type: 'goto', all: false }` |
| `Core.Programming.If` not found | Node doesn't exist | `Core.Programming.Function` with `outputs: 2` (`./docs/patterns/conditions.md`) |
| Wrong node name (e.g. `Core.CSV.Read`, `Browser.Click`) | Common naming mistake | `./docs/reference/node-naming.md` |
| `inPath: Custom('$Home$/file')` literal not resolved | System variables only resolve in Function nodes | `global.get('$Home$') + '/file'` (`./docs/reference/system-variables.md`) |
| Any CSV / Excel / Sheets / SQLite / Pandas / Airtable / DOMParser / DataTable node in scope | Custom data shape is wrong (e.g. `{header: [...]}`, rows as arrays) | **MANDATORY** read `./docs/patterns/data-tables.md` — the format is `{columns: [...], rows: [{key: value}]}` with row keys matching column names |
| Write produces empty cells / `ErrFilePath` / "table not recognized" | `header` instead of `columns`, or rows are arrays not objects | `./docs/patterns/data-tables.md` — the property is `columns`, never `header`; rows are objects keyed by column name, never positional arrays |

Drift-prone reminders before every `Write` / `Edit` of flow code:

- Never output TypeScript as chat text — always use `Write` / `Edit`. Plans and explanations stay in chat.
- Hex IDs from the start. Cross-references (`optNodes.ids`, `Catch.optNodes.ids`, subflow filenames) must use the same hex.
- For browser flows: explore the live page first (`Skill(exploring-browser)` or `mcp__browser__*` after `ToolSearch` warmup). Don't guess selectors.
- For any flow that touches CSV / Excel / Google Sheets / Excel 365 / SQLite / Airtable / Pandas / DataTable / DOMParser nodes — read `./docs/patterns/data-tables.md` BEFORE writing the Function that builds the table. The format is `{columns: [...], rows: [{key: value}]}`, never `{header: ...}` and never rows-as-arrays. Don't reason from the node name; the doc is the source of truth.
- Validate BEFORE save — `save_flow` only compiles, it does NOT pspec-validate.

## Pattern reference

Read these docs before writing the corresponding code:

| Pattern | Doc |
|---|---|
| Loops (Label → ForEach → body → GoTo) | `./docs/patterns/loops.md` |
| Conditions (Function with `outputs: N`) | `./docs/patterns/conditions.md` |
| Credentials (vault + categories) | `./docs/patterns/credentials.md` |
| Browser automation (incl. proxy) | `./docs/patterns/browser.md` |
| Exception handling (Catch, continueOnError) | `./docs/patterns/exceptions.md` |
| Branches & parallel (ForkBranch, WaitGroup) | `./docs/patterns/branches.md` |
| Subflows (Begin/End, multi-output) | `./docs/patterns/subflows.md` |
| Data tables (CSV / Excel / Sheets / SQLite / Pandas / Airtable / DOMParser / DataTable) — **MANDATORY** before writing any code that produces or consumes `msg.table` | `./docs/patterns/data-tables.md` |
| Captcha solving | `./docs/patterns/captcha.md` |

References:

| Topic | Doc |
|---|---|
| Imports (every scope helper + example) | `./docs/reference/imports.md` |
| Node ID format (the hex rule) | `./docs/reference/id-format.md` |
| System variables (`$Home$`, `$TempDir$`) | `./docs/reference/system-variables.md` |
| Node naming (wrong → correct) | `./docs/reference/node-naming.md` |
| Credential categories (field layouts) | `./docs/reference/credential-categories.md` |

For schemas, examples, and package docs, use the `robomotion` CLI (it's already on `PATH`, call it by bare name):

| Need | Command |
|---|---|
| Cross-source fuzzy/semantic search | `robomotion search <query>` |
| Find packages | `robomotion get packages [query]` |
| Find nodes | `robomotion get nodes [query] [--in <ns>]` |
| Find templates | `robomotion get templates [query] [--category <name>] [--tag <name>]` |
| Full node schema + docs + example | `robomotion describe node <type>[,<type>...]` |
| Package info (incl. published versions) | `robomotion describe package <namespace>` |
| Template source | `robomotion describe template <slug>` |
| Package docs (llms.txt) | `robomotion docs <namespace> [--grep <pattern>]` |
| List vaults / vault items | `robomotion get vaults` · `robomotion get vault-items <vault-id>` |
| List robots | `robomotion get robots` |

> **Public templates repo:** [`github.com/robomotionio/robomotion-templates`](https://github.com/robomotionio/robomotion-templates) is the canonical source. Prefer cloning/forking a matching template over building from scratch.

## Workflow

Full step-by-step: **`./docs/workflow.md`**. Outline:

0. **Gather requirements** (interactive only) — credentials (commit to a vault-item pick, don't quiz the user), URLs, files, iteration, error handling.
1. **Discover** — `robomotion search`, `robomotion get nodes`, `robomotion docs <namespace>` (MANDATORY for every non-`Core.*` package).
2. **Plan** — output plan as chat text, then `AskUserQuestion(["Build it", "Modify plan"])`.
3. **Write** — read 1-2 relevant `./docs/patterns/*.md`, verify property names with `robomotion describe node`, then `Write` `main.ts` (and any `subflows/<id>.ts`). For browser flows: explore live first.
4. **Validate** — call `validate_flow` MCP tool. Pspec-checks AND dependency-checks. MUST run BEFORE save.
5. **Save** — `save_flow` if registered (Designer / pi); else `git commit && git push` from inside the flow dir.
6. **(Browser) re-verify selectors** if code changed.
7. **Run** — `robomotion run <flow-dir>` or `--robot <robot-id>`.

If invoked in **direct mode** ("Write main.ts for X", "Generate a flow that does Y"), skip 0-2 and jump to 3.

## Canonical example (simple chain)

For loop / conditional / subflow / catch examples, see the corresponding pattern docs — they have richer working snippets.

```typescript
import { flow, Message, Custom } from '@robomotion/sdk';

flow.create('main', 'Simple Flow', (f) => {
  f.node('42ec21', 'Core.Trigger.Inject', 'Start', {})
    .then('7dbafc', 'Core.Programming.Function', 'Setup', {
      func: `msg.url = 'https://example.com'; return msg;`
    })
    .then('a06926', 'Core.Browser.Open', 'Open Browser', {
      outBrowserId: Message('browser_id')
    })
    .then('8e1c4b', 'Core.Browser.OpenLink', 'Navigate', {
      inBrowserId: Message('browser_id'),
      inUrl: Message('url'),
      outPageId: Message('page_id')
    })
    .then('d52f73', 'Core.Browser.Close', 'Close', {
      inBrowserId: Message('browser_id')
    })
    .then('b9a841', 'Core.Flow.Stop', 'Stop', {});
}).start();
```

## CLI & MCP

- `robomotion` — self-sufficient CLI. Builds, validates, runs, searches, inspects. `robomotion help` for the full verb list.
- `robomotion-browser-mcp` — MCP server for interactive browser exploration (used by `exploring-browser` and `mcp__browser__*` tools).

The `robomotion` CLI shells out to `robomotion-sdk-mcp` internally for search-backed commands and calls `api.robomotion.io` directly for run/stop/vault/robot operations. No additional MCP servers required.

## Related skills

- `validating-flow` — schema validation
- `testing-flow` — behavioral tests
- `running-flow` — execute on robot
- `searching-packages` — find packages, nodes, templates
- `exploring-browser` — interactive browser automation
- `reversing-network` — convert a browser flow to HTTP after capturing traffic
