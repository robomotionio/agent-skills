# FlowTester API

Load and inspect flows. All structural and path-analysis APIs live on this class.

## Loading Flows

```typescript
import { FlowTester } from '@robomotion/sdk/testing';

// Load from file path
const tester = await FlowTester.load('./main.ts');

// Load from directory (looks for main.ts)
const tester = await FlowTester.load('./flows/my-flow');

// Create from existing FlowBuilder
const tester = FlowTester.fromBuilder(flowApi.getBuilder());
```

## Structural Inspection

```typescript
// All nodes: { id, type, name, props, inputs, outputs }
const nodes = tester.getNodes();

// Specific node (supports both '42ec21' and 'main_42ec21')
const node = tester.getNode('42ec21');

// All edges: { from, fromPort, to, toPort }
const edges = tester.getEdges();

const { id, name } = tester.getMetadata();
const builder = tester.getBuilder();
```

## Validation

```typescript
const result = tester.validate();

if (!result.valid) {
  console.log('Errors:', result.errors);
  console.log('Warnings:', result.warnings);
}
```

## Finding Flow Patterns

```typescript
const entries = tester.findEntryPoints();     // trigger nodes
const exits   = tester.findTerminationPoints(); // Stop / Error nodes
const loops   = tester.findLoops();

loops.forEach(loop => {
  console.log(`ForEach: ${loop.forEachNodeId}`);
  console.log(`Has Goto->Label: ${loop.hasGotoLabel}`);
  console.log(`Body nodes: ${loop.bodyNodes.join(', ')}`);
});
```

## Path Analysis

```typescript
const paths         = tester.getAllPaths();
const allTerminate  = tester.allBranchesTerminate();
const coverage      = tester.analyzeBranchCoverage();
// coverage: { totalBranches, percentage, uncoveredBranches }
```

## Checkpoint Testing

Run the flow until (or between) specific nodes:

```typescript
const result = await tester.runUntil('7dbafc', {
  input: { value: 42 }
});
console.log(result.msg, result.path, result.error);

const segment = await tester.runFromTo('a06926', 'b3d715', {
  input: { data: 'test' }
});
```

## Execution Tracing

```typescript
const result = await tester.runWithTrace({ input: { items: [1, 2, 3] } });

result.trace.forEach(step => {
  console.log(step.id, step.type, step.input, step.output);
});

// Trace the path produced by a specific input
const trace = await tester.tracePath({ value: 20 });
console.log(trace.nodes, trace.terminates);
```

## Flow-Wide Analysis Helpers

Standalone functions that take a `FlowTester`:

```typescript
import {
  analyzeFlow,
  calculateCyclomaticComplexity,
  findLongestPath,
  findShortestPath,
  findPaths,
  generateDotGraph,
} from '@robomotion/sdk/testing';

const analysis = analyzeFlow(tester);
// { nodeCount, edgeCount, entryPoints, exitPoints,
//   controlFlowNodes, cycles, deadEnds, unreachableNodes }

const complexity = calculateCyclomaticComplexity(tester);
// E - N + 2P. 1-10 simple, 11-20 moderate, 21-50 complex, 50+ very high risk.

const paths = findPaths(tester, {
  mustPassThrough: ['92a6de', '7dbafc'],
  mustAvoid:       ['a3b7ef'],
  mustTerminate:   true,
  maxLength:       10,
});

const dot = generateDotGraph(tester); // render with: dot -Tpng flow.dot -o flow.png
```
