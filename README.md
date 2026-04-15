<!-- logo placeholder -->

# Robomotion Agent Skills

Agent skills for building, testing, and running [Robomotion](https://www.robomotion.io) automation flows with the `@robomotion/sdk` TypeScript builder. Designed for any agent that supports the [`npx skills`](https://github.com/vercel-labs/skills) catalog format — ships ready for Claude Code, portable to others.

## Available Skills

Start with `creating-flow` if you're new — it bundles the full Robomotion 101 (SDK grammar, core principles, canonical examples, and all pattern docs). The other six skills are specialty wrappers that assume you either have `creating-flow` installed alongside or are already fluent in Robomotion.

| Skill | Description |
|-------|-------------|
| [`creating-flow`](./skills/creating-flow/SKILL.md) | Create Robomotion flows end-to-end: requirements → plan → build → validate → deploy. **Foundational — install first.** |
| [`validating-flow`](./skills/validating-flow/SKILL.md) | Run `robomotion validate` against pspec schemas; node-by-node error report. |
| [`testing-flow`](./skills/testing-flow/SKILL.md) | Author and run behavioral tests with `@robomotion/sdk/testing` + `bun test`. |
| [`running-flow`](./skills/running-flow/SKILL.md) | Execute a flow on a robot and stream agent-mode events with bounded retries. |
| [`searching-packages`](./skills/searching-packages/SKILL.md) | Find packages, nodes, templates, examples via the `robomotion` CLI (Bleve-backed fuzzy + semantic search). |
| [`exploring-browser`](./skills/exploring-browser/SKILL.md) | Interactive browser exploration through `robomotion-browser-mcp`: snapshot, record actions, capture traffic. |
| [`reversing-network`](./skills/reversing-network/SKILL.md) | Reverse-engineer a site's API from captured traffic and replace browser automation with HTTP. |

## Installation

```bash
# 1. Install the Robomotion binaries — REQUIRED. Grab `robomotion` and
#    `robomotion-browser-mcp` from https://robomotion.io/downloads and
#    put them on your PATH.

# 2. Install all skills into your project's .claude/skills directory
npx skills add robomotionio/agent-skills -a claude-code -s '*' -y

# 3. Wire up the `robomotion-browser-mcp` server — REQUIRED for the
#    exploring-browser and reversing-network skills.
curl -LO https://raw.githubusercontent.com/robomotionio/agent-skills/main/.mcp.json
```

Only installing a subset? `npx skills add` supports per-skill installation — check `npx skills --help`.

## Prerequisites

Both binaries are **required** and must be on `PATH`. Install from [robomotion.io/downloads](https://www.robomotion.io/downloads):

| Binary | Purpose |
|--------|---------|
| `robomotion` | CLI used by every skill — `build`, `validate`, `run`, `search`, `get`, `describe`, `docs`. |
| `robomotion-browser-mcp` | MCP server the `exploring-browser` and `reversing-network` skills drive via `mcp__browser__*` tools. |

`bun` is required for `testing-flow` (`bun test` is the test runner). No other MCP servers are needed — `robomotion` shells out to `robomotion-sdk-mcp` internally.

## Usage

Once installed, agents pick up the skills automatically from their descriptions. Example prompts:

```
# Build a new flow
"Create a flow that scrapes the top 10 posts from r/programming and posts them to my WordPress blog."

# Run an existing flow
"Run the write-to-clipboard flow on my Extremis robot."

# Add tests
"Write tests for main.ts that mock the HttpRequest and check branch coverage."

# Validate before committing
"Validate the send-get-request flow."

# Explore a site
"Explore the login page at example.com and find the selectors."

# Convert to HTTP
"This browser flow is too slow — find the API it uses and convert it to HTTP."

# Search
"What Robomotion nodes exist for reading Excel files?"
```

## Layout

Skills are self-contained — every doc referenced by a SKILL.md ships inside the same directory, so `npx skills add` pulls everything in one step.

```
skills/
├── creating-flow/
│   ├── SKILL.md
│   └── docs/                    # sdk-grammar, architecture, patterns/, reference/
├── exploring-browser/
│   ├── SKILL.md
│   └── docs/patterns/browser.md
├── reversing-network/
│   └── SKILL.md
├── running-flow/
│   └── SKILL.md
├── searching-packages/
│   └── SKILL.md
├── testing-flow/
│   ├── SKILL.md
│   └── reference/               # flow-tester, mock-registry, etc.
└── validating-flow/
    └── SKILL.md
```

## Source of Truth

These skills are derived from [`robomotionio/robomotion-templates`](https://github.com/robomotionio/robomotion-templates), where the flow templates and source docs live. File issues and feature requests against the template repo unless the bug is specifically in the skill packaging layer here.

## Contributing

PRs welcome. When adapting content from `robomotion-templates`, keep SKILL.md frontmatter limited to `name` + `description` (agent-agnostic) and make sure every doc referenced by a skill body lives inside that skill's directory — `npx skills add` does not pull sibling files from the repo root.

## License

[MIT](./LICENSE)
