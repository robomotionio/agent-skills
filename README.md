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
| [`building-app`](./skills/building-app/SKILL.md) | Build a Robomotion App: screens under `app/` in front of a flow, in one repository. The harness tools under Build, or the `robomotion app` verbs from a terminal. |

## Installation

```bash
# 1. Install the Robomotion binaries — REQUIRED. Grab `robomotion` and
#    `robomotion-browser-mcp` from https://robomotion.io/downloads and
#    put them on your PATH.

# 2. Sign in, in the project folder: a code and a link, approved in your browser.
#    The login is kept in that project's .robomotion/session.json, so each
#    project can use its own workspace.
robomotion auth login --workspace <your-workspace-host>

# 3. Install the skills. In Claude Code, as a plugin - this also adds the app
#    hand-over check (a Stop hook that holds a hand-over until the app was
#    validated, its buttons pressed and its screens read):
#      /plugin marketplace add robomotionio/agent-skills
#      /plugin install robomotion@robomotion
#    Or copy the skills alone into your project's .claude/skills directory:
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

`bun` is required for `testing-flow` (`bun test` is the test runner) and for `building-app` (the screens are a Vite project under `app/`). No other MCP servers are needed — `robomotion` shells out to `robomotion-sdk-mcp` internally.

### Apps from a terminal

A `git clone` of a flow is the whole project: if the flow backs an app, its screens are under `app/` in the same checkout. From a terminal the `robomotion app` verbs do the rest, one per job:

```
robomotion app create "<name>"          # create the app on the flow in this folder (an empty folder gets a new flow); installs
robomotion app sync                     # pull, place the packages, install
robomotion app dev                      # run the screens on localhost
robomotion app validate                 # the same checks as the Build view's validate_app
robomotion app publish                  # build the screens, create a flow version, publish the app from it
robomotion app robot                    # give the app its own robot (token kept in .robomotion/robot.json)
robomotion app start [--restart]        # start that robot and the app session on it
robomotion app press <action> [--params '{...}']   # press one action through the app's own door
robomotion app smoke                    # press every action once and report, like the Build view's smoke_app
robomotion app screen "<label>"         # read what a screen of the running screens shows
robomotion app status | logs [-f]       # where things stand; the app robot's output
```

From a terminal or Claude Code the agent presses the buttons, uses the app in a headless browser and reads the screens itself (`skills/building-app/SKILL.md`, "The loop"); under Robomotion's Build with AI a harness does part of that (`skills/building-app/docs/build-view.md`). The Claude Code plugin's stop check holds a hand-over that skipped a step.

Saving is `git commit && git push` at the project root, the same as for a flow.

## Usage

Once installed, agents pick up the skills automatically from their descriptions. Example flow-creation prompts:

```
# Web scraping to spreadsheet
"Create a flow that searches DuckDuckGo for a query I enter in a dialog
 and saves the result titles and links to an Excel file."

# Monitoring + cloud integration
"Build a flow that reads a list of domains from a Google Sheet, checks
 each SSL certificate's expiration date, and writes days-until-expiry
 back to the sheet. Pull the service account JSON from Vault."

# File operations with real logic
"Create a flow that scans a directory, computes SHA-256 hashes for
 every file, and deletes duplicates while keeping the first occurrence.
 Show a summary dialog at the end."

# Parallel browser automation
"Build a flow that uses Fork Branch and a Memory Queue to spin up 4
 concurrent browser instances, dequeue product URLs, navigate to each,
 and screenshot the pages in parallel."

# AI chat assistant with state
"Create a chat assistant flow that logs meals to a SQLite database,
 tracks daily calorie and macro totals against a user profile, and
 supports photo-based food logging via an LLM agent."
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
