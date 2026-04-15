# Credentials in Builder Pattern SDK

Secure credential management for Robomotion automation flows.

**Related:** `browser.md` (login form filling) · `captcha.md` (credential-guarded sites) · `reference/credential-categories.md` (field layouts by category).

## Core Principle

**NEVER pass credentials directly in flow code.** Flows reference credentials by `vaultId` and `itemId`. The robot fetches actual secrets at runtime from encrypted vault storage.

```typescript
// WRONG — hardcoded secret
f.node('3a7c92', 'Robomotion.GoogleGemini.GenerateText', 'Generate', {
  inApiKey: Custom('sk-1234567890'),
  inPrompt: Custom('Write a blog post')
});

// CORRECT — vault reference
f.node('3a7c92', 'Robomotion.GoogleGemini.GenerateText', 'Generate', {
  inCredentials: Credential({ vaultId: 'vault-uuid', itemId: 'item-uuid' }),
  inPrompt: Custom('Write a blog post')
});
```

## When NOT to use

- **Literal URL / config value** — use `Custom('https://example.com')`, not `Credential()`. `Credential()` is ONLY for `inCredentials` / `optCredentials`.
- **Non-secret test strings** — keep them in `Custom()` or a Function-node constant.
- **You've already called `Core.Vault.GetItem`** — read individual fields from `msg.credentials.*` via `Message()`, not a second `Credential()` call.

## The Four Patterns

Pick one per node. See the summary table at the end for which to use when.

### Pattern 1: `Credential()` helper (always correct)

Use the helper for any credential property (`inCredentials`, `optCredentials`). It wraps `{vaultId, itemId}` into the scope object the runtime expects.

```typescript
import { flow, Credential, Custom, Message } from '@robomotion/sdk';

flow.create('main', 'Secure Flow', (f) => {
  f.node('5c2d91', 'Core.Mail.Connect', 'Connect to Email', {
    optCredentials: Credential({
      vaultId: 'e6343c49-e40f-4c18-8e8a-5cd4077b747e',
      itemId:  '7adabf50-07ea-4042-a914-400b391ac478'
    }),
    outClientId: Message('mail_client_id')
  });
});
```

**Use only on credential properties (`inCredentials`, `optCredentials`). NEVER on `inText`/`inSelector`/etc. — validation will reject it.**

### Pattern 2: Plain object for `inCredentials` (auto-wrapped)

On `inCredentials` specifically, the SDK auto-wraps a plain `{vaultId, itemId}` object. This is a shortcut for one-off references.

```typescript
f.node('6d3e82', 'Robomotion.WordPress.CreatePost', 'Create Post', {
  inCredentials: {
    vaultId: 'e6343c49-e40f-4c18-8e8a-5cd4077b747e',
    itemId:  '7adabf50-07ea-4042-a914-400b391ac478'
  },
  inTitle:   Message('title'),
  inContent: Message('content')
});
```

**Only works on `inCredentials`.** On `optCredentials` (e.g. `Core.Vault.GetItem`) you MUST use `Credential()`.

### Pattern 3: `Core.Vault.GetItem` (for individual fields)

Use when a node doesn't have `inCredentials` and you need raw fields (e.g. typing a username into a browser form).

**`optCredentials` is REQUIRED.** Omitting it fails at runtime with "Vault has to be selected".

```typescript
import { flow, Custom, Message, Credential } from '@robomotion/sdk';

const LOGIN_CREDENTIALS = { vaultId: 'vault-uuid', itemId: 'item-uuid' };

flow.create('main', 'Login Flow', (f) => {
  f.node('7e4f73', 'Core.Trigger.Inject', 'Start', {})
    .then('8f5a64', 'Core.Vault.GetItem', 'Get Credentials', {
      optCredentials: Credential(LOGIN_CREDENTIALS),
      outItem: Message('credentials')
    })
    .then('9a6b55', 'Core.Browser.SetValue', 'Enter Username', {
      inPageId:  Message('page_id'),
      inSelector: Custom('#username'),
      inValue:    Message('credentials.username')
    })
    .then('ab7c46', 'Core.Browser.SetValue', 'Enter Password', {
      inPageId:  Message('page_id'),
      inSelector: Custom('#password'),
      inValue:    Message('credentials.password')
    });
});
```

The shape of `msg.credentials` depends on the vault item category (LoginItem, APIKeyToken, DatabaseItem, …). See `reference/credential-categories.md`.

### Pattern 4: Message reference for dynamic credentials

Store `{vaultId, itemId}` in `msg` from a setup Function, then reference it via `Message()`. Useful when the credential to use is decided at runtime.

```typescript
f.node('bc8d37', 'Core.Programming.Function', 'Pick Credentials', {
  func: `msg.gemini_creds = { vaultId: 'vault_123', itemId: 'item_456' }; return msg;`
})
  .then('cd9e28', 'Robomotion.GoogleGemini.GenerateText', 'Generate', {
    inCredentials: Message('gemini_creds'),
    inPrompt: Custom('Write a blog post'),
    outText:  Message('generated_text')
  });
```

## Credential Constants Pattern

For multiple nodes sharing a credential, define constants at the top of the file:

```typescript
import { flow, Credential, Custom, Message } from '@robomotion/sdk';

const GEMINI_CREDENTIALS    = { vaultId: 'vault-abc123', itemId: 'item-xyz789' };
const WORDPRESS_CREDENTIALS = { vaultId: 'vault-def456', itemId: 'item-uvw012' };

flow.create('main', 'Blog Generator', (f) => {
  f.node('deaf19', 'Robomotion.GoogleGemini.GenerateText', 'Generate Content', {
    inCredentials: Credential(GEMINI_CREDENTIALS),
    inPrompt: Custom('Write about automation'),
    outText:  Message('content')
  });

  f.node('efb02a', 'Robomotion.GoogleGemini.GenerateImage', 'Generate Cover', {
    inCredentials: Credential(GEMINI_CREDENTIALS),
    inPrompt: Custom('Cover image for automation blog'),
    outImageUrl: Message('coverUrl')
  });

  f.node('f0c13b', 'Robomotion.WordPress.CreatePost', 'Publish', {
    inCredentials: Credential(WORDPRESS_CREDENTIALS),
    inTitle:   Message('title'),
    inContent: Message('content')
  });
});
```

## Discovering Credentials

```bash
robomotion get vaults                          # list vaults
robomotion get vault-items <vault-id>          # list items in a vault
```

## Common Nodes Requiring Credentials

| Node Type | Credential Property | Category |
|-----------|---------------------|----------|
| `Robomotion.GoogleGemini.*` | `inCredentials` | 4 (APIKeyToken) |
| `Robomotion.WordPress.*` | `inCredentials` | 1 (LoginItem) |
| `Core.Mail.Connect` | `optCredentials` | 2 (EmailItem) |
| `Robomotion.SQLite.Connect` | `inCredentials` | 5 (DatabaseItem) |
| `Core.Vault.GetItem` | `optCredentials` | Any — use `Credential()` wrapper |

## Common Mistakes

| Mistake | Consequence | Fix |
|---------|-------------|-----|
| `Core.Vault.GetItem` without `optCredentials` | "Vault has to be selected" | Add `optCredentials: Credential({...})` |
| `Credential()` on non-credential property (e.g. `inText`) | "Config parse error" | Use `Core.Vault.GetItem` first, then `Message('creds.field')` |
| Hardcoding API keys in `Custom()` | Secret exposed in code | Use `Credential()` with vault reference |
| `Custom()` wrapping credential object | Runtime panic | Use `Credential()` or plain object on `inCredentials` |
| Mixing `inCredentials` with `inUsername`/`inPassword` | Conflict | Pick one pattern |
| `Message('creds.fields.username')` | "does not exist" | No `.fields.` — use `Message('creds.username')` |

## What's Safe to Commit

**Safe (UUIDs only):** vault IDs, item IDs, flow code with vault references.
**Never:** real passwords, API keys, tokens, private keys.

## Quick Reference: Which Pattern to Use

| Scenario | Pattern |
|----------|---------|
| Node has `inCredentials` property | Pattern 1 or 2 (Credential helper or plain object) |
| Browser form filling | Pattern 3 (`Core.Vault.GetItem` + `Message('creds.field')`) |
| HTTP with auth headers | Pattern 3 (`GetItem` + Function builds the header) |
| Credential chosen at runtime | Pattern 4 (`Message()` reference) |

For field layouts by credential category, see `reference/credential-categories.md`.
