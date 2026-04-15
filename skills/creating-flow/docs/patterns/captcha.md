# Captcha Solving

Two packages available for solving captchas during browser automation.

**Related:** `browser.md` · `credentials.md` · `skills/reversing-network` (an exposed API usually bypasses the captcha entirely — try capture-and-replay FIRST).

## When NOT to use

- **API endpoint exists** — network reversal bypasses the captcha entirely. Captcha-solving services cost money and fail ~5-10% of the time. See `skills/reversing-network`.
- **Logged-in session is reusable** — solve once, export the session (`browser_export_session`), and reuse cookies for future runs.
- **You're paying per-solve on unattended retries** — add a Catch with a retry ceiling before hitting the solver again.

## AntiCaptcha (`Robomotion.AntiCaptcha.*`)

Direct credential-based approach. Each node takes `optToken` credential directly.

### Nodes

| Node | Purpose | Key Properties |
|------|---------|----------------|
| `Image` | Solve image captcha | `inImagePath` (file path), `outResult` (text) |
| `ReCaptcha` | Solve reCAPTCHA v2 | `inWebsiteURL`, `inWebsiteKey`, `outResult` (token) |
| `HCaptcha` | Solve hCaptcha | `inWebsiteURL`, `inWebsiteKey`, `outResult` (token) |

### Example: Solve reCAPTCHA v2

```typescript
const ANTICAPTCHA_CREDS = { vaultId: '...', itemId: '...' };
f.addDependency('Robomotion.AntiCaptcha', 'v0.3.0'); // MANDATORY for non-Core packages

f.node('42ec21', 'Robomotion.AntiCaptcha.ReCaptcha', 'Solve reCAPTCHA', {
  optToken: Credential(ANTICAPTCHA_CREDS),
  inWebsiteURL: Custom('https://example.com/login'),
  inWebsiteKey: Custom('6Le-wvkSAAAAAPBMRTvw0Q4M...'),  // from data-sitekey
  outResult: Message('captcha_token')
});
```

## CapMonster (`Robomotion.CapMonster.*`)

Session-based approach. Create session first, then solve captchas.

### Nodes

| Node | Purpose | Key Properties |
|------|---------|----------------|
| `CreateSession` | Initialize with API key | `optAPIKey`, `outSession` |
| `SolveCaptcha` | Solve image captcha | `inSession`, `inCaptcha` (base64), `outText` |
| `SolveRecaptchaV2` | Solve reCAPTCHA v2 | `inSession`, `inWebsiteURL`, `inWebsiteKey`, `outToken` |
| `SolveRecaptchaV3` | Solve reCAPTCHA v3 | `inSession`, `inWebsiteURL`, `inWebsiteKey`, `optPageAction`, `optMinScore`, `outToken` |
| `SolveHCaptcha` | Solve hCaptcha | `inSession`, `inWebsiteURL`, `inWebsiteKey`, `outToken` |

### Example: Solve reCAPTCHA v3

```typescript
const CAPMONSTER_CREDS = { vaultId: '...', itemId: '...' };
f.addDependency('Robomotion.CapMonster', 'v0.5.2'); // MANDATORY for non-Core packages

f.node('7dbafc', 'Robomotion.CapMonster.CreateSession', 'Create Session', {
  optAPIKey: Credential(CAPMONSTER_CREDS),
  outSession: Message('cm_session')
})
  .then('a06926', 'Robomotion.CapMonster.SolveRecaptchaV3', 'Solve v3', {
    inSession: Message('cm_session'),
    inWebsiteURL: Custom('https://example.com/submit'),
    inWebsiteKey: Custom('6Le-wvkSAAAAAPBMRTvw0Q4M...'),
    optPageAction: Custom('submit'),
    optMinScore: Custom('0.7'),
    outToken: Message('captcha_token')
  });
```

## Injecting Tokens

After solving, inject the token into the page and trigger submission.

### reCAPTCHA Token Injection

```typescript
// After solving captcha, inject token into form
f.node('c8f4e2', 'Core.Browser.RunScript', 'Inject Token', {
  inPageId: Message('page_id'),
  func: `
    // Set the response textarea
    document.getElementById('g-recaptcha-response').value = msg.captcha_token;
    // Trigger callback if exists
    if (typeof ___grecaptcha_cfg !== 'undefined') {
      Object.keys(___grecaptcha_cfg.clients).forEach(key => {
        const client = ___grecaptcha_cfg.clients[key];
        if (client.callback) client.callback(msg.captcha_token);
      });
    }
    return 'injected';
  `
});
```

### Alternative: SetValue for Hidden Field

```typescript
f.node('3b91d5', 'Core.Browser.SetValue', 'Set Token', {
  inPageId: Message('page_id'),
  inSelector: Custom('#g-recaptcha-response'),
  inValue: Message('captcha_token')
})
  .then('e7a0c8', 'Core.Browser.ClickElement', 'Submit Form', {
    inPageId: Message('page_id'),
    inSelector: Custom('//button[@type="submit"]')
  });
```

## Finding Website Key

The `data-sitekey` attribute is on the captcha div:

```html
<div class="g-recaptcha" data-sitekey="6Le-wvkSAAAAAPBMRTvw0Q4M..."></div>
```

Extract with `Core.Browser.RunScript`:

```typescript
f.node('f52d1a', 'Core.Browser.RunScript', 'Get Site Key', {
  inPageId: Message('page_id'),
  func: `
    const el = document.querySelector('[data-sitekey]');
    return el ? el.getAttribute('data-sitekey') : null;
  `,
  outResult: Message('site_key')
});
```
