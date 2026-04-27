---
name: creating-flow
description: "Creates Robomotion automation flows with the @robomotion/sdk TypeScript builder. Handles the full workflow: requirements → plan → build → validate → deploy. Also use when the user has a plan ready and wants the flow code written."
---

# Robomotion Flow Builder

Robomotion is an RPA platform with a TypeScript SDK and a visual node editor. This skill owns Robomotion 101 — SDK grammar, core principles, canonical examples — and covers the end-to-end flow lifecycle: requirements → plan → build → validate → deploy.

Pattern and reference docs ship inside this skill under `./docs/`. Read them directly when a topic comes up.

## Required First Line

Every flow file (`main.ts` and every `subflows/*.ts`) MUST start with this exact import — copy it verbatim, even helpers you don't currently use:

```ts
import { flow, Message, Custom, JS, Global, Flow, Credential, AI } from '@robomotion/sdk';
```

For library files, swap `flow` for `library`/`subflow` as appropriate but keep every helper imported.

Bun does not warn on unused imports. Always import every scope helper, even if your current draft only uses some of them. Forgetting a helper that you reference later in the body is the **#1 cause of `robomotion build` failure** — it surfaces as a raw `ReferenceError: <Helper> is not defined` thrown out of the bundled flow with no TS hint.

Full reference: `./docs/reference/imports.md` — one screen listing every helper and a minimal example.

## Core Principles

1. **Import from `@robomotion/sdk` only** — `flow`, `Message`, `Custom`, `JS`, `Global`, `Flow`, `Credential`, `AI` (see Required First Line above; import all helpers verbatim)
2. **`f.node(id, type, name, props)`** — correct param order, 6-char hex IDs
3. **Only non-default properties** — Go runtime fills ALL defaults from pspec. *Pspec is the source of truth; emitting defaults shadows future schema changes.*
4. **`Message()` for variables, `Custom()` for literals, `JS()` for one-liner Javascript, `Credential()` for secrets**
5. **`func` is literal string** (NOT `JS()`), enum props are plain strings (NOT `Custom()`)
6. **Loops: Label -> ForEach -> body -> GoTo** — visual flows have no implicit loop
7. **Verify before coding** — use `robomotion describe node <type>` (or `robomotion search <query>`) to get schemas, NEVER guess property names. *Guessed names fail validation silently when the real property has a different scope or casing.*
8. **Self-contained flows** — NEVER use bash to create dirs/files; use `Core.FileSystem.Create`
9. **`addDependency` for non-`Core.*` packages** — every non-`Core.*` package needs `f.addDependency(ns, ver)`. When updating existing flows: NEVER change existing versions, only add missing ones with latest. *Without `addDependency`, the Designer shows an empty version field and the robot can't resolve the package.*
10. **NEVER use `ScrapeList` or `ScrapeTable`** — `Core.Browser.ScrapeList` and `Core.Browser.ScrapeTable` are unreliable. Use `Core.Browser.RunScript` to extract data in Data Table format instead.
11. **ES5 only in `func`** — no `=>`, no `` ` ``, no `const`/`let`, no destructuring. Use `var`, `function()`, string concat (`+`)
12. **Function nodes are NOT Node.js** — no `require()`, `fs`, `Buffer`, `process`. Pure JS sandbox only
13. **`Core.Programming.If` does NOT exist** — use `Core.Programming.Function` with `outputs: 2` for conditionals
14. **Terminal nodes have 0 outputs** — `Debug`, `Log`, `Stop`, `GoTo`, `End`, `WaitGroup.Done` cannot chain `.then()` AFTER them. You can wire TO them; NEVER FROM them. In loops: GoTo ends the body chain — Stop must be a standalone `f.node()` wired via `f.edge()` on ForEach port 1. *The builder throws "Cannot chain from node (outputs=0)" at compile time, so any chained Debug inside a body breaks the whole flow.*
15. **Common properties use literal values** — `delayBefore: 2`, `delayAfter: 0.5`, `continueOnError: true` — NOT `Custom()`
16. **System variables only work in `global.get()`** — `$Home$`, `$TempDir$` must be resolved via `global.get('$Home$')` in Function nodes
17. **Library projects use `library.create()`** — Begin/End nodes, not `flow.create()` with Inject/Stop
18. **GoTo is `Core.Flow.GoTo`** (capital T) — uses `optNodes: { ids: [...], type: 'goto', all: false }`, NOT `inLabel`

## Common Mistakes

### Syntax
| Mistake | Consequence | Fix |
|---------|-------------|-----|
| `f.node('id', 'Start', {type: '...'})` | Wrong param order | `f.node(id, type, name, props)` |
| `func: JS(\`return msg;\`)` or `func: Custom(\`...\`)` | Validation fails | `func: \`return msg;\`` (literal string) |
| `optType: Custom('directory')` | OnCreate failure, empty flow_id | `optType: 'directory'` (plain string) |
| `delayAfter: Custom('2')` | Parse error | `delayAfter: 2` (literal value) |
| Missing `return msg;` in func | Data lost, next node gets nothing | Always `return msg;` |
| Arrow functions / template literals in `func` | Sandbox parse error | Use `var`, `function()`, string concat (`+`) |
| `require('fs')` in Function | Runtime crash | Use `Core.FileSystem.*` nodes |

### Terminal chaining
| Mistake | Consequence | Fix |
|---------|-------------|-----|
| Chain `.then()` after Debug/Log/Stop/GoTo/End | Compile error (`lastNode.outputs === 0`) | Wire TO terminals; attach Debug/Log via `f.edge()` from a non-terminal |
| Missing Goto in loop | Loop runs once | Label → ForEach → body → GoTo |
| `inLabel` on GoTo node | Property doesn't exist | `optNodes: { ids: [...], type: 'goto', all: false }` |
| `Core.Programming.If` | Node doesn't exist | `Core.Programming.Function` with `outputs: 2` |

### Credentials
| Mistake | Consequence | Fix |
|---------|-------------|-----|
| Writing credential code without loading doc | Wrong `Credential()` pattern | Read `./docs/patterns/credentials.md` FIRST |
| Using `optApiKey` vs `inCredentials` wrong | Auth failure | Verify with `robomotion describe node <type>` first |
| Missing `optCredentials` on `Core.Vault.GetItem` | "Vault has to be selected" error | `optCredentials: Credential({vaultId, itemId})` REQUIRED |

### System variables / scope
| Mistake | Consequence | Fix |
|---------|-------------|-----|
| `inPath: Custom('$Home$/file.xlsx')` | Literal string, not resolved | `global.get('$Home$') + '/file.xlsx'` in Function node |
| `ScrapeList` / `ScrapeTable` | Unreliable | Use `RunScript` returning `{ columns, rows }` JSON |

### Library vs flow
| Mistake | Consequence | Fix |
|---------|-------------|-----|
| Using Inject/Stop in Library | Library won't work | Use Begin/End — libraries are subflows |
| Using `flow.create()` in Library | Library won't compile | Use `library.create(id, name, fn)` |

### Dependencies
| Mistake | Consequence | Fix |
|---------|-------------|-----|
| Missing `addDependency` for non-Core | Empty version in Designer | `f.addDependency('Ns', 'vN.N.N')` |
| Bumping existing `addDependency` version | Breaks pinned dependency | NEVER change existing versions |

### Wrong node names
| Mistake | Consequence | Fix |
|---------|-------------|-----|
| Any wrong node name (CSV.Read, Flow.Goto, Programming.Log/RandomSleep, Browser.Click/Type/GetCookie, …) | Node not found, schema lookup fails | See `./docs/reference/node-naming.md` |

## Per-Turn Reminders

The drift-prone rules to re-check before EVERY `Write`/`Edit` that emits flow code:

- **NEVER output TypeScript as chat text** — always use `Write`/`Edit`. Natural-language plans and explanations stay in chat.
- `f.node(id, type, name, props)` — param order. `.then()` for sequential, `.edge()` for multi-port.
- `Message(variable)` for variables · `Custom(literal)` for literals · `Credential({vaultId, itemId})` for secrets · `func` is a literal string (not `JS()`) · enum props are plain strings (not `Custom()`).
- Loops require `Label → ForEach → body → GoTo(label_id)`. GoTo is terminal; `Stop` hangs off ForEach port 1 via `f.edge()`.
- Every flow ends with `.start()` (libraries use `library.create()` and omit `.start()`).
- **GoTo/Label pairing**: if you place any `Core.Flow.GoTo`, confirm a `Core.Flow.Label` node with the matching id exists in this same flow file (or in the subflow you're inside). A GoTo to a non-existent or non-Label id is the #2 cause of mid-turn iteration. (Loops are still wired `Label → ForEach → body → GoTo`; this catches the *standalone* GoTo case — early-exit, retry jumps — where the Label is forgotten.)

## Quick Reference Map

Pattern docs live on disk under `./docs/`. Read them directly.

| Topic | File |
|-------|------|
| SDK syntax & grammar (incl. terminal nodes) | ./docs/sdk-grammar.md |
| Architecture | ./docs/architecture.md |
| Loop patterns | ./docs/patterns/loops.md |
| Conditions | ./docs/patterns/conditions.md |
| Credentials | ./docs/patterns/credentials.md |
| Browser automation (incl. proxy) | ./docs/patterns/browser.md |
| Exception handling | ./docs/patterns/exceptions.md |
| Branches & parallel | ./docs/patterns/branches.md |
| Subflows | ./docs/patterns/subflows.md |
| Data tables | ./docs/patterns/data-tables.md |
| Captcha solving | ./docs/patterns/captcha.md |
| Imports (every scope helper + example) | ./docs/reference/imports.md |
| System variables | ./docs/reference/system-variables.md |
| Node naming (wrong → correct) | ./docs/reference/node-naming.md |
| Credential categories (field layouts) | ./docs/reference/credential-categories.md |

For schemas, examples, and package docs use the `robomotion` CLI:

| Need | Command |
|------|---------|
| Cross-source fuzzy/semantic search | `robomotion search <query>` |
| List / filter packages | `robomotion get packages [query]` |
| List / filter nodes | `robomotion get nodes [query] [--in <ns>]` |
| List / filter templates | `robomotion get templates [query] [--category <name>] [--tag <name>]` |
| Full node schema + docs + example | `robomotion describe node <type>[,<type>...]` |
| Package info | `robomotion describe package <namespace>` |
| Template source | `robomotion describe template <slug>` |
| Package docs (llms.txt) | `robomotion docs <namespace>` |

> **Public templates repo.** The canonical source of Robomotion's flow templates is [`github.com/robomotionio/robomotion-templates`](https://github.com/robomotionio/robomotion-templates). `robomotion get templates` / `robomotion describe template <name>` pull from there — browse the repo directly when you want to read full `main.ts` files, see real-world patterns, or copy a template as a starting point. Prefer cloning/forking a matching template over building from scratch when one exists.

| Grep package docs | `robomotion docs <namespace> --grep <pattern>` |
| List vaults | `robomotion get vaults` |
| List items in a vault | `robomotion get vault-items <vault-id>` |
| List robots | `robomotion get robots` |

## CLI & MCP Servers

The Robomotion binaries live on `PATH` (Mac, Windows, Linux). Always call them by their bare name — never with absolute paths.

| Binary | Purpose |
|--------|---------|
| `robomotion` | Self-sufficient CLI. Builds, validates, runs, searches, inspects. See `robomotion help` for the full verb list. |
| `robomotion-browser-mcp` | MCP server for interactive browser exploration. Used inside the `exploring-browser` skill and via `mcp__browser__*` tools. |

No other MCP servers are required. `robomotion` shells out to `robomotion-sdk-mcp` internally for search-backed commands, and calls `api.robomotion.io` directly for run/stop/vault/robot operations.

### CLI verbs

| Verb | Purpose |
|------|---------|
| `robomotion build` | compile flow to merged JSON |
| `robomotion validate` | pspec-check without emitting JSON |
| `robomotion run` | submit + stream agent-mode events |
| `robomotion stop` | stop the flow currently running on a robot |
| `robomotion search` | fuzzy + semantic cross-source search |
| `robomotion get <resource>` | list / filter — packages, nodes, templates, categories, tags, vaults, vault-items, robots |
| `robomotion describe <resource>` | detailed view — node, package, template |
| `robomotion docs <namespace>` | read or grep llms.txt |
| `robomotion install` / `skills` / `version` | admin |

## Workflow

> **Line-1 rule.** `main.ts` MUST start with the canonical import line (every scope helper, even if you don't use them all yet — see "Required First Line" above):
>
> ```typescript
> import { flow, Message, Custom, JS, Global, Flow, Credential, AI } from '@robomotion/sdk';
> ```
>
> If line 1 is an arrow (`→`), a plan description, or a comment, delete it and start with the import. Never write diagrams, arrows, or pseudo-code to `main.ts` — that belongs in chat text, not the file.

### Direct Mode (non-interactive)

**If you are directly asked to write a flow** ("Write main.ts for X", "Generate a flow that does Y"), skip Steps 0–2 and jump to Step 3. Steps 0–2 are for interactive sessions only.

In direct mode:
1. Verify schemas with `robomotion describe node <type>[,<type2>...]` if unsure.
2. Write `main.ts` with the `Write` tool. If the flow uses `Core.Flow.SubFlow` nodes, write each subflow file at `subflows/{id}.ts` immediately — ID matches the SubFlow node's ID. Subflow files use `subflow.create(name, fn)` (NOT `flow.create()`), with `Core.Flow.Begin` → task nodes → `Core.Flow.End({sfPort: 0})`.
3. Call `validate_flow` — fix errors and re-validate.
4. Then call `save_flow` to persist. Without it, the Designer canvas does not update and the user sees nothing.

### Step 0: Gather Requirements (interactive)

1. **Credentials** — API keys/passwords? Use `robomotion get vaults` then `robomotion get vault-items <vault-id>`; pick the best match by service/item name and put it in the plan. Let the user *correct* if you picked wrong. Do NOT pepper them with `AskUserQuestion` option buttons to choose a vault item — just commit to a pick and move on.
2. **URLs/Endpoints** — confirm with user.
3. **Files** — input/output? The flow MUST create dirs with `Core.FileSystem.Create` (never bash).
4. **Iteration** — multiple items → ForEach loop with Goto→Label. Single item → simple chain.
5. **Error handling** — retry / skip / stop.

### Step 1: Discover

```bash
robomotion search "<what the flow should do>"       # unified fuzzy+semantic search
robomotion get nodes <keyword> [--in <namespace>]   # find specific nodes
robomotion get packages <keyword>                   # find a package
robomotion docs <namespace>                         # read llms.txt (auth + dos/don'ts)
```

`robomotion docs <namespace>` is MANDATORY for every non-`Core.*` package you use — it carries auth patterns and gotchas that aren't in node schemas.

### Step 2: Present Plan for Approval

Output the plan as **text content in chat** (not inside a tool call), then call `AskUserQuestion`:

```markdown
## Flow Plan: [Name]
### Requirements
- Credentials: [vault/item IDs]
- URLs: [targets]
- Files: [I/O paths]
- Pattern: [simple_chain / loop / conditional]
### Flow Structure
1. Start → Inject
2. …
### Packages: [list with nodes used]
```

Options: `"Build it"` | `"Modify plan"`. On "Build it", proceed to Step 3 immediately.

### Step 3: Write Flow

**Before writing code, read the 1–2 pattern docs most relevant to the task (they're bundled with this skill under `./docs/`):**

- `./docs/patterns/browser.md` — MANDATORY for any `Core.Browser.*` flow
- `./docs/patterns/loops.md` — ForEach/Label/GoTo
- `./docs/patterns/conditions.md` — Function with `outputs: 2`
- `./docs/patterns/credentials.md` — any `Credential()` usage
- `./docs/patterns/data-tables.md` — Excel / CSV / Sheets

Core rules are already above (Core Principles, Common Mistakes). Then verify property names with `robomotion describe node <type>[,<type>...]` before writing.

#### Write-step checklist

- [ ] Line 1 is `import { flow, Message, Custom, JS, Global, Flow, Credential, AI } from '@robomotion/sdk';` (every helper, even unused — Bun won't flag dead imports, and missing ones become runtime ReferenceErrors)
- [ ] Every helper used at SDK level (`Message(`, `Custom(`, `JS(`, `Global(`, `Flow(`, `Credential(`, `AI(`) is in the import line
- [ ] Every `Core.Flow.GoTo` references a `Core.Flow.Label` id that exists in this same flow file (loops or standalone jumps both)
- [ ] `f.addDependency(namespace, version)` for every non-`Core.*` package (add missing only — never bump existing)
- [ ] Loops: `Label → ForEach → body → GoTo`. `Stop` is standalone, wired via `f.edge()` on ForEach port 1. **GoTo/Debug/Log/Stop/End are terminal — NEVER `.then()` after them.**
- [ ] Every flow has a `Core.Flow.Stop` node
- [ ] Ends with `.start()` (libraries omit `.start()`)

#### SubFlow files

Use the canonical SubFlow example (see Canonical Examples below): `subflow.create(name, fn)` with `Begin` → nodes → `End(sfPort: 0)`. SubFlow node ID in the parent equals the subflow filename (no `subflow` property). No need to call `robomotion describe node` for Begin/End/SubFlow.

#### Browser flows — mandatory exploration

If the flow uses `Core.Browser.*`, you MUST explore the page before writing code. **Do this in the main session** — MCP servers are scoped to the main conversation, so `Agent` sub-agents cannot use `mcp__browser__*` tools.

Two ways to explore, in order of preference:

1. **Invoke the `exploring-browser` skill** via the `Skill` tool: `Skill(skill="exploring-browser", args="login to <url>")`. The skill uses `mcp__browser__*` directly, records a sequence with resolved XPaths, and returns JSON you convert to SDK code.
2. **Call `mcp__browser__*` tools inline** if you prefer not to branch into the skill. Minimum sequence: `browser_open` → `browser_navigate` → `browser_snapshot` → action tools (`browser_click`, `browser_type`) → `browser_snapshot` after every page change → `browser_close` to get the recorded sequence JSON.

> **Load schemas before the first call.** In Claude Code, `mcp__browser__*` tools are *deferred* — only their names are in the catalog until you pull the schema via `ToolSearch`. Invoking one cold sends empty/malformed JSON over stdio, which crashes `robomotion-browser-mcp` and blacklists ALL browser tools for the rest of the session (they stop appearing in `ToolSearch` results even though `claude mcp list` still says ✓ Connected — that's a fresh probe, not the session's dead pipe). Before your first `browser_*` call, run `ToolSearch query="select:mcp__browser__browser_open,mcp__browser__browser_navigate,mcp__browser__browser_snapshot,mcp__browser__browser_type,mcp__browser__browser_click,mcp__browser__browser_close"` (plus any others you need). If you've already crashed the server, only a Claude Code restart brings the tools back — the connection can't be reattached from inside the session. Agents on other runtimes should substitute their own MCP invocation style.

If the `browser` MCP server shows `failed` in `/mcp` (or `mcp__browser__*` tools don't surface in your catalog), stop and ask the user to restart Claude Code — do NOT fall back to guessing selectors from `curl` + HTML for production flows. A one-off, plain-HTML form is tolerable as a *last resort*, but verified selectors from a live browser are the norm.

#### Credentials

Read `./docs/patterns/credentials.md` MANDATORY before writing any `Credential()`. Key rule: `Core.Vault.GetItem` REQUIRES `optCredentials: Credential({vaultId, itemId})` — omitting it fails at runtime.

### Step 4: Validate (MANDATORY — must run BEFORE Step 5)

Call the `validate_flow` MCP tool. It compiles AND pspec-validates (catches wrong property names, scopes, types). Fix any errors → re-validate.

> **Order matters.** `save_flow` only runs the *compile* step internally — it will accept and push pspec-broken code straight to the canvas (wrong property names will silently mis-wire nodes, wrong scopes will not error until runtime). `validate_flow` is the only thing that catches that class of bug, and only if you run it BEFORE `save_flow`. Validating after save is meaningless: the broken code is already on the user's canvas.

### Step 5: Save (MANDATORY when `save_flow` is available — must run AFTER Step 4)

If the `save_flow` tool is registered (Designer / pi / Robomotion app context), you MUST call it before ending the turn. The Designer canvas is rendered from the flow's git remote, NOT from the local files in your sandbox — without `save_flow`, your edits are invisible to the user.

Do NOT call `save_flow` if Step 4 reported errors. Fix them first, re-validate, then save.

```
save_flow({
  flowPath: ".",                          // resolved against the workspace dir
  name: "<existing flow name>",           // keep what's already in flow.create(...)
  commitMessage: "<one-line what changed>"
})
```

Do NOT say "you can now see the updated flow on your canvas" without a successful `save_flow` in this turn — it is not on the canvas if you didn't save.

If `save_flow` is NOT registered (pure CLI / Claude Code context), use `git commit` + `git push` from inside `<flow-dir>` instead — the flow's per-project git remote is what the Designer pulls from either way.

### Step 6: Verify Browser Selectors (if browser flow)

Selectors are verified during exploration (Step 3). If the code changed (different selectors, new actions), re-run the exploration — either `Skill(exploring-browser)` or `mcp__browser__*` inline — against the current page to re-verify before running.

### Step 7: Run

```bash
robomotion run <flow-dir>                      # interactive robot picker
robomotion run <flow-dir> --robot <robot-id>   # scripted
```

Streams agent events until the flow ends; exit code reflects outcome. See the `running-flow` skill for the full validate → run → observe → fix loop.

## Canonical Examples

### Simple Chain

```typescript
import { flow, Message, Custom } from '@robomotion/sdk';

const myFlow = flow.create('main', 'Simple Flow', (f) => {
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
});

myFlow.start();
```

### Loop (ForEach with Goto->Label)

```typescript
import { flow, Message, Custom } from '@robomotion/sdk';

const myFlow = flow.create('main', 'Loop Flow', (f) => {
  f.node('42ec21', 'Core.Trigger.Inject', 'Start', {})
    .then('7dbafc', 'Core.Programming.Function', 'Setup', {
      func: `msg.items = [1, 2, 3]; return msg;`
    })
    .then('a06926', 'Core.Flow.Label', 'Next Item', {})
    .then('8e1c4b', 'Core.Programming.ForEach', 'For Each', {
      optInput: Message('items'),
      optOutput: Message('item')
    });

  // Loop body (port 0)
  f.node('d52f73', 'Core.Programming.Function', 'Process', {
    func: `console.log('Item:', msg.item); return msg;`
  })
    .then('c47e90', 'Core.Flow.GoTo', 'Continue', {
      optNodes: { ids: ['a06926'], type: 'goto', all: false }
    });

  f.edge('8e1c4b', 0, 'd52f73', 0);  // Port 0: loop body

  // After loop (port 1)
  f.node('5f2d18', 'Core.Flow.Stop', 'Stop', {});
  f.edge('8e1c4b', 1, '5f2d18', 0);  // Port 1: done
});

myFlow.start();
```

### Conditional (Function with outputs: 2)

```typescript
import { flow, Message } from '@robomotion/sdk';

const myFlow = flow.create('main', 'Conditional Flow', (f) => {
  f.node('42ec21', 'Core.Trigger.Inject', 'Start', {})
    .then('7dbafc', 'Core.Programming.Function', 'Check Value', {
      outputs: 2,
      func: `
        if (msg.value > 10) {
          return [msg, null];  // Port 0: true
        }
        return [null, msg];    // Port 1: false
      `
    });

  f.node('a06926', 'Core.Flow.Stop', 'True Branch', {});
  f.edge('7dbafc', 0, 'a06926', 0);

  f.node('d8b90a', 'Core.Flow.Stop', 'False Branch', {});
  f.edge('7dbafc', 1, 'd8b90a', 0);
});

myFlow.start();
```

### SubFlow (Begin/End/SubFlow pattern)

**Subflow file** (`subflows/7dbafc.ts`) — use `subflow.create()`, NOT `flow.create()`:

```typescript
import { subflow, Message } from '@robomotion/sdk';

subflow.create('My SubFlow', (f) => {
  f.node('42ec21', 'Core.Flow.Begin', 'Begin', {})
    // ← PLACEHOLDER: replace with actual task nodes (e.g. OpenLink+RunScript for browser, HttpRequest for API)
    .then('a3f21c', 'Core.Programming.Function', 'Process', {
      func: `msg.result = msg.input; return msg;`
    })
    .then('e4f6c8', 'Core.Flow.End', 'End', { sfPort: 0 });
});
```

**Parent flow** (`main.ts`) — SubFlow node ID must match the subflow filename:

```typescript
import { flow } from '@robomotion/sdk';

flow.create('main', 'Main with SubFlow', (f) => {
  f.node('inject', 'Core.Trigger.Inject', 'Start', {})
    .then('7dbafc', 'Core.Flow.SubFlow', 'My SubFlow', {})  // '7dbafc' → subflows/7dbafc.ts
    .then('stop', 'Core.Flow.Stop', 'Stop', {});
}).start();
```

Key rules: `subflow.create(name, fn)` (no ID, no `.start()`) • Begin (entry) → nodes → End (`sfPort: 0`) • SubFlow node ID = subflow filename (no `subflow` property needed)

### Error Handling (Catch pattern)

```typescript
import { flow, Message, Custom } from '@robomotion/sdk';

flow.create('main', 'Error Handling', (f) => {
  // Main flow
  f.node('42ec21', 'Core.Trigger.Inject', 'Start', {})
    .then('7dbafc', 'Core.Net.HttpRequest', 'Fetch', {
      optUrl: Custom('https://api.example.com/data'),
      optMethod: 'get',
      outBody: Message('response'),
    })
    .then('a06926', 'Core.Flow.Stop', 'Stop', {});

  // Error handler — STANDALONE node, NEVER chain with .then() from main flow
  f.node('c3f81b', 'Core.Trigger.Catch', 'Catch Error', {
    optNodes: { ids: ['7dbafc'], all: false }  // ids = GUIDs of nodes to monitor
  });
  f.node('d5e2a4', 'Core.Programming.Function', 'Handle Error', {
    func: `msg.errorMsg = msg.error || 'unknown'; return msg;`
  });
  f.node('e1f392', 'Core.Flow.Stop', 'Error Stop', {});
  f.edge('c3f81b', 0, 'd5e2a4', 0);
  f.edge('d5e2a4', 0, 'e1f392', 0);
}).start();
```

Key rules: `Core.Trigger.Catch` is a standalone trigger — `f.node()` only, NEVER `.then()` • `optNodes.ids` = array of monitored node GUIDs • `optNodes.all = true` catches ALL nodes in scope • connect with `f.edge()`, not `.then()`

## Related Skills

- `validating-flow` — schema validation
- `testing-flow` — behavioral tests
- `running-flow` — execute on robot
- `searching-packages` — find packages, nodes, templates
- `exploring-browser` — interactive browser automation
- `reversing-network` — convert a browser flow to HTTP after capturing traffic
