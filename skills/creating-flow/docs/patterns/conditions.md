# Conditional Patterns

Patterns for implementing conditional logic in Robomotion visual flows.

**Related:** `loops.md` (while-loop via Function outputs:2) · `branches.md` (fan-out vs branch) · `exceptions.md` (error branching via Catch).

## When NOT to use

- **Pure data shape** — if you can handle both branches inside one Function (just set `msg.result`), skip the multi-output split.
- **Binary success/error from a single node** — use `Core.Trigger.Catch`, not a manual Function with `outputs: 2`.
- **More than ~6 cases** — map data to a key and route with `Switch` (or a Function that dispatches by table lookup).

## WARNING: Core.Programming.If Does NOT Exist

AI models often invent a `Core.Programming.If` node. **It does not exist.** Use these alternatives:

## Option 1: Multi-Output Function (Recommended)

Use `Core.Programming.Function` with multiple outputs for if/else/switch logic.

### Return Semantics (Node-RED Style)

The function receives `msg` and must return it:

| Return Value | Effect |
|--------------|--------|
| `return msg;` | Send to port 0 (single output) |
| `return null;` | Stop flow (no output) |
| `return [msg, null];` | Send to port 0 only |
| `return [null, msg];` | Send to port 1 only |
| `return [msg, msg];` | Send to BOTH ports simultaneously |

### Example: Binary Condition (if/else)

```typescript
f.node('42ec21', 'Core.Programming.Function', 'Check Value', {
  outputs: 2,
  func: `
    if (msg.value > 10) {
      return [msg, null];  // Port 0: true
    }
    return [null, msg];    // Port 1: false
  `
});

// Wire each output port
f.edge('42ec21', 0, '7dbafc', 0);
f.edge('42ec21', 1, 'a06926', 0);
```

### Example: Multi-way Switch

```typescript
f.node('b3f8a2', 'Core.Programming.Function', 'Route by Status', {
  outputs: 4,
  func: `
    switch (msg.status) {
      case 'pending':  return [msg, null, null, null];
      case 'active':   return [null, msg, null, null];
      case 'complete': return [null, null, msg, null];
      default:         return [null, null, null, msg];
    }
  `
});

// Wire each output port
f.edge('b3f8a2', 0, 'c5d917', 0);
f.edge('b3f8a2', 1, 'e4a0c8', 0);
f.edge('b3f8a2', 2, 'f72b4d', 0);
f.edge('b3f8a2', 3, '1a9e63', 0);
```

## Option 2: Switch Node (Declarative Conditions)

Use `Core.Programming.Switch` when you have multiple independent conditions.

### Schema

- `optConditions`: array of JS expressions (each creates an output port)
- `optUseBreak`: stop after first true condition (like switch with break)

### Example: Multiple Conditions

```typescript
f.node('3c8f52', 'Core.Programming.Switch', 'Route', {
  optConditions: [
    Custom('msg.type === "order"'),
    Custom('msg.type === "refund"'),
    Custom('msg.type === "inquiry"')
  ],
  optUseBreak: true
});

// Wire each condition's output port
f.edge('3c8f52', 0, 'd6b1a4', 0);
f.edge('3c8f52', 1, '8e2c7f', 0);
f.edge('3c8f52', 2, '5f4d98', 0);
```

**Note:** Switch errors if NO condition matches ("no matching condition"). Use Function for default handling.

## When to Use Which

| Use Case | Recommended | Why |
|----------|-------------|-----|
| Simple if/else | Function `outputs: 2` | Clearer, has default |
| Complex nested logic | Function | Full JS control |
| Multiple independent checks | Switch | Declarative, parallel |
| Need default/fallback | Function | Switch errors on no match |
| Parallel execution (fan-out) | Function `[msg, msg, msg]` | Explicit control |

## Function Node Port Reference

**Single output (default):**
- Port 0: Message sent here

**Multiple outputs (`outputs: N`):**
- Port 0 through Port N-1: Controlled by return array
- `return [msg, null, null]` sends to port 0 only
- `return [null, msg, null]` sends to port 1 only
- `return [msg, null, msg]` sends to ports 0 AND 2 simultaneously

## While Loop with Condition

For while-loop patterns using `Core.Programming.Function` with `outputs: 2`, see `loops.md` → **While Loop Pattern**.
