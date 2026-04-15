# Parallel Execution and Branching

Patterns for running parallel branches in Robomotion flows using the builder SDK.

**Related:** `loops.md` (serial iteration) · `exceptions.md` (Catch → Done for failed branches) · `conditions.md` (Function-based routing).

## When NOT to use

- **Sub-100ms per-item work** — branching overhead dominates; use a plain ForEach loop.
- **<3 branches without a shared WaitGroup** — just fan out with multiple `f.edge()` calls.
- **Many (>20) branches without queueing** — spinning up 100 parallel workers is slower than 5 workers pulling from a `MemoryQueue`. Use ForkBranch + MemoryQueue.
- **Ordered results required** — fan-out loses ordering; collect with a Function + sort at the end, or stay serial.

## The Messaging Paradigm

Robomotion is a **Node-RED inspired messaging system**. Messages (`msg` objects) flow through wires between nodes. When a node's output connects to multiple targets, **each target receives its own copy** of the message - creating true parallel execution paths.

This is fundamentally different from traditional sequential RPA tools. Instead of processing items one at a time, Robomotion can:
- Open multiple browser tabs simultaneously
- Make concurrent API calls
- Process data with multiple workers

## Basic Fan-Out (No Synchronization)

Connect one node's output to multiple targets. Each branch gets its own `msg` copy and executes independently.

```typescript
f.node('4e2c91', 'Core.Trigger.Inject', 'Start', {})
  .then('7dbf3c', 'Core.Programming.Function', 'Prepare', {
    func: `msg.data = 'shared'; return msg;`
  });

// Fan-out: three independent branches (Core.Flow.Log has 0 outputs — terminal)
f.node('a09b26', 'Core.Flow.Log', 'Branch 1', { inText: Custom('Branch 1') });
f.node('8fc4d1', 'Core.Flow.Log', 'Branch 2', { inText: Custom('Branch 2') });
f.node('2b1e58', 'Core.Flow.Log', 'Branch 3', { inText: Custom('Branch 3') });

f.edge('7dbf3c', 0, 'a09b26', 0);
f.edge('7dbf3c', 0, '8fc4d1', 0);
f.edge('7dbf3c', 0, '2b1e58', 0);
```

### Visual Representation
```
              +----------+
           +->| Branch 1 |
           |  +----------+
+-------+  |  +----------+
| Start |--+->| Branch 2 |
+-------+  |  +----------+
           |  +----------+
           +->| Branch 3 |
              +----------+
```

**Use case**: Fire-and-forget parallel operations where you don't need to wait for completion.

## WaitGroup Nodes (Low-Level Primitives)

Based on Go's `sync.WaitGroup`. Use when you need to wait for all parallel branches to complete before continuing.

### Node Reference

| Node | Outputs | Properties | Purpose |
|------|---------|------------|---------|
| `Core.WaitGroup.Create` | 1 | `outWaitGroupID` | Create new WaitGroup |
| `Core.WaitGroup.Add` | 1 | `inWaitGroupID`, `optDelta` | Increment counter |
| `Core.WaitGroup.Done` | **0** | `inWaitGroupID` | Decrement counter (terminal!) |
| `Core.WaitGroup.Wait` | 1 | `inWaitGroupID` | Block until counter=0 |

**Critical**: `Done` has **0 outputs** - it's a terminal node. Nothing can follow it.

### Visual Representation
```
+--------+   +--------+   +---> Branch 1 ---> ... ---> Done
| Create |-->| Add(3) |---+---> Branch 2 ---> ... ---> Done
+--------+   +--------+   +---> Branch 3 ---> ... ---> Done
                |
                +---> Wait (blocks until all Done)
                        |
                        v
                   Continue flow
```

### Example: Three Parallel Branches

```typescript
// Create WaitGroup
f.node('b3a7f2', 'Core.Trigger.Inject', 'Start', {})
  .then('c91d84', 'Core.WaitGroup.Create', 'WG Create', {
    outWaitGroupID: Message('wg_id')
  })
  .then('e5f6a0', 'Core.WaitGroup.Add', 'WG Add', {
    inWaitGroupID: Message('wg_id'),
    optDelta: Custom('3')  // 3 branches
  });

// Branch 1
f.node('f7c2b9', 'Core.Programming.Function', 'Branch 1 Work', {
  func: `msg.result1 = 'done'; return msg;`
});
f.edge('e5f6a0', 0, 'f7c2b9', 0);

f.node('1d4e83', 'Core.WaitGroup.Done', 'Branch 1 Done', {
  inWaitGroupID: Message('wg_id')
});
f.edge('f7c2b9', 0, '1d4e83', 0);

// Branch 2
f.node('a2b5c6', 'Core.Programming.Function', 'Branch 2 Work', {
  func: `msg.result2 = 'done'; return msg;`
});
f.edge('e5f6a0', 0, 'a2b5c6', 0);

f.node('3e9f71', 'Core.WaitGroup.Done', 'Branch 2 Done', {
  inWaitGroupID: Message('wg_id')
});
f.edge('a2b5c6', 0, '3e9f71', 0);

// Branch 3
f.node('d8c4a2', 'Core.Programming.Function', 'Branch 3 Work', {
  func: `msg.result3 = 'done'; return msg;`
});
f.edge('e5f6a0', 0, 'd8c4a2', 0);

f.node('6f1b95', 'Core.WaitGroup.Done', 'Branch 3 Done', {
  inWaitGroupID: Message('wg_id')
});
f.edge('d8c4a2', 0, '6f1b95', 0);

// Wait for all branches
f.node('82e7d4', 'Core.WaitGroup.Wait', 'WG Wait', {
  inWaitGroupID: Message('wg_id')
});
f.edge('e5f6a0', 0, '82e7d4', 0);

// Continue after all done
f.node('9ca3b8', 'Core.Flow.Stop', 'Stop', {});
f.edge('82e7d4', 0, '9ca3b8', 0);
```

## ForkBranch Node (High-Level Abstraction)

`Core.Flow.ForkBranch` simplifies parallel branching by handling Create/Add/Wait internally.

### Properties

| Property | Default | Description |
|----------|---------|-------------|
| `optNofBranches` | `2` | Number of parallel branches (minimum 2) |
| `outBranchID` | `msg.branch_id` | Unique ID for each branch ("1.wgID", "2.wgID", ...) |
| `outWaitGroupID` | `msg.wg_id` | WaitGroup ID for Done calls |

### Two Output Ports

- **Port 0**: Fires N times immediately (one for each branch)
- **Port 1**: Fires once after ALL branches call `Done`

**Important**: You still must call `Core.WaitGroup.Done` at the end of each branch!

### Visual Representation
```
               Port 0 (fires 3 times)
+------------+     +----------+
| ForkBranch |---->| Branch   |---> ... ---> WG Done
| (N=3)      |     | Work     |
+------|-----+     +----------+
       |
       | Port 1 (fires once, after all Done)
       v
  +---------+
  | Continue|
  +---------+
```

### Example: Fork with 3 Branches

```typescript
f.node('42ec21', 'Core.Trigger.Inject', 'Start', {})
  .then('7dbafc', 'Core.Flow.ForkBranch', 'Fork', {
    optNofBranches: Custom('3'),
    outBranchID: Message('branch_id'),
    outWaitGroupID: Message('wg_id')
  });

// Port 0: Branch work (executes 3 times in parallel)
f.node('a06926', 'Core.Programming.Function', 'Do Work', {
  func: `
    console.log('Branch ' + msg.branch_id + ' working');
    msg['result_' + msg.branch_id] = 'completed';
    return msg;
  `
});
f.edge('7dbafc', 0, 'a06926', 0);

// End each branch with Done
f.node('b5c3d7', 'Core.WaitGroup.Done', 'WG Done', {
  inWaitGroupID: Message('wg_id')
});
f.edge('a06926', 0, 'b5c3d7', 0);

// Port 1: After all branches complete
f.node('e8f1a4', 'Core.Flow.Log', 'All Done', {
  inText: Custom('All branches completed')
});
f.edge('7dbafc', 1, 'e8f1a4', 0);

f.node('c2d9b6', 'Core.Flow.Stop', 'Stop', {});
f.edge('7dbafc', 1, 'c2d9b6', 0);
```

## MemoryQueue for Work Distribution

`Robomotion.MemoryQueue.*` nodes implement a thread-safe queue for producer-consumer patterns.

### Node Reference

| Node | Properties | Purpose |
|------|------------|---------|
| `Create` | `optElements`, `outQueueID` | Create queue (optionally pre-populated) |
| `Enqueue` | `inQueueID`, `inElement` | Add element to queue |
| `Dequeue` | `inQueueID`, `outElement` | Remove element (**throws if empty!**) |
| `Delete` | `inQueueID` | Destroy queue |

### Critical Pattern: Dequeue Throws When Empty

`Dequeue` throws an exception when the queue is empty. You **must** use `Core.Trigger.Catch` to handle this:

```
Label → Dequeue → Process → Goto Label
           ↓ (exception when empty)
       Catch → WG Done
```

### Example: Queue Processing Loop

```typescript
// Create queue with items
f.node('5f8c3a', 'Core.Trigger.Inject', 'Start', {})
  .then('9b2e71', 'Core.Programming.Function', 'Prepare Items', {
    func: `msg.items = ['item1', 'item2', 'item3']; return msg;`
  })
  .then('d4a6f8', 'Robomotion.MemoryQueue.Create', 'Create Queue', {
    optElements: Message('items'),
    outQueueID: Message('qid')
  });

// Loop label
f.node('e7b1c5', 'Core.Flow.Label', 'Next Item', {});
f.edge('d4a6f8', 0, 'e7b1c5', 0);

// Dequeue (throws when empty)
f.node('3c9f24', 'Robomotion.MemoryQueue.Dequeue', 'Dequeue', {
  inQueueID: Message('qid'),
  outElement: Message('item')
});
f.edge('e7b1c5', 0, '3c9f24', 0);

// Process item
f.node('a8d2e6', 'Core.Programming.Function', 'Process', {
  func: `console.log('Processing:', msg.item); return msg;`
});
f.edge('3c9f24', 0, 'a8d2e6', 0);

// Loop back
f.node('f1c7b9', 'Core.Flow.GoTo', 'Continue', {
  optNodes: { ids: ['e7b1c5'], type: 'goto', all: false }
});
f.edge('a8d2e6', 0, 'f1c7b9', 0);

// Catch empty queue exception
f.node('6e4a82', 'Core.Trigger.Catch', 'Queue Empty', {
  optNodes: { ids: ['3c9f24'], all: false }
});

// Queue empty - we're done
f.node('b9f3d1', 'Core.Flow.Log', 'All Done', {
  inText: Custom('Queue processing complete')
});
f.edge('6e4a82', 0, 'b9f3d1', 0);

f.node('2a5c87', 'Core.Flow.Stop', 'Stop', {});
f.edge('6e4a82', 0, '2a5c87', 0);
```

## Combined Pattern: ForkBranch + MemoryQueue

The recommended pattern for parallel work distribution with multiple workers.

### Visual Representation
```
+-------+   +--------------+   +------------+
| Start |-->| Create Queue |-->| ForkBranch |
+-------+   | (100 items)  |   | (5 workers)|
            +--------------+   +-----|------+
                                     |
          Port 0 (fires 5 times)     |
          +--------------------------+
          |
          v
    +-------+   +---------+   +---------+   +------+
    | Label |-->| Dequeue |-->| Process |-->| Goto |--+
    +-------+   +---------+   +---------+   +------+  |
        ^            |                                 |
        |            | (exception when empty)          |
        |            v                                 |
        |       +-------+   +---------+                |
        |       | Catch |-->| WG Done |                |
        |       +-------+   +---------+                |
        +----------------------------------------------+
                                     |
          Port 1 (after all Done)    |
          +--------------------------+
          |
          v
    +----------+
    | Continue |
    +----------+
```

### Example: Process Invoices with 5 Parallel Workers

```typescript
import { flow, Message, Custom } from '@robomotion/sdk';

const invoiceFlow = flow.create('main', 'Parallel Invoice Processing', (f) => {
  // Start and prepare data
  f.node('d1e4f7', 'Core.Trigger.Inject', 'Start', {})
    .then('8c3b2a', 'Core.Programming.Function', 'Get Invoices', {
      func: `
        // Simulate 100 invoices
        msg.invoices = [];
        for (let i = 1; i <= 100; i++) {
          msg.invoices.push({ id: i, amount: Math.random() * 1000 });
        }
        return msg;
      `
    })
    .then('f5a9c6', 'Robomotion.MemoryQueue.Create', 'Create Queue', {
      optElements: Message('invoices'),
      outQueueID: Message('qid')
    })
    .then('b7e2d8', 'Core.Flow.ForkBranch', 'Fork 5 Workers', {
      optNofBranches: Custom('5'),
      outBranchID: Message('branch_id'),
      outWaitGroupID: Message('wg_id')
    });

  // Port 0: Worker loop (executes 5 times in parallel)
  f.node('4f6c91', 'Core.Flow.Label', 'Next Invoice', {});
  f.edge('b7e2d8', 0, '4f6c91', 0);

  // Dequeue next invoice
  f.node('a3d7b5', 'Robomotion.MemoryQueue.Dequeue', 'Dequeue', {
    inQueueID: Message('qid'),
    outElement: Message('invoice')
  });
  f.edge('4f6c91', 0, 'a3d7b5', 0);

  // Process invoice
  f.node('c8e1f4', 'Core.Programming.Function', 'Process Invoice', {
    func: `
      console.log('Worker ' + msg.branch_id + ' processing invoice ' + msg.invoice.id);
      // Simulate processing
      return msg;
    `
  });
  f.edge('a3d7b5', 0, 'c8e1f4', 0);

  // Small delay to prevent overwhelming
  f.node('9b4a2c', 'Core.Programming.Sleep', 'Random Delay', {
    optRandom: true,
    optRandMin: Custom('0.1'),
    optRandMax: Custom('0.5')
  });
  f.edge('c8e1f4', 0, '9b4a2c', 0);

  // Loop back for next item
  f.node('e6f8d3', 'Core.Flow.GoTo', 'Continue Loop', {
    optNodes: { ids: ['4f6c91'], type: 'goto', all: false }
  });
  f.edge('9b4a2c', 0, 'e6f8d3', 0);

  // Catch empty queue - worker is done
  f.node('2c7b95', 'Core.Trigger.Catch', 'Queue Empty', {
    optNodes: { ids: ['a3d7b5'], all: false }
  });

  f.node('f9a3c8', 'Core.WaitGroup.Done', 'Worker Done', {
    inWaitGroupID: Message('wg_id')
  });
  f.edge('2c7b95', 0, 'f9a3c8', 0);

  // Port 1: After all workers complete
  f.node('5d1e7b', 'Core.Flow.Log', 'All Complete', {
    inText: Custom('All 100 invoices processed')
  });
  f.edge('b7e2d8', 1, '5d1e7b', 0);

  f.node('8a4f6c', 'Core.Flow.Stop', 'Stop', {});
  f.edge('b7e2d8', 1, '8a4f6c', 0);
});

invoiceFlow.start();
```

## Error Handling in Parallel Branches

Every branch **must** call `Done` - whether it succeeds or fails. If any branch fails to call `Done`, `Wait` blocks forever.

### Two Paths to Done

1. **Success path**: Branch completes normally → `Done`
2. **Failure path**: Branch catches error → `Catch` → `Done`

### Example: Error-Safe Branch

```typescript
// ForkBranch setup
f.node('7b3e9c', 'Core.Flow.ForkBranch', 'Fork', {
  optNofBranches: Custom('3'),
  outWaitGroupID: Message('wg_id')
});

// Port 0: Branch work that might fail
f.node('d2f5a1', 'Core.Net.HttpRequest', 'Fetch Data', {
  optUrl: Message('api_url'),
  optMethod: 'get',
  outBody: Message('data')
});
f.edge('7b3e9c', 0, 'd2f5a1', 0);

// Success: process and done
f.node('4c8b67', 'Core.Programming.Function', 'Process', {
  func: `msg.processed = true; return msg;`
});
f.edge('d2f5a1', 0, '4c8b67', 0);

f.node('a9e1c3', 'Core.WaitGroup.Done', 'Success Done', {
  inWaitGroupID: Message('wg_id')
});
f.edge('4c8b67', 0, 'a9e1c3', 0);

// Failure: catch and done
f.node('f6d4b8', 'Core.Trigger.Catch', 'Catch Error', {
  optNodes: { ids: ['d2f5a1'], all: false }
});

f.node('1a7c52', 'Core.Programming.Function', 'Log Error', {
  func: `console.log('Branch failed:', msg.error); return msg;`
});
f.edge('f6d4b8', 0, '1a7c52', 0);

f.node('e3b9f6', 'Core.WaitGroup.Done', 'Failure Done', {
  inWaitGroupID: Message('wg_id')
});
f.edge('1a7c52', 0, 'e3b9f6', 0);
```

## Use Cases

| Use Case | Pattern |
|----------|---------|
| Process N items with M workers | ForkBranch + MemoryQueue |
| Multiple browser tabs | ForkBranch (each branch opens a tab) |
| Parallel API calls | Fan-out or ForkBranch |
| Concurrent file operations | ForkBranch |
| Queue processing until empty | MemoryQueue + Catch → Done |
| Web scraping with workers | Excel GetRange → MemoryQueue → ForkBranch |
| HTTP API batch requests | Array of URLs → MemoryQueue → ForkBranch |

### Web Scraping Example Flow

1. Read Excel file with 100 URLs
2. Create MemoryQueue with URLs
3. ForkBranch with 5 workers
4. Each worker: Dequeue URL → Open browser → Scrape → Save → Loop
5. Catch empty queue → WG Done
6. Port 1: All scraping complete

## Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| Missing `Done` in branch | `Wait` blocks forever | Always end branches with `Done` |
| No `Catch` for Dequeue | Exception crashes branch | Use Catch → Done pattern |
| Connecting after `Done` | `Done` has 0 outputs | Nothing can follow Done |
| ForkBranch without Done | Port 1 never fires | Still need `Done` at end of Port 0 branches |
| Wrong port on ForkBranch | Port 0 = branches, Port 1 = after | Check port numbers |
| Forgetting error path Done | Failed branches don't decrement | Add Catch → Done for failures |

## Summary

| Pattern | Key Elements |
|---------|--------------|
| Fan-out | Multiple edges from one output (no synchronization) |
| WaitGroup | Create → Add(N) → N branches → Done each → Wait |
| ForkBranch | ForkBranch → Port 0 branches → Done each → Port 1 continues |
| Worker Pool | ForkBranch + MemoryQueue + Catch → Done pattern |

## See Also

- `loops.md` - Label/Goto patterns for loops
- `exceptions.md` - Catch node and error handling
- `conditions.md` - Multi-output Function nodes for branching logic
