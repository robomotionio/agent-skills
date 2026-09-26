# Credentials in Builder Pattern SDK

Secure credential management for Robomotion automation flows.

**Related:** `browser.md` (login form filling) · `captcha.md` (credential-guarded sites) · `reference/credential-categories.md` (field layouts by category).

## Core Principle

**NEVER pass credentials directly in flow code.** Flows reference credentials by `vaultId` and `itemId`. The robot fetches actual secrets at runtime from encrypted vault storage.

```typescript
// WRONG — hardcoded secret
f.node('3a7c92', 'Robomotion.GoogleGemini.Content.GenerateText', 'Generate', {
  optApiKey: Custom('AIza-1234567890'),
  inText: Custom('Write a blog post')
});

// CORRECT — vault reference
f.node('3a7c92', 'Robomotion.GoogleGemini.Content.GenerateText', 'Generate', {
  optApiKey: Credential({ vaultId: 'vault-uuid', itemId: 'item-uuid' }),
  inText: Custom('Write a blog post')
});
```

## Which property takes the credential

There is no single name. Each node names its own: `optCredentials` (`Core.Vault.GetItem`, `Core.Mail.Connect`, `Core.FTP.Connect`, `Core.Net.HttpRequest`, `Robomotion.PostgreSQL.Connect`), `optApiKey` (`Robomotion.GoogleGemini.*`, `Robomotion.OpenAI.Connect`, `Robomotion.HermesAgent.Agent.HermesAgent`), `optToken` (`Robomotion.Slack.Connect`), `optKey` (`Robomotion.Airtable.Connect`), and so on. Look it up with `robomotion describe node <Type>`: a credential property is the one whose default is a vault reference,

```json
"optApiKey": { "scope": "Custom", "name": { "vaultId": "_", "itemId": "_" } }
```

A node can have more than one (`Core.FTP.Connect` has `optCredentials` and `optPassphrase`). Some nodes take no credential at all: `Robomotion.SQLite.*` opens a file through `optConnectionString`.

Many AI nodes can also run on Robomotion AI credits instead of a key: `optUseRobomotionCredits: true`, and leave the key property out.

## Never ask for the secret itself

You do not collect passwords. Ever. Not in chat, not with `AskUserQuestion`,
not "just this once so I can store it securely".

Asked to build an app that signs in to a bank, the assistant asked

    Bank password
    Enter the password for jane.doe@example.com

as an ordinary text question. That renders a plain box in the chat: the
password was on screen as it was typed, in the transcript for the rest of the
session, and in the on-disk conversation. The person had done nothing wrong -
they were answering the question they were asked.

What to do instead, in order:

1. **`AskUserQuestion` with `type: "vault_picker"`.** The person picks an item
   they already hold; you receive `{vault_id, item_id}` and nothing else. This
   is the whole answer when the credential exists.
2. **If they have no item yet, ask them to create one** and say where: Vault
   in their workspace, the category that matches the site (see
   `reference/credential-categories.md`). Then use the picker. A sentence like
   "add it in Vault and I'll pick it up from there" costs one turn and is the
   only safe path.
3. **Build everything else meanwhile.** A missing credential does not block
   the screens, the flow shape, or the preview - wire `Credential({vaultId,
   itemId})` once you have the pick.

The username is not a secret and can be asked for normally. The password, PIN,
API key, token, one-time code and card number are, and the rule is the same
for all of them.

**If they offer it anyway, still say no.** Asked to "just ask me for the bank
password here in the chat, I will paste it", the assistant answered "Okay -
please paste your bank password for <user>, and I'll store it in your vault".
Agreeing is not politeness. Their password would go through the ordinary
message box into the transcript, the saved conversation, and the log - and
unlike a masked question box, nothing downstream can soften that. The reply is
one sentence and then the route:

> I can't take a password in chat - it would be saved in this conversation.
> Add it in Vault and I'll read it straight from there.

Then carry on building. There is nothing to negotiate here, and no phrasing of
the request that makes chat a safe place to put a secret.

The Designer masks a question that *looks* like it is asking for a secret and
keeps the answer out of the transcript, but that is a net, not a licence: it
cannot un-send what it forwards, and the value still reaches the agent.

## When NOT to use

- **Literal URL / config value** — use `Custom('https://example.com')`, not `Credential()`. `Credential()` is ONLY for a credential property (see above).
- **Non-secret test strings** — keep them in `Custom()` or a Function-node constant.
- **You've already called `Core.Vault.GetItem`** — read individual fields from `msg.credentials.*` via `Message()`, not a second `Credential()` call.
- **An OPTIONAL credential property you don't need** — omit it entirely. See "Optional vs required credential properties" below.

## Optional vs required credential properties

Not every credential property is mandatory. Some nodes take credentials only for an *optional* capability — e.g. `Core.Excel.Open`'s `optCredentials` exists solely to open **password-protected** files, and a Gemini node needs no `optApiKey` when it gets `inConnectionId` from a `Connect` node or runs on credits. When you don't need it, **leave the property out completely**.

Do NOT write a credential property with placeholder/empty vault values (`{ vaultId: '_', itemId: '_' }` or blank strings). It builds to exactly what leaving it out does (the build fills every unset credential property with that placeholder), so it adds nothing, and it reads as if the node needed a credential it does not. `robomotion validate` passes either way, so it will not tell you a *needed* credential is missing either: a node that does need one then fails at run time (`Core.Vault.GetItem` says "Vault has to be selected").

```typescript
// WRONG — placeholder credentials on an unprotected file
f.node('b83f17', 'Core.Excel.Open', 'Open Excel', {
  inPath: Custom('/data/report.xlsx'),
  optCredentials: Credential({ vaultId: '_', itemId: '_' }),   // remove this
  outFileDescriptor: Message('excel_fd')
});

// CORRECT — no password needed: omit optCredentials entirely
f.node('b83f17', 'Core.Excel.Open', 'Open Excel', {
  inPath: Custom('/data/report.xlsx'),
  outFileDescriptor: Message('excel_fd')
});

// CORRECT — password-protected file: real vault reference
f.node('b83f17', 'Core.Excel.Open', 'Open Excel', {
  inPath: Custom('/data/secret.xlsx'),
  optCredentials: Credential({ vaultId: 'vault-uuid', itemId: 'item-uuid' }),
  outFileDescriptor: Message('excel_fd')
});
```

Rule of thumb: only set a credential property when you have a **real** `vaultId`/`itemId` to put in it. If you don't, drop the property. (The exception is `Core.Vault.GetItem`, where `optCredentials` is the node's whole purpose and is always required — see Pattern 3.)

## The Four Patterns

Pick one per node. See the summary table at the end for which to use when.

### Pattern 1: `Credential()` helper (always correct)

Use the helper for any credential property (`optCredentials`, `optApiKey`, `optToken`, …). It wraps `{vaultId, itemId}` into the scope object the runtime expects: `{ scope: 'Custom', name: { vaultId, itemId } }`.

```typescript
import { flow, Message, Custom, JS, Global, Flow, Credential, AI } from '@robomotion/sdk';

flow.create('<flow-id>', 'Secure Flow', (f) => {
  f.node('5c2d91', 'Core.Mail.Connect', 'Connect to Email', {
    optCredentials: Credential({
      vaultId: 'e6343c49-e40f-4c18-8e8a-5cd4077b747e',
      itemId:  '7adabf50-07ea-4042-a914-400b391ac478'
    }),
    outClientId: Message('mail_client_id')
  });
});
```

**Use only on credential properties. NEVER on `inText`/`inSelector`/etc.** `robomotion validate` does not stop you, but the node then gets a vault reference where it expects text.

### Pattern 2: Plain object (auto-wrapped)

The SDK wraps a plain `{vaultId, itemId}` object written inline on a credential property the same way `Credential()` does. A shortcut for one-off references.

```typescript
f.node('6d3e82', 'Robomotion.GoogleGemini.Connect', 'Connect To Gemini', {
  optApiKey: {
    vaultId: 'e6343c49-e40f-4c18-8e8a-5cd4077b747e',
    itemId:  '7adabf50-07ea-4042-a914-400b391ac478'
  },
  outConnectionId: Message('gemini_conn')
});
```

**Write the object inline.** A bare const (`optApiKey: GEMINI_KEY`) fails `robomotion build`: the Designer cannot read it. For a shared const, use `Credential(GEMINI_KEY)`.

### Pattern 3: `Core.Vault.GetItem` (for individual fields)

Use when a node has no credential property and you need raw fields (e.g. typing a username into a browser form).

**`optCredentials` is REQUIRED.** Omitting it fails at runtime with "Vault has to be selected".

```typescript
import { flow, Message, Custom, JS, Global, Flow, Credential, AI } from '@robomotion/sdk';

const LOGIN_CREDENTIALS = { vaultId: 'vault-uuid', itemId: 'item-uuid' };

flow.create('<flow-id>', 'Login Flow', (f) => {
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
  func: `
msg.gemini_key = { vaultId: 'vault_123', itemId: 'item_456' };
return msg;
`
})
  .then('cd9e28', 'Robomotion.GoogleGemini.Content.GenerateText', 'Generate', {
    optApiKey: Message('gemini_key'),
    inText:    Custom('Write a blog post'),
    outText:   Message('generated_text')
  });
```

## Credential Constants Pattern

For several nodes sharing a credential, define constants at the top of the file and wrap them in `Credential()` where they are used. When a package has a `Connect` node, one `Connect` with the key and `inConnectionId` on the rest is simpler still:

```typescript
import { flow, Message, Custom, JS, Global, Flow, Credential, AI } from '@robomotion/sdk';

const GEMINI_KEY      = { vaultId: 'vault-abc123', itemId: 'item-xyz789' };
const FTP_CREDENTIALS = { vaultId: 'vault-def456', itemId: 'item-uvw012' };

flow.create('<flow-id>', 'Blog Generator', (f) => {
  f.addDependency('Robomotion.GoogleGemini', '0.16.3');

  f.node('a4c1e7', 'Core.Trigger.Inject', 'Start', {})
    .then('b1f05d', 'Robomotion.GoogleGemini.Connect', 'Connect To Gemini', {
      optApiKey: Credential(GEMINI_KEY),
      outConnectionId: Message('gemini_conn')
    })
    .then('deaf19', 'Robomotion.GoogleGemini.Content.GenerateText', 'Generate Content', {
      inConnectionId: Message('gemini_conn'),
      inText:  Custom('Write about automation'),
      outText: Message('content')
    })
    .then('efb02a', 'Robomotion.GoogleGemini.Images.GenerateImage', 'Generate Cover', {
      inConnectionId: Message('gemini_conn'),
      inPrompt: Custom('Cover image for automation blog'),
      outImage: Message('cover_path')
    })
    .then('f0c13b', 'Core.FTP.Connect', 'Connect To The Site', {
      inHost: Custom('ftp.example.com'),
      inPort: Custom('21'),
      optCredentials: Credential(FTP_CREDENTIALS),
      outSessionId: Message('ftp_session')
    })
    .then('c93a28', 'Core.Flow.Stop', 'Stop', {});
}).start();
```

## Discovering Credentials

```bash
robomotion get vaults                          # list vaults
robomotion get vault-items <vault-id>          # list items in a vault
```

## Common Nodes Requiring Credentials

| Node Type | Credential Property | Category |
|-----------|---------------------|----------|
| `Robomotion.GoogleGemini.*` (incl. `Connect`) | `optApiKey` | 4 (APIKeyToken) — optional with `inConnectionId` or credits |
| `Robomotion.OpenAI.Connect` | `optApiKey` | 4 (APIKeyToken) |
| `Robomotion.Slack.Connect` | `optToken` | 4 (APIKeyToken) |
| `Core.FTP.Connect` | `optCredentials` | 1 (LoginItem) |
| `Core.Mail.Connect` | `optCredentials` | 2 (EmailItem) |
| `Robomotion.PostgreSQL.Connect` / `Robomotion.MySQL.Connect` | `optCredentials` | 5 (DatabaseItem) |
| `Core.Vault.GetItem` | `optCredentials` | Any — use `Credential()` wrapper |
| `Core.Excel.Open` | `optCredentials` | 4 — **OPTIONAL**, only for password-protected files; omit otherwise |

`Robomotion.SQLite.*` has no credential property: it opens a file named in `optConnectionString`.

## Common Mistakes

| Mistake | Consequence | Fix |
|---------|-------------|-----|
| `Core.Vault.GetItem` without `optCredentials` | "Vault has to be selected" | Add `optCredentials: Credential({...})` |
| Setting an OPTIONAL credential property (e.g. `Core.Excel.Open`'s `optCredentials`) with `_`/blank placeholders | Same as leaving it out, but misleading | Omit the property unless it is needed |
| `Credential()` on non-credential property (e.g. `inText`) | Validate passes; the node gets a vault reference instead of text | Use `Core.Vault.GetItem` first, then `Message('creds.field')` |
| A bare const on a credential property (`optApiKey: GEMINI_KEY`) | `robomotion build` refuses: the Designer cannot read it | `Credential(GEMINI_KEY)`, or the object inline |
| Hardcoding API keys in `Custom()` | Secret exposed in code | Use `Credential()` with vault reference |
| `Custom()` wrapping credential object | Runtime panic | Use `Credential()` or an inline plain object |
| `Message('creds.fields.username')` | "does not exist" | No `.fields.` — use `Message('creds.username')` |

## What's Safe to Commit

**Safe (UUIDs only):** vault IDs, item IDs, flow code with vault references.
**Never:** real passwords, API keys, tokens, private keys.

## Quick Reference: Which Pattern to Use

| Scenario | Pattern |
|----------|---------|
| Node has a credential property (`describe node` shows a vault default) | Pattern 1 or 2 (Credential helper or inline plain object) |
| Browser form filling | Pattern 3 (`Core.Vault.GetItem` + `Message('creds.field')`) |
| HTTP with auth headers | Pattern 3 (`GetItem` + Function builds the header) |
| Credential chosen at runtime | Pattern 4 (`Message()` reference) |

For field layouts by credential category, see `reference/credential-categories.md`.
