---
name: running-chat-assistant
description: "Runs and tests a Robomotion Chat Assistant flow (one that starts at Robomotion.ChatAssistant.ChatIn) the way its users meet it: as an Agent, in the real Chat Assistant page. `robomotion agent` pushes the flow, makes the agent and its robot, starts it on this machine and chats with it - guided questions and conversational turns alike - printing every reply. Drives an edit → push → start → chat → fix loop. Use when the user says \"test the chatbot\", \"try the assistant\", \"open the chat\", \"talk to the agent\", \"run the chat assistant\", or asks to run or test any flow whose trigger is Chat In."
triggers: [chat assistant, chatbot, chat bot, the assistant, the agent, open the chat, talk to it, talk to the agent, try the chat, guided mode, conversational mode, /\bChatIn\b/, /\bchat ?in\b/i]
---

# Running a Chat Assistant

A flow that starts at `Robomotion.ChatAssistant.ChatIn` does nothing on its own: it waits for a message from the Chat Assistant page. `robomotion run` would start it and watch it wait until `--timeout`. So a Chat Assistant flow is tested the way its users meet it: as an **Agent** in the Workspace, running on its own robot, talked to in the real Chat Assistant page.

By hand that is the Designer (version, publish), Admin Console > Agents (create, one instance), the Desktop App (connect the agent's robot, Play) and the /agents page (Open), then typing. **`robomotion agent` does all of it from the terminal:**

```bash
robomotion validate .                        # 1. pspec-clean first, always
robomotion agent push                        # 2. this folder's flow → "<name> (dev)" in the workspace
robomotion agent create --mode guided        # 3. the agent with one instance (or --mode conversational); publishes a version itself if there is none
robomotion agent start                       # 4. connect the agent's own robot on this machine, then Play
robomotion agent logs -n 20                  #    wait for "Started running <name> [...]" before chatting
robomotion agent chat "…" --expect "…"       # 5. the real page, one step at a time, every reply printed
```

**In a folder that is a git checkout of its cloud flow, `agent push` refuses** (saving there is git). Step 2 is then `git add -A && git commit -m "…" && git push`; steps 3 to 5 stay the same. Everywhere else, `agent push` is step 2. After an edit, see Step 4.

**What you need:** the `robomotion` CLI on PATH. It brings `robomotion-deskbot` (the robot) and `robomotion-browser-mcp` (the browser) with it. Plus a login made with `robomotion auth login` in the flow folder (a session, not an API key: the chat page signs in with it). Nothing else: no Designer, no Admin Console, no Desktop App, no Playwright, no curl.

**`robomotion agent` needs robomotion 26.9.8 or later.** Check with `robomotion version` first. On an older CLI the command does not exist (it answers `Package "agent" not found in the package index`): tell the person to update Robomotion (robomotion.io/downloads) and stop. Do not work around it with API calls or the Designer.

## Which mode

The agent's mode decides how the page asks. Pick it from the flow, or ask the person once if the flow could be either.

| Mode | The page shows | The flow looks like |
|---|---|---|
| `guided` | Only what the flow draws: `Text`, then a question widget (`Textbox`, `ButtonGroup`, `Checkbox`, …) that holds the flow until it is answered. No message box. | `ChatIn → Text → Textbox → … → ChatOut`, questions in the order drawn. |
| `conversational` | A message box. Every message is one `ChatIn → … → ChatOut` turn. | `ChatIn → Hermes Agent → ChatOut`, the answer either streamed (`Stream Chunk` on the agent's callbacks port, `End Stream → ChatOut` on its answer port, no `Text` node) or shown whole (`Text → ChatOut`), never both; tools on the agent's tools port. Build it with `creating-flow`'s `docs/patterns/conversational-chat.md`. |

## Step 1 - Push, create, start (once per folder)

```bash
robomotion agent push                 # creates "<name> (dev)" on the first push; never writes to the flow main.ts names
                                      #   (git checkout of the cloud flow: git add -A && git commit && git push instead)
robomotion agent create --mode <m>    # publishes a version if there is none, then Agents > New with one instance
robomotion agent start                # makes the robot a connect token, starts its deskbot here, starts the agent
```

- **The flow's own id is never touched.** A template or a flow with `flow.create('main', …)` gets a dev copy; so does any folder that is not a git checkout of its cloud flow. In a git checkout, `push` refuses: save with `git add -A && git commit -m "…" && git push` instead, then go on with `create` and `start` as above.
- **`create` publishes for you.** If the flow has no version yet, `create` cuts one and publishes it before making the agent. Don't run `publish` first.
- **The agent's robot is not the person's robot.** `create` makes an Application robot that belongs to the agent and runs nothing else; `start` connects it on this machine with its own token. It uses one Application-robot slot in the workspace. If `create` says there is no free slot, tell the person; don't delete their other agents.
- **Wait for the robot before you chat.** `start` returns once the server has accepted the start; the robot still has to fetch the flow and start its packages. The flow is running when `robomotion agent logs` shows `Started running <name> [<version>]` (`[master]` after `--draft`). A message sent before that line can be lost, and `chat` then waits for an answer that never comes. The CLI is being changed so that `start` itself waits for that line; until your `robomotion` does, check `robomotion agent logs -n 20` first.
- Everything is remembered in `.robomotion/agent.json` (0600: it holds the robot's token). Each flow folder has its own agent, robot and deskbot, so several agents can be developed side by side. `robomotion agent status` shows where things stand.

## Step 2 - Chat

`chat` opens the chat page (in a visible browser; `--headless` hides it and saves screenshots to `.robomotion/chat/step-N.png`), waits for the agent, then does each step **in the order given**:

| Step | Does |
|---|---|
| `"text"` | Conversational: sends it as a message. Guided: types it into the open text question and presses Enter. |
| `--click "Label"` | Presses the button with that text in the open question (`ButtonGroup`; a single-choice one answers at once). |
| `--check "Label"` | Ticks the box with that label (`Checkbox`). Ticking asks nothing yet. |
| `--select "Option"` | Picks a `RadioButton` option by its label, or an option from a `Dropdown`'s list. Then `--submit`. |
| `--date YYYY-MM-DD` | Fills a `Datepicker` question. Then `--submit`. |
| `--submit` | Presses the open question's ✓ (after ticks, `--select`, `--date`, or a multi-select `ButtonGroup`). A `Checkbox` shows its ✓ only after a tick, so `--submit` there needs at least one `--check` before it. |
| `--expect "text"` | The text must be in what the step just before it produced, else exit 1. A substring match that ignores case (the CLI is being changed to also count the dash and quote variants `– — ‘ ’ “ ”` as `-`, `'`, `"`). Put each `--expect` right after the step it checks; one before any other step checks the opening message. |

`--select` and `--date` come with the `robomotion` release after 26.9.8; 26.9.8 itself answers only text, buttons and boxes (`robomotion agent --help` lists the steps yours has).

It prints what the agent shows after each step, widgets as what they want:

```
$ robomotion agent chat 12345678 --expect "cannot find" 48120677 --click Damaged --check "Item refund" --submit --expect RMA-0677
Returns desk. I can open a return for an order you have with us.
Order number [type: The eight digits on your confirmation email]
> 12345678
I cannot find an order with that number. Check the digits on your confirmation email and try again.
Order number [type: The eight digits on your confirmation email]
> [expect cannot find] shown
> 48120677
What went wrong with the Trail Runner GTX, size 42? [click: Damaged | Wrong Item | Never Arrived]
> [click Damaged]
What would you like us to do? [tick: Item refund | Postage refund | Replacement, then submit]
> [check Item refund] ticked
> [submit]
Return RMA-0677 is open for order 48120677. …
> [expect RMA-0677] shown
```

Expect a word or two only the right reply would contain (an id, a name, `cannot find`), not a whole sentence: a reply that says the right thing in other words, or with a typographic apostrophe, fails a long `--expect`.

Read `[type: …]`, `[click: a | b]`, `[tick: …, then submit]`, `[select: Small | Large, then submit]` (radio options), `[select from the list (<placeholder>), then submit]` (a dropdown) and `[date: --date YYYY-MM-DD, then submit]` as the next question and answer it with the matching step in the next `chat`. Each `chat` opens a **new** session, so a guided run is one `chat` with all its steps; a conversational run can be several messages in one `chat` (they share the conversation) or several `chat`s (each starts fresh).

`--json` prints one JSON line per step (`{"step", "shown", "ms"}`). Exit 0 means every step got an answer and every `--expect` was shown. **Never say the assistant works without a printed reply that answers what was asked.**

Test the paths the flow draws, not just the happy one: a wrong answer that loops back, each button of a branch, a tool the LLM should call (its answer should quote what the tool returned), and the error path.

## Step 3 - When it fails, read the robot

| What `chat` says | What it means | Look at |
|---|---|---|
| `no answer to "…" within 180s` / `(nothing new on the page)` | The flow failed or never reached `ChatOut`: the page stays locked. | `robomotion agent logs -n 200`: a node error or a package traceback (e.g. `the configured model was not found`) is there. |
| `the chat never became ready … Waiting for Robot` | The agent is not running. | `robomotion agent status`; `robomotion agent start`. |
| `[click X]: nothing like that to press. The open question is: …` | The page is asking something else. | The printed question; your step order. |
| `there is nowhere to type` | A guided page with no open text question. | Use `--click` / `--check` for this question. |
| `chat needs a session, not an API key` | Logged in with an API key. | `robomotion auth login`. |
| `Package "agent" not found in the package index` | The CLI is older than 26.9.8 and has no `agent` command. | `robomotion version`; ask the person to update Robomotion. |

A restart (`start --restart` / `--draft`, `stop`) ends every session that was waiting on a question. The robot log then shows `… package stopped unexpectedly` for those question widgets (`Textbox`, `Checkbox`, …). That is the restart, not a bug in the flow: read the log from the last `Started running` line on.

The robot's full output (package tracebacks go there, not to the page) is `robomotion agent logs [-f] [-n N]`, the same file as `.robomotion/agent-robot.log`.

A flow with no `Core.Trigger.Catch → Text → ChatOut` shows a failing turn as silence: the chat just stays locked. If the log shows an error the person's users would meet, add that Catch branch (see `conversational-chat.md` §2).

## Step 4 - Fix and go again

In a folder that is a git checkout of its cloud flow:

```bash
# edit main.ts
robomotion validate .
git add -A && git commit -m "what changed" && git push
robomotion agent start --draft     # runs the flow you just pushed; no new version needed
robomotion agent logs -n 20        # wait for "Started running <name> [master]"
robomotion agent chat …
```

In any other folder:

```bash
# edit main.ts
robomotion validate .
robomotion agent push
robomotion agent start --draft     # runs the flow as last pushed; no new version needed
robomotion agent logs -n 20        # wait for "Started running <name> [master]"
robomotion agent chat …
```

About 15 seconds per round. When it is right and the person wants the agent to keep a version:

```bash
robomotion agent publish -m "what changed"   # new version, published; the agent moves onto it
robomotion agent start --restart             # run that version
```

Retry budget: three failed rounds on the same symptom, then stop and show the person the step, the reply and the log lines, rather than guessing further.

## Step 5 - Finish

Tell the person the chat address (`robomotion agent url`; they open it signed in) and what you tested. Leave the agent running if they will try it; otherwise ask before cleaning up:

```bash
robomotion agent stop              # stop the agent, keep everything
robomotion agent delete            # stop it, delete the agent and its robot
robomotion agent delete --flow     # …and the "(dev)" flow copy with its versions
```

`delete` never touches a flow `push` did not create.

## Don't

- Don't use `robomotion run` to test a Chat In flow: nothing sends it a message.
- Don't paste or print the session token, or hand anyone a chat address with `?sid=` in it.
- Don't test in someone else's agent: `create` makes this folder its own.
- Don't read the page's HTML to decide it worked: read what `chat` printed and the robot's log.

## Related Skills

- `creating-flow` - build the flow (`docs/patterns/conversational-chat.md` for the conversational turn contract)
- `validating-flow` - `robomotion validate`
- `running-flow` - flows with any other trigger
