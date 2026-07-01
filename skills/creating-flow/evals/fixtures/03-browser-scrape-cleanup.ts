import { flow, Message, Custom, JS, Global, Flow, Credential, AI } from '@robomotion/sdk';

flow.create('a1f003', 'Browser Scrape with Cleanup', (f) => {
  f.node('111111', 'Core.Trigger.Inject', 'Start', {})
    .then('222222', 'Core.Browser.Open', 'Open Browser', {
      optBrowser: 'chrome',
      optMaximized: true,
      outBrowserId: Message('browser_id')
    })
    .then('333333', 'Core.Browser.OpenLink', 'Navigate', {
      inBrowserId: Message('browser_id'),
      inUrl: Custom('https://example.com'),
      outPageId: Message('page_id')
    })
    .then('444444', 'Core.Browser.WaitElement', 'Wait', {
      inPageId: Message('page_id'),
      inSelector: Custom('h1'),
      inSelectorType: 'css',
      optTimeout: Custom('15')
    })
    .then('555555', 'Core.Browser.RunScript', 'Scrape', {
      inPageId: Message('page_id'),
      func: `return JSON.stringify({ heading: document.querySelector('h1').innerText });`,
      outResult: Message('result_json')
    })
    .then('666666', 'Core.Browser.Close', 'Close Browser', {
      inBrowserId: Message('browser_id')
    })
    .then('777777', 'Core.Flow.Stop', 'Stop', {});
}).start();
