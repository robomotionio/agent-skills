# SubFlows

Patterns for creating modular, reusable flow components using the SubFlow system.

**Related:** `branches.md` (parallel execution) · `exceptions.md` (Catch around a SubFlow) · `conditions.md` (multi-output branching) · `loops.md` (ForEach inside subflows).

## When NOT to use

- **Tiny logic (<3 nodes)** — the Begin/End overhead dwarfs the savings; inline it.
- **Single-output pass-through** — if the subflow just wraps one Function, inline the Function.
- **Requires `Core.Trigger.Inject` or `Core.Flow.Stop` inside** — those are flow-level only. SubFlows use `Begin`/`End`. If you need `Inject`, you need a flow, not a subflow.
- **Library update would break other projects** — library projects update ALL consumers. If the contract isn't stable, keep it as an inline subflow instead.

## Overview

SubFlows are **reusable flow components** inspired by Node-RED subflows. They enable:
- Logical separation of flow sections (login, data processing, cleanup)
- Cleaner main flows with complex logic encapsulated
- Multiple output paths from a single operation

**Example Use Case**: A Login subflow with username/password entry, captcha solving, and a session cookie output. The subflow can have 2 outputs: success (with cookie) or failure.

## Library Projects vs Inline Subflows

There are two types of subflows in Robomotion:

| | Inline Subflows | Library Projects |
|---|---|---|
| **Location** | `subflows/` dir inside a flow project | Standalone project (sidebar → Libraries) |
| **Scope** | Private to one flow | Shared across ALL flow projects |
| **main.ts** | N/A (file is `subflows/{id}.ts`) | Uses `library.create(id, name, fn)` (NOT `flow.create().start()`) |
| **Entry/Exit** | `Core.Flow.Begin` / `Core.Flow.End` | `Core.Flow.Begin` / `Core.Flow.End` |
| **Invoked by** | `Core.Flow.SubFlow` node (ID = filename) | `Core.Flow.Library` node |
| **Updates** | Only affects parent flow | Updates ALL projects using the library |

**Key rule**: Library projects NEVER use `Core.Trigger.Inject` or `Core.Flow.Stop`. Those are for regular flow projects only. Libraries always use `Core.Flow.Begin` as entry and `Core.Flow.End` as exit, just like inline subflows.

```typescript
// Library project main.ts
import { library, Message } from '@robomotion/sdk';

library.create('FLOW_ID', 'My Library', (f) => {
  f.node('e4f5c6', 'Core.Flow.Begin', 'Begin', {})
    .then('d7e8f9', 'Core.Programming.Function', 'Process', {
      func: `msg.result = msg.input.toUpperCase(); return msg;`
    })
    .then('a1b2c3', 'Core.Flow.End', 'End', { sfPort: 0 });
});
```

## Architecture

### Directory Structure

Subflows are stored as 6-char hex-named TypeScript files in the `subflows/` directory:

```
flows/<flow-name>/
├── main.ts                    # Main flow (uses Core.Flow.SubFlow nodes)
├── package.json
└── subflows/
    ├── 7dbafc.ts              # Login subflow
    └── a3f21c.ts              # Process data subflow
```

**Key Points:**
- Each subflow has a unique 6-char hex filename (e.g., `7dbafc.ts`)
- The SubFlow node's ID in the parent flow IS the subflow identifier — no separate `subflow` property needed
- CLI auto-discovers subflows in `subflows/*.ts` and merges them into the output

### ID Prefixing (Critical for Collision Avoidance)

When flows merge, node IDs must be globally unique (they're message box receivers):

| Flow | User ID | Full ID |
|------|---------|---------|
| Main flow | `a3f21c` | `{flowId}_a3f21c` |
| Subflow | `a3f21c` | `{subflowId}_a3f21c` |

The SDK automatically prefixes node IDs with the flow/subflow GUID.

## Node Reference

### Scope Hierarchy

```
main.ts (or parent subflow)
├── Core.Flow.SubFlow  ← calls subflow by its node ID
│
└── subflows/{nodeId}.ts
    ├── Core.Flow.Begin  ← entry point (INSIDE subflow)
    ├── ... other nodes ...
    ├── Core.Flow.SubFlow  ← can call another subflow (infinite nesting)
    └── Core.Flow.End  ← exit point (INSIDE subflow)
```

**Key distinction:**
- `Core.Flow.SubFlow` - Used in **parent scope** to invoke a subflow
- `Core.Flow.Begin` / `Core.Flow.End` - Used **inside** the subflow file

### Core.Flow.SubFlow (Parent Scope - Invokes a Subflow)

**Location**: `main.ts` or any parent subflow that wants to call another subflow

| Property | Default | Description |
|----------|---------|-------------|
| `outputs` | `1` | Number of output ports (1-32) |

**The SubFlow node's ID IS the subflow identifier.** The runtime derives the subflow ID from the node's GUID — no `subflow` property is needed. Example: a SubFlow node with ID `7dbafc` will load `subflows/7dbafc.ts`.

This node references a subflow. The runtime:
1. Looks up the subflow data by the node's GUID (from the merged JSON registry)
2. Routes incoming messages to all `Begin` nodes inside that subflow
3. Maps `End` node `sfPort` values back to this SubFlow node's output ports

### Core.Flow.Begin (Inside Subflow - Entry Point)

**Location**: Inside `subflows/{id}.ts` only

| Property | Description |
|----------|-------------|
| *none* | Entry point marker |

- **0 inputs, 1 output**
- Every subflow **MUST** have at least 1 Begin node
- Messages entering the SubFlow start here

**How Begin Works**: When a message arrives at a SubFlow node in the parent scope, the runtime routes it to **all** Begin nodes inside that subflow. The Begin node then passes the message to its connected nodes.

### Core.Flow.End (Inside Subflow - Exit Point)

**Location**: Inside `subflows/{id}.ts` only

| Property | Default | Description |
|----------|---------|-------------|
| `sfPort` | `0` | Output port index (0-based) |

- **1 input, 0 outputs**
- Every subflow **MUST** have at least 1 End node
- Maps to parent SubFlow node's output ports via `sfPort`

**How `sfPort` Works**: When the runtime initializes a SubFlow, it reads all End nodes and their `sfPort` values. Each End node is wired to the corresponding output port of the **parent** SubFlow node:

```
Inside subflows/{id}.ts:
  End node (sfPort: 0)  →  wired to  →  Parent's SubFlow port 0  →  whatever follows port 0
  End node (sfPort: 1)  →  wired to  →  Parent's SubFlow port 1  →  whatever follows port 1
```

The runtime uses `sfPort` as an index into the parent SubFlow's output port array (`nodeMap[subflowGuid][sfPort]`).

## Single Output SubFlow

The simplest pattern: one Begin, one End.

### Subflow Definition (`subflows/7dbafc.ts`)

```typescript
// subflows/7dbafc.ts - Login SubFlow (ID inferred from filename)
import { subflow, Message, Custom } from '@robomotion/sdk';

subflow.create('Login SubFlow', (f) => {
  // Begin node - entry point (REQUIRED)
  f.node('42ec21', 'Core.Flow.Begin', 'Begin', {})
    .then('a3f21c', 'Core.Browser.OpenLink', 'Open Login', {
      inBrowserId: Message('browser_id'),
      inUrl: Custom('https://app.example.com/login'),
      outPageId: Message('page_id')
    })
    .then('a06926', 'Core.Browser.TypeText', 'Enter Email', {
      inPageId: Message('page_id'),
      inSelector: Custom('//input[@name="email"]'),
      inText: Message('credentials.username')
    })
    .then('b8c3d4', 'Core.Browser.TypeText', 'Enter Password', {
      inPageId: Message('page_id'),
      inSelector: Custom('//input[@name="password"]'),
      inText: Message('credentials.password')
    })
    .then('c9e5f7', 'Core.Browser.ClickElement', 'Click Login', {
      inPageId: Message('page_id'),
      inSelector: Custom('//button[@type="submit"]')
    })
    .then('d1a2b3', 'Core.Browser.WaitElement', 'Wait Dashboard', {
      inPageId: Message('page_id'),
      inSelector: Custom('//div[@class="dashboard"]'),
      optTimeout: Custom('30')
    })
    // End node - exit point (REQUIRED)
    .then('e4f6c8', 'Core.Flow.End', 'End', {
      sfPort: 0  // Maps to SubFlow output port 0
    });
});
```

**CRITICAL**: Every subflow file **MUST** have:
1. `subflow.create(name, fn)` - NOT `flow.create()` with `.start()`
2. `Core.Flow.Begin` - Entry point where messages enter
3. `Core.Flow.End` - Exit point(s) with `sfPort` mapping to parent outputs

### Main Flow Using the SubFlow (`main.ts`)

```typescript
// main.ts - Main flow that uses the Login subflow
import { flow, Message, Custom, Credential } from '@robomotion/sdk';

const CREDS = { vaultId: 'xxx', itemId: 'yyy' };

flow.create('e599f6ce-60cd-47d6-a478-57f1c1b8e27e', 'Main Flow with Login', (f) => {
  f.node('f2a7b9', 'Core.Trigger.Inject', 'Start', {})
    .then('18c4d6', 'Core.Vault.GetItem', 'Get Credentials', {
      optCredentials: Credential(CREDS),
      outItem: Message('credentials')
    })
    .then('29e5f8', 'Core.Browser.Open', 'Open Browser', {
      outBrowserId: Message('browser_id')
    })
    // SubFlow node — node ID '7dbafc' matches subflows/7dbafc.ts
    .then('7dbafc', 'Core.Flow.SubFlow', 'Login', {})
    // Continue after login completes
    .then('4b07da', 'Core.Browser.GetCookies', 'Get Session Cookies', {
      inPageId: Message('page_id'),
      outCookies: Message('cookies')
    })
    .then('5c18eb', 'Core.Browser.Close', 'Close Browser', {
      inBrowserId: Message('browser_id')
    })
    .then('6d29fc', 'Core.Flow.Stop', 'Stop', {});
}).start();
```

### Visual Representation

```
Main Flow:
+-------+   +-------+   +--------+   +---------------+   +--------+   +------+
| Start |-->| Creds |-->| Open   |-->| Login SubFlow |-->| Cookie |-->| Stop |
+-------+   +-------+   | Browser|   | (ID: 7dbafc)  |   +--------+   +------+
                        +--------+   +---------------+
                                           |
                                           v
                              Internally executes subflows/7dbafc.ts
```

## Multiple Output SubFlow

SubFlows can have multiple outputs for different outcomes (success/failure, different paths).

### Subflow with 2 Outputs (`subflows/c4e5a2.ts`)

```typescript
// subflows/c4e5a2.ts - Bank File Check SubFlow
import { subflow, Message } from '@robomotion/sdk';

subflow.create('Bank File Check', (f) => {
  // Begin - entry point
  f.node('7e3a0b', 'Core.Flow.Begin', 'Begin', {})
    .then('8f4b1c', 'Robomotion.SQLite.Query', 'Query: Bank Total', {
      func: `SELECT count(*) as counter FROM banka WHERE islem_tarihi LIKE '{{currentDateDB}}'`,
      inConnectionId: Message('bank_conn_id'),
      inTransactionId: Message('trx_id'),
      outResult: Message('result')
    })
    .then('9a5c2d', 'Core.Programming.Function', 'Check Count', {
      func: `if (msg.result.rows[0].counter == 0) {
  return [msg, null];  // Port 0: no records
}
return [null, msg];    // Port 1: has records`
    });

  // Port 0: No records - exit early with sfPort: 0
  f.node('ab6d3e', 'Core.Flow.End', 'End Empty', { sfPort: 0 });
  f.edge('9a5c2d', 0, 'ab6d3e', 0);

  // Port 1: Has records - continue processing via nested subflow
  f.node('bc7e4f', 'Core.Flow.SubFlow', 'Check Status', {});
  f.edge('9a5c2d', 1, 'bc7e4f', 0);

  // After nested subflow - exit with sfPort: 1
  f.node('cd8f50', 'Core.Flow.End', 'End Processed', { sfPort: 1 });
  f.edge('bc7e4f', 0, 'cd8f50', 0);
});
```

### Main Flow Handling Both Outputs

```typescript
// main.ts - Main flow with multi-output subflow
import { flow, Message, Custom } from '@robomotion/sdk';

flow.create('main', 'Process Bank Data', (f) => {
  f.node('de9061', 'Core.Trigger.Inject', 'Start', {})
    .then('ef0172', 'Robomotion.SQLite.Open', 'Open DB', {
      inPath: Message('db_path'),
      outConnectionId: Message('bank_conn_id')
    })
    // SubFlow with 2 outputs — node ID 'c4e5a2' matches subflows/c4e5a2.ts
    .then('c4e5a2', 'Core.Flow.SubFlow', 'Bank File Check', {
      outputs: 2  // Two output ports!
    });

  // Port 0: No records found - skip processing
  f.node('012394', 'Core.Flow.Log', 'No Records', {
    inText: Custom('No bank records to process')
  });
  f.edge('c4e5a2', 0, '012394', 0);

  f.node('1234a5', 'Core.Flow.Stop', 'Stop Empty', {});
  f.edge('c4e5a2', 0, '1234a5', 0);

  // Port 1: Records processed - continue
  f.node('2345b6', 'Core.Flow.Log', 'Records Processed', {
    inText: Custom('Bank records processed successfully')
  });
  f.edge('c4e5a2', 1, '2345b6', 0);

  f.node('3456c7', 'Core.Flow.Stop', 'Stop Success', {});
  f.edge('c4e5a2', 1, '3456c7', 0);
}).start();
```

### Visual Representation

```
Main Flow:
                                              Port 0 (no records)
+-------+   +---------+   +----------------+   +------------+
| Start |-->| Open DB |-->| Bank File Check|-->| No Records |-->| Stop |
+-------+   +---------+   | SubFlow        |   +------------+
                          | (outputs:2)    |
                          +-------|--------+
                                  |
                                  | Port 1 (processed)
                                  v
                          +------------+
                          | Processed  |-->| Stop |
                          +------------+

Inside Bank File Check SubFlow:
+-------+   +-------+   +-------+   +-----------+
| Begin |-->| Query |-->| Check |-->| End (sf0) | ← sfPort: 0 (no records)
+-------+   +-------+   | P0  P1|   +-----------+
                        +---|---+
                            |
                            | Port 1 (has records)
                            v
                        +--------------+   +-----------+
                        | Check Status |-->| End (sf1) | ← sfPort: 1
                        | (SubFlow)    |   +-----------+
                        +--------------+
```

## Common Use Cases

| Use Case | Outputs | Description |
|----------|---------|-------------|
| Login | 1 | Login flow, returns logged-in session |
| Login with error handling | 2 | Port 0: success, Port 1: login failed |
| Data validation | 2 | Port 0: valid, Port 1: invalid |
| CAPTCHA solving | 2 | Port 0: solved, Port 1: failed |
| File processing | 3 | Port 0: success, Port 1: not found, Port 2: error |
| API call with retry | 2 | Port 0: success, Port 1: max retries exceeded |

## Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| Using `flow.create().start()` in library | Wrong function | Use `library.create(id, name, fn)` for library projects |
| Missing Begin node | Subflow has no entry point | Add `Core.Flow.Begin` |
| Missing End node | Subflow never exits | Add `Core.Flow.End` with `sfPort` |
| Wrong `sfPort` values | Messages route to wrong output | Ensure sfPort matches intended port (0-indexed) |
| Mismatched `outputs` count | End nodes don't align with SubFlow outputs | Set `outputs: N` on SubFlow, use End nodes with `sfPort: 0` to `N-1` |
| Connecting after End | End has 0 outputs | End is terminal - nothing can follow |
| Adding `subflow` property | Unnecessary, causes confusion | SubFlow node ID IS the identifier — no property needed |
| Non-hex node IDs | Subflow routing failure | Use 6-char hex (0-9, a-f) for all node IDs |

## Best Practices

1. **Use `subflow.create()` for inline subflows, `library.create(id, name, fn)` for library projects** - NOT `flow.create()`
2. **One Begin node per subflow** - Multiple Begin nodes receive duplicate messages
3. **Match End nodes to outputs** - If `outputs: 3`, have End nodes with `sfPort: 0, 1, 2`
4. **SubFlow node ID = subflow filename** - Node ID `7dbafc` → file `subflows/7dbafc.ts` (ID inferred automatically)
5. **Use descriptive names** - `Login SubFlow` not `SubFlow 1`
6. **Keep subflows focused** - One logical operation per subflow
7. **Pass data via msg** - Input/output data flows through the message object
8. **Document expected msg properties** - Add comments about required inputs and outputs
9. **Use Catch for error handling** - See `exceptions.md` for patterns

## Nested SubFlows

Subflows can call other subflows to any depth — a `subflow.create()` file may contain `Core.Flow.SubFlow` nodes referencing other `subflows/*.ts` files, and each file must have its own `Begin` and `End`. No special syntax for nesting.

## Testing Subflows

See `testing-flow` skill → `reference/subflow-tester.md` for the `SubflowTester` / `discoverSubflows` API.

## See Also

- `branches.md` - Parallel execution and WaitGroup patterns
- `exceptions.md` - Catch node and error handling
- `conditions.md` - Multi-output Function nodes for branching
- `loops.md` - ForEach and While patterns within subflows
