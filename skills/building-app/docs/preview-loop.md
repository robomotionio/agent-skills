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

`start_app_session` creates a **draft** app instance and starts the flow long-lived on the **local** robot. From that moment the preview's buttons hit a real robot - not mocks that later turn out to lie.

- Before the session exists, screens render their `SAMPLE_*` data and the app is honestly display-only. Get it live early anyway: seeing screens is what keeps the person engaged.
- After every flow save the session is bounced and the panel says so ("reconnecting the robot..."). Expect in-flight calls at that moment to fail retryably; don't diagnose them as bugs.
- The robot must be local and online. If it isn't, the buttons show the offline state - tell the person to start their robot; do not rebuild anything.

## Sequencing a change

For a UI-only change ("bigger title", "green button"): edit the screen file → HMR shows it → `get_preview_errors` → reply. Seconds, no server restart, no push.

For a contract change (new action, changed params): edit `app.json` → regenerate → fix `tsc` fallout in screens and flow → `push_app` → flow save bounces the session → `get_preview_errors` → reply. Tell the user the app is "updating" during the bounce, in plain words.

## States the preview can be in

`no app yet` · `starting` · `ready` · `build error` · `runtime error` · `dev server crashed` · `robot offline`. The panel renders these honestly; your narration must match it. Never tell the user everything is fine while the panel shows an error state, and never leave a broken state undescribed - an unexplained blank frame reads as a hung tool.
