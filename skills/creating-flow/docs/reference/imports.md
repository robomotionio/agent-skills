# Imports — Scope Helpers

Every `main.ts` and `subflows/*.ts` starts with the same canonical import. Copy it verbatim — Bun does not warn on unused imports, but referencing a helper you forgot to import becomes a runtime `ReferenceError` at `robomotion build` time with no TS hint.

```ts
import { flow, Message, Custom, JS, Global, Flow, Credential, AI } from '@robomotion/sdk';
```

Library files swap `flow` for `library`; subflow files swap it for `subflow`. Every other helper stays in the import.

## Helpers

| Helper | Use for | Example |
|---|---|---|
| `flow` / `library` / `subflow` | Top-level builder. `flow.create('main', name, fn).start()` for flows, `library.create(id, name, fn)` for libraries (no `.start()`), `subflow.create(name, fn)` inside `subflows/<id>.ts`. | `flow.create('main', 'My Flow', (f) => { ... }).start();` |
| `Message(name)` | Read/write a variable from the message payload (`msg.<name>`). The dominant scope helper — use for any per-flow value (URLs, results, IDs). | `inUrl: Message('url')` |
| `Custom(value)` | Hardcoded literal value in a property slot that expects a scoped value. NEVER use for enum properties or numeric common props (those are plain strings/numbers). | `optUrl: Custom('https://example.com')` |
| `JS(expr)` | One-liner JavaScript expression evaluated by the runtime when the property is read. Distinct from a Function node's `func` (which is a literal string, NOT `JS()`). | `optCondition: JS('msg.x > 10')` |
| `Global(name)` | Read a global variable shared across flows (e.g. `Global('api_token')`). System variables like `$Home$` are resolved via `global.get('$Home$')` *inside* a Function node, not via `Global()`. | `inApiKey: Global('SHARED_KEY')` |
| `Flow(name)` | Read a flow-scoped variable (set on the flow itself). Rare. Most state flows through `Message()` instead. | `inUserId: Flow('current_user')` |
| `Credential({vaultId, itemId})` | Reference a vault credential. NEVER hardcode secrets. `Core.Vault.GetItem` REQUIRES `optCredentials: Credential({vaultId, itemId})` or it fails at runtime ("Vault has to be selected"). | `optCredentials: Credential({ vaultId: 'abc-…', itemId: 'def-…' })` |
| `AI(name)` | Reference an AI-scoped variable when wiring AI provider nodes. Use only when an AI node's schema expects an `AI()`-scoped value. | `inPrompt: AI('user_prompt')` |

## What is NOT imported

These belong inside a Function node's `func` string (a JS sandbox executed by the robot, **not** SDK code):

- `msg` — the per-call payload (`msg.x = 1; return msg;`)
- `global.get(...)` / `global.set(...)` — robot-side global store, including system variables like `$Home$`, `$TempDir$`
- `console.log(...)` — robot stdout

`func` content does NOT need any of the SDK helpers above — those only apply to the *property slots* in `f.node()` calls.

## Common mistakes

- `import { flow } from '@robomotion/sdk'` then `inUrl: Message('url')` later → `ReferenceError: Message is not defined` at build time. **Fix:** always copy the full canonical import.
- `func: JS('return msg;')` → validation fails. **Fix:** `func: 'return msg;'` (plain string).
- `optType: Custom('directory')` for an enum prop → empty value at runtime. **Fix:** `optType: 'directory'` (plain string).
- `delayBefore: Custom(2)` / `continueOnError: Custom(true)` → parse error. **Fix:** literal value, `delayBefore: 2`.
