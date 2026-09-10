# The preview loop

The whole loop is local: you edit a file, Vite hot-reloads, the person sees it in the Designer's preview panel, and the backend runs on the robot sitting on the same machine. Latency IS the product here - anything that reintroduces a wait into this loop is a regression, not a tradeoff.

```
you edit app/src/pages/Review.tsx
   │
   ├─ vite dev server (localhost, started by app_dev_server)  ── HMR ──┐
   │                                                                   ▼
   │                                            Designer preview <iframe>
   │                                                   │
   └─ you read back get_preview_errors ◀───────────────┘
```

## `app_dev_server` (your native tool)

| Command | Behaviour |
|---|---|
| `start` | Idempotent. Picks a free port, binds localhost only, runs the app's dev build. Returns `{url, port}`. Starting an already-running server returns the existing url - never bounce it just in case. |
| `stop` | Terminates the server and its children. |
| `status` | `{running, url, port, uptime_ms}`. |
| `logs` | Recent stdout/stderr, tail-bounded. |
| `get_preview_errors` | Everything collected since the last call: build errors from Vite plus runtime errors reported from inside the preview. |

The server lives and dies with your process. If `status` says running but the preview looks stale, `stop` then `start` - a stale server serving old code is the worst debugging state there is, because it looks right and is wrong.

## Route context: edit what they're looking at

When the person navigates inside the preview, the current route is silently prepended as context to their next message. This is what makes ordinary language work:

- Message arrives carrying "the user is looking at /review" + "make that button green" → edit the button on the review screen. Don't ask which button when there's one on that screen; don't touch other screens.
- No route context and the request is ambiguous across screens → that's a genuine ambiguity, ask with quick replies.

The preview also reports which screens exist and which actions were just invoked - "it didn't work" right after an `extractInvoice` invocation means look at THAT action first.

## The self-check (non-negotiable)

After EVERY batch of edits, before replying to the user:

1. Call `get_preview_errors`.
2. Empty → done, reply.
3. Errors → fix them, call it again. Only reply when it's clean, or when you're out of ideas - then say plainly what's broken and what you tried, in user language.

There is also a reactive path you don't control: a runtime error in the preview triggers the Designer's own auto-retry, capped at 2 per user message. Work with it, not against it - if your proactive check is clean, the reactive path stays quiet.

## The draft backend

`start_app_session` creates a **draft** app instance and starts the flow long-lived on the app's **own** robot. From that moment the preview's buttons hit a real robot - not mocks that later turn out to lie.

- Before the session exists, screens render their `SAMPLE_*` data and the app is honestly display-only. Get it live early anyway: seeing screens is what keeps the person engaged.
- **The backend is checked before the person touches it.** Every start (and every restart after a save) is followed by `smoke_app`, run by the harness: each button pressed once through the app's own MCP door, the report attached to the `start_app_session` result. A `dead_end` there is a path that never reaches `App Respond`, and `last_node` says where it stopped; `unwired` is an action with no `App Action` node; `dead_after_first` is a flow that ended itself. The classify-then-act table is step 6b of the skill. A backend that has not answered the smoke pass has not been shown to work, whatever the preview looks like.
- `call_action` presses one button with values you choose - the way to prove the case the stand-ins could not (a real country code, a real record id) or to press a write on purpose.
- After every flow save the session is bounced and the panel says so ("reconnecting the robot..."). Expect in-flight calls at that moment to fail retryably - the smoke pass waits a bounce out on its own; a call that fails during a bounce is not a fault, so don't diagnose it as one.
- The robot must be online. If it isn't, the buttons show the offline state - tell the person to start their robot; do not rebuild anything.

### When a press did nothing

Walk this in order rather than guessing. Every line is observable; the smoke
report answers the first and the last for you.

| Ask | Where | If it fails |
|---|---|---|
| Is the flow still running? | `start_app_session` (says "already running" or restarts), `smoke_app` `door` = `not_running`, robot log `Stopped running` | The flow ended itself: rule 5 - a `Stop`/`End` on a path, or an unhandled error with no `Catch` -> `App Respond Error`. |
| Did the press reach the flow at all? | `smoke_app` / `call_action` on that button: `unwired` means no `App Action` serves it | Add the `App Action` node with that action name. |
| Did the steps run, and how far? | `poll_logs` on the session's `studio_id`; `last_node` in the smoke row | A `dead_end` at `last_node`: the path from there never reaches `App Respond`. Wire it. |
| Is the robot the app's own, and connected? | `start_app_session` refuses any other robot; the preview's banner | Start the session again; never pick another robot. |
| Is the app on the same contract as the flow? | `stale` in the smoke row; the preview's "app was updated, reload" state | Save the flow and start the session again. |

## Sequencing a change

For a UI-only change ("bigger title", "green button"): edit the screen file → HMR shows it → `get_preview_errors` → reply. Seconds, no server restart, no push.

For a contract change (new action, changed params): edit `app.json` → regenerate → fix `tsc` fallout in screens and flow → `push_app` → flow save bounces the session → `get_preview_errors` → reply. Tell the user the app is "updating" during the bounce, in plain words.

## States the preview can be in

`no app yet` · `starting` · `ready` · `build error` · `runtime error` · `dev server crashed` · `robot offline`. The panel renders these honestly; your narration must match it. Never tell the user everything is fine while the panel shows an error state, and never leave a broken state undescribed - an unexplained blank frame reads as a hung tool.
