# Integration Mode

Write one test file that runs against mocks by default and real services when `INTEGRATION=1` is set.

## Environment Detection

```typescript
import {
  isIntegrationMode,
  hasCredentials,
  getCredentials,
  shouldSkipSlowTests,
} from '@robomotion/sdk/testing';

if (isIntegrationMode()) {
  // run against real services
} else {
  // use mocks
}

if (hasCredentials('wordpress')) {
  const creds = getCredentials('wordpress');
  // { WORDPRESS_URL, WORDPRESS_USER, WORDPRESS_PASS }
}

if (shouldSkipSlowTests()) { /* SKIP_SLOW=1 */ }
```

## Skip Helpers

```typescript
import { skipWithoutCredentials, skipWithoutIntegration, shouldSkip } from '@robomotion/sdk/testing';

const skipA = skipWithoutCredentials('gemini');
if (shouldSkip(skipA)) {
  console.log('Skipped:', skipA.reason);
  return;
}

const skipB = skipWithoutIntegration();
if (shouldSkip(skipB)) return;
```

## Test Helper

```typescript
import { createTestHelper } from '@robomotion/sdk/testing';

const helper = createTestHelper('wordpress');
if (helper.skipReason()) return;

await helper.runIfIntegration(async () => {
  await realWordPressApi.createPost({ title: 'Test' });
});
```

## Running Integration Tests

```bash
bun test                           # unit only (default)
INTEGRATION=1 bun test             # run integration tests
SKIP_SLOW=1 bun test               # skip slow tests

WORDPRESS_URL=https://mysite.com \
WORDPRESS_USER=admin \
WORDPRESS_PASS=secret \
INTEGRATION=1 \
bun test
```

## Supported Credential Types

| Type | Environment Variables |
|------|-----------------------|
| `wordpress` | WORDPRESS_URL, WORDPRESS_USER, WORDPRESS_PASS |
| `gemini` | GEMINI_API_KEY |
| `openai` | OPENAI_API_KEY |
| `sqlite` | SQLITE_DB_PATH |
| `mysql` | MYSQL_HOST, MYSQL_USER, MYSQL_PASS, MYSQL_DB |
| `postgres` | POSTGRES_HOST, POSTGRES_USER, POSTGRES_PASS, POSTGRES_DB |
| `redis` | REDIS_URL |
| `slack` | SLACK_TOKEN |
| `github` | GITHUB_TOKEN |
| `aws` | AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION |
