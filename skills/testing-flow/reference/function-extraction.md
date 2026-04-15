# Function Extraction

Test the JavaScript inside Function nodes in isolation, without running the whole flow.

```typescript
import { extractFunc, runFunc, extractAllFuncs } from '@robomotion/sdk/testing';

// Extract single function by node ID
const func = extractFunc(tester, '2bf967');
const output = func({ value: 21 });
expect(output.result).toBe(42);

// Run with detailed result
const result = runFunc(func, { value: 21 });
console.log(result.output, result.error, result.executionTime, 'ms');

// Extract every Function node in the flow
const funcs = extractAllFuncs(tester);
funcs.forEach((fn, nodeId) => {
  console.log(`Testing function in ${nodeId}`);
});
```

## Test with Multiple Cases

```typescript
import { testFunctionWithCases } from '@robomotion/sdk/testing';

const func = extractFunc(tester, '81f5cd');
const results = testFunctionWithCases(func, [
  { input: { n: 5 },  expected: { result: 10 }, description: 'doubles 5' },
  { input: { n: 0 },  expected: { result: 0 },  description: 'handles zero' },
  { input: { n: -3 }, expected: (out) => out.result < 0, description: 'negative stays negative' },
]);

results.forEach(r => {
  console.log(r.passed ? 'PASS' : 'FAIL', r.description);
});
```

## Analyze Function Nodes

```typescript
import { analyzeFunctionNode } from '@robomotion/sdk/testing';

const info = analyzeFunctionNode(tester, '42ec21');
console.log(info.code, info.outputs, info.variables, info.usesMsg, info.returnsValue);
```
