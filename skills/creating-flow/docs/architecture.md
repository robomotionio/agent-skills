# Architecture

Core concepts for Robomotion's visual flow execution model and project structure.

## Project Structure

```
flows/<flow-name>/
├── main.ts          # TypeScript source (builder SDK)
└── subflows/        # Optional subflow files
    └── a1b2c3.ts    # Subflow (6-char hex ID)
```

**Build**: `robomotion build main.ts` -> merged JSON to stdout
**Execution**: Go runtime fills defaults from pspec, robot executes flow

## Visual Flow vs Imperative Code

| Imperative Code | Visual Flows |
|-----------------|--------------|
| Functions return automatically | Nodes need explicit output wires |
| Loops continue implicitly | Loops need Goto->Label wiring |
| Call stack tracks state | Message object carries state |
| Variables are local | All data flows through `msg` |

## Chaining with .then() vs .edge()

**Prefer `.then()` for sequential chains.** Use `.edge()` only when necessary.

### When to Use `.then()`

Use `.then()` for simple sequential connections (port 0 to port 0):

```typescript
f.node('42ec21', 'Core.Trigger.Inject', 'Start', {})
  .then('7dbafc', 'Core.Programming.Function', 'Process', {
    func: `msg.result = 'done'; return msg;`
  })
  .then('a06926', 'Core.Flow.Stop', 'Stop', {});
```

### When to Use `.edge()`

Use `.edge()` only for:

1. **Multi-port connections** (ForEach port 1, Function with multiple outputs)
2. **Fan-out scenarios** (one node connecting to multiple nodes)
3. **Non-sequential wiring** (connecting back to earlier nodes, like Goto->Label)

```typescript
// ForEach loop - needs .edge() for port 1 (done)
f.node('8f3c72', 'Core.Flow.Label', 'Next', {})
  .then('d4e519', 'Core.Programming.ForEach', 'For Each', {
    optInput: Message('items'),
    optOutput: Message('item')
  })
  .then('6ba0ed', 'Core.Programming.Function', 'Process', {...})
  .then('c91f48', 'Core.Flow.GoTo', 'Continue', {
    optNodes: { ids: ['8f3c72'], type: 'goto', all: false }
  });

// Port 1 (done) needs explicit .edge()
f.node('2e7d35', 'Core.Flow.Stop', 'Stop', {});
f.edge('d4e519', 1, '2e7d35', 0);
```

## The Message Object

Every flow has a **message object** (`msg`) that flows through nodes via wires:

- `msg` is the ONLY way to pass data between nodes
- Each node receives `msg`, modifies it, outputs it
- Properties set on `msg` persist through the flow
- Wires explicitly connect nodes (no implicit flow)

**Think of it like Node-RED**: Outputs write to `msg.propertyName`, inputs read from `msg.propertyName`.

## Function Node

The primary data transformation tool. Uses pure JavaScript sandbox (NOT Node.js).

```typescript
func: `
  msg.total = msg.price * msg.quantity;
  return msg;  // REQUIRED
`
```

**Return semantics:**
- `return msg;` -> Send to next node
- `return null;` -> Stop flow (no output)

## Parallel Execution

When a node has multiple outgoing edges, connected nodes run **in parallel**:

```typescript
f.edge('3b8f6a', 0, '9ce042', 0);  // Log node
f.edge('3b8f6a', 0, '71df59', 0);  // Debug node
f.edge('3b8f6a', 0, 'bf2a14', 0);  // Stop node - terminates flow!
```

**Problem**: If Stop runs in parallel with Log/Debug, the flow may terminate before other nodes complete.

**Solution**: Use `delayBefore` on Stop:

```typescript
f.node('4a7c39', 'Core.Flow.Stop', 'Stop', {
  delayBefore: 0.2  // Wait 200ms before stopping
});
```

## Key Takeaways

1. **Think visually** — Every node needs explicit output wiring
2. **Use .then() for chains** — Simple sequential connections
3. **Use .edge() for ports** — Loops, conditionals, multi-output nodes
4. **Loops need Goto->Label** — See patterns/loops.md
5. **msg carries all data** — All data flows through the message object
6. **ONLY non-defaults** — Go fills ALL defaults from pspec
7. **End with myFlow.start()** — Required to output JSON
8. **Parallel execution** — Multiple edges from one node run in parallel
