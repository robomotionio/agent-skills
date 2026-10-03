import { flow, Message, Custom, JS, Global, Flow, Credential, AI } from '@robomotion/sdk';

flow.create('f3a1c2d4-0b5e-4c6a-9d7e-1a2b3c4d5e6f', 'Save a note', (f) => {
  f.addDependency('Robomotion.WindowsAutomation', '0.19.0');

  f.node('c2e7e3', 'Core.Trigger.Inject', 'Start', {})
    .then('d78eea', 'Core.Programming.Function', 'The note and where to save it', {
      func: `var stamp = new Date().toISOString().replace(/[-:T]/g, '').substring(0, 14);

msg.note = 'Meeting moved to Friday.\\nBring the Q3 numbers.';
msg.file = global.get('$TempDir$') + '\\\\note-' + stamp + '.txt';

return msg;`
    })
    .then('4bc39b', 'Core.Process.StartProcess', 'Open Notepad', {
      inFilePath: Custom('notepad.exe'),
      inCustomArgs: [],
      optBackground: true
    })
    .then('2af8ef', 'Robomotion.WindowsAutomation.WaitWindow', 'Wait for the Notepad window', {
      inSelector: Custom("//WindowControl[@class='Notepad' and ends-with(@name, ' - Notepad')]"),
      optCondition: 'appear'
    })
    .then('091ccd', 'Robomotion.WindowsAutomation.Click', 'New tab', {
      inSelector: Custom("//WindowControl[@class='Notepad' and ends-with(@name, ' - Notepad')]//ButtonControl[@id='AddButton']"),
      optShowWindow: true
    })
    .then('eb8119', 'Robomotion.WindowsAutomation.SetText', 'Type the note', {
      inSelector: Custom("//WindowControl[@class='Notepad' and ends-with(@name, ' - Notepad')]//DocumentControl[@name='Text editor']"),
      inText: Message('note')
    })
    .then('0fa258', 'Robomotion.WindowsAutomation.ExpandNode', 'Open the File menu', {
      inSelector: Custom("//WindowControl[@class='Notepad' and ends-with(@name, ' - Notepad')]//MenuItemControl[@name='File']")
    })
    .then('ad29b4', 'Robomotion.WindowsAutomation.Click', 'Save as', {
      inSelector: Custom("//WindowControl[@class='Notepad' and ends-with(@name, ' - Notepad')]//WindowControl[@name='Popup']//MenuItemControl[@name='Save as']")
    })
    .then('baa8ab', 'Robomotion.WindowsAutomation.SetText', 'File name', {
      inSelector: Custom("//WindowControl[@class='Notepad' and ends-with(@name, ' - Notepad')]//WindowControl[@name='Save as']//EditControl[@id='1001']"),
      inText: Message('file'),
      optEmulateTyping: true
    })
    .then('111ad8', 'Robomotion.WindowsAutomation.Click', 'Save', {
      inSelector: Custom("//WindowControl[@class='Notepad' and ends-with(@name, ' - Notepad')]//WindowControl[@name='Save as']//ButtonControl[@id='1']"),
      optShowWindow: true
    })
    .then('54bb85', 'Core.Flow.Stop', 'Stop', {});
}).start();
