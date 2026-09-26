---
name: running-flow
description: Validates locally (`robomotion validate`) then executes a Robomotion flow on a robot (`robomotion run <flow-dir>`), tailing the agent-mode JSONL session log to drive a validate → run → observe → fix loop with bounded retries. Use when the user says "run the flow", "start on robot X", "trigger this on the robot", "test on a robot", or "deploy and run".
---

# Running a Robomotion Flow

Run a flow on a robot, watch the agent-mode event stream, react to failures. Four moving parts:

1. **Pre-flight** — `robomotion validate <flow-dir>` catches pspec/schema errors locally in <1s before you ever submit. Cheap; always do it first.
2. **A robot** — the person's own, connected on this computer (Robomotion's Desktop App, or `robomotion robot connect` when the person agrees). `robomotion get robots` shows which are connected.
3. **Trigger** — `robomotion run <flow-dir> --robot <name>` builds locally, submits, and streams the event log.
4. **Observation** — `run` tails the JSONL session log; `robomotion logs --last` reads it again. A run is done at its `flow_end` (or `flow_error`) event; an `agent_mode` start/end pair may bracket it, but do not wait for one.

**A flow that starts at `Robomotion.ChatAssistant.ChatIn` is not run here.** Nothing would send it a message; it would wait until `--timeout`. Test it as an Agent in the real chat page with the `running-chat-assistant` skill (`robomotion agent`).

**No browser: the log is the only oracle for a flow.** A flow has no screens, so nothing shows you whether it worked but the robot's events. Read them; never say a run worked without a `flow_end status=success` in them.

## Step 1 — Validate (mandatory pre-flight)

```bash
robomotion validate <flow-dir>           # exit 0 = pspec-clean, 1 = errors on stderr
```

Catches every "wrong property name", "non-existent node type", "invalid port" before any robot-side work. The CLI rebuilds + validates without emitting JSON. **Don't skip it** — diagnosing a pspec error from a `node_error` event in the run log is much slower than reading the validate output.

If validate fails: read stderr, fix `main.ts`, re-run validate. Loop until exit 0, then proceed.

> `robomotion run` also validates as part of its build step, so a bad flow won't reach the robot — but you'll find out *after* the network round-trip and `Submitting flow for execution...` spinner. Validate first.

## Step 2 — The robot is the person's

A flow runs on one of the person's own robots. `robomotion run` follows the run by reading the log the robot writes on its own machine, so the robot has to be connected **on this computer**. Usually the Desktop App already has it connected.

```bash
robomotion get robots        # which robots exist, and which are connected right now
```

The first time in a project, ask the person which robot, **once**, in one short question, unless they already said; then pass it as `--robot <name>`. The CLI remembers the choice in the project's `.robomotion/run.json`, so every later `robomotion run` in that folder needs no flag. When no robot is known and there is no terminal to ask in, `run` prints the robots and exits 3: that is your cue to ask, not to guess. (Exit 3 has a second meaning, below: the run went to a robot on another machine.)

The robot writes its event log on its own machine (`~/.config/robomotion/agent/logs/sessions/<studio_id>.jsonl`); `robomotion run` follows it when the robot is on this computer.

**When no robot of theirs is connected here** (the Desktop App is not running, or this is a server), ask the person once, then connect one here as them:

```bash
robomotion robot connect --robot "<name>"   # one of their Development/Production robots; remembered for this folder
robomotion robot status                     # what `robot connect` has running here
robomotion robot disconnect                 # when they are done
```

It connects the robot the way the Desktop App does, with their login; it never makes a new robot or a new token, and it refuses an agent's or an app's robot (those start with `robomotion agent start` / `robomotion app start`). Needs robomotion 26.9.8 or later.

## Step 3 — Trigger the run

```bash
robomotion run <flow-dir> --robot <name|id>        # the choice is remembered in .robomotion/run.json
robomotion run <flow-dir>                          # next time: the remembered robot (a picker when there is a terminal)
robomotion run                                     # defaults to main.ts in cwd
```

The CLI accepts either a flow directory (resolves to `main.ts` inside) or a `.ts` file. It:

1. Builds the flow (validates against pspec; fails fast on errors).
2. Resolves the robot (`--robot`, then `.robomotion/run.json`).
3. `POST /v1/flows.agent.run` with a fresh `studio_id` (printed as `Session` on success).

**Prereqs:** Step 1 (validate) clean; the project signed in (`robomotion auth whoami`; `robomotion create flow` did this, otherwise `robomotion auth login --workspace <host>`); the robot connected (Step 2).

## Step 4 — Observe the agent event stream

`robomotion run` **follows** the stream by default — it tails a session log file the deskbot writes at:

```
~/.config/robomotion/agent/logs/sessions/<studio_id>.jsonl           (Linux/macOS)
%LOCALAPPDATA%\Robomotion\agent\logs\sessions\<studio_id>.jsonl      (Windows)
```

Events are compact one-line JSON. The run is over at `flow_end` (or `flow_error`); the stream may stop right there, with no `agent_mode end` line after it. Example:

```
{"event":"agent_mode","status":"start"}
{"event":"flow_start","flow":"Imported Write To Clipboard","version":"local","origin":"agent"}
{"event":"node_start","node":"Start"}
{"event":"node_end","node":"Start"}
{"event":"node_start","node":"Get Clipboard Data"}
{"event":"node_end","node":"Get Clipboard Data","duration_ms":4780}
{"event":"flow_end","status":"success","duration_ms":8852}
{"event":"agent_mode","status":"end"}
```

Exit codes from `robomotion run`:

| Code | Meaning |
|-----:|---------|
| `0` | `flow_end status=success` |
| `1` | `flow_end status=error` or `flow_error` |
| `2` | Tail timeout (session still running) — raise `--timeout` or re-read the log file |
| `3` | Either **no robot was chosen** (no `--robot`, none remembered, no terminal to ask in — the robots are listed; ask the person which one), or **the run was submitted but its log never appeared here** — the robot is on another machine, so its log lives there. In that second case the run still proceeds on the robot; check the Flow Designer for progress. Read the output to tell which. |

Flags: `--no-follow` (fire-and-forget, no stream), `--log-wait <s>` (how long to wait for the file to appear, default 5), `--timeout <s>` (overall follow budget, default 300).

### Event reference

| Event | Fields | Meaning |
|-------|--------|---------|
| `agent_mode` | `status: "start" \| "end"` | May bracket the run. Not always written, and `robomotion logs` does not show it — never wait for it. |
| `flow_start` | `flow`, `version`, `origin` | Flow started. `version` is `local` for `robomotion run`; `origin` is who started it (`"agent"` for `robomotion run`). |
| `flow_end` | `status: "success" \| "error"`, `duration_ms`, `error?` | Flow finished — the run is done. |
| `flow_error` | `error`, `node?`, `node_id?`, `duration_ms` | Unhandled flow-level error — the run is done. |
| `node_start` | `node` | Node entered. |
| `node_end` | `node`, `duration_ms?` | Node completed. `duration_ms` is absent on some nodes (the trigger's, for one); don't rely on it. |
| `node_error` | `node`, `error`, `duration_ms` | Node threw — your signal to fix. |
| `log` | `node?`, `level`, `msg` | `Core.Flow.Log` output. |
| `debug` | `node`, `msg` | `Core.Programming.Debug` payload (truncated to 255 bytes per field). |
| `connected` | `msg` | Robot registered with the workspace. |
| `ready` | — | Robot ready to accept commands. |

### Re-reading after the run

`robomotion run` consumes the log while streaming. The file persists afterwards; `robomotion logs` reads it back, filtered to the events a person reads (`flow_start`, `node_*`, `log`, `debug`, `flow_error`, `flow_end` — no `agent_mode` lines). The first line is a `log: <path>` header naming the file it read:

```bash
robomotion logs --last               # the newest run's events
robomotion logs --studio <id>        # one run, by the Session id `run` printed
robomotion logs --last -f            # follow a run still going
robomotion logs --last --raw         # every line, for jq
```

## Step 5 — The validate → run → observe → fix loop

Target autonomous iteration (bounded retries; stop on user request):

1. **Validate locally**: `robomotion validate <flow-dir>` — must exit 0 before submitting. If non-zero, fix `main.ts` from the stderr report and repeat this step (do NOT submit a known-broken flow).
2. **Submit**: `robomotion run <flow-dir> --robot <name>` (the flag only the first time) — capture the `Session` id.
3. **Stream**: `run` tails the agent log automatically until `flow_end` / `flow_error`; `robomotion logs --last` reads it again.
4. **Classify**:
   - `flow_end status=success` (CLI exit 0) → report, **offer to open what it produced** (below), and stop.
   - `node_error` or `flow_error` (CLI exit 1) → inspect `error` + `node`, fix `main.ts`, **back to step 1**. Max 3 retries without asking the person.
   - Timeout (CLI exit 2) → flow may still be running on the robot; report and ask.
   - CLI exit 3 → read the output. No robot chosen: the robots are listed; ask which one, then `--robot <name>`. Log unreachable: the robot is on another machine and its log is there; say so, and ask the person what the robot showed, or watch progress in the Flow Designer.
5. Between retries, keep mock/test fixtures stable so a passing run actually proves the fix.
6. **Save** when a fix made it pass: `git add -A && git commit -m "..." && git push` in the flow folder (`commit -am` misses new files, such as a new `subflows/<id>.ts`). The Designer shows what was pushed. A run rewrites `main.designer.ts` (the canvas layout) — commit it together with `main.ts`. A run that passed with no change needs no save when the flow was already saved before it ran. When it was not — the person asked to build it, run it, and save it once it works — save now, after the green run: that save is the last step of the job.

### After a successful run: offer to open what it produced

A run that writes a file has not finished for the person until they have seen
it. Naming the file and leaving them to go and find it is a step short: they
asked for a spreadsheet, they watched it being made, and the obvious next thing
is to look at it.

So when a successful run wrote something (a spreadsheet, a CSV, a PDF, a
downloaded document), say where it is **and offer to open it**:

> Created `web_table.xlsx` in your Downloads folder with all 6 rows. Want me to
> open it?

If they say yes, open it on their computer. Robomotion runs on Linux, macOS and
Windows, so pick the opener by platform rather than assuming one:

```bash
# Linux
xdg-open "<path>"
# macOS
open "<path>"
# Windows
start "" "<path>"        # cmd;  PowerShell: Start-Process "<path>"
```

Rules:

- **Offer, never open by yourself.** A file appearing on someone's screen
  because a step finished is a surprise, not a result. It is one question.
- **Only what this run actually produced**, and only when you know the path -
  the flow wrote it, so you do. Never guess a path or open a folder instead.
- **Only in a conversation.** A run somebody is watching earns the offer; a
  scheduled or headless run has nobody there and must not open anything.
- **When you cannot ask, show it instead.** Running non-interactively (a
  one-shot `claude -p`, a CI job, no question tool) there is nobody to answer
  the offer, so don't end on a question: show what the run produced in your
  report — print a text or CSV file (`cat`, or `head -n 20` for a long one),
  the rows of a spreadsheet you read back — and give its full path. Still
  never open a window.
- **A failure to open is not a failure of the run.** If the opener is missing or
  the desktop is not available (a server, an SSH session), say the run worked
  and give the full path. Never let it turn a green run red.

### Common `node_error` patterns

| `error` fragment | Likely cause | Fix |
|------------------|--------------|-----|
| `Cannot read property 'X' of undefined` | Upstream node didn't set `msg.X` | Check the writing node's `out*` property; verify `Message('X')` upstream. |
| `Network timeout` / `ETIMEDOUT` | URL unreachable from robot | Confirm URL, raise timeout, check proxy. |
| `element not found` / selector failure | Stale selector | Re-run `exploring-browser` and update `inSelector`. |
| `property not found in pspec` | Invalid property name | `robomotion describe node <type>` to verify the schema. |
| `Vault has to be selected` | Missing `optCredentials` on `Core.Vault.GetItem` | Add `optCredentials: Credential({vaultId, itemId})`. |

## Other useful CLI verbs

- `robomotion get robots` — list available robots (same data the interactive picker uses).
- `robomotion logs [--last | --studio <id>] [-f]` — the events of a run, again.
- `robomotion stop --robot <robot-id>` — stop whatever flow is running on a robot.
- `robomotion get vaults` / `robomotion get vault-items <vault-id>` — credentials available to your workspace.

## Quick errors and fixes

| Message | Cause | Fix |
|---------|-------|-----|
| `Not logged in to Robomotion in this project` | The folder has no login | `robomotion auth login --workspace <host>` in the project folder (run it in the background; the person approves in the browser). |
| `No main.ts found in directory: <path>` | Wrong dir or missing main.ts | Point at a directory that contains `main.ts`. |
| `Flow validation failed` | pspec violation at build time | Fix errors (use `validating-flow` for a detailed report) and re-run. |
| `No robot named "<x>"` / `No robot chosen` (exit 3) | Wrong name, or none given without a terminal | `robomotion get robots`, ask the person which one, `--robot <name>`. |
| `No robots in this workspace` | No robots registered | Ask the person to create one in Robomotion and start it on their computer. |
| Run submits but no `flow_start` appears | Robot offline or in another workspace | `robomotion get robots`; ask the person to start their robot, or (with their yes) `robomotion robot connect --robot "<name>"`. |
| `Couldn't follow the flow here — no log appeared` (exit 3) | The robot is on another computer | The run still happened there. To follow runs here: `robomotion robot connect --robot "<name>"` on this computer. |

## Developing a package against the flow

When a fix belongs in a package the flow uses (its source is on this computer), run the package from its source tree instead of publishing it:

```bash
robomotion package dev <package source folder> [--version <the version main.ts depends on>]
robomotion run                       # the robot now starts the package from source
robomotion package off <package source folder>   # back to the installed build
robomotion package status
```

A Python package runs from `<source>/.venv` (made on the first `dev`), so an edit is live on the next run; run `package dev` again after an edit if a flow keeps the package running. Other languages are rebuilt with the package's own build commands on each `package dev`. A package's full traceback is in the robot's output, not in the run's event stream. Run the package's own tests before calling a fix good. When it is released, bump `f.addDependency(...)` to the published version and `package off`. Needs robomotion 26.9.8 or later.

## Related Skills

- `creating-flow` — generate the flow
- `running-chat-assistant` — a flow that starts at Chat In: run and test it as an Agent in the chat page
- `validating-flow` — schema check (local, no robot needed)
- `testing-flow` — behavioral tests with mocks (no robot needed)
