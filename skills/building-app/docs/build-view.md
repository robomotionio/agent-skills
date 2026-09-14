# Under Robomotion's Build with AI

Read this only when you are running inside Robomotion's own **Build with AI**
(the tools `create_app`, `app_dev_server` and `ask_user_question` are all
registered). Everything in `SKILL.md` holds; what changes is that the
commands are tools, the person sees a preview panel beside the chat, and a
harness does some steps for you. `create_app` alone is not the test: the
Robomotion tools can be registered in any assistant, and there nothing runs
them for you.

## The commands, as tools

| In `SKILL.md` | Here |
|---|---|
| `robomotion auth login` | nothing: the session is the person's |
| `robomotion app create "<name>"` | `create_app` with the name and, WHEN YOU ARE ALREADY IN A FLOW, its id as `flowId` - in Build you always are, and omitting it binds the app to a different flow than the one on the person's screen. Returns `app_id`, `flow_id`, `flow_path` (the project root) and `app_path` (`app/`). Then `sync_app` before you read or write anything. |
| `robomotion app sync` | `sync_app` |
| `git commit && git push` | `save_flow` on the project root: one save records the flow, the contract and the screens together. `git add`, `git commit`, `git push`, `git reset` are refused inside the checkout while `save_flow` is registered; reading (`git status`, `git log`, `git diff`) is free. |
| `robomotion app validate` | `validate_app` |
| `robomotion app dev` | nothing: **the preview comes up on its own a few seconds after the first save** and appears in the person's preview panel. Do not call `app_dev_server start` for it (it answers "already running", one useless row on the person's screen); `app_dev_server status` only when you think the preview is down. |
| `robomotion app screen "<label>"` | `app_dev_server` with `read_screen` and `screen` set to the label or route |
| the console errors from `app screen` / `app try` | `app_dev_server get_preview_errors`: what the dev server compiled, and what the BROWSER reported. The browser half is empty until the preview has loaded, so "nothing from the browser" on a page nobody opened is not a clean bill of health. |
| `robomotion app robot` | `create_app_robot` (only with the yes) |
| `robomotion app start` | `start_app_session`; a save bounces the session by itself |
| `robomotion app smoke` | nothing: **the harness runs `smoke_app` after every `start_app_session`** and puts the report in front of you as a second block of that result. Call `smoke_app` yourself only after a fix that did not need a restart. |
| `robomotion app press` | `call_action` |
| `robomotion app try` | not available: the preview is signed in as the person, not as you, and nothing you do can drive it. Press through the door (`smoke_app`, `call_action`) and read with `read_screen`. |
| `robomotion app logs` | `poll_logs` on the `studio_id` that `start_app_session` returned. A restart mints a NEW `studio_id`: read the old one before restarting, or you are reading an empty log that looks like "the press never arrived". |
| `robomotion app publish` | `publish_app` |
| `robomotion app status` | `list_apps`, `app_dev_server status` |
| the question tool | `ask_user_question` |
| the task list | `todo_write` |

Never compute the contract hash yourself here either: `robomotion app codegen`
from the app folder, as in `SKILL.md`.

## What the harness does unasked

- Starts the preview after the first save.
- Runs `smoke_app` after every `start_app_session` and after every save that
  restarted the backend; reads the report's leftovers and asks you to add a
  delete when a create has none.
- Holds your turn when `.robomotion/request-checks.md` exists and the
  screens changed but none was read, and asks you to `read_screen` them.
- Refuses a delete pressed on a record the pass did not make.

So the steps `SKILL.md` marks as yours (smoke after start, read every screen
before hand-over, tidy the pass's rows) happen here without you; your job is
to read what the harness put in front of you and act on it, never to explain
it away.

## The preview panel

The whole loop is local: you edit a file, Vite hot-reloads, the person sees
it in the panel, and the backend runs on the app's robot on the same machine.
Latency IS the product here - anything that reintroduces a wait into this loop
is a regression, not a tradeoff.

- **Never tell the person to open a link, and never quote a `127.0.0.1`
  address**: the preview appears in their panel by itself, and their robot may
  be on another machine. If they ask where the app lives, give the address
  from the tool result.
- **Route context.** When the person navigates the preview, the current route
  arrives silently prepended to their next message. "Make that button green"
  resolves against the screen they are LOOKING AT: use that route, don't guess
  across screens, don't ask which screen when the context already says.
- **After EVERY edit batch, `get_preview_errors` before telling the person
  you're done.** A runtime error in the preview also triggers the Designer's
  own auto-retry, capped at 2 per user message; work within that.
- **States the panel can be in:** `no app yet` · `starting` · `ready` ·
  `build error` · `runtime error` · `dev server crashed` · `robot offline`.
  Your narration must match it: never say everything is fine while the panel
  shows an error, never leave a broken state undescribed.
- After every flow save the session is bounced and the panel says so
  ("reconnecting the robot..."). A call that fails during a bounce is not a
  fault; the smoke pass waits a bounce out on its own.
- The preview shows "app was updated, reload" when the SPA and the robot hold
  different contract builds: regenerate both sides from the current
  `app.json`, save, and the session bounces. That notice is the mismatch
  protection working, not a bug.

## An app for the flow that is already open

An app is a set of screens plus exactly ONE flow behind it. When a project is
already open, `flow_context` tells you which case you are in - decide from it,
do not ask blindly:

| `flow_context` says | What to do |
|---|---|
| `app_id` is set | This flow already backs an app. Continue THAT app - `list_apps` / `sync_app`, never `create_app`. |
| `node_count` is 0 | An empty project. Use it as the new app's backend: `create_app` with its `flowId`. |
| `node_count` > 0, no `app_id` | Genuinely ambiguous - **ask**. |

Only the third row earns a question, and it is a real one: that flow is
somebody's working automation with its own trigger, and giving it app screens
means changing how it starts. Put it in their terms - "Add screens to the
automation you have open, or start a fresh project with its own automation?" -
with those two as the quick replies. Never say "flow_context", "node_count" or
"trigger". If they choose the open automation, pass its flow id to
`create_app` as `flowId` so the app adopts it instead of scaffolding a second
one.

## When things fail, here

| Situation | Do this |
|---|---|
| Runtime error in the preview (`rm-app-error`) | Fix and re-check; the Designer auto-retries at most twice per user message - work within that, don't loop forever. |
| The app's OWN robot shows as offline in `list_robots` before a run | Expected between runs: the robot is brought up only while its session runs, and `start_app_session` does that. Never start it by hand, never pick another robot. |
| `start_app_session` did not start (robot not connected, or it did not take the run) | Say it in one sentence and end your turn: "Your robot isn't running - start it and tell me, and I'll connect the app." Do NOT retry, do NOT call `stop_flow`, do NOT inspect packages or the network. When the person says the robot is up, call `start_app_session` once more. |
| `start_app_session` says the robot is busy | This app's OWN backend is already running; the smoke report on that result says which buttons answer. Only if a run genuinely needs a fresh backend, stop this app's session and start it again; never touch another app's robot. |
| `create_app_robot` says the workspace is full | Give the numbers it returns and the two ways forward: delete an app they no longer use, or add robots to their plan - both from the Run dialog or the Build panel, which carry an "Add more robots" button. Do not delete anything yourself. |
