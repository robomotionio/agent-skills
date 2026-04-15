# Browser Automation

Reference for `Core.Browser.*` nodes and common patterns.

**Related:** `reversing-network` skill (replace browser with HTTP once you've captured the underlying API). For captcha solving, browser-side credentials, and ForEach loops around browser actions, see the `creating-flow` skill's pattern docs.

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

## Browser Options

```typescript
f.node('4a9e12', 'Core.Browser.Open', 'Open Browser', {
  optBrowser: Custom('chrome'),        // chrome, headlesschrome, firefox, edge
  optProxy: Custom('robomotion-proxy'), // for protected sites
  optMaximized: true,
  outBrowserId: Message('browser_id')
});
```

| `optBrowser` | Description |
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
  optTimeout: Custom('10')
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
  optProxy: Custom('robomotion-proxy'),
  outBrowserId: Message('browser_id')
});
```

Default (`no-proxy`) is used for normal API calls.

## Related Documentation

- `creating-flow` skill → `docs/patterns/loops.md` — ForEach loop wiring for scraping multiple URLs
- `creating-flow` skill → `docs/patterns/captcha.md` — solve captchas during browser automation
- `creating-flow` skill → `docs/patterns/credentials.md` — browser login via `Core.Vault.GetItem`
- `reversing-network` skill — switch to HTTP after capturing the underlying API
