# Windows desktop automation

Reference for `Robomotion.WindowsAutomation.*` nodes: driving Windows desktop applications (Win32, WinForms, WPF, UWP/WinUI) through UI Automation.

**Related:** `skills/exploring-windows` (explore the live app and get verified selectors — MANDATORY before writing these nodes) · `exceptions.md` · `credentials.md` · `browser.md` (for anything that runs in a browser).

## When NOT to use

- **The data is reachable another way** — an API, a database, an export file, Excel through `Core.Excel`. Desktop automation is the slowest and most fragile path; use it when the app is the only door.
- **The app runs in a browser** — use `Core.Browser.*` and `exploring-browser`.
- **No interactive desktop** — UI Automation needs an unlocked, logged-in session on the robot's machine. A robot running as a service without a desktop, or a locked screen, sees no windows. Unattended robots: `Robomotion.WindowsAutomation.KeepAlive` keeps the screen from locking; `Session.StartSession` opens an RDP session to drive a remote machine.

## Always explore first

Run `Skill(exploring-windows)` against the live app. It performs each step through the package's own code, records the node that repeats it, and verifies every selector by resolving it back to the element it was made from. Do not write selectors from screenshots or guesses: a selector that looks right and matches nothing fails only on the robot, after a 30 s wait.

`windows_end` returns the sequence. Each action is already a node: `nodeType`, a plain-language `name`, `props` in the node's own property names.

| In the sequence | In `main.ts` |
|---|---|
| `{"scope":"Custom","name":"…"}` | `Custom('…')` |
| `{"scope":"Message","name":"x"}` | `Message('x')` |
| `true`, `30`, `"right"` (plain) | the same plain value — never `Custom()` (enums, booleans, `optWaitTimeout`, `optTimeout`, `optIndex` are plain) |
| `"inCustomArgs": ["--log", "x"]` | the same array |
| `dependencies[0].minVersion` | the lowest Windows Automation version with every feature the recording used: pin a published version at or above it |

## The dependency

`Robomotion.WindowsAutomation` is not a Core package:

```bash
robomotion describe package Robomotion.WindowsAutomation   # → published versions
```

```ts
f.addDependency('Robomotion.WindowsAutomation', '<a published version>');
```

`Core.Process.StartProcess` (open the app) is Core — no dependency.

## Selectors

Every element node takes `inSelector`, an XPath over the UI Automation tree:

```
//WindowControl[@class='Notepad' and ends-with(@name, ' - Notepad')]//DocumentControl[@name='Text editor']
```

- A step is `<ControlType>Control[conditions][N]`: `ButtonControl`, `EditControl`, `DocumentControl`, `ComboBoxControl`, `ListControl`, `ListItemControl`, `DataGridControl`, `DataItemControl`, `TreeItemControl`, `TabItemControl`, `MenuItemControl`, `CheckBoxControl`, `RadioButtonControl`, `WindowControl`, `PaneControl`, `GroupControl`, `TextControl`, `CustomControl`, …
- `//` = anywhere below, `/` = direct child. The first `WindowControl` step is the window: everything after it is searched inside that window.
- Attributes: `@name`, `@id` (AutomationId), `@class`, `@helptext` (tooltip), `@text` (a text shown inside the element: list rows, grid rows), `@process` (window's program, 0.20.0+), `@supports-invoke='true'` (and other patterns).
- Operators: `@name='x'`, `@name!='x'`, `contains(@name, 'x')`, `starts-with(…)`, `ends-with(…)`, `matches(@name, 'regex')`, `wildcard(@name, 'Inv*')`, `fuzzy(@name, 'x', 0.8)`; join with `and`.
- `[N]` = the Nth (1-based) matching child of its own parent.
- Values hold `'…'` or `"…"`; there is no escaping, so a value with `'` uses `"…"`.

What the explorer writes, and why — keep it when editing by hand:

| Case | Selector shape |
|---|---|
| Window whose title carries a document name | `WindowControl[@class='Notepad' and ends-with(@name, ' - Notepad')]` — still matches after Save As renames it |
| WinForms window | `starts-with(@class, 'WindowsForms10.Window.')` — the class name's tail changes between runs |
| Element of a dialog | `…//WindowControl[@name='Save As']//ButtonControl[@id='1']` |
| Win32 dialog buttons | numeric ids: `1` OK/Save, `2` Cancel, `6` Yes, `7` No — the same in every Windows language |
| Icon-only button | `ButtonControl[@helptext='Refresh orders']` |
| One of many look-alikes | anchored to what differs: `//DataItemControl[@text='10500']//ButtonControl[@name='Open']`, `//TreeItemControl[@name='Software']//TreeItemControl[@name='Settings']` |
| A grid cell (WinForms DataGridView) | `DataItemControl[starts-with(@name, 'Qty Row 3,')]` — the name's tail follows the sort order |

Making a selector dynamic (one flow, many records): build the string in a Function node and pass it with `Message('selector')`, or use `JS()` — e.g. a row by the order number in `msg.order`:

```ts
inSelector: JS("\"//WindowControl[ends-with(@name, ' - Acme Desk')]//DataItemControl[@text='\" + msg.order + \"']//ButtonControl[@name='Open']\"")
```

## Nodes

All element nodes wait up to `optWaitTimeout` seconds (default 30, plain number) for their element to appear — no separate wait needed before them.

| Node | Does | Key properties |
|---|---|---|
| `Core.Process.StartProcess` | Start the app | `inFilePath: Custom('notepad.exe')`, `inCustomArgs: [...]`, **`optBackground: true`** (else the node waits for the app to exit) |
| `WaitWindow` | Wait for a window | `inSelector`, `optCondition: 'appear' \| 'disappear'` (must be set), `optTimeout: 30` |
| `Click` | Click | `inSelector`, `optMouseButton: 'left' \| 'double_left' \| 'right' \| 'middle'`, `optShowWindow: true` (bring the window forward), `optInvokePattern: true` (UIA invoke, no mouse) |
| `SetText` | Put text in a field | `inSelector`, `inText`, `optClearFirst` (default true), `optEmulateTyping` |
| `SendKey` | Keys into an element | `inSelector`, `optKeyModifier1..3: '{Ctrl}' \| '{Enter}' \| '{Tab}' \| '{F5}' …`, `optText: Custom('s')` — Ctrl+S = `optKeyModifier1: '{Ctrl}', optText: Custom('s')`; text with keys `Custom('John{Tab}Smith{Enter}')` (0.20.0+) |
| `SetValue` | UIA value (no typing) | `inSelector`, `inValue` |
| `SetCheckbox` | Check / uncheck / toggle | `inSelector`, `inValue: Custom('true' \| 'false' \| 'toggle')` |
| `SetCombobox` | Pick a combo box entry by text | `inSelector` (the combo), `inValue: Custom('APAC')` |
| `SelectListItem` | Pick a list item | `inSelector` (the list), `inValue: Custom('SKU-04321')` or `optIndex: 3`, `optMatchMode: 'exact' \| 'contains' \| 'starts_with'` |
| `SelectTab` | Open a tab | `inSelector` (the tab strip), `inTab: Custom('Orders')` or `optIndex` |
| `SetSelected` | Select a radio button / item | `inSelector`, `optSelected: true` |
| `ExpandNode` | Expand / collapse a tree node, expander | `inSelector`, `optAction: 'expand' \| 'collapse' \| 'toggle'` |
| `SetSlider` | Slider / spinner value | `inSelector`, `inValue: Custom('25')` |
| `Scroll` | Scroll a container | `inSelector`, `optDirection`, `optAmount: 'small' \| 'large' \| 'to_start' \| 'to_end' \| 'by_percent'`, `inPercent` |
| `MouseDrag` | Drag between elements | `inSourceSelector`, `inTargetSelector`, `inSourceX/Y`, `inTargetX/Y` (offsets inside each), `optCoordinateType: 'relative'` |
| `ClickCoordinate` | Click a point inside an element (canvas, custom-drawn) | `inSelector`, `inX`, `inY`, `optCoordinateType: 'relative'` |
| `SetFocus` | Keyboard focus | `inSelector` |
| `WaitElement` | Wait for a state | `inSelector`, `optCondition: 'appear' \| 'disappear' \| 'enabled' \| 'disabled' \| 'selected' \| 'focused'` (must be set), `optTimeout: 30` |
| `WaitForValue` | Wait for a value | `inSelector`, `inExpectedValue`, `optCondition: 'equals' \| 'contains' \| … \| 'changed'` |
| `GetText` / `GetValue` | Read | `inSelector` → `outText` / `outValue` |
| `GetTableData` | Read a grid / list view | `inSelector` → `outTable` (`{columns, rows}` — see `data-tables.md`), `optMaxRows`, `optIncludeHeaders` |
| `GetListItems` / `GetTabItems` / `GetTreeItems` | List items | `inSelector` → `outItems` / `outTabs` |
| `GetCheckbox` / `GetSlider` / `GetCombobox` / `IsEnabled` / `IsSelected` | Read a state | `inSelector` → `outChecked` / `outValue` / `outValues` / `outEnabled` / `outSelected` |
| `CloseWindow` | Close a window | `inSelector` (the window) |
| `GetWindowList` | Open windows as a table | `inFilter`, `inProcessName` → `outTable` |
| `Screenshot` | Image of an element / screen | `inSelector`, `inFilePath`, `optFullScreen` |
| `GetClipboard` / `SetClipboard` | Clipboard text | `outText` / `inText` |
| `RunScript` | C# against the UIA tree when no node fits | `func` (C#; `Find("selector")`, `msg`) |
| `KeepAlive` | Keep an unattended session from locking | `optMethod` |
| `Session.StartSession` / `StopSession` / `GetSession` / `TransferSession` | RDP sessions | see `robomotion describe node` |

Verify a node's exact properties with `robomotion describe node Robomotion.WindowsAutomation.<Name>`.

## Example: Notepad — type a note and save it as a file

What `exploring-windows` recorded on Windows 11 for "open Notepad, write a note, save it as a file", as a flow. Windows 11 Notepad reopens the person's last tabs, so the recording opens a new tab first — typing into the reopened tab would change their file. The File name box of Save As is a Win32 dialog edit: the recording sets `optEmulateTyping: true` on it (Windows Automation 0.20.0+ types there by itself).

```ts
import { flow, Message, Custom, JS, Global, Flow, Credential, AI } from '@robomotion/sdk';

flow.create('<flow-id>', 'Save a note', (f) => {
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
```

These selectors are Windows 11 Notepad's (the `AddButton` tab button, the menu's `Popup` window, the `Save as` dialog). Use the ones your exploration recorded: they differ between apps and Windows versions.

## Common failures

| Symptom | Cause | Fix |
|---|---|---|
| `Element not found within 30s timeout` | Selector does not match on the robot: the app is not open yet, a dialog is not up, a title changed, a row is not loaded | Re-explore; `windows_query` the selector against the live app. Add `WaitWindow` / `WaitElement` for windows that open later. Prefer `ends-with` on document titles |
| The flow types the text but the app ignores it (Save As saves the old name, a date picker keeps its date) | The control ignores UIA ValuePattern | Windows Automation 0.20.0+ detects it and types instead; on older versions set `optEmulateTyping: true` on `SetText` |
| Clicks land in the wrong window / nothing happens | The window is behind another one | `optShowWindow: true` on `Click` |
| A step works in the Designer but not on the unattended robot | Locked screen, no interactive session | Run the robot in a logged-in desktop session; `KeepAlive`; or `Session.StartSession` |
| `Config parse error` at load | A plain option wrapped in `Custom()` (`optWaitTimeout: Custom('30')`) or an `in*` port left bare | Plain: `optWaitTimeout`, `optTimeout`, `optIndex`, enums, booleans. Wrapped: every `in*`/`out*`, `optText` |
| `WaitWindow`/`WaitElement`/`SendKey` does nothing | `optCondition` / key modifiers left at their `_` default | Set `optCondition: 'appear'` …; set the key slots you need |
