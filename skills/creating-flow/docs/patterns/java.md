# Java desktop automation

Reference for `Robomotion.JavaAutomation.*` nodes: driving Java desktop applications (Swing / AWT) through the Java Access Bridge.

**Related:** `skills/exploring-java` (explore the live app and get verified selectors — MANDATORY before writing these nodes) · `data-tables.md` (Extract Table output) · `exceptions.md` · `credentials.md`.

## When NOT to use

- **The data is reachable another way** — an API, a database, an export file. Desktop automation is the slowest and most fragile path; use it when the app is the only door.
- **The app is not Swing/AWT** — JavaFX and Eclipse/SWT applications are not reached by the Java Access Bridge: use Windows Automation (`exploring-windows`). A browser-based "Java" app (a web front end): `Core.Browser.*`.
- **The Java Access Bridge is off** — `jabswitch -enable` (JDK/JRE `bin`), then restart the application. Needed on the robot's machine too. Without it the nodes find no window.
- **No interactive desktop** — the nodes click with the real mouse and type with the real keyboard; the robot needs an unlocked, logged-in session.

## Always explore first

Run `Skill(exploring-java)` against the live app. It performs each step through the package's own code, records the node that repeats it, and verifies every selector by resolving it back to the element it was made from. `java_end` returns the sequence. Each action is already a node: `nodeType`, a plain-language `name`, `props` in the node's own property names.

| In the sequence | In `main.ts` |
|---|---|
| `{"scope":"Custom","name":"…"}` | `Custom('…')` |
| `{"scope":"Message","name":"x"}` | `Message('x')` |
| `"17"`, `"_"`, `"double_click"`, `true`, `60` (plain) | the same plain value — never `Custom()` (key slots `inMod1..3`, enums, booleans, `optTimeout` are plain) |
| `"inCustomArgs": ["-jar", "C:\\Apps\\app.jar"]` | the same array |
| `dependencies[0].minVersion` | the lowest Java Automation version that runs every recorded step: pin a published version at or above it. If none is published yet, record again after `java_target_version version="<newest published>"` |

## The dependency

`Robomotion.JavaAutomation` is not a Core package:

```bash
robomotion describe package Robomotion.JavaAutomation   # → published versions
```

```ts
f.addDependency('Robomotion.JavaAutomation', '<a published version ≥ minVersion>');
```

`Core.Process.StartProcess` (start the app) is Core — no dependency.

## Selectors: Window Title + Full Path

Every element node takes two inputs:

- `inTitle` — the window: plain text contained in its title (`'Acme Desk (Java)'`), or a regex (`'^Order \\d+$'`). 2.1.0 matches as text first, so titles with `(`, `+`, `*` work; 1.7.x treats it as a regex only.
- `inFullPath` — the element inside it. Empty = the window itself.

```
//push button[name='Save customer']
//text[vname='Email']                                   a field named by the label in front of it (or its tooltip)
//panel[name='Billing address']//push button[name='Edit']  inside a titled group: one of two look-alikes
//table[name='Orders']
root pane[0]/layered pane[0]/panel[1]/push button[0]   absolute, as the Designer's inspector writes it
```

- A step is `role[conditions][N]`. `//` = anywhere below (only what is showing: the selected tab's page, open popups, plus menus), `/` = a direct child.
- Roles (the bridge's English names): `push button`, `toggle button`, `check box`, `radio button`, `text`, `password text`, `combo box`, `list`, `table`, `tree`, `page tab list`, `page tab`, `menu bar`, `menu`, `menu item`, `popup menu`, `spinbox`, `slider`, `label`, `panel`, `internal frame`, `scroll pane`; `*` = any.
- Attributes: `name`, `vname`, `description` (tooltip), `text` (a field's text), `value`, `states` (`states='editable'` = has all those states), `index`.
- Operators: `name='x'`, `name!='x'`, `contains(name, 'x')`, `starts-with(…)`, `ends-with(…)`, `matches(name, 'regex')`; join with `and`. `@name` is accepted too.
- `[N]` = the Nth match, 0-based.
- `//` paths, `vname`/`text`/`value`/`states`, `matches()` and plain-text titles need 2.1.0; the recording says so per step.

Making a selector dynamic: build it in a Function node and pass `Message('path')`, or use `JS()` — but prefer the node that takes the value: Select Table Row `inValue`, Select List Item `inValue`, Select Tree Node `inNodePath`, Set Combobox `inValue`.

## Nodes

All element nodes wait up to `optTimeout` seconds (plain number, default 5; Wait nodes 30) for their element.

| Node | Does | Key properties |
|---|---|---|
| `Core.Process.StartProcess` | Start the app | `inFilePath: Custom('C:\\...\\javaw.exe')` (or the app's .exe), `inCustomArgs: ['-jar', 'C:\\Apps\\app.jar']`, **`optBackground: true`** (else the node waits for the app to exit) |
| `Wait` (Wait Context) | Wait for a window (empty path) or an element | `inTitle`, `inFullPath: Custom('')`, `optTimeout: 60` |
| `WaitElement` | Wait for an element to appear / disappear | `optCondition: 'appear'` |
| `WaitValue` | Wait until an element reads a value | `inExpected`, `optMatch: 'contains'` |
| `ClickElement` | Click (mouse when on screen; 2.1.0) | `optClickType: 'double_click'` (plain), `optMethod` |
| `ClickCoordinate` | Click at x,y inside an element (custom-painted areas) | `inX`, `inY` (Custom), `optCoordinateType` (default `'relative'`) |
| `SetText` | Replace a field's text (typed like a person when on screen; 2.1.0) | `inText`, `optMethod: 'auto'` |
| `SendKey` / `SendKeyToElement` | Keys: up to three from the list (`'17'` Ctrl, `'16'` Shift, `'18'` Alt, `'13'` Enter, `'9'` Tab, `'27'` Esc, `'112'`–`'123'` F1–F12, …) plus text | `inMod1..3` (plain strings; leave unused slots out — `validate` refuses `'_'`), `optKey: Custom('S')` — Ctrl+S is `inMod1: '17', optKey: Custom('S')` |
| `SetCheckbox` | Check / uncheck / toggle | `optState: 'check'` |
| `SetCombobox` | Choose a combo item (an editable combo takes any text) | `inValue` |
| `SelectListItem` (2.1.0) | Choose a list item | `inValue` (+ `optMatchMode`), or `inIndex`; `optAdd` for multi-select |
| `SelectTab` | Open a tab | `inTabName` on the `page tab list` |
| `SelectMenu` | Menu path, menu bar or open popup menu | `inFullPath: Custom('')`, `inMenuPath: Custom('File/Save As...')` |
| `SelectTreeNode` | Select / expand a tree item by its path | `inNodePath: Custom('Catalog/Phones/Cases')`, `optExpandOnly` |
| `SelectTableRow` (2.1.0) | Select a row by a cell value or index; optionally click it | `inValue`, `inColumn`, `inRow`, `optClick: 'double_click'`; outputs `outRow` |
| `ExtractTable` | A whole table → Robomotion data table | `outTable: Message('table')`, `inMaxRows`, `inColumns`, `optJsonify` |
| `GetTableCell`, `GetSelectedRows`, `GetTableInfo` | Table reads | |
| `GetText`, `GetValue`, `GetCheckbox`, `GetCombobox`, `IsEnabled`, `ElementExists`, `GetAttribute` | Reads into `msg` | `out…: Message('x')` |
| `SetSpinnerValue` | Spinner or slider | `inValue` |
| `ActivateHyperlink` | A link in an HTML pane | `inLinkText` |
| `ScrollIntoView`, `HoverElement`, `DragAndDrop`, `SetFocus`, `DoAction`, `Screenshot` | | |
| `CloseWindow` (2.1.0) | Close a window like its close button | outputs `outClosed` (false when the app asked to save) |

## A recorded flow

Recorded with `exploring-java` against the Acme Desk test app: type a customer, save it under a new name, save again with Ctrl+S.

```ts
import { flow, Message, Custom, JS, Global, Flow, Credential, AI } from '@robomotion/sdk';

flow.create('Save a customer file', (f) => {
  f.addDependency('Robomotion.JavaAutomation', '2.1.0');

  f.node('4a7c1e', 'Core.Trigger.Inject', 'Start', {})
    .then('9b2f60', 'Core.Process.StartProcess', 'Start Acme Desk', {
      inFilePath: Custom('C:\\Program Files\\Java\\jdk-21\\bin\\javaw.exe'),
      inCustomArgs: ['-jar', 'C:\\Apps\\AcmeDesk\\AcmeDesk.jar'],
      optBackground: true,
    })
    .then('c03d18', 'Robomotion.JavaAutomation.Wait', 'Wait for Acme Desk', {
      inTitle: Custom('Acme Desk (Java)'),
      inFullPath: Custom(''),
      optTimeout: 60,
    })
    .then('e81a4b', 'Robomotion.JavaAutomation.SetText', 'Type the customer name', {
      inTitle: Custom('Acme Desk (Java)'),
      inFullPath: Custom("//text[name='Customer name']"),
      inText: Custom('Ada Lovelace'),
    })
    .then('5d92af', 'Robomotion.JavaAutomation.SelectMenu', 'Choose File > Save As', {
      inTitle: Custom('Acme Desk (Java)'),
      inFullPath: Custom(''),
      inMenuPath: Custom('File/Save As...'),
    })
    .then('17b6e3', 'Robomotion.JavaAutomation.SetText', 'Type the file name', {
      inTitle: Custom('Save As'),
      inFullPath: Custom("//text[name='File Name:']"),
      inText: Custom('C:\\Data\\customers\\lovelace.acme'),
    })
    .then('a64c02', 'Robomotion.JavaAutomation.ClickElement', 'Click Save', {
      inTitle: Custom('Save As'),
      inFullPath: Custom("//push button[name='Save']"),
    })
    .then('2fe875', 'Robomotion.JavaAutomation.SendKeyToElement', 'Press Ctrl+S', {
      inTitle: Custom('Acme Desk (Java)'),
      inFullPath: Custom("//text[name='Customer name']"),
      inMod1: '17',
      optKey: Custom('S'),
    })
    .then('b39d71', 'Core.Flow.Stop', 'Stop', {});
}).start();
```

(The ids above are an example; generate fresh ones. `'2.1.0'` validates once 2.1.0 is published.)

The same customer flow recorded for the published 1.7.7 (`java_target_version version="1.7.7"`: absolute paths, a regex title, the dialog-opening menu item as Click Coordinate, Alt+F4 to close) ran on a robot on 2026-10-03 — every node passed and the app saved the file: `../../evals/fixtures/11-java-acme-customer.ts`.

## Common failures

| Symptom | Cause | Fix |
|---|---|---|
| `WindowNotFound` and "No Java window is open" | Bridge off, or the app still starting | `jabswitch -enable` + restart the app; a `Wait` with `optTimeout: 60` after Start Process |
| `WindowNotFound` on 1.7.x for a title with `(`, `+`, `*` | 1.7.x matches titles as a regex | Pin 2.1.0, or escape: `'Acme Desk \\(Java\\)'` |
| `ElementNotFound` with "the window is open" | The element is on another tab, in a closed dialog, or the path was guessed | Select the tab / open the dialog first; get the path from `exploring-java` |
| The flow hangs on a click that opens a dialog (1.7.x) | Click Element / Select Menu used the bridge's action, which waits for the dialog to close | Pin 2.1.0 (clicks with the mouse) |
| `ApplicationBlocked` | A Do Action / bridge call opened a modal dialog | Use Click Element for that button; close the dialog with Send Key Escape/Enter |
| A date / number field keeps its old value | Text set through the bridge is not committed | Set Text with `optMethod: 'auto'` (default in 2.1.0) or `'type'` |
| `NotForeground` / `NoKeyboardFocus` | Another window kept the foreground; keys were not sent | The robot's desktop must be unlocked and not in use; nothing else should pop up |
| Ctrl+S pressed Ctrl+F4 (1.7.x) | 1.7.x sent letters as other virtual keys | Pin 2.1.0; on 1.7.x write the letter in capitals (`optKey: Custom('S')`) |
