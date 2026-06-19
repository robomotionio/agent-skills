# Migrating Legacy Assistant → Chat Assistant

Companion to the `creating-flow` skill. Read this **before** rewriting any flow that uses the
legacy **`Robomotion.Assistant`** package so you produce a correct **`Robomotion.ChatAssistant`**
flow. The two packages look similar (same widget vocabulary — text, dropdown, checkbox, …) but the
**runtime model, node IDs, and almost every property name differ**. A blind find-replace of the
namespace will *not* work.

> Source of truth: the two pspecs
> (`…/Assistant/robomotion-assistant-0.4.3.pspec`,
> `…/ChatAssistant/robomotion-chatassistant-<ver>.pspec`) and the node Go sources. When in doubt
> run `robomotion describe node Robomotion.ChatAssistant.<Node>` — this doc is a map, the pspec is
> the territory. Always pin the **latest published** ChatAssistant version with
> `robomotion describe package Robomotion.ChatAssistant`.

---

## 1. The architectural shift (read this first)

This is the part that breaks naive migrations.

| | **Legacy `Robomotion.Assistant`** | **New `Robomotion.ChatAssistant`** |
|---|---|---|
| Execution model | **One long-running, blocking flow.** The whole conversation is a single execution. Each node blocks (`AppRequestV2`) until the user acts, then the flow continues to the next node. | **Turn-based.** `ChatIn` is a **trigger** (0 inputs); it fires per incoming message. The flow handles that turn and ends at `ChatOut` (0 outputs). |
| Entry point | A generic trigger (e.g. `Core.Trigger.Inject`) starts the flow. | **`Robomotion.ChatAssistant.ChatIn`** replaces the trigger. |
| Exit point | `Assistant.End` (End Conversation) publishes a "done" command. | **`Robomotion.ChatAssistant.ChatOut`** terminates the turn (terminal node — wire **TO** it, never `.then()` from it). |
| Two modes | n/a (mode toggled at runtime via `Change Mode`). | Mode is set **on the Agent** (Admin Console), read by `ChatIn`: **`guided`** vs **`conversational`**. There is no mode node. |
| AI | None built in — you scripted prompts/streaming manually. | Pair with an **LLM Agent** node (`Robomotion.ADK.Agent.LLMAgent` / `Robomotion.Agents.Agent.LLMAgent`) for conversational flows. |
| Widget result | `outPayload` — a **map** keyed by the widget's ID (e.g. `payload.dropdown1`, `payload.textbox1`). | `outResult` — the **selected value directly** (string, or array for multi-select). No per-widget IDs. |
| Session plumbing | Manual. | `ChatIn` binds the message-context to the UI session automatically; **widgets need no session_id input** — they resolve it implicitly. |

### Which target mode?

Pick the mode that matches the *legacy* flow's intent, then pick the structure:

- **Guided** — the legacy flow was a deterministic **form / wizard**: a fixed sequence of widgets
  (header → dropdown → textbox → buttons → …) collecting input. This is the **near 1:1** path.
  Multiple widgets still block in sequence **within one `ChatIn → … → ChatOut` execution**, exactly
  like the old linear flow.

  ```
  Legacy:  [Inject] → Header → Dropdown → Textbox → ButtonGroup → End
  New:     ChatIn   → Header → Dropdown → Textbox → ButtonGroup → ChatOut   (Agent mode: guided)
  ```

- **Conversational** — the legacy flow was chat-like (used `Prompt` to read free text, looped, fed
  an LLM). Restructure around an LLM Agent. Interactive widgets are **rejected at runtime in
  conversational mode** (see §6).

  ```
  New:     ChatIn → LLM Agent → Text → ChatOut
                     (inUserPrompt: Message('payload.text'), inFiles: Message('payload.files'))
           + Catch → Set Error(msg.text) → Text → ChatOut
  ```

  Clone the public **`generic-chat-assistant`** template as the skeleton for this case.

---

## 2. Dependency change

```ts
// remove
f.addDependency('Robomotion.Assistant', '0.4.3');
// add (pin the real latest — verify with: robomotion describe package Robomotion.ChatAssistant)
f.addDependency('Robomotion.ChatAssistant', '1.8.3');
```

For conversational flows also add an LLM Agent package (verify the live version):
`Robomotion.ADK` (e.g. `0.22.2`) or `robomotion.agents`. `Core.*` is never an `addDependency`.

---

## 3. Node ID mapping

| Legacy node (`Robomotion.Assistant.*`) | New node (`Robomotion.ChatAssistant.*`) | Notes |
|---|---|---|
| — (generic trigger) | **`ChatIn`** | new entry point / trigger |
| `End` (End Conversation) | **`ChatOut`** | terminal; wire TO it |
| `Prompt` | **`ChatIn` payload** (conversational) or **`Textbox`** (guided) | see §5 |
| `Text` | `Text` | markdown preserved |
| `Header` | `Header` | `optAlignment` ➜ **gone**; new `inLevel` (h1–h6) |
| `Divider` | `Divider` | `optWidth` ➜ `inThickness`; new `inBorder` style |
| `Textbox` | `Textbox` | ID input dropped; result via `outResult` |
| `Dropdown` | `Dropdown` | options model changed (§4) |
| `Checkboxes` | `Checkbox` | **name singular**; options model changed |
| `RadioButtons` | `RadioButton` | **name singular** |
| `ButtonGroup` | `ButtonGroup` | `inMultiSelect` single/multi |
| `DatePicker` | `Datepicker` | **lowercase p**; min/max/initial/title ➜ **gone** |
| `Image` | `Image` | `optAlignment`/`optSize` ➜ **gone**; can take local path |
| `File` (Upload File) | `UploadFile` | richer options |
| `Download` (Download File) | `DownloadFile` | richer options + `outPublicURL` |
| `StreamingText` | `StreamingText` | much simpler (§5) |
| `ChangeMode` | **removed** | mode is an Agent setting |
| `Theme` (Change Theme) | **removed** | theme configured outside the flow |
| — | **`Auth`** | new (basic / password) |
| — | **`Error`** | new (styled error bubble) |
| — | **`Progress`** | new (updatable progress) |
| — | **`Video`** | new |
| — | **`CustomWidget`** | new (React component) |

---

## 4. The #1 gotcha: widget options & results

### Supplying options

Legacy widgets took a message-scope array (`optLabels` / `optOptions`) **plus** an `inXxxID`.
New widgets drop the ID and take a per-type array prop:

| Legacy | New |
|---|---|
| `ButtonGroup.optLabels` | `ButtonGroup.optButtonsArray` |
| `Dropdown.optOptions` | `Dropdown.optDropdownArray` |
| `Checkboxes.optOptions` | `Checkbox.optCheckboxArray` |
| `RadioButtons.optOptions` | `RadioButton.optRadioButtonArray` |
| `*.optCustomOptions` / `*.optCustomLabels` (designer) | same names, still designer-side custom arrays |

These `opt*Array` props are **message/JS scope objects** — wrap them in `Message()` or `JS()`, never a
raw array literal. Accepted item shapes (`utils.BuildOptions`):

```js
// simplest: array of strings (auto id opt1, opt2…, label=value=string)
["Yes", "No", "Maybe"]

// full control: array of objects
[{ id: "y", label: "Yes", value: "yes", variant: "default" }, …]
```

**Recommended pattern** — build the array in a `Core.Programming.Function` node, then point the
widget at it (mirrors how legacy flows fed `optOptions`):

```ts
.then('a1b2c3', 'Core.Programming.Function', 'Options', {
  func: `msg.options = ['Refund', 'Replace', 'Talk to agent']; return msg;`
})
.then('d4e5f6', 'Robomotion.ChatAssistant.Dropdown', 'Pick', {
  inLabel: Custom('How can we help?'),
  optDropdownArray: Message('options'),
  outResult: Message('choice')
})
```

### Reading the result

This is the most common downstream break. **Legacy** stored a map keyed by the widget ID:

```js
// legacy: read the dropdown whose inDropdownID was "dropdown1"
var picked = msg.payload.dropdown1;          // value
// checkboxes were a map of {label: bool}; an "OK" button key also appeared
```

**New** stores the value directly in `outResult`:

```js
var picked = msg.choice;                      // single-select → the value string
// multi-select (ButtonGroup multi / Checkbox) → array of values
```

Audit every Function/condition node that read `msg.payload.<id>` and rewrite it to read the new
`outResult` variable.

---

## 5. Special-case nodes

### Prompt → ChatIn / Textbox
Legacy `Prompt` blocked for free-form text and returned it in `outPayload`.
- **Conversational**: the user's text already arrives on `ChatIn` as `msg.payload.text` (and files as
  `msg.payload.files`). Delete the `Prompt` node; consume the `ChatIn` payload.
- **Guided**: replace `Prompt` with a **`Textbox`** (`inLabel`, optional `optRows` for multiline,
  `optInputType` text/number) and read `outResult`.

### End Conversation → ChatOut
Replace `Assistant.End` with `ChatOut`. It is **terminal** (0 outputs). Every branch of the turn
(including the `Catch` error branch) should end at a `ChatOut`.

### Change Mode → removed
Guided vs conversational is now configured on the **Agent** (Admin Console) and read by `ChatIn`.
There is no node and no `enable_prompt` / `enable_streaming` flags. Delete `ChangeMode` nodes.

### Change Theme → removed
No theme node exists in ChatAssistant. Theme/branding is configured outside the flow. Drop all
`Theme` nodes and their 10 color inputs.

### StreamingText (much simpler)
Legacy needed `Change Mode` to spin up a stream, then `inStreamID` + `inIndex` + `inText`, with a
second output port for end-of-stream. New `StreamingText`:
- `inStreamingID` (`name=stream_id`) — a stable id for the stream (default `Message('stream_id')`).
- `inText` (`name=chunk`) — the chunk to append. **Empty text ends the stream.**
- No index, no Change Mode, single output. Typically driven by an LLM Agent's streamed chunks.

### Datepicker / Header / Image — lost options
The new equivalents are leaner. These legacy options have **no new home** — drop them (or emulate in
a Function / the widget label):
- `DatePicker`: `optInitialDate`, `optFirstDate`, `optLastDate`, `optTitle` → gone (new has only
  `inLabel` / `inDescription`). Put any title text in `inLabel`.
- `Header`: `optAlignment` → gone; instead set heading size via `inLevel` (1–6).
- `Image`: `optAlignment`, `optSize` → gone; new `Image` adds `inAltText` and accepts a **local file
  path** in `inImageURL` (auto-uploaded).

---

## 6. Mode rule (will fail at runtime if ignored)

In **conversational** mode the interactive widgets error out
(`Cannot use <widget> in conversational mode`): **ButtonGroup, Dropdown, Checkbox, RadioButton,
Datepicker, Textbox, UploadFile, DownloadFile, Auth, CustomWidget(interactive)**.

Display-only nodes work in **both** modes: **Text, Header, Divider, Image, Video, Error,
StreamingText**, and `CustomWidget` in `static` mode.

➡ If the legacy flow was a widget form, target **guided** mode. If it was chat/LLM, target
**conversational** and replace input widgets with the conversation itself.

---

## 7. Per-property cheat-sheet (SDK)

Property-typing rules from the SDK grammar still apply:
- **Input-port props** (`in*`, and scoped `opt*` like `optMaxLength`, `optRows`, `inThickness`,
  `inLevel`, `opt*Array`) → wrap in `Custom()` / `Message()` / `JS()`, **even numbers**.
- **Enum / option props** (`inMultiSelect`, `inMode`, `inAuthMode`, `inBorder`, `optInputType`) →
  plain string, e.g. `inMultiSelect: 'multi'`.
- **Boolean option props** (`optPublic`, `optAutoplay`, `optLoop`, `optMuted`) → raw `true`/`false`.

| New node | Inputs (wrap) | Enum/option (plain) | Output |
|---|---|---|---|
| `ChatIn` | — | — | `outSessionID`, `outPayload`, `outSession`, `outProfile` |
| `ChatOut` | — | — | — |
| `Text` | `inText` | — | — |
| `Header` | `inText`, `inLevel` | — | — |
| `Divider` | `inThickness` | `inBorder` (`solid`\|`dashed`\|`dotted`\|`double`\|`groove`\|`ridge`\|`inset`\|`outset`\|`none`) | — |
| `ButtonGroup` | `inLabel`, `inDescription`, `optButtonsArray` | `inMultiSelect` (`single`\|`multi`) | `outResult` |
| `Dropdown` | `inLabel`, `inDescription`, `inPlaceholder`, `optDropdownArray` | — | `outResult` |
| `Checkbox` | `inLabel`, `inDescription`, `optCheckboxArray` | — | `outResult` (array) |
| `RadioButton` | `inLabel`, `inDescription`, `optRadioButtonArray` | — | `outResult` |
| `Datepicker` | `inLabel`, `inDescription` | — | `outResult` |
| `Textbox` | `inLabel`, `inDescription`, `inPlaceholder`, `optMaxLength`, `optRows` | `optInputType` (`text`\|`number`) | `outResult` |
| `Image` | `inLabel`, `inDescription`, `inImageURL`, `inAltText` | — | — |
| `Video` | `inLabel`, `inDescription`, `inVideoURL`, `inPoster` | `optPublic`,`optAutoplay`,`optLoop`,`optMuted` (bool) | `outPublicURL` |
| `DownloadFile` | `inLabel`, `inDescription`, `inFilePath`, `optButtonText`, `optFileName` | `optPublic` (bool) | `outPublicURL` |
| `UploadFile` | `inLabel`, `inDescription`, `inLocalDirectory`, `inAcceptableExtensions`, `inMaxFileSize` | `inMode` (`single`\|`multiple`) | `outFiles` (array of local paths) |
| `StreamingText` | `inStreamingID`, `inText` | — | — |
| `Error` | `inErrorLabel`, `inErrorMessage` | — | — |
| `Auth` | `inLabel`, `inDescription` | `inAuthMode` (`basicAuth`\|`passwordOnly`) | `outResult` (`{username?,password}`) |
| `CustomWidget` | `inWidgetData` (+ `func` = React TSX string, like `Function.func`) | `inMode` (`interactive`\|`static`) | `outResult` (interactive only) |
| `Progress` | `inTitle`, `inDescription`, `inProgressID` | — | `outProgressID` (feed back into `inProgressID` to update) |

Notes:
- `UploadFile.inLocalDirectory` is **required** and replaces legacy `File.inDir`. Output is
  `outFiles` (array of saved local paths), like legacy `outFiles`.
- `DownloadFile.inFilePath` (required) replaces legacy `Download.inPath`. Set `optPublic: true` to
  also get a shareable URL in `outPublicURL`.
- `Progress` is a *new* pattern: first call returns a `progress_id` in `outProgressID`; pass it back
  via `inProgressID` on later calls to update the same indicator instead of stacking new ones.

---

## 8. Migration recipe

1. **Read the legacy flow** and classify it: **form/wizard → guided**, or **chat/LLM →
   conversational** (§1).
2. **Swap dependencies** (§2). Pin the live ChatAssistant version.
3. **Replace the trigger** with `ChatIn`, and every `End` with `ChatOut`.
4. **Rename each widget** node ID per §3 and **remap its properties** per §7. Delete `ChangeMode`
   and `Theme` nodes.
5. **Convert options**: `optOptions`/`optLabels` → the `opt*Array` prop, fed from a Function node
   (§4). Drop the `inXxxID` inputs.
6. **Rewrite result reads**: every `msg.payload.<widgetId>` → the widget's new `outResult` variable
   (§4).
7. **Handle `Prompt`** (§5) and **StreamingText** (§5).
8. For conversational flows, insert the **LLM Agent** and a **Catch → Error** branch (clone
   `generic-chat-assistant`).
9. Fresh **6-hex node IDs** for any node you add. Every branch ends at a `ChatOut`.
10. **Validate** (`validate_flow`) before save — it catches the renamed-property class of bug.

---

## 9. Before / after example (guided form)

**Legacy** — collect a choice and some text, then finish:

```ts
import { flow, Message, Custom } from '@robomotion/sdk';
flow.create('…', 'Support Form', (f) => {
  f.addDependency('Robomotion.Assistant', '0.4.3');
  f.node('11aa11', 'Core.Trigger.Inject', 'Start', {})
    .then('22bb22', 'Robomotion.Assistant.Header', 'Title', { inText: Custom('Support') })
    .then('33cc33', 'Core.Programming.Function', 'Opts', { func: `msg.options=['Refund','Replace']; return msg;` })
    .then('44dd44', 'Robomotion.Assistant.Dropdown', 'Pick', {
      inDropdownID: Custom('dropdown1'), optOptions: Message('options'), outPayload: Message('payload')
    })
    .then('55ee55', 'Robomotion.Assistant.Textbox', 'Detail', {
      inTextboxID: Custom('textbox1'), inLabel: Custom('Tell us more'), outPayload: Message('payload')
    })
    .then('66ff66', 'Core.Programming.Function', 'Read', {
      func: `msg.choice = msg.payload.dropdown1; msg.detail = msg.payload.textbox1; return msg;`
    })
    .then('77aa77', 'Robomotion.Assistant.End', 'End', {});
}).start();
```

**New** — guided mode, ChatIn → ChatOut, results via `outResult`:

```ts
import { flow, Message, Custom, JS, Global, Flow, Credential, AI } from '@robomotion/sdk';
flow.create('…', 'Support Form', (f) => {
  f.addDependency('Robomotion.ChatAssistant', '1.8.3');
  f.node('11aa11', 'Robomotion.ChatAssistant.ChatIn', 'Chat In', {})
    .then('22bb22', 'Robomotion.ChatAssistant.Header', 'Title', { inText: Custom('Support'), inLevel: Custom('2') })
    .then('33cc33', 'Core.Programming.Function', 'Opts', { func: `msg.options=['Refund','Replace']; return msg;` })
    .then('44dd44', 'Robomotion.ChatAssistant.Dropdown', 'Pick', {
      inLabel: Custom('How can we help?'), optDropdownArray: Message('options'), outResult: Message('choice')
    })
    .then('55ee55', 'Robomotion.ChatAssistant.Textbox', 'Detail', {
      inLabel: Custom('Tell us more'), optRows: Custom('4'), outResult: Message('detail')
    })
    .then('66ff66', 'Core.Programming.Function', 'Confirm', {
      func: `msg.text = 'Got it: ' + msg.choice + ' — ' + msg.detail; return msg;`
    })
    .then('77aa77', 'Robomotion.ChatAssistant.Text', 'Echo', { inText: Message('text') })
    .then('88bb88', 'Robomotion.ChatAssistant.ChatOut', 'Chat Out', {});
}).start();
```

Key diffs: trigger→`ChatIn`; `End`→`ChatOut`; `optOptions`→`optDropdownArray`; dropped
`inDropdownID`/`inTextboxID`; `msg.payload.dropdown1`→`msg.choice` (`outResult`); `Header` gains
`inLevel`.

---

## 10. Pitfalls checklist

- [ ] Did **not** keep `Robomotion.Assistant.*` IDs — all renamed to `Robomotion.ChatAssistant.*`.
- [ ] Flow starts at `ChatIn` (not `Inject`) and every branch ends at `ChatOut`.
- [ ] `ChangeMode` and `Theme` nodes deleted (no equivalent).
- [ ] Options moved from `optOptions`/`optLabels` to `opt*Array`, wrapped in `Message()`/`JS()`.
- [ ] All `msg.payload.<widgetId>` reads rewritten to the new `outResult` variables.
- [ ] No interactive widgets left in a **conversational**-mode flow.
- [ ] Numeric inputs wrapped in a scope helper (`inLevel: Custom('2')`, `optRows: Custom('4')`).
- [ ] LLM Agent + Catch/Error branch present for conversational migrations.
- [ ] `addDependency('Robomotion.ChatAssistant', …)` pinned to a real published version.
- [ ] Ran `validate_flow` (catches renamed-property errors) **before** `save_flow`.
```
