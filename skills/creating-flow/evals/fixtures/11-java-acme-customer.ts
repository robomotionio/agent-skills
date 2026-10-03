import { flow, Message, Custom, JS, Global, Flow, Credential, AI } from '@robomotion/sdk';

flow.create('b17a3c', 'Java desktop app from an exploring-java recording', (f) => {
  f.addDependency('Robomotion.JavaAutomation', '1.7.7');

  f.node('4fcd09', 'Core.Trigger.Inject', 'Start', {})
    .then('5be910', 'Core.Programming.Function', 'The customer and where to save it', {
      func: `var stamp = new Date().toISOString().replace(/[-:T]/g, '').substring(0, 14);

msg.name = 'Ada Lovelace';
msg.email = 'ada@analytical.engine';
msg.country = 'United Kingdom';
msg.file = global.get('$TempDir$') + '\\\\customer-' + stamp + '.acme';

return msg;`
    })
    .then('1ced18', 'Core.Process.StartProcess', 'Start Acme Desk', {
      inFilePath: Custom('C:\\Program Files\\Microsoft\\jdk-21.0.11.10-hotspot\\bin\\javaw.exe'),
      inCustomArgs: ['-jar', 'C:\\Users\\faik\\go\\src\\robomotion\\robomotion-java-mcp\\testapp\\AcmeDesk\\AcmeDesk.jar', '--log', 'C:\\Users\\faik\\AppData\\Local\\Temp\\acme-robot-events.jsonl'],
      optBackground: true
    })
    .then('221ed4', 'Robomotion.JavaAutomation.Wait', 'Wait for Acme Desk', {
      inTitle: Custom('Acme Desk \\(Java\\)'),
      inFullPath: Custom(''),
      optTimeout: 60
    })
    .then('b362bd', 'Robomotion.JavaAutomation.SetText', 'Type the customer name', {
      inTitle: Custom('Acme Desk \\(Java\\)'),
      inFullPath: Custom("root pane[0]/layered pane[0]/panel[0]/page tab list[0]/page tab[0]/panel[0]/panel[0]/text[name='Customer name'][0]"),
      inText: Message('name')
    })
    .then('2600e6', 'Robomotion.JavaAutomation.SetText', 'Type the email', {
      inTitle: Custom('Acme Desk \\(Java\\)'),
      inFullPath: Custom('root pane[0]/layered pane[0]/panel[0]/page tab list[0]/page tab[0]/panel[0]/panel[0]/text[1]'),
      inText: Message('email')
    })
    .then('a0dd1e', 'Robomotion.JavaAutomation.SetCombobox', 'Choose the country', {
      inTitle: Custom('Acme Desk \\(Java\\)'),
      inFullPath: Custom("root pane[0]/layered pane[0]/panel[0]/page tab list[0]/page tab[0]/panel[0]/panel[0]/combo box[name='Country'][0]"),
      inValue: Message('country')
    })
    .then('5c23ea', 'Robomotion.JavaAutomation.SetCheckbox', 'Subscribe to the newsletter', {
      inTitle: Custom('Acme Desk \\(Java\\)'),
      inFullPath: Custom("root pane[0]/layered pane[0]/panel[0]/page tab list[0]/page tab[0]/panel[0]/panel[0]/check box[name='Subscribe to newsletter'][0]"),
      optState: 'check'
    })
    .then('6a12d4', 'Robomotion.JavaAutomation.ClickElement', 'Choose the Gold tier', {
      inTitle: Custom('Acme Desk \\(Java\\)'),
      inFullPath: Custom("root pane[0]/layered pane[0]/panel[0]/page tab list[0]/page tab[0]/panel[0]/panel[0]/panel[0]/radio button[name='Gold'][0]")
    })
    .then('57f981', 'Robomotion.JavaAutomation.ClickElement', 'Save the customer', {
      inTitle: Custom('Acme Desk \\(Java\\)'),
      inFullPath: Custom("root pane[0]/layered pane[0]/panel[0]/page tab list[0]/page tab[0]/panel[0]/panel[0]/panel[2]/push button[name='Save customer'][0]")
    })
    .then('fd9a5a', 'Robomotion.JavaAutomation.ClickElement', 'Open the File menu', {
      inTitle: Custom('Acme Desk \\(Java\\)'),
      inFullPath: Custom("root pane[0]/layered pane[0]/menu bar[0]/menu[name='File'][0]")
    })
    .then('2234bf', 'Robomotion.JavaAutomation.ClickCoordinate', 'Choose Save As', {
      inTitle: Custom('Acme Desk \\(Java\\)'),
      inFullPath: Custom("root pane[0]/layered pane[0]/menu bar[0]/menu[0]/menu item[name='Save As...'][0]"),
      inX: Custom('12'),
      inY: Custom('8')
    })
    .then('c39544', 'Robomotion.JavaAutomation.SetText', 'Type the file name', {
      inTitle: Custom('Save As'),
      inFullPath: Custom("root pane[0]/layered pane[0]/panel[0]/file chooser[0]/panel[3]/panel[0]/text[name='File Name:'][0]"),
      inText: Message('file')
    })
    .then('8a94d4', 'Robomotion.JavaAutomation.ClickElement', 'Click Save', {
      inTitle: Custom('Save As'),
      inFullPath: Custom("root pane[0]/layered pane[0]/panel[0]/file chooser[0]/panel[3]/panel[2]/push button[name='Save'][0]")
    })
    .then('d30566', 'Robomotion.JavaAutomation.SendKey', 'Close Acme Desk', {
      inTitle: Custom('Acme Desk \\(Java\\)'),
      inMod1: '18',
      inMod2: '115',
      optKey: Custom('')
    })
    .then('541c29', 'Core.Flow.Stop', 'Stop', {});
}).start();
