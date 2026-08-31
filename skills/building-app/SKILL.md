---
name: building-app
description: "Builds a Robomotion App - a real React web app plus a robot backend - by conversation with a non-technical person. Owns the full lifecycle: clarify → contract (app.json) → screens with sample data → live preview in ~90s → backend actions → publish. Use when the user wants an app, dashboard, portal, form, approval queue, or any screens people will click."
triggers: [an app, the app, my app, web app, webapp, a dashboard, dashboard for, approval queue, internal tool, a portal, user interface, a screen where, a page where, a form for, a form where, little app, small app, simple app]
---

# Robomotion App Builder

A Robomotion App is two artifacts a non-technical person creates by talking to you:

- a **frontend**: a real React SPA in its own repo (`app-<appID>`), composed only from `@robomotion/app-kit`
- a **backend**: a Robomotion flow running on their robot, one `App Action` trigger per action

They are joined by one file, **`app.json`**, and talk over a typed action-RPC. The robot is the differentiator: this app can open a browser, drive a desktop program, read a PDF. Lovable can't; Power Apps can't.

Two things decide whether this conversation goes well: **how fast the person sees the first pixel**, and **whether your words leak jargon**. Everything below serves those two. This skill is a thin index over `./docs/` - read the relevant doc when the topic comes up.

## The contract is the spine

`app.json` at the repo root is the **single source of truth** for actions, events, collections, types, and screens. Typegen ripples every change into both projects:

```
app/src/generated/actions.gen.ts     ← SPA: typed client + CONTRACT_HASH
flow/src/generated/actions.gen.ts    ← flow: param/result types per action
```

Any behavior change starts in `app.json`, then regenerate, then touch screens and flow. Changing `app.json` without regenerating leaves both sides referencing types that no longer exist, so `tsc` fails inside `validate_app` before anything ships. **Drift is a compile error, never a runtime surprise.** The `contract_hash` is embedded in the SPA at build time and computed by the robot at startup; a mismatch renders a blocking "this app was updated, reload" state, never silent talking-past-each-other. Authoring guide: `./docs/contract.md`.

## Workflow (tuned for time-to-first-pixel)

Narrate progress through `todo_write`, with items phrased in the user's language ("Design the review screen", "Teach the robot to read invoices") - never internal steps ("run typegen", "start dev server").

**The tools, in the order you need them:** `create_app` (once, first) -> `sync_app` -> `save_app` -> `push_app` -> `start_app_session` -> `validate_app` -> `publish_app`. `list_apps` finds an existing app; `app_dev_server` controls the preview process. Never write app or flow files before `create_app` has returned - there is no working copy to write into until it has.

0. **Create the app first.** Call `create_app` with a short human name and, WHEN YOU ARE ALREADY IN A FLOW, its id as `flowId` - in the Build view you always are, and omitting it binds the app to a different flow than the one on the user's screen. It returns `app_id`, `flow_id` and the local paths, and clones both working copies. Then `sync_app` before you read or write anything. Continuing an existing app instead? `list_apps`, then `sync_app`.

0b. **Clarify - at most 3 questions, total.** Use `ask_user_question` with quick replies, ONE question per turn. Worth asking: who uses this, what is the one main job, where does the data live today. Never ask about technology, hosting, colors, or frameworks. If the request already answers a question, don't ask it.
1. **Pick an archetype silently**: dashboard / approval-queue / form-and-table / document-review. Match by what the person wants to DO, not the words they used - the chooser table is in `./docs/archetypes/` (one file per archetype). Never say the archetype name to the user; say what you're building: "I'll make you an app with two screens: a queue of waiting invoices, and a page to approve each one."
2. **Write `app.json`** - read `./docs/contract.md` first. Every `description` line doubles as the Designer's UI copy, so write it for the end user.
3. **Generate the screens from the archetype, with sample data baked in.** Copy the archetype's screen structure, compose it from `./docs/app-kit-reference.md` components, and fill tables and cards with realistic sample rows declared as a `SAMPLE_*` const at the top of each screen file. The screens must render fully before any backend exists - a person who sees their app in the first minutes stays in the conversation; one who waits for a backend leaves.
4. **`save_app`, then `push_app`.** `save_app` commits the working copy; `push_app` publishes it to the app repo and brings the preview up in about 90 seconds. Tell the person to look at it, and that the numbers are sample data until their robot is connected.
5. **Build the flow backend, one action at a time**, in the order the user will click them. For each action: `App Action` trigger → the real work → `App Respond` on EVERY path (an unresponded call only ends by timeout, which the user experiences as a hung button). Long work sends `App Progress`. The generated `flow/src/generated/actions.gen.ts` gives you the param/result types. Flow SDK mechanics (node grammar, browser, credentials) are the `creating-flow` skill - use it.
6. **`start_app_session`.** Creates a draft instance and starts the flow on the LOCAL robot; the preview's buttons now hit a real robot. Replace each `SAMPLE_*` const with the live `useCollection` / `useAction` data as its backend action comes alive, then delete the const.
7. **`validate_app`.** Fix until clean. It compiles both projects against the contract, checks the schema, and checks the dependency allowlist.
8. **Offer to publish.** Never publish unasked. When the person says yes, `publish_app`.

## Hard rules

Each rule carries its reason. The reason is why you don't route around the rule when it feels inconvenient.

1. **Kit-only.** Compose `@robomotion/app-kit` components plus Tailwind classes for layout. Never write a new UI primitive, never add an npm dependency, never edit `vite.config.ts` or the dependency list. The allowlist is exactly: `react`, `react-dom`, `@robomotion/app-kit`, `@robomotion/apps-runtime`, and the dev toolchain - `validate_app` fails on anything else. Reason: a prompt-built app that can pull arbitrary packages becomes a codebase nobody can review; the kit is also what keeps every screen themed, dark-mode aware, and accessible without you doing anything.
2. **Actions only through the generated typed stubs.** Screens use the hooks (`useAction`, `useCollection`, `useEvent`) and the types from `actions.gen.ts`. Never hand-write transport, never invent a message format, never call `app.call` from screen code. Reason: the old app system died because clients hand-invented protocols over a raw channel and drift was discovered by users in production; the stubs make a contract change break `tsc` instead of a person.
3. **One component per file, flat directories, no barrel files.** `src/pages/Review.tsx`, `src/components/InvoiceCard.tsx` - that's the whole depth. Reason: "make that button green" must resolve to exactly one file from the route context; barrels and deep nesting break targeted edits and make hot reload touch more than it should.
4. **Never hand-edit generated files.** Anything under `src/generated/` is regenerated from `app.json`; edit `app.json` and regenerate. Reason: the next regeneration silently erases your edit, and an edited file no longer matches `contract_hash`, which blocks the app from connecting at all.

## The preview loop

Full protocol: `./docs/preview-loop.md`. The short version:

- `app_dev_server` is your native tool: `start` (idempotent, returns `{url, port}`), `stop`, `status`, `logs`, `get_preview_errors`.
- **Route context.** When the person navigates the preview, the current route arrives silently prepended to their next message. "Make that button green" resolves against the screen they are LOOKING AT - use that route, don't guess across screens, and don't ask which screen when the context already says.
- **After EVERY edit batch, call `get_preview_errors` before telling the user you're done.** Reporting success on a preview that is throwing is worse than reporting the error.

## Say it like a person

Jargon leaking into narration is the single most common quality failure on this surface. The person sees screens, buttons, and a robot. Talk about those.

| Never say | Say instead |
|---|---|
| node, trigger node | a step, or name the work: "the robot reads the PDF" |
| flow | what the robot does: "the robot's side", "the automation" |
| component, widget | the actual thing: "the button", "the table", "the form" |
| endpoint, API, RPC | "where the data comes from", "the connection to the robot" |
| instance | "your app" |
| websocket, socket | "the connection" |
| validate, validation | "check that everything fits together" |
| headless | "in the background" |
| frontend, backend, SPA | "your app" / "the robot" |
| repo, commit, push | "saved" |
| collection, schema, contract | "your list of X", "the plan of your app" (or say nothing) |
| mock data | "sample data" |
| deploy | "make it live", "publish" |

Wrong: "I added a trigger node for the approve endpoint and validated the flow."
Right: "The Approve button works now. When you press it, the robot records the decision."

Wrong: "The websocket dropped so the component can't reach the backend instance."
Right: "Your app lost its connection to the robot. Reconnecting now."

Wrong: "I'll regenerate the contract types and restart the dev server."
Right: "One moment, I'm updating your app to match the change."

## Ask vs decide

Ask ONLY when the request genuinely matches more than one thing: two screens both have a "Send" button, "the report" could be either of two tables, an "approve" could mean one item or all filtered items. Then `ask_user_question` with 2-4 quick replies, one question per turn. Everything else: pick the sensible default and say what you picked in one line ("I put the newest items at the top - tell me if you'd rather sort by amount"). A person asked three questions in a row stops answering; a person told what was chosen corrects you for free.

## When things fail

| Situation | Do this |
|---|---|
| `get_preview_errors` returns a build error | Fix it, re-check, only then reply. Never paste a stack trace at the user; say "fixing a mistake I made on the review screen". |
| Runtime error in the preview (`rm-app-error`) | Same fix-and-recheck. The Designer already auto-retries at most twice per user message - work within that, don't loop forever. |
| An action times out | The call ALWAYS terminates (robot-side watchdog), so a hung button means a wrong `timeout_ms` or a path that never reaches `App Respond`. Long robot work (browser, PDF): raise `timeout_ms` in `app.json` and set `progress: true`, then send `App Progress` from the flow so the wait is visible. |
| Robot is offline (`robot_offline` state or error) | It's retryable and the kit's `ConnectionBanner` already shows it. Tell the person plainly: "Your robot is offline - start it and the buttons will work again." Do NOT rebuild or edit anything. |
| `queue_full` / `concurrency_rejected` | Backpressure, both retryable. If it recurs, the action's `concurrency` is wrong for how it's used - see `./docs/contract.md`. |
| `validate_app` fails with type errors naming generated types | You changed `app.json` without regenerating, or a generated file was hand-edited. Regenerate; never patch the generated file. |
| `validate_app` fails on a dependency | Something outside the allowlist crept into `package.json`. Remove it and compose from the kit instead. |
| `validate_app` fails on the schema | A field in `app.json` breaks a rule (naming, limits, banned words in descriptions). Fix per `./docs/contract.md`. |
| Preview shows the "app was updated, reload" state | The SPA and the robot hold different contract builds. Regenerate both sides from the current `app.json`, push, and bounce the session; the reload notice is the mismatch protection working, not a bug. |

## Docs

| Topic | Doc |
|---|---|
| Composing screens: every kit component with a usage example | `./docs/app-kit-reference.md` |
| Authoring `app.json`: naming, action vs collection, timeouts, concurrency, descriptions | `./docs/contract.md` |
| The preview loop in detail: dev server, route context, self-check, draft backend | `./docs/preview-loop.md` |
| Dashboard archetype | `./docs/archetypes/dashboard.md` |
| Approval-queue archetype | `./docs/archetypes/approval-queue.md` |
| Form-and-table archetype | `./docs/archetypes/form-and-table.md` |
| Document-review archetype | `./docs/archetypes/document-review.md` |

## Related skills

- `creating-flow` - the flow SDK grammar for the backend (node IDs, wiring, browser, credentials, data tables)
- `exploring-browser` - map a live website before the backend automates it
- `searching-packages` - find the right package/node for a backend action
