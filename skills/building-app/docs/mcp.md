# `mcp.json` - the app as an MCP server, and the assistant in its corner

Every Robomotion App is also an MCP server. Its `app.json` actions are its tools, served
by the app's own robot at `https://mcp.robomotion.io/<b58>`, and every app gets a chat
widget bottom-right that drives those same tools. Neither needs anything from you to
exist. `mcp.json` is how you make them *good*: it is the presentation layer over the
contract, the part an agent reads before it touches a tool.

## Shape

```jsonc
{
  "schema": "robomotion/mcp/v1",
  "name": "Leave Desk",
  "description": "Leave requests for a small team: submit, review, approve.",
  "instructions": "You help team members and their manager with leave. Members submit and check requests; the manager reviews and decides. Dates are inclusive. Never approve on a member's behalf: only decide when the person asking is the manager.",
  "tools": {
    "submit_request": {
      "description": "Submit a leave request for the person asking. Ask for the dates if they are not given; the reason is optional.",
      "idempotent": false
    },
    "decide_request": {
      "description": "Approve or deny one pending request. Confirm the decision in one line before doing it.",
      "destructive": true
    },
    "list_requests": { "read_only": true },
    "purge_archive": { "enabled": false }
  },
  "assistant": {
    "enabled": true,
    "public": false,
    "greeting": "Hi! I can submit a leave request, check where one is, or, if you are the manager, decide one."
  }
}
```

## Rules

- **The first line is `"schema": "robomotion/mcp/v1"`.** It names the format; leave it out and
  the file still loads as v1, write anything else and the whole file is ignored.
- **Presentation only.** No params, no result schemas, no types. `app.json` owns the contract
  and typegen; `mcp.json` changes nothing on the wire and nothing in the contract hash.
  A tool named here that `app.json` does not declare is ignored.
- **`instructions` is the soul.** One paragraph: what the app is for, who uses it, the
  house rules an agent must keep (what needs confirmation, what it must never do). Write
  it as if briefing a new colleague.
- **One sentence per tool**, about *when* to use it and what to ask for first. The
  `app.json` description says what the action does for the UI; this one says how an agent
  should reach for it.
- **Hints are honest.** `read_only` for pure reads, `destructive` for anything that
  cannot be undone (deleting, sending, paying, deciding), `idempotent` when calling twice
  is harmless. Clients confirm destructive calls and may retry idempotent ones.
- **`enabled: false`** keeps an action off both the MCP server and the assistant. Use it
  for admin or bulk actions a person should click deliberately.
- **`assistant.public`** is off by default. Anonymous visitors of a public app get the
  assistant only if you turn it on, because every message runs the app's actions and
  costs the owner model credits.
- **Never name a real company, person or credential** in any of it. The file ships with
  the app.

## When to write it

In the same pass as `app.json`, right after it. Update it whenever an action changes
meaning. It is small; keep it that way.
