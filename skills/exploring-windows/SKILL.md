---
name: exploring-windows
description: Explores a Windows desktop application (Notepad, Excel, an ERP client, a WinForms/WPF/Win32/UWP line-of-business app, a Save As dialog) through the robomotion-windows-mcp server - reads its UI tree like a DOM, searches it, takes screenshots, performs the steps - and returns a recorded sequence of Robomotion.WindowsAutomation nodes whose selectors were verified against the live app. Use when the person wants a desktop app automated ("open Notepad, type, save as", "fill this form in our accounting app", "read the table in this window"), when you need a selector for a desktop element, and before writing ANY Robomotion.WindowsAutomation flow. Windows only.
---

# Exploring Windows applications

You drive the person's real desktop app through the `robomotion-windows-mcp` server, step by step, the way the robot will. Every action you take is recorded as the `Robomotion.WindowsAutomation` node that repeats it, with a selector the server has **verified**: generated from the element you acted on, then resolved with the Windows Automation package's own engine back to that same element. When you are done you get a sequence; `creating-flow` turns it into `main.ts`.

This is the desktop twin of `exploring-browser`. Same habits: snapshot first, act with refs, close when done, ask before building.

## Step 0 — load the tools

The `mcp__windows__*` tools are deferred in Claude Code. Calling one cold sends malformed JSON and loses the server for the session. Before the first call:

```
ToolSearch query="select:mcp__windows__windows_list_windows,mcp__windows__windows_launch,mcp__windows__windows_snapshot,mcp__windows__windows_find,mcp__windows__windows_click,mcp__windows__windows_type,mcp__windows__windows_send_keys,mcp__windows__windows_select,mcp__windows__windows_menu,mcp__windows__windows_end"
```

Add the others as you need them (`windows_screenshot`, `windows_wait`, `windows_get_table`, `windows_set_checkbox`, `windows_expand`, `windows_inspect`, `windows_get_selector`, `windows_pick_element`, …). If the server shows as failed in `/mcp`, the binary is missing or not on PATH: say so, do not guess selectors.

## The loop

1. **Find or open the app.** `windows_list_windows` when it is already open; otherwise `windows_launch path="notepad.exe"` (a program name, a full path, a document, or a URI such as `ms-settings:`). Launch waits for the app's window and makes it the current window. It handles Store apps (Windows 11 Notepad, Calculator) and single-instance apps that reuse their open window.
2. **Snapshot.** `windows_snapshot` - the window as compact text, one line per element, each with a ref:
   ```
   window "Untitled - Notepad" [ref=e1] process=Notepad class=Notepad
     - menubar [ref=e13] #MenuBar
       - menuitem "File" [ref=e14] [collapsed]
     - document "Text editor" [ref=e2] value="" [focused]
     - button [ref=e16] #tbSave tooltip="Save"
     - grid "Orders" [ref=e31] [scrolls: 2% visible — windows_find reaches the rest]
       - row [ref=e38] cells: 10001 | Alan Turing | 2026-01-02 | 611.30 | New
         - button "Open" [ref=e41]
   ```
   `#id` is the AutomationId, `tooltip=` is the only words an icon button has, `[disabled]` / `[checked]` / `[collapsed]` / `[selected]` / `[focused]` / `[offscreen]` are states. Refs stay valid for as long as their element exists, across snapshots.
3. **Act with refs.** `windows_click target=@e41`, `windows_type target=@e2 text="..."`, `windows_select`, `windows_set_checkbox`, `windows_send_keys`, `windows_menu path="File > Save As..."`. Each result tells you what changed: a dialog that opened, a window that closed or was renamed, where the focus went — and the step it recorded with its selector.
4. **Snapshot again whenever the windows changed** (the result says "The windows changed"). A dialog is a window too: `windows_snapshot window="Save As"`.
5. **Finish with `windows_end`.** It closes the windows you launched (answering "Don't save" for what you typed while exploring), and returns the recorded sequence. Never leave an exploration app open while you build or run the flow: the robot opens its own.
6. **Show the plan, ask, then build.** Present the steps in plain words and ask with `AskUserQuestion` before writing the flow. Then `creating-flow` (its `docs/patterns/windows.md` maps the sequence to `main.ts`).

## Finding things

| Need | Tool |
|---|---|
| See the window | `windows_snapshot` (narrow a big one with `ref=@eN`, widen with `full=true`) |
| An element by its words, like a DOM search | `windows_find query="Customer name"` — names, ids, values, tooltips, the text of list/grid rows; reaches rows of virtualized lists that are scrolled out of view |
| What a selector hits, as the robot will resolve it | `windows_query selector="//WindowControl[...]//ButtonControl[@name='OK']"` |
| Everything about one element (patterns, states, which nodes fit it) | `windows_inspect target=@eN` |
| The best selector, verified, with alternatives | `windows_get_selector target=@eN` |
| What the person sees | `windows_screenshot` — boxes labelled with refs drawn on it (`annotate`). Costs 10-40× a snapshot: use it when the tree is not enough |
| Which element is at a point in the picture | `windows_element_at x y` (image coordinates of the last screenshot) |
| Show the person what you mean | `windows_highlight target=@eN label="this one?"` |
| The person shows you | `windows_pick_element` — tell them first: "hover the field and press Ctrl+X (Esc cancels)" |

Use a screenshot when the snapshot shows a big unnamed `custom`/`pane` (a canvas, a chart, a game, a remote-desktop window), when names are missing or meaningless, or to check the result looks right. Elements that are drawn but not in the tree can only be clicked by position: `windows_click_point x y` (recorded relative to the element under the point, or the window). It is the last resort: it breaks when the layout changes.

## Recording rules

- Actions are recorded by default; reads (`windows_get_text`, `windows_get_table`, `windows_get_state`, …) are not. Pass `explore=true` to act without recording (moving around, undoing a mistake); `explore=false` on a read to record it as a node writing `msg.<variable>`.
- `windows_remove_step step=N` drops a mistaken step; `windows_get_sequence` shows the recording so far.
- A recorded click on an element of a dialog names the dialog: `//WindowControl[...]//WindowControl[@name='Save As']//ButtonControl[@id='1']`. Win32 dialog buttons are recorded by their numeric id (1 = OK/Save, 2 = Cancel, 6 = Yes, 7 = No): those do not change with the Windows language.
- Window titles that carry a document name ("report.txt - Notepad") are matched on the stable part, `ends-with(@name, ' - Notepad')`, so the flow still finds the window after Save As renames it.
- A selector the server could not make unique, or could not verify, comes with a warning in the result and a `note` in the sequence. Look at it: `windows_get_selector` lists alternatives; a container ref (`windows_snapshot ref=…`) shows what tells look-alikes apart.
- `windows_launch` records `Core.Process.StartProcess` (background) + `WaitWindow`. Programs start directly; a document or URI is opened through `explorer.exe`, which is what the robot's Start Process node can do.

## Exploration is read-only

The app is the person's live system. Read it; do not change it.

- `windows_click` (and `windows_menu`) refuses an element named like a committing action — Delete, Remove, Send, Submit, Post, Pay, Approve, Transfer, Confirm, Archive, Publish, Don't save, Sign out, … — once. If the step belongs in the flow, repeat with `record_only=true`: it is recorded with its verified selector and not performed. If you must see what happens after it, ask the person first (say plainly it will change their data), then repeat with `confirm_side_effect=true`.
- Saving files: when the flow saves to the person's real path, explore Save As with that path typed in and record the final Save with `record_only=true`, or save to a temporary path while exploring and put the real path in the flow.
- Typing into a document you opened is fine — `windows_end` discards it. Typing into one the person had open is not: open a new one (`ctrl+n`, a new tab) first.
- If you changed something by accident, tell the person what changed, in the same turn, before anything else.

## Desktop specifics the server already handles (and what to do when it cannot)

| Situation | What happens / what to do |
|---|---|
| A field that ignores the value set through UI Automation (the File name box of Save As, a date picker) | `windows_type` detects it and types the keys instead; the recorded Set Text node does the same |
| Element below the fold of a scroll area or a long list | actions scroll it into view first |
| A list, grid or tree with thousands of rows (virtualized) | `windows_find` / `windows_select` reach rows that are not on screen; for big grids prefer the app's own search/filter box, then pick the row — that is what a person does, and it is faster |
| Items whose UIA name is a type name (`MyApp.Models.Customer`) | the snapshot shows their visible text; selectors use `@text='…'` |
| Look-alike elements (an "Open" button on every row) | the selector is anchored to what tells them apart: `//DataItemControl[@text='10500']//ButtonControl[@name='Open']` |
| Icon-only toolbar buttons | named by their tooltip: `[@helptext='Refresh orders']` |
| Something that appears later (a button after a slow task, a dialog) | `windows_wait target=<selector> condition=appear` (or `enabled`, `disappear`); every element node also waits up to 30 s on its own |
| Keys | `windows_send_keys keys="ctrl+s"` (shortcut), `"enter"` (one key), `"John{Tab}Smith{Enter}"` (text with keys, one node) |
| A menu path | `windows_menu path="Edit > Find > Replace…"` — menu bars, WinForms ToolStrips, Win32 popup menus, right-click context menus (right-click first, then `windows_menu path="Duplicate"`) |
| Combo boxes, lists, tab strips | `windows_select target=<the container> value="…"`; a radio button or a single item: `windows_select target=<it>` |
| Grids and list views | `windows_get_table` (all rows, virtualized included); `explore=false` records Get Table Data |
| A dialog | snapshot it by title: `windows_snapshot window="Save As"`; dialogs are listed under the window that owns them |
| The app is not responding | snapshots say so; wait, then `windows_screenshot` to see its state |

## Converting to a flow

The sequence's `actions` are nodes in order: `nodeType`, a plain-language `name`, and `props` already in the node's own property names — `{scope:"Custom",name:…}` objects become `Custom(…)`, `{scope:"Message",name:…}` become `Message(…)`, plain values stay plain. Chain them with `.then()` after the trigger, give each a fresh 6-hex id, and add `f.addDependency('Robomotion.WindowsAutomation', '<version>')` with a published version (`robomotion describe package Robomotion.WindowsAutomation`; the sequence's `dependencies[0].minVersion` is the lowest that has every feature the recording used). The full mapping, node by node: `creating-flow` → `./docs/patterns/windows.md`.

## Tool reference

| Group | Tools |
|---|---|
| Session | `windows_list_windows`, `windows_launch`, `windows_focus_window`, `windows_close_window`, `windows_end` |
| See | `windows_snapshot`, `windows_find`, `windows_query`, `windows_inspect`, `windows_get_selector`, `windows_screenshot`, `windows_element_at`, `windows_highlight`, `windows_pick_element` |
| Act (recorded) | `windows_click`, `windows_type`, `windows_send_keys`, `windows_set_value`, `windows_set_checkbox`, `windows_select`, `windows_expand`, `windows_set_slider`, `windows_scroll`, `windows_drag`, `windows_click_point`, `windows_focus`, `windows_menu`, `windows_wait`, `windows_wait_window` |
| Read (recorded with `explore=false`) | `windows_get_text`, `windows_get_value`, `windows_get_table`, `windows_get_items`, `windows_get_state`, `windows_clipboard` |
| Recording | `windows_get_sequence`, `windows_clear_sequence`, `windows_remove_step`, `windows_set_flow_name`, `windows_add_delay` |
