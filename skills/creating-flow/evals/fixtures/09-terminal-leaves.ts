import { flow, Message, Custom, JS, Global, Flow, Credential, AI } from '@robomotion/sdk';

flow.create('a1f009', 'Terminal Nodes Wired As Leaves', (f) => {
  f.node('111111', 'Core.Trigger.Inject', 'Start', {})
    .then('222222', 'Core.Programming.Function', 'Compute', {
      outputs: 2,
      func: `
        if (msg.value > 0) {
          return [msg, null];
        }
        return [null, msg];
      `
    });

  f.node('333333', 'Core.Programming.Function', 'Process Positive', {
    func: `msg.note = 'positive'; return msg;`
  });

  f.node('444444', 'Core.Flow.Log', 'Log Positive', {
    inText: Message('note'),
    optLevel: 'info'
  });
  f.node('555555', 'Core.Programming.Debug', 'Debug Snapshot', {});
  f.node('666666', 'Core.Flow.Stop', 'Stop OK', {});
  f.node('777777', 'Core.Flow.Stop', 'Stop Negative', {});

  f.edge('222222', 0, '333333', 0);
  f.edge('222222', 1, '777777', 0);
  f.edge('333333', 0, '444444', 0);
  f.edge('333333', 0, '555555', 0);
  f.edge('333333', 0, '666666', 0);
}).start();
