# Credential Categories — Field Layouts

Vault items have a category, which determines the field structure that `Core.Vault.GetItem` returns in `msg.credentials`. Use this reference when building flows that read individual credential fields.

| Category | Type | Used By |
|----------|------|---------|
| 1 | LoginItem | FTP, web logins, browser automation |
| 2 | EmailItem | `Core.Mail.*` (IMAP/POP3 inbox + SMTP outbox) |
| 3 | CreditCard | Payment flows (not commonly used in flows) |
| 4 | APIKeyToken | Gemini, OpenAI, HTTP auth headers |
| 5 | DatabaseItem | MySQL, Postgres, MSSQL, Oracle (SQLite needs none) |
| 6 | DocumentItem | Certificates, signed files |
| 7 | AESKeyItem | AES symmetric keys |
| 8 | RSAKeyPairItem | RSA key pairs |

## Category 1: LoginItem

Username/password authentication.

| Field | Type | Description | Redaction |
|-------|------|-------------|-----------|
| `username` | string | Username or email | — |
| `password` | string | Password | REDACTED |

```typescript
// Nodes with a login credential property (e.g. Core.FTP.Connect):
optCredentials: Credential({ vaultId: '...', itemId: '...' })

// Browser automation — use Core.Vault.GetItem first:
.then('a1d24c', 'Core.Vault.GetItem', 'Get Credentials', {
  optCredentials: Credential(LOGIN_CREDENTIALS),
  outItem: Message('credentials')
})
// Then: Message('credentials.username'), Message('credentials.password')
```

## Category 2: EmailItem

IMAP/POP3 inbox + SMTP outbox.

| Field | Type | Description | Redaction |
|-------|------|-------------|-----------|
| `inbox.type` | string | `imap` or `pop3` | — |
| `inbox.server` | string | Inbox hostname | — |
| `inbox.port` | number | 993, 995, ... | — |
| `inbox.username` | string | Inbox user | — |
| `inbox.password` | string | Inbox password | REDACTED |
| `smtp.server` | string | SMTP hostname | — |
| `smtp.port` | number | 587, 465, ... | — |
| `smtp.username` | string | SMTP user | — |
| `smtp.password` | string | SMTP password | REDACTED |

## Category 4: APIKeyToken

API authentication (Gemini, OpenAI, HTTP).

| Field | Type | Description | Redaction |
|-------|------|-------------|-----------|
| `value` | string | API key or token | MASKED_MID |

```typescript
// The node reads the 'value' field itself from its API-key property
f.node('b2e35d', 'Robomotion.GoogleGemini.Content.GenerateText', 'Generate', {
  optApiKey: Credential({ vaultId: '...', itemId: '...' }),
  inText: Custom('Write a blog post'),
});
```

## Category 5: DatabaseItem

Database connections (MySQL, Postgres, MSSQL, Oracle).

| Field | Type | Description | Redaction |
|-------|------|-------------|-----------|
| `type` | string | `mysql`, `postgres`, `mssql`, `oracle` | — |
| `server` | string | Hostname / IP | MASKED_IP |
| `port` | number | DB port | — |
| `database` | string | DB name | MASKED_END |
| `username` | string | DB user | MASKED_END |
| `password` | string | DB password | REDACTED |
| `sid` | string | Oracle SID (Oracle only) | — |

## Log Redaction

The runtime redacts sensitive values automatically:

| Strategy | Display | Used For |
|----------|---------|----------|
| RT_REDACT | `********` | Passwords, API keys |
| RT_MASK_MID | `4532****9012` | Credit cards |
| RT_MASK_EMAIL | `u***@domain.com` | Emails |
| RT_HASH | `hash:a3f8bc7d` | Verification |
