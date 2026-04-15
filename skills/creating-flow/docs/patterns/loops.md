# Loop Patterns

Patterns for implementing loops in Robomotion visual flows using the builder SDK.

**Related:** `conditions.md` (branching inside a loop body, while-loop shape) · `data-tables.md` (iterating `table.rows`).

## When NOT to use

- **Single known item** — just chain nodes; no ForEach needed.
- **Fixed small repetition (<3)** — inline the calls; a 2-step loop is harder to read than two sequential calls.
- **Concurrency needed** — use `ForkBranch` + `MemoryQueue` from `branches.md`, not a serial ForEach.

## The Loop Challenge

Visual flows execute by passing messages between nodes through wires. Unlike imperative code, there's no call stack or implicit return. When you need to loop, you must **explicitly wire** the flow back to the loop entry point.

## ForEach Loop Pattern

### Incorrect (Missing Loop Wire)
```typescript
// DON'T DO THIS - flow stops after Log!
f.node('3a7c1d', 'Core.Programming.ForEach', 'For Each', {
  optInput: Message('items'),
  optOutput: Message('item')
});
f.edge('prev01', 0, '3a7c1d', 0);

f.node('8e2b4f', 'Core.Flow.Log', 'Log', {
  inText: Message('item')
});
f.edge('3a7c1d', 0, '8e2b4f', 0);  // Port 0 = loop body

// Missing Goto! Flow stops here - loop never repeats!
```

### Correct (With Goto->Label)

> **Terminal-node rule** (see `creating-flow` SKILL.md Core Principle 14): `Debug`, `Log`, `Stop`, `GoTo`, `End` have 0 outputs — never chain `.then()` from them. Wire Debug/Log into the body with `f.edge()` from a non-terminal body node.

```typescript
// Use .then() for the sequential chain, .edge() only for port 1
f.node('42ec21', 'Core.Flow.Label', 'Next Item', {})
  .then('7dbafc', 'Core.Programming.ForEach', 'For Each', {
    optInput: Message('items'),
    optOutput: Message('item')
  })
  .then('a06926', 'Core.Programming.Function', 'Process Item', {
    func: 'return msg;'
  })
  .then('5f8d3e', 'Core.Programming.Sleep', 'Delay', {
    optDuration: Custom('1')
  })
  // GoTo wires back to Label. Node type is GoTo (capital T); optNodes.ids uses node IDs.
  .then('c91b47', 'Core.Flow.GoTo', 'Continue Loop', {
    optNodes: { ids: ['42ec21'], type: 'goto', all: false }
  });

// Debug inside the loop: f.edge() from a non-terminal body node (NEVER from GoTo)
f.node('dbg01', 'Core.Programming.Debug', 'Log Item', { optDebugData: Message('item') });
f.edge('a06926', 0, 'dbg01', 0);

// After loop completes (port 1) — .edge() for non-default port
f.node('2e6a8c', 'Core.Flow.Stop', 'Stop', {});
f.edge('7dbafc', 1, '2e6a8c', 0);
```

### Visual Representation
```
+-------+   +-------+   +-----+   +-------+   +------+
| Label |-->|ForEach|-->| Log |-->| Sleep |-->| Goto |--+
+-------+   |  P0 P1|   +-----+   +-------+   +------+  |
    ^       +---|---+                                    |
    |           |                                        |
    |           v                                        |
    |       +------+                                     |
    |       | Stop |                                     |
    |       +------+                                     |
    +----------------------------------------------------+
```

## Nested Loops

Each level needs its own Label->Goto pair. Use `.then()` for sequential chains, `.edge()` only for port 1 exits:

```typescript
// Outer loop: Label → ForEach → Body
f.node('f4a821', 'Core.Flow.Label', 'Next Category', {})
  .then('b72e5c', 'Core.Programming.ForEach', 'For Each Category', {
    optInput: Message('categories'),
    optOutput: Message('category')
  })
  // Outer loop body (port 0)
  .then('9d4f63', 'Core.Browser.OpenLink', 'Open Category', {
    inBrowserId: Message('browser_id'),
    inUrl: Message('category.url'),
    outPageId: Message('page_id')
  })
  // Inner loop: Label → ForEach → Body
  .then('1c8a7e', 'Core.Flow.Label', 'Next Product', {})
  .then('6eb394', 'Core.Programming.ForEach', 'For Each Product', {
    optInput: Message('category.products'),
    optOutput: Message('product')
  })
  // Inner loop body (port 0) — Function is chainable (1 output); Debug/Log are terminal (SKILL.md Core Principle 14)
  .then('d35c12', 'Core.Programming.Function', 'Process Product', {
    func: 'return msg;'
  })
  .then('87af49', 'Core.Programming.Sleep', 'Delay', {
    optDuration: Custom('1')
  })
  // Inner loop GoTo (use full prefixed ID: 1c8a7e)
  .then('e20d6b', 'Core.Flow.GoTo', 'Continue Inner', {
    optNodes: { ids: ['1c8a7e'], type: 'goto', all: false }
  });

// After inner loop completes (port 1), GoTo outer loop - needs .edge()
f.node('54c9f8', 'Core.Flow.GoTo', 'Continue Outer', {
  optNodes: { ids: ['f4a821'], type: 'goto', all: false }
});
f.edge('6eb394', 1, '54c9f8', 0);

// After outer loop completes (port 1) - needs .edge()
f.node('3b17ae', 'Core.Flow.Stop', 'Stop', {});
f.edge('b72e5c', 1, '3b17ae', 0);
```

## While Loop Pattern

Use `Core.Programming.Function` with `outputs: 2` for condition-based loops: Label → Function (check condition) → body on port 0 → GoTo back to Label → exit on port 1.

For conditional branching details, see `conditions.md` → **Multi-Output Function**.

## Loop with Early Exit (Break)

Add a `Function` node with `outputs: 2` inside the loop body to check a stop condition. Wire port 0 to a Stop/Log node (break), and port 1 continues processing → GoTo back to label. The ForEach port 1 (done) and the break path can share the same Stop node.

## Best Practices

1. **Always add delays** — Use `Core.Programming.Sleep` with `optDuration: Custom('N')` to prevent overwhelming targets
2. **Use descriptive node names** — Label: "Process Next Order", GoTo: "Go to Process Next Order"
3. **Handle errors inside loops** — Wrap risky operations in try/catch, return `msg` to continue
4. **Track progress** — Use `optIndex: Message('i')` on ForEach to log progress

## Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| Missing Goto | Flow stops after first iteration | Add `Core.Flow.GoTo` at end of loop body |
| Label after ForEach | Label must be BEFORE ForEach | Move Label before ForEach |
| GoTo with wrong ID | optNodes.ids needs the node ID | Use the correct hex ID in optNodes.ids |
| No delay in loop | Overwhelms target systems | Add RandomSleep in loop body |
| Wrong port numbers | Port 0 = loop body, Port 1 = done | Check port numbers in f.edge() |
| Debug in loop chain | Debug has 0 outputs → compile error | Wire Debug via `f.edge()` from a non-terminal body node (SKILL.md Core Principle 14) |
| Wrong node name (RandomSleep, Delay, …) | Node not found | See `../reference/node-naming.md` |
| Excessive `.edge()` | Verbose, harder to read | Use `.then()` for sequential chains |

## Summary

| Pattern | Key Elements |
|---------|--------------|
| ForEach | Label before ForEach -> body on port 0 -> Goto at end -> done on port 1 |
| While | Label -> Function (outputs: 2) -> body on port 0 -> Goto -> exit on port 1 |
| Nested | Each level has its own Label/Goto pair |
| Break | Conditional branch that skips Goto (falls through to exit) |

## Port Number Reference

**ForEach Node Ports:**
- Port 0: Loop body (executes for each item)
- Port 1: Done (executes after all items processed)

**Function Node (outputs: 2) Ports:**
- Port 0: First array element (typically: condition true)
- Port 1: Second array element (typically: condition false)

See `conditions.md` for complete conditional patterns.

Always use explicit port numbers with `.edge()` for multi-port nodes!
