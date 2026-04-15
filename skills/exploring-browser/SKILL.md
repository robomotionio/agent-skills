---
name: exploring-browser
description: Explores a website interactively via the robomotion-browser-mcp server to discover selectors, record action sequences, capture network traffic, and produce a JSON flow sequence that maps to Robomotion SDK TypeScript. Use when the user says "explore this page", "find the selector for X", "record the login flow", "what API does this page use", or before writing ANY `Core.Browser.*` flow. Pairs with `reversing-network` when the captured traffic reveals a clean API.
---

# Browser Exploration Skill

Interactive browser automation with real-time exploration and flow recording. Backed by the `robomotion-browser-mcp` server.

**Pairs with:** `reversing-network` — once you have captured network traffic, switch from browser automation to HTTP if a clean API is exposed.

## Overview

This skill enables **pair-programming** with the browser - you and Claude explore websites together, discover selectors, and build automation flows. At the end, a **JSON flow sequence** is generated that maps directly to Robomotion SDK TypeScript.

## Workflow

> **Step 0 — Load tool schemas.** In Claude Code, `mcp__browser__*` tools are *deferred* (only names in the catalog until you pull their schemas). Calling `browser_open` cold sends empty/malformed JSON over stdio, crashes `robomotion-browser-mcp`, and blacklists every browser tool for the rest of the session — `ToolSearch` will then return "no matching deferred tools" even though `claude mcp list` still reports ✓ Connected (that's a fresh probe, not the session's dead pipe). Before the first call, run:
>
> ```
> ToolSearch query="select:mcp__browser__browser_open,mcp__browser__browser_navigate,mcp__browser__browser_snapshot,mcp__browser__browser_type,mcp__browser__browser_click,mcp__browser__browser_close,mcp__browser__browser_get_sequence,mcp__browser__browser_set_flow_name"
> ```
>
> (Add `browser_wait`, `browser_select`, `browser_query`, `browser_start_network_capture`, etc. if you need them.) Once the server is dead, only a Claude Code restart brings it back — the connection can't be reattached from inside the session. Agents on other runtimes should substitute their own MCP invocation style.

1. **Open Browser** - Launch with `browser_open` (stealth mode enabled by default)
2. **Navigate** - Go to target URL with `browser_navigate`
3. **Snapshot** - Use `browser_snapshot` to see page structure with refs (primary exploration tool)
4. **Act** - Use refs from snapshot: `browser_click @e3`, `browser_type @e5` (auto-recorded with XPath)
5. **Re-snapshot** - After page changes (click, navigation), take a new snapshot
6. **Close Browser** - ALWAYS call `browser_close` when exploration is done — this returns the flow sequence JSON and frees the browser
7. **Ask User** - Present the plan/sequence and use `AskUserQuestion` to ask whether to proceed with building the flow
8. **Convert** - Only after user approval, convert JSON to TypeScript for robomotion-sdk

**CRITICAL**: You MUST close the browser (`browser_close`) when you have finished exploring all the steps. Do NOT leave the browser open while building/modifying code. And you MUST ask the user with `AskUserQuestion` before proceeding to write or modify flow code.

## Key Concepts

### Snapshot-First Exploration (MANDATORY)

**On EVERY new URL or page change, your FIRST action MUST be `browser_snapshot`.** This is non-negotiable. Snapshot uses ~50-100 tokens vs ~500-2000 tokens for a screenshot.

```
GOOD: browser_navigate → browser_snapshot → read tree → browser_click @e3
BAD:  browser_navigate → browser_screenshot → browser_query → browser_query → ...
BAD:  browser_navigate → browser_query → browser_query → browser_query → ...
```

**Rules:**
- **FIRST CALL after any navigation** (`browser_navigate`, `browser_click` that loads a new page, `browser_reload`, `browser_go_back`) MUST be `browser_snapshot`
- Use the refs (`@e1`, `@e2`, ...) from the snapshot as selectors in action tools
- After a page-changing action (click, form submit), take a NEW snapshot immediately
- **DO NOT use `browser_screenshot` for page discovery** — it costs 10-40x more tokens. Only use screenshot as a LAST RESORT when you are stuck and cannot proceed with snapshot refs alone (e.g., visual layout issues, image verification)
- **DO NOT use `browser_query` for page discovery** — snapshot already shows all interactive elements. Only use query for targeted checks on specific selectors
- **NEVER** make multiple sequential `browser_query` calls to "discover" the page — that's what snapshot is for

### Refs — Lightweight Element References

Snapshots assign refs like `@e1`, `@e2` to interactive elements. These refs work as selectors in ALL action tools:

```
browser_click selector=@e3          → clicks the element, records its XPath
browser_type selector=@e5 text=hello → types into the element, records its XPath
```

Refs are **ephemeral** — they're invalidated on navigation, reload, or go-back. After page changes, take a new snapshot to get fresh refs.

Recordings always store the **resolved XPath/CSS selector**, never the ref. This means the RPA robot gets stable selectors.

### Explore Mode

- **explore=true** (default for queries): Don't record the action, just explore
- **explore=false** (default for actions): Record the action to flow sequence

| Tool Type | Default explore | Behavior |
|-----------|-----------------|----------|
| Snapshot (`browser_snapshot`) | — | Exploration only (never recorded) |
| Queries (`browser_query`, `browser_get_text`) | true | Exploration, not recorded |
| Actions (`browser_click`, `browser_type`) | false | Recorded to flow |
| Navigation (`browser_navigate`) | false | Recorded to flow |
| Screenshots | true | Not recorded by default |

### Selectors

Use **refs** (preferred), **XPath**, or **CSS** selectors:

```
# Refs (from browser_snapshot) — PREFERRED
@e1, @e2, @e3

# XPath examples
//button[@id='submit']
//input[@name='email']

# CSS examples
#submit
input[name='email']
```

## Available Tools

### Lifecycle
- `browser_open` - Launch browser (headless, stealth, viewport options)
- `browser_close` - Close browser and return flow sequence JSON

### Navigation
- `browser_navigate` - Go to URL
- `browser_reload` - Refresh page
- `browser_go_back` - Navigate back

### Exploration
- `browser_snapshot` - **ALWAYS USE FIRST** — Accessibility tree with refs (@e1, @e2, ...). Mandatory after every navigation.
- `browser_screenshot` - **LAST RESORT ONLY** — Visual capture. Only use when stuck and snapshot refs aren't enough.
- `browser_query` - Targeted element check (use sparingly — snapshot already shows everything)
- `browser_get_text` - Get element text content
- `browser_get_value` - Get input value
- `browser_get_attr` - Get attribute value

### Actions (Auto-recorded)
- `browser_click` - Click element
- `browser_type` - Type into input
- `browser_select` - Select dropdown option
- `browser_wait` - Wait for element
- `browser_scroll` - Scroll to element
- `browser_hover` - Hover over element

### Context
- `browser_switch_iframe` - Enter iframe
- `browser_switch_main` - Exit to main page

### Session
- `browser_get_sequence` - Get current JSON sequence
- `browser_clear_sequence` - Start fresh
- `browser_set_flow_name` - Name the flow

### Cookies
- `browser_get_cookies` - Get cookies (optionally filter by domain)
- `browser_set_cookie` - Set a single cookie
- `browser_set_cookies` - Set multiple cookies
- `browser_clear_cookies` - Clear cookies (optionally by domain)

### Network Capture (API Discovery)
- `browser_start_network_capture` - Start capturing requests/responses
- `browser_get_requests` - Get captured requests (filter by method/URL)
- `browser_get_responses` - Get captured responses (filter by status/URL)
- `browser_get_request_response` - Get request-response pair by ID
- `browser_stop_network_capture` - Stop capturing
- `browser_clear_network_capture` - Clear captured data

### Console Capture (Debugging)
- `browser_start_console_capture` - Start capturing console logs
- `browser_get_console_logs` - Get captured logs (filter by type)
- `browser_clear_console_logs` - Clear captured logs
- `browser_stop_console_capture` - Stop capturing

### Session Persistence
- `browser_export_session` - Export cookies, localStorage, URL as JSON
- `browser_import_session` - Import previously exported session
- `browser_save_session` - Save session to file
- `browser_load_session` - Load session from file

### Element Picker (Interactive Selection)
- `browser_start_element_picker` - Start interactive element picker (red highlight on hover)
- `browser_get_picked_element` - Get element selected by user via Ctrl+X
- `browser_stop_element_picker` - Stop picker and remove highlight

## Example Session

```
User: Automate login to example.com

Claude: I'll open a browser and explore the login page.
[browser_open stealth=true]
[browser_navigate url="https://example.com/login"]
[browser_snapshot]
// Returns:
//   - textbox "Email" [ref=e1]
//   - textbox "Password" [ref=e2] [type=password]
//   - button "Sign In" [ref=e3]

Now I'll perform the login actions using refs:
[browser_type selector=@e1 text="user@example.com"]
[browser_type selector=@e2 text="secret123"]
[browser_click selector=@e3]

// Page changed — take a new snapshot to see what happened
[browser_snapshot]

// Done exploring — CLOSE THE BROWSER to get the flow sequence
[browser_close]
// Returns flow sequence JSON with resolved XPath selectors (not refs)

Claude: Here's the plan I recorded:
1. Open Browser → Navigate to login page
2. Type email → Type password → Click Sign In

[AskUserQuestion: "Should I build the TypeScript flow from this sequence?"]

// Only after user says yes:
Here's the TypeScript flow:
// ... generated code ...
```

## Tips

1. **Snapshot first, always** — one `browser_snapshot` shows every interactive element with refs.
2. **Re-snapshot after page changes** — navigation/clicks invalidate refs.
3. **Close the browser when done** — always `browser_close`. Never leave it open while writing code.

The conversion from recorded JSON to TypeScript belongs to `creating-flow`; this skill's job ends at the sequence JSON. For browser-specific SDK patterns (proxy config, selector tips), see `./docs/patterns/browser.md`.

---

## Pair-Programming Workflows

### When Element Not Found - Use Element Picker!

When you can't find an element after multiple attempts, **use the interactive element picker** instead of asking the user to manually inspect:

```
1. Take a screenshot to see current state
2. Try 2-3 different selector strategies
3. Check if element is in an iframe (browser_switch_iframe)
4. If still not found, START THE ELEMENT PICKER:
   [browser_start_element_picker]
   "I can't find the element. I've enabled the element picker -
    please hover over the element you want and press Ctrl+X to select it.
    Press Escape to cancel."
5. Wait for user, then retrieve the element:
   [browser_get_picked_element]
6. Use the recommended selectors from the result
```

**Example workflow:**
```
Claude: I'm looking for the login button but can't find it with the usual selectors.
        Let me enable the element picker so you can show me exactly which element you mean.

[browser_start_element_picker]

Result: Element picker started. User should hover over elements (red highlight)
        and press Ctrl+X to select.

Claude: Please hover over the button you want me to click and press Ctrl+X.
        You'll see a red highlight around elements as you hover.

--- User hovers and presses Ctrl+X ---

[browser_get_picked_element]

Result: {
  "picked": true,
  "element": {
    "tagName": "button",
    "className": "btn-primary submit-form",
    "text": "Sign In",
    "recommendedSelectors": [
      { "type": "xpath", "selector": "//button[contains(text(),'Sign In')]", "confidence": 80, "reason": "Contains text" },
      { "type": "xpath", "selector": "//button[@class='btn-primary submit-form']", "confidence": 70, "reason": "Class match" }
    ]
  }
}

Claude: Got it! The button has text "Sign In". I'll use this selector:
[browser_click selector="//button[contains(text(),'Sign In')]"]
```

### Network Analysis for API Discovery

Use network capture to understand what APIs a page uses:

```
1. browser_start_network_capture capture_body=true
2. Perform the action (login, form submit, etc.)
3. browser_get_requests method=POST
4. Analyze the API endpoints found
5. Suggest: "Instead of browser automation, you could use
   Core.Net.HttpRequest directly with this endpoint"
```

**Example workflow:**
```
Claude: Let me capture network traffic to see what API this uses...
[browser_start_network_capture capture_body=true]

Claude: Now I'll fill in the login form...
[browser_type selector="//input[@name='email']" text="test@example.com"]
[browser_type selector="//input[@name='password']" text="password"]
[browser_click selector="//button[@type='submit']"]

Claude: Let me check what API calls were made...
[browser_get_requests method=POST]

Result: Found POST to /api/auth/login with JSON body:
{
  "email": "test@example.com",
  "password": "password"
}

Claude: I found the login API endpoint. Instead of browser automation,
you could create a simpler flow using Core.Net.HttpRequest:
- POST to /api/auth/login
- Store the auth token from response
- Use token for subsequent API calls

Would you prefer the API-based approach?
```

### Debugging with Console Logs

When actions don't work as expected:

```
1. browser_start_console_capture types=["error","warn"]
2. Retry the failing action
3. browser_get_console_logs type=error
4. Report findings and adjust approach
```

**Example workflow:**
```
Claude: The click didn't seem to work. Let me check for JavaScript errors...
[browser_start_console_capture types=["error","warn"]]
[browser_click selector="//button[@id='submit']"]
[browser_get_console_logs type=error]

Result: Error: "Cannot read property 'validate' of undefined" at form.js:42

Claude: Found a JavaScript error - the page has a bug in its validation code.
Let me try waiting for the form to fully load first...
[browser_wait selector="//form[@data-ready='true']"]
```

### Session Persistence for Auth

When working with authenticated sites:

```
1. Complete login manually or via automation
2. browser_export_session - save for later
3. Close browser, do other work
4. browser_open, browser_import_session - restore auth
```

**Example workflow:**
```
Claude: Let me save your authenticated session for later use...
[browser_export_session]

Session exported with 5 cookies and current URL.

Claude: I'll save this to a file so you can reuse it:
[browser_save_session path="/tmp/myapp-session.json"]

--- Later ---

Claude: Let me restore your previous session...
[browser_open]
[browser_load_session path="/tmp/myapp-session.json"]

Session restored - you're logged in as user@example.com
```

### When to Use Browser vs HTTP Request

| Scenario | Recommendation |
|----------|----------------|
| Simple API with known endpoints | Use `Core.Net.HttpRequest` |
| Login flow → need auth cookies | Use browser, then export session |
| Complex JavaScript-rendered content | Use browser automation |
| Form with CSRF tokens | Use browser (handles tokens automatically) |
| Scraping paginated data | Start with browser, switch to API if found |
| File downloads | Use browser for auth, API for download |

**Decision workflow:**
1. Start with network capture
2. If clean REST API found → suggest HTTPRequest
3. If complex auth/CSRF → stick with browser
4. If both needed → browser for auth, API for data
