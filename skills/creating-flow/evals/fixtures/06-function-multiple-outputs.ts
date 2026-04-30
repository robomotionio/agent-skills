import { flow, Message, Custom, JS, Global, Flow, Credential, AI } from '@robomotion/sdk';

flow.create('a1f006', 'Function with Multiple Outputs', (f) => {
  f.node('111111', 'Core.Trigger.Inject', 'Start', {})
    .then('222222', 'Core.Programming.Function', 'Build Value', {
      func: `msg.value = 42; return msg;`
    })
    .then('333333', 'Core.Programming.Function', 'Branch By Value', {
      outputs: 2,
      func: `
        if (msg.value > 10) {
          return [msg, null];
        }
        return [null, msg];
      `
    });

  f.node('444444', 'Core.Programming.Function', 'High Branch', {
    func: `msg.note = 'high'; return msg;`
  });
  f.node('555555', 'Core.Programming.Function', 'Low Branch', {
    func: `msg.note = 'low'; return msg;`
  });
  f.node('666666', 'Core.Flow.Stop', 'Stop', {});

  f.edge('333333', 0, '444444', 0);
  f.edge('333333', 1, '555555', 0);
  f.edge('444444', 0, '666666', 0);
  f.edge('555555', 0, '666666', 0);
}).start();
