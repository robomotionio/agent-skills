# Node ID Format

## The rule

Every node ID in a Robomotion flow MUST match `/^[0-9a-f]{6}$/` — exactly **6 lowercase hex characters**.

Examples that pass: `42ec21` · `7dbafc` · `a06926` · `8e1c4b`
Examples that fail: `'begin'` · `'label'` · `'maps'` · `'A1B2C3'` (uppercase) · `'42ec2'` (5 chars) · `'42ec211'` (7 chars)

The SDK rejects non-hex IDs at the source — `f.node()`, `.then()`, and `f.edge()` throw a `FlowAuthorError` immediately. There is no auto-fix; pick valid hex from the start.

## Subflow filename rule

For every `Core.Flow.SubFlow` node in `main.ts`, a file `subflows/<id>.ts` must exist with the same hex ID:

```typescript
// main.ts
f.node('a3f21c', 'Core.Flow.SubFlow', 'My SubFlow', {})  // node ID

// subflows/a3f21c.ts        ← filename = node ID, exactly
import { subflow, Message, Custom, JS, Global, Flow, Credential, AI } from '@robomotion/sdk';
subflow.create('My SubFlow', (f) => { /* ... */ });
```

If the names don't match, the Designer can't enter the subflow on double-click. The SDK now throws on non-hex `__SUBFLOW_ID__` (i.e., a non-hex filename).

## Why hex IDs

- The Designer routes node URLs by ID; semantic names break the URL scheme.
- IDs are map keys in the runtime — collisions or non-canonical casing silently mis-wire.
- Hex IDs are stable across rename refactors. Semantic IDs invite churn (rename one node → update every `optNodes.ids` reference).

## How to generate

Every id is random, made fresh for this flow. Run `openssl rand -hex 3` once per id you need (or `bun -e 'console.log(crypto.randomUUID().slice(0,6))'`). If you cannot run a command, write 6 hex characters with no pattern in them.

**Never copy an id printed in these docs** (`42ec21`, `7dbafc`, `a3f21c` and every other example here) and never write a patterned one (`a1b2c3`, `aa11bb`, `cc22dd`, `000001`, `abcdef`). This matters most for subflows: the id is the `subflows/<id>.ts` filename, it is shown to the person as a file name, and two flows that copied the same example id collide when they are merged. The SDK only checks the regex and uniqueness inside the flow; it cannot tell a copied example from a real id.

If a node ID needs to be referenced elsewhere (e.g., `Core.Flow.GoTo.optNodes.ids: ['a3f21c']`), copy the exact hex string. The same hex MUST appear in:
- The node's `f.node(id, …)` call.
- Every cross-reference: `optNodes.ids` on `GoTo` and `Catch`, `subflows/<id>.ts` filename.

## Common mistakes

| Symptom | Cause |
|---|---|
| `[SDK] Invalid node ID 'begin' in f.node('begin', ...)` | Semantic ID — replace with hex |
| `[SDK] Invalid node ID 'A1B2C3'` | Uppercase hex — must be lowercase |
| Designer won't open a SubFlow on double-click | `subflows/<id>.ts` filename ≠ node ID |
| `optNodes.ids` reference fails to find target | Hex in reference doesn't match the node's hex |

If you see any of these, fix the hex IDs at the source and re-run `robomotion validate`.
