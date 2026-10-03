---
name: exploring-java
description: Explores a Java desktop application (Swing / AWT - an ERP or banking client, an Oracle Forms-era tool, any app started from a .jar or a Java .exe) through the robomotion-java-mcp server - reads its UI tree like a DOM through the Java Access Bridge, searches it, takes screenshots, performs the steps - and returns a recorded sequence of Robomotion.JavaAutomation nodes whose Window Title + Full Path selectors were verified against the live app. Use when the person wants a Java application automated ("fill this form in our Java client", "export the orders table", "open the record and approve it"), when you need a selector for a Java element, and before writing ANY Robomotion.JavaAutomation flow. Windows only.
---

# Exploring Java applications

You drive the person's real Java application through the `robomotion-java-mcp` server, step by step, the way the robot will. Every action you take is recorded as the `Robomotion.JavaAutomation` node that repeats it, with a selector the server has **verified**: generated from the element you acted on, then resolved with the Java Automation package's own engine back to that same element. When you are done you get a sequence; `creating-flow` turns it into `main.ts`.

This is the Java twin of `exploring-browser` (and of `exploring-windows`). Same habits: snapshot first, act with refs, close when done, ask before building.

**Is it a Java app?** Swing and AWT windows (class `SunAwtFrame` / `SunAwtDialog`) — this skill. JavaFX and Eclipse/SWT applications draw native or their own controls and are not reached by the Java Access Bridge: use `exploring-windows` for them.

## Step 0 — load the tools

The `mcp__java__*` tools are deferred in Claude Code. Calling one cold sends malformed JSON and loses the server for the session. Before the first call:

```
ToolSearch query="select:mcp__java__java_status,mcp__java__java_list_windows,mcp__java__java_launch,mcp__java__java_snapshot,mcp__java__java_find,mcp__java__java_click,mcp__java__java_type,mcp__java__java_select,mcp__java__java_menu,mcp__java__java_end"
```

Add the others as you need them (`java_screenshot`, `java_wait`, `java_select_row`, `java_read_table`, `java_set_checkbox`, `java_set_value`, `java_send_keys`, `java_inspect`, `java_get_selector`, `java_pick_element`, …). If the server shows as failed in `/mcp`, the binary is missing or not on PATH: say so, do not guess selectors.

## The Java Access Bridge must be on

`java_status` says whether it is. When it is off, Java windows are on the screen but the server sees none of them (`java_list_windows` names them as "the bridge cannot see"). Turning it on is a system setting: **ask the person**, then run `jabswitch -enable` (in the JDK/JRE `bin` folder) and restart the Java application. The robot's machine needs it on too.

## The loop

1. **Find or open the app.** `java_list_windows` when it is already open; otherwise `java_launch path="C:\\Apps\\Ledger\\ledger.jar"` (a `.jar` starts as `javaw -jar`, an `.exe` directly; pass `args` as a list). Launch waits for the first Java window (JVMs start slowly; up to 40 s) and makes it current.
2. **Snapshot.** `java_snapshot` — the window as compact text, one line per element, each with a ref:
   ```
   Window "orders.acme - Acme Desk (Java)"  (Window Title selector: "Acme Desk (Java)", pid 14264)
   - menu bar [ref=e1] (open items with java_menu "Menu/Item")
     - menu "File" [ref=e2]: New | Open... | Save | Save As... | Export ▸ (CSV... | PDF... (disabled)) | Exit
   - tool bar [ref=e6]
     - push button "Save document" (tooltip) [ref=e8]
   - page tab list [ref=e11]: Customer* | Orders | Products   (* selected; java_select target=@e11 value=<tab>)
     - page tab "Customer" [ref=e12] [selected]
       - text "Customer name" [ref=e13] value=""
       - text "Email" (label) [ref=e14] value=""
       - combo box "Country" [ref=e19] value="Japan" (20 options)
       - panel "Billing address" [ref=e29]
         - text "Street" [ref=e30] value=""
         - push button "Edit" [ref=e31]
       - table "Orders" [ref=e16] 1000 rows × 5 columns: Order | Customer | Status | Amount | Shipped
         - row 0: 10001 | Alan Turing | Shipped | 642.9 | true
   ```
   It shows what is on screen: the selected tab's page only, the menus with their items (they exist while closed), the first rows of tables and lists. `(label)` means the field has no name of its own and is known by the label in front of it; `(tooltip)` that an icon button is known by its tooltip. Refs stay valid across snapshots while the screen keeps its shape.
3. **Act with refs.** `java_click target=@e31`, `java_type target=@e13 text="..."`, `java_select target=@e19 value="Canada"`, `java_set_checkbox`, `java_menu path="File/Save As..."`, `java_select_row target=@e16 value="10742" column="Order" click="double_click"`. Each result tells you what changed — a dialog that opened, a window that closed or was retitled — and the step it recorded with its selector.
4. **Snapshot again whenever the windows changed** (the result says so). A dialog is a window of its own: `java_snapshot window="Save As"`.
5. **Finish with `java_end`.** It closes the windows you launched — an application that asks "save changes?" is answered **Cancel** and left open (tell the person; nothing of theirs is discarded) — and returns the recorded sequence. Never leave an exploration app open while you build or run the flow: the robot opens its own.
6. **Show the plan, ask, then build.** Present the steps in plain words and ask with `AskUserQuestion` before writing the flow. Then `creating-flow` (its `docs/patterns/java.md` maps the sequence to `main.ts`).

## Finding things

| Need | Tool |
|---|---|
| See the window | `java_snapshot` (one part: `target=@eN`; every element with raw properties, hidden ones too: `full=true`) |
| An element by its words, like a page search | `java_find text="Customer name"` — names, labels, tooltips, field text, list items, combo options, menu items, table cells ("row 741, column Order") |
| What a path hits, in order, as the robot resolves it | `java_query path="//panel[name='Billing address']//push button[name='Edit']"` |
| Everything about one element (states, actions, options, parents) | `java_inspect target=@eN` |
| The verified selector, and which package version it needs | `java_get_selector target=@eN` |
| What the person sees | `java_screenshot` — refs drawn as numbered boxes. Costs 10-40× a snapshot: use it when the tree is not enough |
| Which element is at a point in the picture | `java_element_at x y` (image coordinates of the last screenshot) |
| Show the person what you mean | `java_highlight target=@eN` |
| The person shows you | `java_pick_element` — tell them first: "hover the field and press Ctrl+X (Esc cancels)" |

Custom-painted areas (charts, canvases, a drawn calendar) have no parts in the tree: take a screenshot and `java_click_point x y` (recorded relative to the element under the point). It is the last resort.

## Selectors

Every node takes a **Window Title** and a **Full Path**; the server writes both.

- Window Title: the stable part of the title as plain text — "Acme Desk (Java)" for "orders.acme - Acme Desk (Java)", so the flow still finds the window after Save As renames it. A title that carries data ("Order 10742") becomes a pattern, `^Order \d+$`.
- Full Path: `//push button[name='Save customer']`; `//text[vname='Email']` for a field named only by the label in front of it; `//panel[name='Shipping address']//text[name='Street']` when the same field exists twice. Only when nothing names an element does it fall back to a position (`[N]`) — the result warns you.
- A selector the server could not make unique comes with a warning and a `note` in the sequence. Look at it before building.

## Recording rules

- Actions are recorded by default; reads (`java_get_text`, `java_get`, `java_read_table`, `java_get_cell`) are not. Pass `explore=true` to act without recording; `explore=false` on a read to record it as a node writing `msg.<variable>` (`java_read_table explore=false variable="orders"` → Extract Table → a Robomotion data table).
- `java_remove_step step=N` drops a mistaken step; `java_get_sequence` shows the recording so far.
- Steps that use what Java Automation 2.1.0 added say "needs Robomotion.JavaAutomation 2.1.0+" and the sequence's `dependencies[0].minVersion` says the lowest version that runs all of it.
- **Check what is published before exploring**: `robomotion describe package Robomotion.JavaAutomation`. If its newest version is older than 2.1.0, call `java_target_version version="<that version>"` first: selectors are then recorded as absolute paths with regex titles, and clicks that open a dialog as mouse clicks, so the flow runs on it. A few steps have no older form (table rows, multi-select lists, typed values an editable combo does not list): the recording still marks them 2.1.0 — tell the person they need the newer package.
- `java_launch` records `Core.Process.StartProcess` (background) + `Wait` for the window. A `.jar` is recorded as the `javaw.exe` that started it: the robot's machine needs Java there (or `javaw` on PATH) — say so in the plan.

## Exploration is read-only

The application is the person's live system. Read it; do not change it.

- `java_click`, `java_menu` and `java_click_point` refuse an element named like a committing action — Delete, Remove, Send, Submit, Post, Pay, Approve, Transfer, Confirm, Archive, Discard, Sign out, … — once. If the step belongs in the flow, repeat with `record_only=true`: recorded with its verified selector, not performed. If you must see what happens after it, ask the person first (say plainly it will change their data), then repeat with `confirm_side_effect=true`.
- Saving files: explore Save As with a temporary path, or type the real path and record the final Save with `record_only=true`.
- If you changed something by accident, tell the person what changed, in the same turn, before anything else.

## What the server handles (and what to do when it cannot)

| Situation | What happens / what to do |
|---|---|
| A button or menu item that opens a dialog | Clicked with the real mouse. (The Java Access Bridge's own "click" runs the app's code and waits until the dialog closes — and while it waits, no accessibility call of any program works. `java_do_action "click"` does exactly that: do not use it for such buttons.) If a step reports "the application is blocked by a modal dialog", close the dialog with the keyboard or ask the person. |
| Text fields | `java_type` types like a person when the field is on screen (click, select all, type), so dates, masks and spinner editors commit their value; `method="set"` sets it through the bridge (no key or focus events). Read back either way. |
| Editable combo box with a value that is not in its list | `java_select value="Portland"` types it and commits it with Enter |
| Element scrolled out of view / on another tab | Scrolled into view with the wheel; another tab must be selected first (`java_select` on the tab list) — a `//` path only sees what is showing |
| Tables (JTable) | `java_select_row value=… column=… click=double_click` (scrolls to the row), `java_read_table`, `java_get_cell`; `java_find` searches the cells |
| Long lists | `java_select value="…" match=contains` reaches item 4,000 of 5,000; items named like `MyApp$Item@1f2a` (no toString) are recorded by index |
| Trees | `java_select target=<tree> value="Root/Branch/Leaf"` expands lazily loaded branches on the way; `java_expand` |
| Menus and popup menus | `java_menu path="File/Export/CSV..."`; right-click first (`java_click click_type=right`, or `java_select_row … click=right_click`), then `java_menu path="Mark as shipped"` |
| Something that appears later | `java_wait target=<path> condition=appear` (or `disappear`, or `value` with `expected=`); `java_wait_window title="Order"` |
| Keys | `java_send_keys keys="{Ctrl+S}"`, `"{Enter}"`, `"Grace{Tab}Hopper"` — sent only once the window is in front and the element focused |
| Hyperlinks in an HTML pane | the snapshot lists them; `java_activate_link target=… text="Terms of use"` |
| Closing the app | `java_close_window` (recorded as Close Window); a "save changes?" question is answered Cancel and reported |

## Converting to a flow

The sequence's `actions` are nodes in order: `nodeType`, a plain-language `name`, and `props` already in the node's own property names — `{scope:"Custom",name:…}` becomes `Custom(…)`, `{scope:"Message",name:…}` becomes `Message(…)`, plain values stay plain. Chain them with `.then()` after the trigger, give each a fresh 6-hex id, and add `f.addDependency('Robomotion.JavaAutomation', '<version>')` with a published version at least `dependencies[0].minVersion` (`robomotion describe package Robomotion.JavaAutomation`). The full mapping, node by node: `creating-flow` → `./docs/patterns/java.md`.

## Tool reference

| Group | Tools |
|---|---|
| Session | `java_status`, `java_list_windows`, `java_launch`, `java_focus_window`, `java_close_window`, `java_end` |
| See | `java_snapshot`, `java_find`, `java_query`, `java_inspect`, `java_get_selector`, `java_screenshot`, `java_element_at`, `java_highlight`, `java_pick_element` |
| Act (recorded) | `java_click`, `java_type`, `java_send_keys`, `java_select`, `java_set_checkbox`, `java_set_value`, `java_menu`, `java_expand`, `java_select_row`, `java_scroll_into_view`, `java_hover`, `java_drag`, `java_click_point`, `java_focus`, `java_do_action`, `java_activate_link`, `java_wait`, `java_wait_window` |
| Read (recorded with `explore=false`) | `java_get_text`, `java_get`, `java_read_table`, `java_get_cell`, `java_list_items` |
| Recording | `java_get_sequence`, `java_clear_sequence`, `java_remove_step`, `java_set_flow_name`, `java_add_delay` |
