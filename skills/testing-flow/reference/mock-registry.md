# MockRegistry

Mock external services for isolated tests. Two levels of mocking, with node-ID mocks taking precedence over type mocks.

## Why Two Levels?

A flow may have several nodes of the same type, each needing a different response:

```
c8f412  Core.Net.HttpRequest -> { posts: [...] }
d9e523  Core.Net.HttpRequest -> { user: {...} }
e4a634  Core.Net.HttpRequest -> { postId: '123' }
```

Node-ID mocks let you control each one; type mocks act as a safety net for everything else.

## Node ID Mocking (Recommended)

```typescript
import { MockRegistry } from '@robomotion/sdk/testing';

MockRegistry.registerNode('c8f412', async (props, msg) => ({
  posts: [
    { title: 'Reddit Post 1', body: 'Content 1' },
    { title: 'Reddit Post 2', body: 'Content 2' },
  ]
}));

MockRegistry.registerNode('f5b745', async (props, msg) => ({
  postId: '12345',
  url: 'https://example.com/post-12345'
}));

// Bulk register
MockRegistry.registerNodes({
  '1ae856': async () => ({ data: 'fetched' }),
  '2bf967': async () => ({ transformed: true }),
  '3ca078': async () => ({ saved: true }),
});
```

## Type Mocking (Catch-All)

```typescript
MockRegistry.register('Core.Net.HttpRequest', async (props, msg, nodeId) => {
  console.log(`Unmocked HTTP request in node: ${nodeId}`);
  return { statusCode: 200, body: {} };
});

MockRegistry.registerMultiple({
  'Core.Net.HttpRequest':            async () => ({ statusCode: 200 }),
  'Robomotion.SQLite.Query':         async () => ({ rows: [] }),
  'Robomotion.WordPress.CreatePost': async () => ({ postId: 'mock' }),
});
```

## Mock Priority

When a node runs, MockRegistry checks in order:
1. **Exact node ID** — `registerNode('4db189', ...)`
2. **Partial node ID** — `main_4db189` matches `4db189`
3. **Type** — `register('Core.Net.HttpRequest', ...)`

## Mock Helpers

```typescript
import { mockResponse, mockError, mockSequence, mockConditional } from '@robomotion/sdk/testing';

MockRegistry.registerNode('1ae856', mockResponse({ data: 'fixed' }));
MockRegistry.registerNode('5ec29a', mockError('Service unavailable'));

MockRegistry.registerNode('6fd3ab', mockSequence([
  { page: 1, hasMore: true },
  { page: 2, hasMore: true },
  { page: 3, hasMore: false },
]));

MockRegistry.registerNode('5ec29a', mockConditional([
  { when: (props, msg) => msg.action === 'create', then: { id: 'new-123', created: true } },
  { when: (props, msg) => msg.action === 'delete', then: { deleted: true } },
], { error: 'Unknown action' }));
```

## Tracking Calls

```typescript
MockRegistry.registerNode('1ae856', async () => ({ data: 'test' }));

// ... run flow ...

const count    = MockRegistry.getCallCount('1ae856');
const calls    = MockRegistry.getCalls('1ae856');
const lastCall = MockRegistry.getLastCall('1ae856');

calls.forEach(call => {
  console.log(call.nodeId, call.props, call.msg);
});
```

## Verifying Mock Inputs

Check what the flow passed TO a mock:

```typescript
MockRegistry.registerNode('70e4bc', async () => ({ postId: '123' }));

// ... run flow ...

const wpCall = MockRegistry.getLastCall('70e4bc');
expect(wpCall?.msg.title).toBe('Expected Title');
expect(wpCall?.msg.content).toContain('Expected content');
```

## Clearing Mocks

```typescript
MockRegistry.clear();        // all mocks (node + type)
MockRegistry.clearNodes();   // only node-ID mocks
MockRegistry.clearTypes();   // only type mocks
MockRegistry.clearMock('1ae856');
MockRegistry.resetCalls();   // keep handlers, reset counters
```

Clear mocks in `afterAll()` to avoid test pollution.
