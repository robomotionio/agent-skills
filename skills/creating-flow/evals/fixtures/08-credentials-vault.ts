import { flow, Message, Custom, JS, Global, Flow, Credential, AI } from '@robomotion/sdk';

flow.create('a1f008', 'Credentials via Vault', (f) => {
  f.node('111111', 'Core.Trigger.Inject', 'Start', {})
    .then('222222', 'Core.Vault.GetItem', 'Load API Credentials', {
      optCredentials: Credential({
        vaultId: '11111111-2222-3333-4444-555555555555',
        itemId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
      }),
      outItem: Message('credentials')
    })
    .then('2a2a2a', 'Core.Programming.Function', 'Build Headers', {
      func: `msg.headers = { Authorization: 'Bearer ' + msg.credentials.api_key }; return msg;`
    })
    .then('333333', 'Core.Net.HttpRequest', 'Call API', {
      optUrl: Custom('https://api.example.com/me'),
      optMethod: 'get',
      inHeaders: Message('headers'),
      outBody: Message('response')
    })
    .then('444444', 'Core.Flow.Stop', 'Stop', {});
}).start();
