import { flow, Message, Custom, JS, Global, Flow, Credential, AI } from '@robomotion/sdk';

flow.create('a1f004', 'CSV Write with Headers', (f) => {
  f.node('111111', 'Core.Trigger.Inject', 'Start', {})
    .then('222222', 'Core.Programming.Function', 'Build Table', {
      func: `
        msg.csv_path = global.get('$Home$') + '/eval-csv-write.csv';
        msg.table = {
          columns: ['Name', 'Score'],
          rows: [
            { Name: 'Alpha', Score: 10 },
            { Name: 'Beta', Score: 20 }
          ]
        };
        return msg;
      `
    })
    .then('333333', 'Core.CSV.WriteCSV', 'Write CSV', {
      inFilePath: Message('csv_path'),
      inTable: Message('table'),
      optEncoding: 'utf8',
      optSeparator: 'comma',
      optHeaders: true
    })
    .then('444444', 'Core.Flow.Stop', 'Stop', {});
}).start();
