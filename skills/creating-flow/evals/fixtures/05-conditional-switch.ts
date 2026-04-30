import { flow, Message, Custom, JS, Global, Flow, Credential, AI } from '@robomotion/sdk';

flow.create('a1f005', 'Conditional Switch with Multiple Ports', (f) => {
  f.node('111111', 'Core.Trigger.Inject', 'Start', {})
    .then('222222', 'Core.Programming.Function', 'Build Status', {
      func: `msg.status = 'pending'; return msg;`
    })
    .then('333333', 'Core.Programming.Switch', 'Route By Status', {
      optConditions: [
        { scope: 'Custom', name: 'msg.status === "pending"' },
        { scope: 'Custom', name: 'msg.status === "active"' },
        { scope: 'Custom', name: 'msg.status === "done"' }
      ]
    });

  f.node('444444', 'Core.Programming.Function', 'Handle Pending', {
    func: `msg.note = 'pending'; return msg;`
  });
  f.node('555555', 'Core.Programming.Function', 'Handle Active', {
    func: `msg.note = 'active'; return msg;`
  });
  f.node('666666', 'Core.Programming.Function', 'Handle Done', {
    func: `msg.note = 'done'; return msg;`
  });
  f.node('777777', 'Core.Flow.Stop', 'Stop', {});

  f.edge('333333', 0, '444444', 0);
  f.edge('333333', 1, '555555', 0);
  f.edge('333333', 2, '666666', 0);
  f.edge('444444', 0, '777777', 0);
  f.edge('555555', 0, '777777', 0);
  f.edge('666666', 0, '777777', 0);
}).start();
