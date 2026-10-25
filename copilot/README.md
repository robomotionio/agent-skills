# Robomotion in Microsoft 365 Copilot: the wording

`copilot.json` is what Copilot reads from Robomotion. The Copilot server
(webhooks-service) reads this file from `main` every five minutes, so a change
here reaches Copilot without a deploy. If the file is missing or broken, the
server keeps the wording it was built with.

| Field | What it is | When Copilot sees a change |
|---|---|---|
| `server_instructions` | What the server tells Copilot's model about Robomotion | New chats, within minutes |
| `tools.<name>.title`, `.description` | Each tool's wording | New chats, within minutes; Copilot keeps an older copy of the tools for a while |
| `agent.instructions`, `agent.version` | The agent's own instructions, inside the app package | Only after an admin downloads the app (Admin, Integrations, Microsoft 365 Copilot) and uploads it (Microsoft 365 admin center, Agents, Robomotion, Update in store) |

Rules:

- Only words. A tool's name, its inputs and whether Copilot asks before using it
  live in the code; renaming or adding a tool here does nothing.
- Raise `agent.version` (for example 1.3.2 to 1.3.3) whenever `agent.instructions`
  changes. Microsoft takes an update only with a higher version, and the server
  ignores new instructions without one.
- Limits: server instructions 4000 characters, a tool description 2000, a tool
  title 80, agent instructions 8000. One field over its limit and the whole file
  is ignored.
- Never put a workspace, a customer or a secret in this file: the repo is public.

To compare with what the server was built with:
`COPILOT_TEXT_OUT=/tmp/copilot.json go test ./buildmcp/ -run TestWriteCopilotText`
in robomotion-webhooks-service.
