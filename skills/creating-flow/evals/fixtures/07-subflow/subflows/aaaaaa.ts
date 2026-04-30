import { subflow, Message, Custom } from '@robomotion/sdk';

subflow.create('Process Input', (f) => {
  f.node('b10001', 'Core.Flow.Begin', 'Begin', {})
    .then('b10002', 'Core.Programming.Function', 'Process', {
      func: `msg.result = msg.input + ' (processed)'; return msg;`
    })
    .then('b10003', 'Core.Flow.End', 'End', { sfPort: 0 });
});
