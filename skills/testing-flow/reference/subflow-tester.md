# SubflowTester

Load and run subflows in isolation.

```typescript
import { SubflowTester, discoverSubflows, loadAllSubflows } from '@robomotion/sdk/testing';

const tester = await SubflowTester.load('./subflows/login');

const info = tester.getInfo();
// { id, name, inputs, outputs, dependencies }

const validation = tester.validate();
expect(validation.valid).toBe(true);

const result = await tester.run({
  input:  { username: 'test', password: 'secret' },
  mocks:  {
    'Core.Browser.Open':         async () => ({ browserId: 'mock' }),
    'Core.Browser.ClickElement': async () => ({}),
  },
  timeout: 5000,
});
// { success, output, exitPort }
```

## Discovering Subflows

```typescript
// Find all subflows in a flow directory
const subflows = await discoverSubflows('./flows/my-flow');
subflows.forEach(sf => {
  console.log(`${sf.id}: ${sf.name} (${sf.nodeCount} nodes)`);
});

// Load every subflow
const testers = await loadAllSubflows('./flows/my-flow');
```
