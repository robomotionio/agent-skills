# Image automation (Remote Desktop, Citrix, pixels)

Reference for `Robomotion.ImageAutomation.*` nodes: finding things on the screen by how they look (template images) and what they say (OCR), then clicking and typing like a person. The only way into a Remote Desktop / Citrix / VNC session and into applications that draw their own controls.

**Related:** `skills/exploring-image` (explore the live screen and get verified templates - MANDATORY before writing these nodes) · `data-tables.md` (Extract Table output) · `exceptions.md` · `credentials.md`.

## When NOT to use

- **Something can see the application's controls** - a web page (`Core.Browser.*`, `exploring-browser`), a local Windows app (Windows Automation, `exploring-windows`), a local Java app (Java Automation, `exploring-java`). Selectors survive theme, size and colour changes; pixels do not.
- **The data is reachable another way** - an API, a database, an export file.
- **No interactive desktop** - the nodes look at the screen and use the real mouse and keyboard; the robot needs an unlocked, logged-in session whose window is not minimized (a minimized Remote Desktop session is not drawn at all).

## Always explore first

Run `Skill(exploring-image)` against the live screen. It performs each step through the package's own code, records the node that repeats it, and keeps a template only when the package's matcher finds it exactly once on the whole screen. `image_end` returns the sequence; `image_write_templates flow_file=<flow>/main.ts` writes the template images into the flow file. Each action is already a node: `nodeType`, a plain-language `name`, `props` in the node's own property names.

| In the sequence | In `main.ts` |
|---|---|
| `"image": "IMG_FIELD_NAME"` | `image: IMG_FIELD_NAME` - the identifier of the const `image_write_templates` wrote, NOT a string |
| `{"scope":"Custom","name":"…"}` | `Custom('…')` |
| `{"scope":"Message","name":"x"}` | `Message('x')` |
| `116`, `true`, `"double"`, `"to-disappear"` (plain) | the same plain value - never `Custom()` (deltaX/Y, booleans, enums, Search Region are plain) |
| `"regions": [{…anchor…}, {…target…}]`, `"targetOffset": {…}` | the same object literal |
| `dependencies[0].minVersion` | the lowest Image Automation version that runs every step: pin a published version at or above it |

Never type or paste base64 yourself. The consts block sits between marker comments; a later `image_write_templates` replaces it.

## The dependency

```bash
robomotion describe package Robomotion.ImageAutomation   # → published versions
```

```ts
f.addDependency('Robomotion.ImageAutomation', '<a published version ≥ minVersion>');
```

Templates stored in the flow as data URLs need **0.12.0+**; 0.11.x reads only templates uploaded through the Designer. `Core.Process.StartProcess` (start the Remote Desktop client) is Core - no dependency.

## How a step finds its target

- **Template** (`image`): a PNG cut from the screen. Matching is normalised correlation on grey levels; `optConfidence` (recorded `0.9`) is the minimum score. The best match wins; the recording kept only templates that match exactly one place.
- **Click point**: `deltaX` / `deltaY` = pixels from the template's top-left corner (0,0 = its centre). The point may lie outside the template (a label used as a landmark for the field next to it).
- **Wait Timeout** (`optWaitTimeout`, recorded `15`): the node polls until its target appears. A remote screen answers late - keep it; raise it for slow sessions.
- **Window** (`optWindow`, 0.12.0, plain text in the window title - `'acme-erp01'`): the step searches only that window, wherever it is when the step runs; OCR is faster and is not confused by what is beside the window. The recording sets it on every step after Focus Window - keep it. A wait keeps polling while the window is not open; Image / Text Exists answer false.
- **Search Region** (`optSearchRegion`, `"x,y,w,h"` in pixels or 0-1 fractions): only for speed or to pick one of several look-alikes. With Window it is relative to the window; without, it ties the step to the window's position on the screen.
- **Scale Invariant** (`optScaleInvariant: true`, `optScaleRange`): tries other template sizes - for a session whose scaling differs between runs (smart sizing). Slower (~0.5 s per search).
- **OCR nodes** find text instead (`inText` / `inSearchText`, `optMatch`: `exact` - whole words, case and punctuation ignored; `contains`; `fuzzy` - one misread letter per word; `optIndex` picks one of several occurrences in reading order).

## Nodes

| Node | What it does | Key properties (beyond `image`, `deltaX/Y`, `optConfidence`, `optWaitTimeout`) |
|---|---|---|
| `Window.FocusWindow` (0.12.0) | Bring a window (the RDP / Citrix client) to the front - keys go to the window in front | `inTitle` (Custom: text in the title), `optMatch` contains/exact/regex, `optMaximize`, `optWaitTimeout` (default 10), `outTitle` |
| `Image.ClickImage` | Click where the template is | `optMouseButton` left/middle/right, `optClickType` single/double, `optKeyModifier` none/ctrl/shift/alt/win |
| `Image.ClickType` | Click a field, (select all), type | `inText`, `optClear`, `optPressEnter`, `optDelayPerKeyMs` (0.12.0; 20-50 for sessions that drop fast keys), `optVerify` (0.12.0: read the field back, retype slowly once if a key was lost; never for passwords) |
| `Image.SelectCopy` | Click, Ctrl+A, Ctrl+C | then `Clipboard.GetText` → `outText` |
| `Image.FindImage` | Where the template is | `outX`, `outY` (top-left), `outConfidence`, `outCount` (0.12.0: how many places match) |
| `Image.ImageExists` | Is it there (no error when not) | `outExists`, `outConfidence` |
| `Image.WaitImage` | Wait for it to appear / disappear | `optCondition` to-appear/to-disappear, `optTimeout` (default 30) |
| `Mouse.HoverImage`, `Mouse.DragImage`, `Mouse.MoveMouse`, `Mouse.Scroll`, `Mouse.ClickCoordinate` | Hover (`optHoverMs`), drag `image` → `imageTo`, move to an image / text / point, wheel (`optDirection`, `optAmount`), click fixed coordinates | |
| `OCR.ClickText`, `OCR.FindText`, `OCR.TextExists`, `OCR.WaitText` | Text instead of a template | `inText` / `inSearchText`, `optMatch` (0.12.0), `optIndex`, `optLanguage` (eng, deu, tur, ...) |
| `OCR.GetTextNearImage` | Read the text in a rectangle next to an anchor | `image` = reference image; `regions[0]` = anchor, `regions[1]` = target, each `{x,y,width,height}` in % of the reference image; `outText` |
| `OCR.GetTextNearText` | Read next to an anchor text | `inAnchorText`, `targetOffset {x,y,w,h}` from the anchor's top-left, `optMatch` |
| `OCR.GetText` | Read a fixed rectangle | `region {x,y,w,h}` - relative to the window with `optWindow`, else screen pixels |
| `OCR.ExtractTable` | A grid into rows | `image` + `regions` (anchor = the table's corner, target = the table), `optHasHeader`, `optScrollMode` none/wheel/pagedown for more rows than fit; `outTable` (rows), `outHeaders`, `outRowCount` |
| `Keyboard.SendKeys` | Type text into what has the focus | `inText`, `optInterpretTokens` (`{ENTER}`, `{TAB}`, `{HOTKEY:ctrl+s}`), `optDelayPerKeyMs` |
| `Keyboard.SendHotkey` | A key combination | `inKeys` (`"ctrl+s"`, `"alt+f4"`, `"enter"`), `optDelayMs` |
| `Screen.WaitScreenStable`, `Screen.WaitMouseShape` | Wait until the screen (window, region) stops changing / the pointer is not busy (`optShape` notbusy) | `optChangeFirst` (0.12.0: first wait for the screen to answer the click before it, then to settle - before Send Keys / Get Text on a slow session), `optWindow`, `optStableMs`, `optTimeout` |

Run `robomotion describe node <type>` for anything not listed.

## A recorded flow

The customer form of a legacy ERP over Remote Desktop (recorded with `exploring-image`, replayed through the real nodes):

```ts
import { flow, Custom } from '@robomotion/sdk';

// ── image templates (robomotion-image-mcp): consts the Image Automation nodes use as `image` ──
// 172x26: Field Name:
const IMG_FIELD_NAME = 'data:image/png;base64,iVBORw0KGgo...';
// 94x30: Click save
const IMG_CLICK_SAVE = 'data:image/png;base64,iVBORw0KGgo...';
// 80x28: Click OK
const IMG_CLICK_OK = 'data:image/png;base64,iVBORw0KGgo...';
// ── end of image templates ──

flow.create('Save a customer (ERP over RDP)', (f) => {
  f.addDependency('Robomotion.ImageAutomation', '0.12.0');

  f.node('a1b2c3', 'Core.Trigger.Inject', 'Start', {})
    .then('d4e5f6', 'Robomotion.ImageAutomation.Window.FocusWindow', 'Bring acme-erp01 to the front', {
      inTitle: Custom('acme-erp01'),
    })
    .then('0a1b2c', 'Robomotion.ImageAutomation.Image.ClickType', 'Type the name', {
      image: IMG_FIELD_NAME, deltaX: 116, deltaY: 13,
      inText: Custom('Grace Hopper'),
      optConfidence: Custom('0.9'), optWaitTimeout: Custom('15'), optClear: true,
    })
    .then('3d4e5f', 'Robomotion.ImageAutomation.Image.ClickImage', 'Click Save', {
      image: IMG_CLICK_SAVE, deltaX: 47, deltaY: 15,
      optConfidence: Custom('0.9'), optWaitTimeout: Custom('15'),
    })
    .then('6a7b8c', 'Robomotion.ImageAutomation.Image.ClickImage', 'Close the saved message', {
      image: IMG_CLICK_OK, deltaX: 40, deltaY: 14,
      optConfidence: Custom('0.9'), optWaitTimeout: Custom('15'),
    })
    .then('9d0e1f', 'Core.Flow.Stop', 'Stop', {});
});
```

## Common failures

| Symptom | Cause | Fix |
|---|---|---|
| "is not on the screen. Best match 0.7x" on the robot | the session is drawn differently: colour depth, ClearType, scaling, theme, another resolution | make the robot's session match the recording (or record on it); Scale Invariant for scaling only |
| "Best match 0.86-0.89" | compression (RemoteFX / AVC) blurs the screen | lower `optConfidence` to 0.85; keep it ≥ 0.8 |
| "The screen could not be captured ... not being drawn" | the robot's own Remote Desktop window is minimized, the session is locked or disconnected | keep that window restored; on dedicated robots log on to the console or use a session that stays connected |
| Clicks the wrong one of two look-alikes | a template that matches more than one place (the recording warned) | re-record that step on a target with distinctive surroundings, or set `optSearchRegion` |
| Text found slowly, or not found though it is in the window | the step OCRs the whole screen (no `optWindow`); what is beside the window changes the reading | set `optWindow` to text in the session window's title |
| Keys typed into another window | the remote window was not in front | `Window.FocusWindow` first; a click into the remote window before typing |
| Characters missing from typed text | the session drops fast keystrokes | `optVerify: true` on Click & Type (retypes slowly once); `optDelayPerKeyMs` 20-50 (Click & Type, Send Keys) |
| Keys lost after opening a dialog (Send Keys right after a click) | the slow session had not shown the dialog yet; the keys went to the window behind it | wait for the dialog itself (`Image.WaitImage` / `OCR.WaitText` on its title or a field), or Click & Type into its field. `optChangeFirst` only when the click has one answer: it returns when the first change settles (a menu closing settles before a slow dialog) |
| The flow "succeeds" but closed the wrong message | every message box's OK looks the same; the template matched another message's OK | `OCR.WaitText` with the message's text before the OK click |
| OCR misreads ("Biling") | small or low-contrast text | `optMatch: 'fuzzy'`, a template step instead, or Select & Copy for field values |
| The step runs before the dialog shows | no wait on the target | keep `optWaitTimeout`; `Image.WaitImage` / `OCR.WaitText` for things no step clicks |
