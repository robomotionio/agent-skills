import { flow, Message, Custom, JS, Global, Flow, Credential, AI } from '@robomotion/sdk';

flow.create('a1f002', 'ForEach Loop with Label and GoTo', (f) => {
  f.node('111111', 'Core.Trigger.Inject', 'Start', {})
    .then('222222', 'Core.Programming.Function', 'Build Items', {
      func: `msg.items = ['alpha', 'beta', 'gamma']; return msg;`
    });

  f.node('333333', 'Core.Flow.Label', 'Next Item', {});
  f.node('444444', 'Core.Programming.ForEach', 'For Each', {
    optInput: Message('items'),
    optOutput: Message('item')
  })
    .then('555555', 'Core.Programming.Function', 'Process Item', {
      func: `msg.processed = msg.item + '!'; return msg;`
    })
    .then('666666', 'Core.Flow.GoTo', 'Loop Back', {
      optNodes: { ids: ['333333'], type: 'goto', all: false }
    });

  f.node('777777', 'Core.Flow.Stop', 'Stop', {});

  f.edge('222222', 0, '444444', 0);
  f.edge('333333', 0, '444444', 0);
  f.edge('444444', 1, '777777', 0);
}).start();
