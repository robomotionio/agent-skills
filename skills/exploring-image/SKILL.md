---
name: exploring-image
description: Explores any screen the robot can only SEE - a Remote Desktop (RDP), Citrix or VNC session, a legacy or custom-drawn application with no accessibility - through the robomotion-image-mcp server - reads the screen with OCR and computer vision into a list of fields, buttons, texts and icons with refs, performs the steps on the real screen - and returns a recorded sequence of Robomotion.ImageAutomation nodes whose template images were verified unique on the screen. Use when the person wants something automated "on the remote server", "in Citrix", "on the terminal session", in an app other skills cannot see into, and before writing ANY Robomotion.ImageAutomation flow. Windows (where the RDP / Citrix client runs).
---

# Exploring a screen by its pixels

You drive the person's real screen through the `robomotion-image-mcp` server, step by step, the way the robot will. On a Remote Desktop or Citrix session there is no element tree: the remote application arrives as a picture. The server reads that picture (OCR and box detection), you act on what it found, and every action is recorded as the `Robomotion.ImageAutomation` node that repeats it, with a **template image** cut around the target and **verified unique on the whole screen** with the package's own matcher - then the action itself is performed by the package's own code with that template. When you are done you get a sequence; `creating-flow` turns it into `main.ts`.

This is the pixel twin of `exploring-browser`, `exploring-windows` and `exploring-java`. Prefer those when they can see the application: a browser page (`exploring-browser`), a local Windows app (`exploring-windows`), a local Java app (`exploring-java`). Use this one when the application lives behind a remote session or draws its own controls.

## Step 0 - load the tools

The `mcp__image__*` tools are deferred in Claude Code. Calling one cold sends malformed JSON and loses the server for the session. Before the first call:

```
ToolSearch query="select:mcp__image__image_status,mcp__image__image_list_windows,mcp__image__image_focus_window,mcp__image__image_snapshot,mcp__image__image_click,mcp__image__image_type,mcp__image__image_send_keys,mcp__image__image_find_text,mcp__image__image_screenshot,mcp__image__image_end"
```

Add the others as you need them (`image_launch`, `image_wait`, `image_read_text`, `image_read_table`, `image_template`, `image_element_at`, `image_hover`, `image_drag`, `image_scroll`, `image_select_copy`, `image_write_templates`, `image_settings`, ...). If the server shows as failed in `/mcp`, the binary is missing or not on PATH: say so; do not guess coordinates.

## Before you start: the session the robot will run in

A template is pixels. It matches only a screen drawn the same way:

- **Same session settings** on the robot as now: resolution, display scaling, colour depth, font smoothing (ClearType on/off), the remote app's theme. A template captured with ClearType off does not match a screen drawn with it on (confidence drops from 1.0 to ~0.75).
- **The remote window maximized** (or full screen) on the robot, so the screen looks the same every run. `image_focus_window maximize=true` records that.
- **Never minimize the robot's own Remote Desktop window** while a flow runs: Windows stops drawing a minimized session and nothing can be seen or clicked. `image_status` says when this machine is itself a remote session.

Say these to the person when you show the plan.

## The loop

1. **Find the window.** `image_status`, then `image_list_windows`; `image_focus_window title="acme-erp01"` brings the Remote Desktop / Citrix window to the front, makes it the scope, and records Focus Window (the flow's first step - keys go to whatever window is in front). From then on every recorded step carries the **Window** option (text in that title): on the robot it searches only that window, wherever it is, and rectangles are relative to it. `image_set_scope window=screen` records whole-screen steps instead (rarely right). To start it instead: `image_launch path="mstsc.exe" args=["C:\\RDP\\erp.rdp"] title="acme-erp01"` (records Start Process + Focus Window).
2. **Snapshot.** `image_snapshot` - the scope as text, one line per thing a person would name, positions relative to the scope:
   ```
   "acme-erp01 - Remote Desktop Connection": 1282x800 at 307,87 (positions below are relative to it).
   - text "Acme ERP 4.2 [Customer 10001]" [ref=e3] at 178,60
   - text "File" [ref=e5] at 164,82
   - icon [ref=e12] at 213,103 16x16
   - field "Customer ID:" in "General" [ref=e21] value="10001" at 275,180 99x20
   - field "Name:" in "General" [ref=e25] value="" at 275,210 339x20
   - field "Street:" in "Billing address" [ref=e23] value="" at 729,182 299x20
   - radio "Wholesale" in "General" [ref=e37] [unchecked] at 372,361 15x15
   - checkbox "VIP customer" in "General" [ref=e39] [unchecked] at 275,390 12x12
   - button "Edit..." in "Billing address" [ref=e30] at 953,245 75x23
   - button "Save" [ref=e42] at 170,666 90x26
   ```
   It is built from OCR and the pixels, so it is imperfect: a word may be misread ("Biling" for "Billing"), an icon has no name, a control may be missed. **Check it against the picture**: `image_snapshot screenshot=true` draws the same refs as numbered boxes on the screenshot. Take a new snapshot after anything changes the screen - refs point at places, and a ref on a screen that changed is refused rather than clicked.
3. **Act with refs.** `image_click target=@e42`, `image_type target=@e25 text="Grace Hopper"`, `image_send_keys keys="ctrl+s"`. A target can also be visible text (`target="text:Export orders..."`) or a point in the scope (`target="point:254,111"`, as the snapshot prints positions - for an icon you identified on the screenshot). Each result says what was recorded (the template's size and how unique it is) and **what changed on the screen**: a dialog that appeared with its text, a busy pointer, a screen still painting.
4. **Wait for the remote side.** A remote screen answers after a round trip and paints in pieces. Every recorded find step already waits for its target (Wait Timeout, 15 s by default - `image_settings wait_timeout=30` for slow Citrix). Record `image_wait` only for things no step looks for: a "Saving..." banner to go away (`condition=disappear`), a report to finish. When the next step does not look for anything (keys into a dialog that is still coming, `how=region` reads) and the session is slow, record `image_wait screen_stable=true change_first=true` right after the click: on the robot it waits for the screen to answer and settle (it compares with the screen before the click, so it works even if the answer was quick). A keystroke typed before a slow dialog is there goes to the window behind it.
5. **Finish with `image_end`.** It returns the recorded sequence. With `flow_file="<flow>/main.ts"` it also writes the template images into that file (see Converting).
6. **Show the plan, ask, then build.** Present the steps in plain words (and the session requirements above) and ask with `AskUserQuestion` before writing the flow. Then `creating-flow` (its `docs/patterns/image.md` maps the sequence to `main.ts`).

## Finding things

| Need | Tool |
|---|---|
| Read the screen | `image_snapshot` (`screenshot=true` for the annotated picture) |
| A text, like a page search (OCR) | `image_find_text text="Export orders" match=contains` - each place becomes a ref. `match=fuzzy` allows one misread letter per word |
| See it | `image_screenshot` - refs drawn as boxes; image pixel × scale + origin = screen pixel (the text says the scale) |
| What is at a point of the picture | `image_element_at image_x= image_y=` (or scope `x= y=`) - the element, or a new ref for the area around the point |
| The template a step would record, and whether it is unique | `image_template target=@eN` - returns the picture and the verdict, without acting |
| Show the person | `image_highlight target=@eN` |

## How targets are recorded

The default (`by=image`) cuts a template around the target and keeps the smallest one the package's matcher finds **exactly once on the whole screen**, with a margin over the next best match, on two captures a moment apart (a blinking caret or a clock inside it would show there):

- a button or an icon: the button / icon itself;
- a field or a check box: **the field together with its label**, so look-alike fields ("Street:" in a Billing and a Shipping group) are told apart; a field is clicked near its left edge;
- when that is still not unique: more and more of the surroundings (a group title, a neighbour).

The click point inside the template is recorded too (Delta X / Y). If nothing around a target is unique, the step is recorded with a warning ("matches N places"): pick a target with more distinctive surroundings, or use `by=text`.

- `by=text` records Click Text: OCR finds the text on the robot. Slower and less exact, but it survives colour and theme changes. The server checks that OCR of the whole screen finds that text where the target is.
- `by=point` records fixed screen coordinates - only for a screen that never moves; the result warns.

## Typing and keys

- `image_type target=@eN text="..."` records Click & Type: click the field, select all (`clear=true`, the default), type. The field is read back with OCR the way the robot will (its inside, found from the click point) and the result says what it shows; when it is readable the step is recorded with **Verify** - on the robot it reads the field back and retypes slowly once if a keystroke was lost. Characters missing now → the session drops fast keystrokes: repeat with `delay_per_key=30`.
- Passwords: `secret=true` - not read back or echoed; the step's note says to read it from a Vault credential in the flow. Never put a real password into a flow as Custom text.
- `image_send_keys keys="ctrl+s"` / `"enter"` / `"alt+f"` records Send Hotkey; text with tokens (`"Smith{TAB}John{ENTER}"`) records Send Keys. Keys go to the window in front - the scope window is brought to the front first.

## Reading values

- `image_read_text target=@eN` reads a value (a field's content, a total, a status) and records **Get Text near Image**: an anchor next to the value - its label, made unique - and the value's rectangle, stored as one reference image, so the step finds the value wherever the window is. It shows what the recorded step reads back now. `how=near_text` records Get Text near Text (the anchor found by OCR); `how=region` a fixed rectangle (Get Text, last resort). `output="total"` names the message variable.
- `image_read_table target=@eN` (or `target="point:x,y" width= height=` for the grid's top-left corner) reads a grid into rows and records **Extract Table** anchored on the table's corner. More rows than fit on the screen: set the node's Scroll Mode in the flow.
- `image_select_copy target=@eN` clicks a field, selects all and copies - the exact text, no OCR - recorded as Select & Copy + Get Clipboard Text. Prefer it for values in editable fields.

Reads are recorded by default (they are what the flow is for); `explore=true` only reads.

## Exploration is read-only

The screen is the person's live system. Read it; do not change it.

- `image_click` refuses, once, a target named like a committing action - Delete, Approve, Send, Submit, Pay, Transfer, Confirm, Log off, Yes, ... If the step belongs in the flow, repeat with `record_only=true`: recorded with its verified template, not performed. If you must see what happens after it, ask the person first (say plainly it will change their data), then repeat with `confirm_side_effect=true`. An icon has no name: think before clicking one you cannot identify.
- If you changed something by accident, tell the person what changed, in the same turn, before anything else.

## Converting to a flow

The sequence's `actions` are nodes in order: `nodeType`, a plain-language `name`, and `props` in the node's own property names - `{scope:"Custom",name:…}` becomes `Custom(…)`, `{scope:"Message",name:…}` becomes `Message(…)`, plain values stay plain. **`image` / `imageTo` hold the NAME of a template const** (`"IMG_FIELD_NAME"`): run `image_write_templates flow_file="<flow>/main.ts"` (or `image_end flow_file=...`) - it writes `const IMG_FIELD_NAME = 'data:image/png;base64,...';` lines between marker comments at the top of the file - and write `image: IMG_FIELD_NAME` (the identifier, not a string) in the node. Never copy the base64 yourself. Chain the nodes with `.then()` after the trigger, give each a fresh 6-hex id, and add `f.addDependency('Robomotion.ImageAutomation', '<version>')` with a published version at least `dependencies[0].minVersion` (`robomotion describe package Robomotion.ImageAutomation`). Templates stored in the flow need Image Automation 0.12.0 or later. The full mapping: `creating-flow` → `./docs/patterns/image.md`.

## Tool reference

| Group | Tools |
|---|---|
| Session | `image_status`, `image_list_windows`, `image_focus_window`, `image_launch`, `image_set_scope`, `image_settings`, `image_end` |
| See | `image_snapshot`, `image_screenshot`, `image_find_text`, `image_element_at`, `image_template`, `image_highlight` |
| Act (recorded) | `image_click`, `image_type`, `image_send_keys`, `image_hover`, `image_drag`, `image_scroll`, `image_select_copy`, `image_wait` |
| Read (recorded) | `image_read_text`, `image_read_table` |
| Recording | `image_get_sequence`, `image_remove_step`, `image_clear`, `image_write_templates` |
