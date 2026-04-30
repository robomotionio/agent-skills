# Flow Build Workflow

End-to-end: requirements → plan → write → validate → save. This skill ends at save. Running the flow is owned by the `running-flow` skill — invoke it separately when the user explicitly asks to run.

The main `SKILL.md` references this doc; load it when you need the verbose body of any step.

## Direct mode (non-interactive)

If the user says "Write main.ts for X" or "Generate a flow that does Y", skip Steps 0-2 and jump to Step 3.

1. Verify schemas with `robomotion describe node <type>[,<type2>...]` if unsure.
2. Write `main.ts` with the `Write` tool. If the flow uses `Core.Flow.SubFlow` nodes, also write each subflow file at `subflows/<id>.ts` immediately — ID matches the SubFlow node's ID. Subflow files use `subflow.create(name, fn)` with `Core.Flow.Begin` → task nodes → `Core.Flow.End({sfPort: 0})`.
3. Call `validate_flow` — fix errors and re-validate.
4. Then call `save_flow` to persist. Without it, the Designer canvas does not update. **Stop here** — do not run the flow.

## Step 0: Gather requirements (interactive)

1. **Credentials** — API keys, passwords. Use `robomotion get vaults`, then `robomotion get vault-items <vault-id>`. Pick the best match by service/item name and put it in the plan. Let the user *correct* the choice if you picked wrong. Do NOT pepper them with `AskUserQuestion` option buttons.
2. **URLs/Endpoints** — confirm with user.
3. **Files** — input/output? The flow MUST create dirs with `Core.FileSystem.Create` (never bash).
4. **Iteration** — multiple items → ForEach loop with GoTo→Label. Single item → simple chain.
5. **Error handling** — retry / skip / stop.

## Step 1: Discover

```bash
robomotion search "<what the flow should do>"       # unified fuzzy + semantic search
robomotion get nodes <keyword> [--in <namespace>]   # find specific nodes
robomotion get packages <keyword>                   # find a package
robomotion docs <namespace>                         # read llms.txt (auth + dos/don'ts)
```

`robomotion docs <namespace>` is MANDATORY for every non-`Core.*` package you use — it carries auth patterns and gotchas that aren't in node schemas.

## Step 2: Present plan for approval

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
### Packages: [list with nodes used + versions]
```

Options: `"Build it"` | `"Modify plan"`. On "Build it", proceed to Step 3.

## Step 3: Write flow

**Before writing, read the 1-2 pattern docs most relevant to the task:**

- `./patterns/browser.md` — MANDATORY for any `Core.Browser.*` flow
- `./patterns/loops.md` — ForEach / Label / GoTo
- `./patterns/conditions.md` — Function with `outputs: 2`
- `./patterns/credentials.md` — any `Credential()` usage
- `./patterns/data-tables.md` — Excel / CSV / Sheets

Then verify property names with `robomotion describe node <type>[,<type>...]`.

### Write-step checklist

- [ ] Line 1 is `import { flow, Message, Custom, JS, Global, Flow, Credential, AI } from '@robomotion/sdk';` (every helper, even unused — Bun won't flag dead imports)
- [ ] All node IDs are 6-char lowercase hex (`/^[0-9a-f]{6}$/`). No semantic names. See `./reference/id-format.md`.
- [ ] Subflow node ID equals `subflows/<id>.ts` filename, exactly.
- [ ] `f.addDependency(namespace, version)` for every non-`Core.*` package — version is concrete (never `'latest'`). Check existence with `robomotion get packages <ns>` first. **Never** call `addDependency` for `Core.*` namespaces — they are embedded in the robot and auto-loaded.
- [ ] Every `Core.Flow.GoTo` references a `Core.Flow.Label` id that exists in this same flow file.
- [ ] Loops: `Label → ForEach → body → GoTo`. `Stop` is standalone, wired via `f.edge()` on ForEach port 1.
- [ ] Terminal nodes (`Debug`, `Log`, `Stop`, `GoTo`, `End`, `WaitGroup.Done`) have 0 outputs — wire TO them, never `.then()` after them.
- [ ] Every flow has a `Core.Flow.Stop` node.
- [ ] Ends with `.start()` (libraries omit `.start()`).

### SubFlow files

Use the canonical SubFlow example (see SKILL.md "Canonical Examples" or `./patterns/subflows.md`): `subflow.create(name, fn)` with `Begin` → nodes → `End(sfPort: 0)`. SubFlow node ID in the parent equals the subflow filename. No need to call `robomotion describe node` for Begin/End/SubFlow.

### Browser flows — mandatory exploration

If the flow uses `Core.Browser.*`, explore the page before writing code. **Do this in the main session** — MCP servers are scoped to the main conversation; `Agent` sub-agents cannot use `mcp__browser__*`.

Two ways to explore, in order of preference:

1. **Invoke the `exploring-browser` skill** via `Skill(skill="exploring-browser", args="login to <url>")`. It uses `mcp__browser__*` directly, records a sequence with resolved XPaths, and returns JSON you convert to SDK code.
2. **Call `mcp__browser__*` tools inline.** Minimum sequence: `browser_open` → `browser_navigate` → `browser_snapshot` → action tools → `browser_snapshot` after every page change → `browser_close` to get the recorded sequence JSON.

> **Load schemas before the first call.** In Claude Code, `mcp__browser__*` tools are *deferred* — only their names are in the catalog until you pull schemas via `ToolSearch`. Invoking one cold sends empty/malformed JSON over stdio, which crashes `robomotion-browser-mcp` and blacklists ALL browser tools for the session. Before your first `browser_*` call:
>
> ```
> ToolSearch query="select:mcp__browser__browser_open,mcp__browser__browser_navigate,mcp__browser__browser_snapshot,mcp__browser__browser_type,mcp__browser__browser_click,mcp__browser__browser_close"
> ```
>
> If you've already crashed the server, only a Claude Code restart brings the tools back.

If `browser` MCP shows `failed` in `/mcp`, stop and ask the user to restart Claude Code — do NOT fall back to guessing selectors from `curl` + HTML for production flows.

### Credentials

Read `./patterns/credentials.md` MANDATORY before writing any `Credential()`. Key rule: `Core.Vault.GetItem` REQUIRES `optCredentials: Credential({vaultId, itemId})` — omitting it fails at runtime.

## Step 4: Validate (MANDATORY — must run BEFORE Step 5)

Call the `validate_flow` MCP tool. It compiles, pspec-validates (catches wrong property names, scopes, types), and now also validates `f.addDependency()` against the live package index. Fix any errors → re-validate.

> **Order matters.** `save_flow` only runs the *compile* step internally — it accepts and pushes pspec-broken code straight to the canvas. `validate_flow` is the only thing that catches that class of bug, and only if you run it BEFORE `save_flow`. Validating after save is meaningless.

## Step 5: Save (MANDATORY when `save_flow` is available — must run AFTER Step 4)

If `save_flow` is registered (Designer / pi / Robomotion app context), you MUST call it before ending the turn. The Designer canvas is rendered from the flow's git remote, NOT from the local files.

Do NOT call `save_flow` if Step 4 reported errors. Fix them first, re-validate, then save.

```
save_flow({
  flowPath: ".",                          // resolved against the workspace dir
  name: "<existing flow name>",           // keep what's already in flow.create(...)
  commitMessage: "<one-line what changed>"
})
```

Do NOT say "you can now see the updated flow on your canvas" without a successful `save_flow` in this turn.

If `save_flow` is NOT registered (pure CLI / Claude Code context), use `git commit` + `git push` from inside `<flow-dir>` instead — the per-project git remote is what the Designer pulls from.

## Step 6: Verify browser selectors (if browser flow)

Selectors are verified during exploration (Step 3). If the code changed (different selectors, new actions), re-run the exploration against the current page to re-verify **before saving**.

## End of workflow

After a successful `save_flow` (or `git push`), the create-flow lifecycle is **complete**. Report what changed and stop. Do NOT call `robomotion run`, `RemoteTrigger`, or any other run path on your own — running a flow is a separate user request, handled by the `running-flow` skill. Wait for the user to ask.
