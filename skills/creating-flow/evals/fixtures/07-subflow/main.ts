import { flow, Message, Custom, JS, Global, Flow, Credential, AI } from '@robomotion/sdk';

flow.create('a1f007', 'SubFlow Pattern', (f) => {
  f.node('111111', 'Core.Trigger.Inject', 'Start', {})
    .then('222222', 'Core.Programming.Function', 'Build Input', {
      func: `msg.input = 'hello'; return msg;`
    })
    .then('aaaaaa', 'Core.Flow.SubFlow', 'Process Input', {})
    .then('333333', 'Core.Flow.Stop', 'Stop', {});
}).start();
