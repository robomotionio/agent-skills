---
name: running-flow
description: Validates locally (`robomotion validate`) then executes a Robomotion flow on a robot (`robomotion run <flow-dir>`), tailing the agent-mode JSONL session log to drive a validate → run → observe → fix loop with bounded retries. Use when the user says "run the flow", "start on robot X", "trigger this on the robot", "test on a robot", or "deploy and run".
---

# Running a Robomotion Flow

Run a flow on a robot, watch the agent-mode event stream, react to failures. Four moving parts:

1. **Pre-flight** — `robomotion validate <flow-dir>` catches pspec/schema errors locally in <1s before you ever submit. Cheap; always do it first.
2. **A robot** — the person's own, already running (Robomotion on their computer, or a robot they run elsewhere). `robomotion get robots` shows which are connected. You never start one.
3. **Trigger** — `robomotion run <flow-dir> --robot <name>` builds locally, submits, and streams the event log.
4. **Observation** — `run` tails the JSONL session log; `robomotion logs --last` reads it again. Events are bracketed by `{"event":"agent_mode","status":"start"}` … `{"event":"agent_mode","status":"end"}`.

**No browser: the log is the only oracle for a flow.** A flow has no screens, so nothing shows you whether it worked but the robot's events. Read them; never say a run worked without a `flow_end status=success` in them.

## Step 1 — Validate (mandatory pre-flight)

```bash
robomotion validate <flow-dir>           # exit 0 = pspec-clean, 1 = errors on stderr
```

Catches every "wrong property name", "non-existent node type", "invalid port" before any robot-side work. The CLI rebuilds + validates without touching `*.designer.ts` or emitting JSON. **Don't skip it** — diagnosing a pspec error from a `node_error` event in the run log is much slower than reading the validate output.

If validate fails: read stderr, fix `main.ts`, re-run validate. Loop until exit 0, then proceed.

> `robomotion run` also validates as part of its build step, so a bad flow won't reach the robot — but you'll find out *after* the network round-trip and `Submitting flow for execution...` spinner. Validate first.

## Step 2 — The robot is the person's

A flow runs on a robot the person already has running: Robomotion on their computer, or a robot they keep elsewhere. You do not start, install or connect one.

```bash
robomotion get robots        # which robots exist, and which are connected right now
```

The first time in a project, ask the person which robot, **once**, in one short question, unless they already said; then pass it as `--robot <name>`. The CLI remembers the choice in the project's `.robomotion/run.json`, so every later `robomotion run` in that folder needs no flag. When no robot is known and there is no terminal to ask in, `run` prints the robots and exits 3: that is your cue to ask, not to guess.

The robot writes its event log on its own machine (`~/.config/robomotion/agent/logs/sessions/<studio_id>.jsonl`); `robomotion run` follows it when the robot is on this computer.

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

Events are compact one-line JSON, terminated by `agent_mode:end`. Example:

```
{"event":"agent_mode","status":"start"}
{"event":"flow_start","flow":"Imported Write To Clipboard","version":"local"}
{"event":"node_start","node":"Start"}
{"event":"node_end","node":"Start","duration_ms":21}
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
| `3` | Session submitted but log file never appeared — robot is on a different machine so its log lives there. The run still proceeds on the robot; check the Flow Designer for progress. |

Flags: `--no-follow` (fire-and-forget, no stream), `--log-wait <s>` (how long to wait for the file to appear, default 5), `--timeout <s>` (overall follow budget, default 300).

### Event reference

| Event | Fields | Meaning |
|-------|--------|---------|
| `agent_mode` | `status: "start" \| "end"` | Brackets the run. `end` is a safety-net terminal event. |
| `flow_start` | `flow`, `version` | Flow started. |
| `flow_end` | `status: "success" \| "error"`, `duration_ms`, `error?` | Flow finished — primary terminal event. |
| `flow_error` | `error`, `node?`, `node_id?`, `duration_ms` | Unhandled flow-level error. |
| `node_start` | `node` | Node entered. |
| `node_end` | `node`, `duration_ms` | Node completed. |
| `node_error` | `node`, `error`, `duration_ms` | Node threw — your signal to fix. |
| `log` | `node?`, `level`, `msg` | `Core.Flow.Log` output. |
| `debug` | `node`, `msg` | `Core.Programming.Debug` payload (truncated to 255 bytes per field). |
| `connected` | `msg` | Robot registered with the workspace. |
| `ready` | — | Robot ready to accept commands. |

### Re-reading after the run

`robomotion run` consumes the log while streaming. The file persists afterwards; `robomotion logs` reads it back, filtered to the events above (the same set the Build view's `poll_logs` shows):

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
3. **Stream**: `run` tails the agent log automatically until `agent_mode:end`; `robomotion logs --last` reads it again.
4. **Classify**:
   - `flow_end status=success` (CLI exit 0) → report, **offer to open what it produced** (below), and stop.
   - `node_error` or `flow_error` (CLI exit 1) → inspect `error` + `node`, fix `main.ts`, **back to step 1**. Max 3 retries without asking the person.
   - Timeout (CLI exit 2) → flow may still be running on the robot; report and ask.
   - Log unreachable (CLI exit 3) → the robot is on another machine and its log is there; say so, and ask the person what the robot showed, or watch progress in the Flow Designer.
5. Between retries, keep mock/test fixtures stable so a passing run actually proves the fix.
6. **Save** when it passes: `git commit -am "..." && git push` in the flow folder. The Designer shows what was pushed.

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
| Run submits but no `agent_mode:start` appears | Robot offline or in another workspace | `robomotion get robots`; ask the person to start their robot. |

## Related Skills

- `creating-flow` — generate the flow
- `validating-flow` — schema check (local, no robot needed)
- `testing-flow` — behavioral tests with mocks (no robot needed)
