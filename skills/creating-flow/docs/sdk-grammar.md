# Capability: TypeScript Builder SDK Syntax

The builder SDK provides a fluent API for creating Robomotion flows in TypeScript.

## Basic Structure

```typescript
import { flow, Message, Custom } from '@robomotion/sdk';

const myFlow = flow.create('main', 'Flow Name', (f) => {
  // Define nodes and connections here
});

myFlow.start();  // REQUIRED - compiles and outputs JSON to stdout
```

### Library Projects

```typescript
import { library, Message, Custom } from '@robomotion/sdk';

library.create('FLOW_ID', 'Library Name', (f) => {
  // Uses Core.Flow.Begin/End instead of Inject/Stop
});
// No .start() needed
```

## Creating Nodes

### Single Node

```typescript
f.node('42ec21', 'Package.Category.NodeType', 'Node Label', {
  property1: value1,
  property2: value2
});
```

### Chained Nodes (use .then())

For simple sequential connections where one node leads to another:

```typescript
f.node('7dbafc', 'Core.Trigger.Inject', 'Start', {})
  .then('a06926', 'Core.Programming.Function', 'Step 1', {
    func: 'msg.step = 1; return msg;'
  })
  .then('c3e8f1', 'Core.Programming.Function', 'Step 2', {
    func: 'msg.step = 2; return msg;'
  })
  .then('d4f9a2', 'Core.Flow.Stop', 'Stop', {});
```

## Connecting Nodes

### .then() vs .edge() - When to Use Each

**Rule: Use `.then()` for sequential chains. Use `.edge()` only when necessary.**

| Use `.then()` for | Use `.edge()` for |
|-------------------|-------------------|
| Sequential flow (port 0 → port 0) | Multi-port connections (port 1+) |
| Simple chains | Fan-out (one node → multiple nodes) |
| Most of your flow | Loops (Goto back to Label) |

### Sequential Chains (use .then())

**Prefer `.then()` for simple sequential connections.** This is cleaner and more readable:

```typescript
// GOOD - clean sequential chain
f.node('b4f2e8', 'Core.Trigger.Inject', 'Start', {})
  .then('d91c3a', 'Core.Programming.Function', 'Process', {
    func: `msg.data = 'hello'; return msg;`
  })
  .then('e5a7b2', 'Core.FileSystem.WriteFile', 'Write', {
    inPath: Message('output_path'),
    inText: Message('data')
  })
  .then('f8c4d6', 'Core.Flow.Stop', 'Stop', {});
```

### Multi-Port Connections (use .edge())

Use `.edge()` when dealing with multiple outputs (loops, conditionals, fan-out):

```typescript
// Create nodes separately - use Function with outputs: 2 for conditionals
f.node('1a9b5c', 'Core.Programming.Function', 'Check Value', {
  outputs: 2,
  func: `
    if (msg.value > 10) {
      return [msg, null];  // Port 0: true
    }
    return [null, msg];    // Port 1: false
  `
});

f.node('2c7d4e', 'Core.Programming.Debug', 'True Branch', {
  optDebugData: Message('value')
});

f.node('3f8e6a', 'Core.Programming.Debug', 'False Branch', {
  optDebugData: Message('value')
});

// Connect with explicit port numbers
f.edge('1a9b5c', 0, '2c7d4e', 0);  // Port 0: true
f.edge('1a9b5c', 1, '3f8e6a', 0);  // Port 1: false
```

## Terminal Nodes (0 outputs)

These nodes have **0 output ports**. You can wire **TO** them; you can NEVER chain `.then()` **FROM** them. Use `.edge()` to attach them as side-effects off an earlier non-terminal node.

| Node | Purpose |
|------|---------|
| `Core.Programming.Debug` | Dump `msg` for inspection |
| `Core.Flow.Log` | Log text (`inText`) — NOT `Core.Application.Log` |
| `Core.Flow.Stop` | Stop the flow |
| `Core.Flow.GoTo` | Loop back to a Label |
| `Core.Flow.End` | Subflow exit (`sfPort`) |
| `Core.WaitGroup.Done` | Decrement a WaitGroup counter |

```typescript
// Stop chained as the final step — allowed (wiring TO a terminal)
.then('d1e4b8', 'Core.Programming.Function', 'Process', { ... })
.then('e3a592', 'Core.Flow.Stop', 'Stop', {});

// Debug attached as a parallel branch via f.edge() — NOT via .then()
f.node('b4d7f1', 'Core.Programming.Debug', 'Debug', { optDebugData: Message('result') });
f.edge('d1e4b8', 0, 'b4d7f1', 0);
```

Inside loops, `GoTo` ends the body chain; `Stop` for the exit branch MUST be a standalone `f.node()` wired via `f.edge()` on ForEach port 1 — never chained after `GoTo`.

## Node IDs

Node IDs are 6-character random hexadecimal strings:
- Examples: `42ec21`, `7dbafc`, `a06926`, `c3e8f1`
- Use lowercase hex characters (0-9, a-f)
- Each node in a flow must have a unique ID

The SDK automatically prefixes node IDs with the flow ID internally to ensure global uniqueness when flows are merged.

## Property Scopes

### Input Properties

| Scope | Syntax | Use Case | Example |
|-------|--------|----------|---------|
| Message | `Message('var')` | Read from msg.var | `inUrl: Message('url')` |
| Custom | `Custom('value')` | Static literal value | `inUrl: Custom('https://example.com')` |
| JS | `JS('expr')` | JavaScript expression | `inCondition: JS('msg.value > 10')` |
| Global | `Global('var')` | Global variable (shared across flows) | `inData: Global('config')` |
| Flow | `Flow('var')` | Flow-scoped variable | `inCounter: Flow('loopIndex')` |
| AI | `AI('var')` | AI-generated variable | `inPrompt: AI('generatedText')` |

### Output Properties

Output properties use the same scope helpers:

```typescript
outText: Message('result')      // Saves to msg.result
outPosts: Message('posts')      // Saves to msg.posts
outTotal: Global('globalTotal') // Saves to global.globalTotal (rare)
```

## Multi-Output Nodes

Several nodes have multiple output ports. See `./patterns/loops.md` for port reference.

## Multi-Output Function Nodes

Function nodes can have multiple outputs (1-32):

```typescript
f.node('5b2d9f', 'Core.Programming.Function', 'Route', {
  outputs: 3,
  func: `
    if (msg.type === 'A') return [msg, null, null];  // Port 0
    if (msg.type === 'B') return [null, msg, null];  // Port 1
    return [null, null, msg];                         // Port 2
  `
});

// Wire each output port
f.edge('5b2d9f', 0, '6c3e0a', 0);
f.edge('5b2d9f', 1, '7d4f1b', 0);
f.edge('5b2d9f', 2, '8e5a2c', 0);
```

## Common Node Properties

These properties are available on ALL nodes. They are handled by the runtime, not defined in individual node schemas.

| Property | Type | Description |
|----------|------|-------------|
| `delayBefore` | float | Seconds to wait before executing the node |
| `delayAfter` | float | Seconds to wait after executing the node |
| `continueOnError` | bool | If true, flow continues even if node fails |

### delayBefore / delayAfter

Add delays before or after node execution:

```typescript
// Wait 200ms before stopping (useful when Stop runs in parallel with other nodes)
f.node('9f6b3d', 'Core.Flow.Stop', 'Stop', {
  delayBefore: 0.2  // 200ms
});

// Wait 1 second after HTTP request completes
f.node('a07c4e', 'Core.Net.HttpRequest', 'Fetch Data', {
  optUrl: Custom('https://api.example.com/data'),
  optMethod: 'get',
  outBody: Message('response'),
  delayAfter: 1.0  // 1 second
});
```

### continueOnError

Allow flow to continue even if a node fails:

```typescript
// Don't stop the flow if this node fails
f.node('b18d5f', 'Core.Net.HttpRequest', 'Optional API Call', {
  optUrl: Message('optional_url'),
  optMethod: 'get',
  outBody: Message('optional_data'),
  continueOnError: true
});
```

## Adding Dependencies (MANDATORY for non-Core packages)

**ALWAYS** ensure every non-`Core.*` package has an `f.addDependency()` call.
Without this, the saved flow has empty version strings and breaks the designer dependency panel.

**NEVER** call `f.addDependency()` for any `Core.*` namespace (`Core.Trigger`, `Core.Browser`, `Core.Programming`, `Core.CSV`, `Core.Flow`, `Core.Vault`, `Core.Net`, `Core.Excel`, …). These are embedded in the robot runtime and auto-loaded by the Designer; declaring them is redundant and the package index does not list them. A flow built entirely from `Core.*` nodes has zero `addDependency` calls.

- **New flows:** Get the version from `robomotion search <pkg>` or `robomotion get packages <name>`.
- **Updating existing flows:** NEVER change existing `addDependency` versions. Only add new lines for newly introduced packages.

```typescript
// MANDATORY — one call per external (non-Core) package, BEFORE any nodes
f.addDependency('Robomotion.SQLite', 'v1.2.0');
f.addDependency('Robomotion.WordPress', 'v2.0.0');
// ✗ NEVER:
// f.addDependency('Core.Browser', 'v26.4.8');
```

## Scope Helper Functions

### Message() - Message Variable

Reference variables from the message object:

```typescript
f.node('c29e6a', 'Core.Browser.OpenLink', 'Navigate', {
  inBrowserId: Message('browser_id'),
  inUrl: Message('target_url'),
  outPageId: Message('page_id')
});
```

### Custom() - Literal Value

Use for static literal values on **input properties** (inXxx):

```typescript
f.node('d3af7b', 'Core.Browser.OpenLink', 'Navigate', {
  inBrowserId: Message('browser_id'),
  inUrl: Custom('https://example.com'),
  outPageId: Message('page_id')
});
```

**NEVER use Custom() for enum/option properties** like `optType`, `optMode`, `optSort`.
These are plain strings:

```typescript
// WRONG - creates scope object, causes config parse error
optType: Custom('directory')

// CORRECT - plain string
optType: 'directory'
```

### JS() - JavaScript Expression

Use for conditions in Switch nodes:

```typescript
f.node('e4b08c', 'Core.Programming.Switch', 'Route', {
  optConditions: [
    JS('msg.price < 100 && msg.stock > 0'),
    JS('msg.price >= 100')
  ],
  optUseBreak: true
});
```

### Credential() - Vault Reference

Use for secure credential references:

```typescript
const CREDS = { vaultId: 'vault-uuid', itemId: 'item-uuid' };

f.node('f5c19d', 'Core.Vault.GetItem', 'Get Credentials', {
  optCredentials: Credential(CREDS),
  outItem: Message('credentials')
});
```

### Flow() - Flow-Scoped Variable

Variables scoped to the current flow:

```typescript
f.node('a6d2ae', 'Core.Programming.Function', 'Increment', {
  func: `msg.counter = (flow.counter || 0) + 1; return msg;`
});
```

### AI() - AI-Generated Variable

For AI-generated content:

```typescript
{ inPrompt: AI('generatedText') }
```

## Import Statement

Full imports when using all helpers:

```typescript
import { flow, Credential, Custom, Message, Global, Flow, AI, JS } from '@robomotion/sdk';
```

Minimal import for simple flows:

```typescript
import { flow, Message, Custom } from '@robomotion/sdk';
```

## Complete Example

```typescript
import { flow, Credential, Custom, Message } from '@robomotion/sdk';

const GEMINI_CREDS = {
  vaultId: 'vault-123',
  itemId: 'item-456'
};

const myFlow = flow.create('main', 'AI Blog Generator', (f) => {
  // MANDATORY: declare external package dependencies with version
  f.addDependency('Robomotion.GoogleGemini', 'v1.0.0');

  f.node('b7e3bf', 'Core.Trigger.Inject', 'Start', {})
    .then('c8f4c0', 'Core.Programming.Function', 'Build Prompt', {
      func: `
        msg.prompt = 'Write a blog post about automation';
        return msg;
      `
    })
    .then('d9a5d1', 'Robomotion.GoogleGemini.GenerateText', 'Generate', {
      inCredentials: Credential(GEMINI_CREDS),
      inPrompt: Message('prompt'),
      outText: Message('content')
    })
    .then('fbc7f3', 'Core.Flow.Stop', 'Stop', {});

  f.node('eab6e2', 'Core.Programming.Debug', 'Log Result', { optDebugData: Message('content') });
  f.edge('d9a5d1', 0, 'eab6e2', 0);  // Debug is terminal — Stop wired separately above
});

myFlow.start();
```

## FlowBuilder API

### Flow Object Methods

| Method | Description |
|--------|-------------|
| `.validate()` | Validate flow, returns `ValidationResult` |
| `.start(skipValidation?)` | Validate and output compiled JSON to stdout |
| `.toJSON()` | Generate JSON output (for debugging) |
| `.getBuilder()` | Get the underlying `FlowBuilder` (for testing) |

### FlowBuilder Methods

| Method | Description |
|--------|-------------|
| `node(id, type, name, props?)` | Add a node |
| `then(id, type, name, props?)` | Chain to next node (auto-wires port 0 → port 0) |
| `edge(from, fromPort, to, toPort?)` | Add explicit edge connection |
| `addDependency(namespace, version)` | Declare package dependency |
| `getNodes()` | Get all nodes |
| `getEdges()` | Get all edges |
| `getDependencies()` | Get all dependencies |
| `getMetadata()` | Get flow id and name |

## Compilation Flow

1. Write `main.ts` with builder SDK
2. Run: `robomotion build main.ts`
3. Output: JSON to stdout
4. Go runtime fills ALL missing defaults from pspec
5. Robot executes from `.flow` file
