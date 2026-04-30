import { flow, Message, Custom, JS, Global, Flow, Credential, AI } from '@robomotion/sdk';

flow.create('a1f001', 'Error Handling with Catch Trigger', (f) => {
  f.node('111111', 'Core.Trigger.Inject', 'Start', {})
    .then('222222', 'Core.Browser.Open', 'Open Browser', {
      optBrowser: 'chrome',
      outBrowserId: Message('browser_id')
    })
    .then('333333', 'Core.Browser.OpenLink', 'Navigate', {
      inBrowserId: Message('browser_id'),
      inUrl: Custom('https://example.com'),
      outPageId: Message('page_id')
    })
    .then('444444', 'Core.Browser.Close', 'Close', {
      inBrowserId: Message('browser_id')
    })
    .then('555555', 'Core.Flow.Stop', 'Stop', {});

  f.node('666666', 'Core.Trigger.Catch', 'Catch Browser Errors', {
    optNodes: { ids: ['222222', '333333'], all: false }
  });
  f.node('777777', 'Core.Browser.Close', 'Cleanup Close', {
    inBrowserId: Message('browser_id')
  });
  f.node('888888', 'Core.Flow.Stop', 'Error Stop', {});
  f.node('999999', 'Core.Flow.Log', 'Log Error', {
    inText: Message('error.message'),
    optLevel: 'error'
  });

  f.edge('666666', 0, '777777', 0);
  f.edge('777777', 0, '888888', 0);
  f.edge('666666', 0, '999999', 0);
}).start();
