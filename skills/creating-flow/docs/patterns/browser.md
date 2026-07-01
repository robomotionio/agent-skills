# Browser Automation

Reference for `Core.Browser.*` nodes and common patterns.

**Related:** `captcha.md` · `credentials.md` · `loops.md` · `skills/reversing-network` (replace browser with HTTP once you've captured the underlying API).

## When NOT to use

- **A clean HTTP/REST API exists** — `Core.Net.HttpRequest` is faster and far more reliable. Capture traffic first (see `skills/reversing-network`).
- **Single static file to download** — use `Core.Net.HttpRequest` with a file output, not `OpenLink`.
- **No JS rendering required** — if `curl` gets the data, skip the browser.

> **ES5 only in `func` strings** — no arrow functions, template literals, `const`/`let`, destructuring, or optional chaining. See `creating-flow` SKILL.md Core Principle 11.


## Core Nodes

| Node | Purpose | Key Properties |
|------|---------|----------------|
| `Open` | Launch browser | `optBrowser`, `optProxy`, `outBrowserId` |
| `Close` | Close browser | `inBrowserId` |
| `OpenLink` | Navigate to URL | `inBrowserId`, `inUrl`, `outPageId`, `optSameTab`, `optStealthMode` |
| `ClickElement` | Click element | `inPageId`, `inSelector`, `optClickType` |
| `TypeText` | Type into input | `inPageId`, `inSelector`, `inText` |
| `GetValue` | Get input value | `inPageId`, `inSelector`, `outValue` |
| `SetValue` | Set input value | `inPageId`, `inSelector`, `inValue` |
| `WaitElement` | Wait for element | `inPageId`, `inSelector`, `optTimeout` |
| `RunScript` | Execute JavaScript | `inPageId`, `func`, `outResult` |
| `Screenshot` | Capture screenshot | `inPageId`, `inPath` |
| `Select` | Select dropdown option | `inPageId`, `inSelector`, `inValue` |

## Selectors — the default is XPath (most common runtime failure)

**Every `Core.Browser.*` element node — `ClickElement`, `TypeText`, `GetValue`,
`SetValue`, `WaitElement`, `Select` — interprets `inSelector` as XPath by
default.** The node has an `inSelectorType` property with two values:
`xpath:position` (the default) and `css`. Get this wrong and the element is
never found: the flow fails at runtime with
`Wait element timed out: element not found` even though the URL and page are
correct and the selector looks fine in DevTools.

Rules (follow exactly):

- **Prefer XPath and omit `inSelectorType`.** When you explore a page
  (`/exploring-browser`) you'll note CSS-style handles like `#email` or
  `input[type="email"]` — you MUST translate them to XPath before writing the
  node:

  | What you found | Write this XPath (NOT the CSS) |
  |----------------|-------------------------------|
  | `#email` | `//input[@id='email']` |
  | `input[type="email"]` | `//input[@type='email']` |
  | `.submit` | `//*[contains(@class,'submit')]` |
  | button text "Sign In" | `//button[normalize-space()='Sign In']` |
  | link text "Reports" | `//a[normalize-space()='Reports']` |
  | first of many identical | `(//button[@data-testid='row-action'])[1]` |

  ```typescript
  f.node('000004', 'Core.Browser.TypeText', 'Type Email', {
    inPageId: Message('page_id'),
    inSelector: Custom("//input[@id='email']"),   // XPath, no inSelectorType
    inText: Custom('user@example.com')
  });
  ```

- **NEVER pass a CSS-style string (`#id`, `.class`, `input[type="email"]`) without
  setting the type** — it is parsed as XPath and silently fails.

- If you genuinely need CSS, set the type explicitly to `css`:

  ```typescript
  f.node('000004', 'Core.Browser.TypeText', 'Type Email', {
    inPageId: Message('page_id'),
    inSelectorType: Custom('css'),       // REQUIRED whenever inSelector is CSS
    inSelector: Custom('#email'),
    inText: Custom('user@example.com')
  });
  ```

- **Do NOT write `inSelectorType: 'xpath'`** — that is not a valid value (the
  XPath enum is `xpath:position`). For XPath, just omit `inSelectorType`.

- Be consistent across a flow: don't mix XPath on some nodes and bare CSS strings
  on others. Pick XPath for everything unless a CSS selector is unavoidable.

- **Target an input by its OWN attributes, not by nearby label text.** The visible
  label next to a field is almost always a separate `<label>`/text element — it is
  NOT the input's `@placeholder`. Writing `//input[@placeholder='<the label you
  saw>']` is a frequent cause of `element not found`. Use the input's real, stable
  attributes from your snapshot, in order of preference: `@id` → `@name` →
  `@type`/`@autocomplete`. For example, if you explored a field whose label reads
  "Full name" but the input is `<input id="fullName">`, write `//input[@id='fullName']`
  — **never** `//input[@placeholder='Full name']`. Only use `@placeholder` if you
  confirmed that exact placeholder is on the input itself in the snapshot.

## Never pick an ambiguous XPath (it must match exactly ONE element)

A selector that matches **more than one** element is a top cause of wrong/flaky
automations: at runtime the robot acts on the first/wrong match or the node
errors. As you explore, **confirm every selector you write resolves to exactly one
element on that page.** Prefer the most robust form available:

1. **A stable, unique attribute** — `//input[@id='email']`, `//*[@data-testid='x']`,
   `//input[@name='username']`. Best choice; use it whenever the element has one.
2. **A distinctive attribute** — `@type`, `@autocomplete`, `@aria-label`, `@role`.
3. **Exact text on the right element** — `//button[normalize-space()='Submit']`.
   Use exact `normalize-space()='...'`, not `contains(text(),'...')`, which
   over-matches and silently grabs the first hit.
4. **Last resort: a scoped path or explicit index** — only when you have verified
   the order is stable and you genuinely want the Nth match (e.g. "the first of
   many identical row buttons" → `(//table//button[@data-testid='row-action'])[1]`).

Avoid:

- **Brittle absolute paths** (`/html/body/div[2]/div[3]/...`) — break on any layout
  change.
- **Bare tag matches** that hit many nodes (`//input`, `//button`, `//a`).
- **`contains(...)` that over-matches** several elements — prefer exact text, or
  scope it: `//form[@id='login']//button[normalize-space()='Sign In']`.
- **Guessed positional `[n]`** — index only when you verified the order.

When unsure, **scope by a nearby stable container** instead of reaching for an
index: `//*[@id='login']//input[@type='password']` beats `(//input)[2]`. This is
mandatory even if the user does not ask for it — robust, unambiguous selectors are
the default, not an option.

## Browser Options

```typescript
f.node('4a9e12', 'Core.Browser.Open', 'Open Browser', {
  optBrowser: 'chrome',          // PLAIN STRING — chrome | headlesschrome | firefox | edge
  optProxy: 'robomotion-proxy',  // PLAIN STRING — no-proxy | robomotion-proxy | custom
  optMaximized: true,            // boolean literal
  outBrowserId: Message('browser_id')
});
```

> **CRITICAL — enum/dropdown options take a PLAIN value, NOT `Custom()`.**
> `optBrowser`, `optProxy`, `optProxyAuth`, `optClickType` and similar fixed-choice
> "opt*" fields are plain strings (or booleans like `optMaximized`). Wrapping them
> in `Custom(...)` emits a `{name, scope}` object, and the robot rejects it at load
> time with **`Config parse error`** / `interface conversion: ... is string, not
> []interface {}` — the flow never starts (no `flow_start`, no node runs).
> `Custom()` / `Message()` are ONLY for value fields that accept a variable
> (selectors, URLs, text, paths: `inSelector`, `inUrl`, `inText`, `optDownloadDir`,
> `optProxyAddr`, …). When unsure whether an option is an enum, omit it and take
> the default rather than guessing `Custom()`.

## Downloading files (set `optDownloadDir`)

When the task is to **download a file** (PDF, export, report, etc.), clicking the
download control is NOT enough: a headless browser discards downloads unless you tell
it where to put them. On `Core.Browser.Open` set **`optDownloadDir`** to an absolute
folder (it's a value field, so `Custom(...)` is correct here).

**Clicking only STARTS the download — wait for it to FINISH before `Close`/`Stop`.**
A click returns immediately; the file is still streaming to disk. If `Close Browser`
or the flow's `Stop` runs right after, the browser is torn down mid-transfer and the
file is **cancelled / never lands**. So leave a real delay between the download click
and `Close`. The simplest way is the common `delayAfter` runtime prop on the click
node (raw seconds, no extra node) — or `delayBefore` on Close/Stop:

```typescript
f.node('4a9e12', 'Core.Browser.Open', 'Open Browser', {
  optBrowser: 'chrome',
  optDownloadDir: Custom('/home/<user>/Downloads'),  // REQUIRED to persist downloads
  outBrowserId: Message('browser_id')
});
// ... navigate to the download control ...
f.node('a1b2c3', 'Core.Browser.ClickElement', 'Download', {
  inPageId: Message('page_id'),
  inSelector: Custom('<xpath you explored for the download control>'),
  delayAfter: 5   // seconds AFTER the click — let the file finish writing to disk
})
  .then('8e7d6c', 'Core.Browser.Close', 'Close Browser', { inBrowserId: Message('browser_id') });
```

`delayBefore`/`delayAfter` are common runtime props on every node (raw float seconds,
NOT wrapped in `Custom()`). A `Core.Programming.Sleep` node works too — but **do NOT
"wait" with `Core.Browser.WaitElement` on `//body` or any element already on the
page**: `WaitElement` waits for an element to *appear*, and those already exist, so
it returns in ~0ms and waits for nothing — the download still gets cut off. Only use
WaitElement to wait for something that is genuinely not there yet.

Without `optDownloadDir`, OR if `Close`/`Stop` races the download, the flow still
reports `flow_end success` (the click succeeded) but **no file lands on disk** — a
confusing "it worked but nothing downloaded" outcome. Always set `optDownloadDir`
AND a real delay before Close for download tasks.

| `optBrowser` (plain string) | Description |
|--------------|-------------|
| `chrome` | Chrome with UI |
| `headlesschrome` | Chrome headless (no UI) |
| `firefox` | Firefox with UI |
| `edge` | Edge with UI |

## Same Tab Navigation

For loops that visit multiple URLs, reuse the same tab:

```typescript
// First navigation creates page_id
f.node('7bc3d8', 'Core.Browser.OpenLink', 'First Page', {
  inBrowserId: Message('browser_id'),
  inUrl: Custom('https://example.com'),
  outPageId: Message('page_id')
});

// Loop body: reuse same tab with optSameTab + inPageId
f.node('e52f91', 'Core.Browser.OpenLink', 'Open URL', {
  inBrowserId: Message('browser_id'),
  inPageId: Message('page_id'),      // REQUIRED with optSameTab
  inUrl: Message('url'),
  optSameTab: true
});
```

## Wait for Element

Most `Core.Browser.*` action nodes have built-in waiting for their target selector. Use `WaitElement` explicitly when you need to wait for elements that aren't the target of the next action (e.g., waiting for a loading spinner to disappear).

Wait for dynamic content before interacting:

```typescript
f.node('a6c4b7', 'Core.Browser.WaitElement', 'Wait for Results', {
  inPageId: Message('page_id'),
  inSelector: Custom('//div[@class="results"]'),
  optTimeout: Custom('10')   // WaitElement.optTimeout is variableType:Integer → scope helper, not a bare number
})
  .then('d38e0f', 'Core.Browser.RunScript', 'Extract Data', {
    inPageId: Message('page_id'),
    func: `
      var table = document.querySelector('table');
      var headers = [];
      var rows = [];
      var ths = table.querySelectorAll('thead th');
      ths.forEach(function(th) { headers.push(th.innerText.trim()); });
      var trs = table.querySelectorAll('tbody tr');
      trs.forEach(function(tr) {
        var row = {};
        tr.querySelectorAll('td').forEach(function(td, i) { row[headers[i]] = td.innerText.trim(); });
        rows.push(row);
      });
      return JSON.stringify({ columns: headers, rows: rows });
    `,
    outResult: Message('table_json')
  });
```

## NEVER "wait for the dashboard" with a guessed selector (top login failure)

`Wait element timed out: element not found` is the #1 runtime failure. It is
almost always a `WaitElement` (or a `Wait for Dashboard`/`Wait for MFA` node) that
waits on a selector you **assumed** rather than one you **verified on that exact
page**. Two hard rules:

- **Action nodes already wait for their own target.** A `ClickElement` on
  `//a[normalize-space()='Reports']` waits for that link to exist. So after a
  login you do NOT need a separate "Wait for Dashboard" node — just make the next
  real step (click a nav link, read a value) target an element you confirmed is on
  the post-login page. A standalone wait for a *guessed* dashboard element only
  adds a 30-second timeout and a failure.
- **Only `WaitElement` on a SPECIFIC element you explored** (a spinner to
  disappear, a results table to appear) — never a vague "page is ready" guess.

## Logins can have more than one step — explore through to the goal

Every site is different. Do not assume a login is `type → type → click Sign In →
dashboard`. Submitting a login form often lands on **another step** (a
verification / 2FA / "confirm it's you" screen, a consent page, a redirect) before
the real destination. If you build `Sign In → Wait for Dashboard`, you time out,
because the page is on that in-between step, not the dashboard.

So: **explore THROUGH the whole flow** (`/exploring-browser`) — submit, snapshot
the *next* page, and keep going until you reach the goal. Build exactly the steps
you actually saw, with the selectors from your own snapshots. Whatever extra
screen appears, handle it before moving on.

If a verification step asks for a code: the code is **per-run and secret — never
hardcode it**. Take it from a flow variable / input the user provides
(`Message('otp_code')`), or from email/SMS via the relevant node. How the field
and button are identified is entirely site-specific — use what you explored.

The shape (selectors below are **examples only** — every site's are different):

```typescript
// ... Type Email → Type Password → Click 'Sign In' (each waits for its target) ...

// Whatever screen Sign In landed on, build what you explored. If it's a code
// field, the TypeText already waits for it — no separate "Wait" node:
f.node('a11111', 'Core.Browser.TypeText', 'Enter Code', {
  inPageId: Message('page_id'),
  inSelector: Custom('<xpath you explored for the code field>'),  // example
  inText: Message('otp_code')                                     // per-run, NOT hardcoded
});

f.node('a22222', 'Core.Browser.ClickElement', 'Confirm', {
  inPageId: Message('page_id'),
  inSelector: Custom('<xpath you explored for the confirm button>')
});

// Reached the destination — don't "wait" for it, just target the first real
// element you need (that action node waits for it on its own).
```

None of the selectors here are universal — `#code`, `Verify`, the on-page-code
handle are examples. Always build from what `/exploring-browser` showed on the
real verification page; the point is the SHAPE (handle the code step; don't wait
on a guessed dashboard), not these exact strings.

## Execute JavaScript

Run custom JavaScript in browser context.

**RunScript vs Function node:**

| Aspect | `Core.Browser.RunScript` | `Core.Programming.Function` |
|--------|--------------------------|----------------------------|
| Context | Browser (has `window`, `document`) | Flow sandbox (has `msg`) |
| Can read `msg.*` | Yes | Yes |
| Can modify `msg.*` | No | Yes |
| Return value | Primitive types only (string, number, boolean, plain objects) | Must return `msg` or `[msg, null, ...]` |
| Async/setTimeout | Not supported | Not supported |

**Important:** Never return DOM elements from RunScript—outputs are JSON-serialized. Return extracted data instead.

```typescript
f.node('f1a52c', 'Core.Browser.RunScript', 'Scroll to Bottom', {
  inPageId: Message('page_id'),
  func: `window.scrollTo(0, document.body.scrollHeight); return 'scrolled';`,
  outResult: Message('scroll_result')
});
```

## Extracting Data with RunScript (Data Table Format)

**NEVER use `ScrapeList` or `ScrapeTable`** - use `RunScript` to extract data in our Data Table format.

### Extract Table from Page

```typescript
f.node('c3d4e5', 'Core.Browser.RunScript', 'Extract Table', {
  inPageId: Message('page_id'),
  func: `
    var table = document.querySelector('table');
    var headers = [];
    var rows = [];

    // Get headers
    var ths = table.querySelectorAll('thead th');
    ths.forEach(function(th) {
      headers.push(th.innerText.trim().toLowerCase().replace(/ /g, '_'));
    });

    // Get rows
    var trs = table.querySelectorAll('tbody tr');
    trs.forEach(function(tr) {
      var row = {};
      var tds = tr.querySelectorAll('td');
      tds.forEach(function(td, i) {
        row[headers[i]] = td.innerText.trim();
      });
      rows.push(row);
    });

    return JSON.stringify({ columns: headers, rows: rows });
  `,
  outResult: Message('table_json')
})
  .then('d4e5f6', 'Core.Programming.Function', 'Parse Table', {
    func: `
      msg.table = JSON.parse(msg.table_json);
      return msg;
    `
  });
```

**Key points:**
- RunScript returns strings, so JSON.stringify the data
- Parse with JSON.parse in a Function node
- Use our Data Table format: `{ columns: string[], rows: object[] }`
- Row object keys MUST match column names exactly
- Use `element ? element.innerText : ''` (NOT optional chaining `?.` — ES5 only in func strings)
- **Extract CLEAN text — prefer `.innerText`/`.textContent`, which are already
  decoded.** Reading an attribute (`getAttribute('title')`) or `innerHTML` can
  carry raw HTML entities into the data (`&#39;`, `&amp;`, `&quot;`), which then
  land verbatim in the user's CSV/sheet. If you must read one of those, decode it:
  `var d = document.createElement('textarea'); d.innerHTML = s; s = d.value;` —
  the user should see `it's`, never `it&#39;s`.

## Cookie & Session Management

Robomotion has built-in cookie handling nodes:

| Node | Purpose |
|------|---------|
| `Core.Browser.GetCookies` | Get cookies from browser |
| `Core.Browser.SetCookies` | Set cookies in browser |

```typescript
// Get cookies after login
f.node('c4a9e1', 'Core.Browser.GetCookies', 'Get Auth Cookies', {
  inBrowserId: Message('browser_id'),
  outCookies: Message('auth_cookies')
});

// Restore cookies in a later session
f.node('b7d3f2', 'Core.Browser.SetCookies', 'Set Auth Cookies', {
  inBrowserId: Message('browser_id'),
  inCookies: Message('saved_cookies')
});
```

## Network Analysis for HTTP Request Flows

When building flows, consider whether browser automation is needed or if direct HTTP requests would be simpler.

**Use Browser MCP's network capture to discover APIs:**
1. Use `/exploring-browser` skill with `browser_start_network_capture`
2. Perform the action you want to automate
3. Check `browser_get_requests` for API endpoints
4. If clean REST API found, use `Core.Net.HttpRequest` instead

**When to use Browser vs HTTPRequest:**

| Scenario | Recommendation |
|----------|----------------|
| Simple REST API | `Core.Net.HttpRequest` - faster, more reliable |
| Complex JS-rendered content | Browser automation required |
| Auth with CSRF tokens | Browser (handles tokens automatically) |
| Login → then API calls | Browser for login, HTTPRequest for data |
| File downloads behind auth | Browser for auth, HTTPRequest for download |

## Proxy

For sites that block datacenter IPs, route the browser through the Robomotion proxy:

```typescript
f.node('4a9e12', 'Core.Browser.Open', 'Open Browser', {
  optBrowser: 'chrome',
  optProxy: 'robomotion-proxy',
  outBrowserId: Message('browser_id')
});
```

Default (`no-proxy`) is used for normal API calls.

## Related Documentation

- `loops.md` — ForEach loop wiring for scraping multiple URLs
- `captcha.md` — solve captchas during browser automation
- `credentials.md` — browser login via `Core.Vault.GetItem`
- `skills/reversing-network` — switch to HTTP after capturing the underlying API
