# Exception Handling

Patterns for handling errors in Robomotion visual flows.

**Related:** `branches.md` (parallel branches MUST call `Done` on both success and failure — wire `Catch → Done`) · `conditions.md` (route by error content with a Function after Catch).

## When NOT to use

- **Switch "no matching condition"** — don't wrap it in Catch; use a Function with `outputs: N+1` and a default branch instead.
- **Critical steps** — don't set `continueOnError: true` on nodes whose failure invalidates downstream logic (e.g. `HttpRequest` whose response you must read). Let it fail and catch it.
- **Expected "not found" / "already exists"** — `continueOnError: true` is fine; don't reach for `Catch` for things that happen every run.

## Two Approaches

| Approach | Use Case | Example |
|----------|----------|---------|
| `continueOnError` | Expected failures you want to ignore | Directory already exists |
| `Core.Trigger.Catch` | Need to handle/log/react to errors | Retry logic, error reporting |

## Option 1: continueOnError (Suppress Errors)

Every node has a `continueOnError` common property. When `true`, errors are logged but flow continues.

### When to Use

- Creating resources that may already exist
- Optional operations that shouldn't stop the flow
- Known failures that are acceptable

### Example: Create Directory If Not Exists

```typescript
f.node('3a7c9e', 'Core.FileSystem.Create', 'Create Output Dir', {
  inPath: Custom('/output/data'),
  optType: 'directory',
  continueOnError: true  // Ignore "already exists" error
});
```

### Example: Optional File Delete

```typescript
f.node('8f2b4d', 'Core.FileSystem.Delete', 'Delete Old File', {
  inPath: Message('oldFilePath'),
  continueOnError: true  // Ignore if file doesn't exist
});
```

## Option 2: Core.Trigger.Catch (Handle Errors)

Use the Catch node to react to errors from specific nodes or all nodes in scope.

### Schema

- `optNodes.ids`: Array of node IDs to monitor (e.g., `42ec21`)
- `optNodes.all`: If true, catches errors from ALL nodes in current scope

### Example: Catch Specific Node

```typescript
// Main flow
f.node('42ec21', 'Core.Trigger.Inject', 'Start', {})
  .then('7dbafc', 'Core.Net.HttpRequest', 'Fetch Data', {
    optUrl: Custom('https://api.example.com/data'),
    optMethod: 'get',
    outBody: Message('response')
  })
  .then('a06926', 'Core.Flow.Stop', 'Stop', {});

// Error handler for HTTPRequest only
f.node('c3f81b', 'Core.Trigger.Catch', 'Handle API Error', {
  optNodes: {
    ids: ['7dbafc'],  // Node ID to monitor
    all: false
  }
});

// Handle the error
f.node('d5e2a4', 'Core.Programming.Function', 'Log Error', {
  func: `
    console.log('API failed:', msg.error);
    msg.fallback = true;
    return msg;
  `
});
f.edge('c3f81b', 0, 'd5e2a4', 0);
```

### Example: Catch All Errors in Scope

```typescript
// Error handler for ALL nodes in main scope
f.node('1b9e7f', 'Core.Trigger.Catch', 'Global Error Handler', {
  optNodes: {
    ids: [],
    all: true  // Catch errors from ANY node
  }
});

f.node('2c8d6a', 'Core.Programming.Function', 'Handle Any Error', {
  func: `
    console.log('Flow error:', msg.error);
    // Could send alert, log to file, etc.
    return msg;
  `
});
f.edge('1b9e7f', 0, '2c8d6a', 0);
```

### Example: Catch SubFlow Errors

```typescript
// SubFlow that might fail — node ID 'e4f5c8' matches subflows/e4f5c8.ts (no extra property needed)
f.node('e4f5c8', 'Core.Flow.SubFlow', 'Process Data', {});

// Catch any error from the SubFlow
f.node('5a3b12', 'Core.Trigger.Catch', 'SubFlow Error', {
  optNodes: {
    ids: ['e4f5c8'],  // Node ID to monitor
    all: false
  }
});
```

## Error Object Structure

When Catch fires, `msg` contains error details:

```typescript
msg.error = {
  code: 'Core.Net.HttpRequest.ErrRequest',
  message: 'Connection timeout',
  guid: '7dbafc',
  name: 'Fetch Data'
}
```

## When to Use Which

| Scenario | Use |
|----------|-----|
| Directory/file might exist | `continueOnError: true` |
| Optional cleanup operations | `continueOnError: true` |
| Need retry logic | `Core.Trigger.Catch` |
| Need error logging/alerting | `Core.Trigger.Catch` |
| Need fallback behavior | `Core.Trigger.Catch` |
| SubFlow error recovery | `Core.Trigger.Catch` |

## Common Patterns

### Pattern: Retry with Catch

```typescript
// API call
f.node('9c7e3d', 'Core.Net.HttpRequest', 'Fetch', {
  optUrl: Message('url'),
  optMethod: 'get',
  outBody: Message('data')
});

// Catch and retry
f.node('b4a2f6', 'Core.Trigger.Catch', 'Retry Handler', {
  optNodes: { ids: ['9c7e3d'], all: false }  // Node ID to monitor
});

f.node('6d1c89', 'Core.Programming.Function', 'Check Retry', {
  outputs: 2,
  func: `
    msg.retries = (msg.retries || 0) + 1;
    if (msg.retries < 3) {
      return [msg, null];  // Port 0: retry
    }
    return [null, msg];    // Port 1: give up
  `
});
f.edge('b4a2f6', 0, '6d1c89', 0);

// Port 0: Retry - wire back to API call
f.node('f8e5b2', 'Core.Programming.Sleep', 'Wait', {
  optDuration: Custom('2')
});
f.edge('6d1c89', 0, 'f8e5b2', 0);
f.edge('f8e5b2', 0, '9c7e3d', 0);  // Retry the request

// Port 1: Give up
f.node('a1d47c', 'Core.Flow.Stop', 'Failed', {});
f.edge('6d1c89', 1, 'a1d47c', 0);
```

### Pattern: Ensure Cleanup

```typescript
// Browser operations with cleanup
f.node('4e9f16', 'Core.Browser.Open', 'Open Browser', {
  outBrowserId: Message('browser_id')
})
  .then('82c3a7', 'Core.Browser.OpenLink', 'Navigate', {
    inBrowserId: Message('browser_id'),
    inUrl: Custom('https://example.com')
  });

// Catch any browser errors
f.node('7b5d28', 'Core.Trigger.Catch', 'Browser Error', {
  optNodes: { ids: ['82c3a7'], all: false }  // Node ID to monitor
});

// Always close browser on error
f.node('f6a9e3', 'Core.Browser.Close', 'Close Browser', {
  inBrowserId: Message('browser_id')
});
f.edge('7b5d28', 0, 'f6a9e3', 0);
```
