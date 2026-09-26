# Conversational Chat Assistant

How a **conversational** `Robomotion.ChatAssistant` flow actually behaves, and the three
wirings you almost always need: the turn contract, streaming, and attachments.

**Related:** `assistant-migration.md` (porting a legacy `Robomotion.Assistant` flow) ·
`exceptions.md` (the Catch branch every conversational flow needs).

### The agent has three outputs — never `.then()` from it

The Hermes Agent (`Robomotion.HermesAgent.Agent.HermesAgent`) has three output ports:

| Port | What hangs off it |
|---|---|
| 0 | **tools** — `Tool In` nodes and toolkits (§6) |
| 1 | **callbacks** — `Callback In` nodes (streaming, progress, clarify) |
| 2 | **the answer** — where the turn carries on to `Text` / `End Stream` → `ChatOut` |

`.then()` always wires port 0, so `.then()` from the agent plugs the answer into the
**tools** port: the flow builds and validates, and the turn never reaches `ChatOut`. Wire
everything after the agent with `f.edge('<agent>', <port>, '<node>', 0)`.

The agent's prompt is `inQuery`. (`inUserPrompt` belongs to the ADK LLM Agent, a different
node.) The snippets below leave out the file's first line and the `addDependency` lines;
a whole file starts with the full import and pins both packages — see the checklist.

> Everything below is **`Robomotion.ChatAssistant` 1.9.0 or later**. Pin a real published
> version — `robomotion describe package Robomotion.ChatAssistant`.

## 1. The turn contract (read this first)

**One user message is one turn: one flow run from `ChatIn` to `ChatOut`.**

The composer locks the moment the user sends, and **the only thing that unlocks it is
`ChatOut`**. Not a `Text` node, not the agent answering, not an error — `ChatOut`.

Three consequences, and every conversational-flow bug is one of them:

| Symptom | Cause | Fix |
|---|---|---|
| Chat frozen after an error | A branch went red before `ChatOut` | Catch branch, §2 |
| Chat frozen with no error | A branch simply has no `ChatOut` | Every path ends at `ChatOut` |
| Chat frozen for ever on a slow agent | The turn died somewhere the flow can't catch | `optTurnTimeout` on `ChatIn` |

`ChatIn` is a **trigger** (0 inputs) — it fires per message. `ChatOut` is **terminal**
(0 outputs) — wire *to* it, never `.then()` from it.

### What `ChatIn` gives you

| Output | Contents |
|---|---|
| `outSessionID` (`msg.session_id`) | The conversation's id. Stable across turns — good as a Hermes `Session ID` **and** as a `Streaming Id`. |
| `outPayload` (`msg.payload`) | `{ text, files }` — what the user typed, and what they attached. |
| `outProfile` (`msg.profile`) | Who is chatting, when there is a Robomotion session. |

### Stop, and what it does to your flow

Since 1.9.0 the user can press **Stop** mid-turn. The composer unlocks immediately; the
robot marks the turn cancelled and **every Chat Assistant node from that point on refuses**
with `Robomotion.ChatAssistant.ErrCancelled`.

You do not have to check for it. But know two things:

- **A red node after a Stop is expected**, not a bug in your flow.
- **Cancellation is soft.** An LLM call already running finishes; its answer is simply never
  rendered. Do not rely on Stop to stop billing or side effects. If a turn writes to a
  database, it will still write.

### `optTurnTimeout` — set it

```ts
f.node('b82ce8', 'Robomotion.ChatAssistant.ChatIn', 'Chat In', {
  optTurnTimeout: 300,   // seconds; 0 = wait for ever (the default)
});
```

It is the backstop for the case a Catch branch cannot reach: the robot sends the `chat_out`
itself and the user gets their chat back. Set it a comfortable margin above your slowest
honest turn. It does not cancel the work — it only unlocks the chat.

## 2. Wiring one: the turn, with its error path

The smallest correct conversational flow. Note the Catch branch is not optional — without it
a single bad turn locks the chat until the page is reloaded.

```ts
// The turn
f.node('b82ce8', 'Robomotion.ChatAssistant.ChatIn', 'Chat In', {
  optTurnTimeout: 300,
})
  .then('63b7c9', 'Robomotion.HermesAgent.Agent.HermesAgent', 'Agent', {
    inQuery:     Message('payload.text'),
    inSessionId: Message('session_id'),
    optUseRobomotionCredits: true,                  // §7
    optModelName: 'openrouter/deepseek-v4.1-flash',
  });

// The answer. Declared on its own, because it hangs off the agent's port 2.
f.node('a04f9a', 'Robomotion.ChatAssistant.Text', 'Answer', {
  inText: Message('text'),        // Hermes' outText; Text always renders Markdown
})
  .then('f9dfba', 'Robomotion.ChatAssistant.ChatOut', 'Chat Out', {});

f.edge('63b7c9', 2, 'a04f9a', 0);   // port 2 = the answer (0 = tools, 1 = callbacks)

// The error path — hand the chat back, and say why
f.node('ba1e58', 'Core.Trigger.Catch', 'Catch', {
  optNodes: { type: 'catch', ids: [], all: true },
});
f.node('956a3f', 'Robomotion.ChatAssistant.Error', 'Show Error', {
  inErrorLabel:   Custom('Something went wrong'),
  inErrorMessage: Message('error.message'),
});
f.node('f2082f', 'Robomotion.ChatAssistant.ChatOut', 'Chat Out (error)', {});

f.edge('ba1e58', 0, '956a3f', 0);
f.edge('956a3f', 0, 'f2082f', 0);
```

A Catch branch that ends anywhere other than `ChatOut` is worse than no Catch branch: the
user sees the error *and* a dead composer.

## 3. Wiring two: streaming

A conversational agent that shows nothing until the whole turn is done feels broken next to
the assistants people compare it to. Stream it.

Requires `Robomotion.HermesAgent` **0.21.0+** for the `stream_delta` callback.

```ts
f.node('b82ce8', 'Robomotion.ChatAssistant.ChatIn', 'Chat In', { optTurnTimeout: 300 })
  .then('63b7c9', 'Robomotion.HermesAgent.Agent.HermesAgent', 'Agent', {
    inQuery:     Message('payload.text'),
    inSessionId: Message('session_id'),
    optUseRobomotionCredits: true,
    optModelName: 'openrouter/deepseek-v4.1-flash',
  });

// Close the bubble the deltas were filling, THEN end the turn.
f.node('810eef', 'Robomotion.ChatAssistant.StreamingText', 'End Stream', {
  inStreamingID: Message('session_id'),
  optEndStream:  true,
})
  .then('f9dfba', 'Robomotion.ChatAssistant.ChatOut', 'Chat Out', {});

// The deltas. Callback In hangs off the agent's `callbacks` port — index 1.
f.node('d7ca16', 'Robomotion.HermesAgent.Callback.CallbackIn', 'Stream Delta', {
  optCallbackType: 'stream_delta',
});
f.node('2c2093', 'Robomotion.ChatAssistant.StreamingText', 'Stream Chunk', {
  inText:        Message('payload'),
  inStreamingID: Message('session_id'),
});

f.edge('63b7c9', 2, '810eef', 0);   // port 2 = the answer
f.edge('63b7c9', 1, 'd7ca16', 0);   // port 1 = callbacks (0 = tools)
f.edge('d7ca16', 0, '2c2093', 0);
```

Four rules:

1. **No `Text` node for the answer.** The streamed bubble already holds it; a `Text` node
   renders the same answer a second time. This is the single most common streaming mistake.
2. **`Streaming Id` must match** between the chunk node and the End Stream node.
   `msg.session_id` is the easy correct choice — it is present on the callback message too,
   because the callback context is a clone of the agent's.
3. **Do not end a stream with an empty chunk** in new flows. It still works, but it ends
   *every* open stream for the session. `optEndStream: true` closes the one you name.
4. **Do not wire a `Callback Out`** after `stream_delta`. Since 0.21.0 the streaming and
   progress callbacks are fire-and-forget — nothing waits for an answer. (`clarify`,
   `pre_tool`, `post_tool`, `pre_llm`, `post_llm` and Tool Approve **do** wait, and still
   need their `Callback Out`.)

Deltas arrive coalesced — a readable chunk, not one message per token.

### Showing what the agent is doing

Same shape, different callback. `Progress` closes itself when the next non-progress widget
arrives, so there is nothing to clean up.

```ts
f.node('7757cc', 'Robomotion.HermesAgent.Callback.CallbackIn', 'Tool Start', {
  optCallbackType: 'tool_start',
});
f.node('7880f5', 'Robomotion.ChatAssistant.Progress', 'Working', {
  inTitle: Message('payload'),
});
f.edge('63b7c9', 1, '7757cc', 0);   // port 1 = callbacks
f.edge('7757cc', 0, '7880f5', 0);
```

## 4. Wiring three: attachments

The composer uploads attachments **before** it sends the message, so `msg.payload.files` is
a list of names and versions — **never files on disk**. `GetAttachments` (1.9.0+) downloads
them and hands you local paths, which is what an agent's `Files` input, a document parser or
a `Core.FileSystem` node actually wants.

```ts
f.node('b82ce8', 'Robomotion.ChatAssistant.ChatIn', 'Chat In', { optTurnTimeout: 300 })
  .then('83989b', 'Robomotion.ChatAssistant.GetAttachments', 'Get Attachments', {
    inFiles:     Message('payload.files'),   // the default; the whole payload works too
    // inDirectory omitted = a fresh temp directory
  })
  .then('63b7c9', 'Robomotion.HermesAgent.Agent.HermesAgent', 'Agent', {
    inQuery:     Message('payload.text'),
    inSessionId: Message('session_id'),
    inFiles:     Message('local_files'),     // GetAttachments' output
    optUseRobomotionCredits: true,
    optModelName: 'openrouter/deepseek-v4.1-flash',
  });

f.node('a04f9a', 'Robomotion.ChatAssistant.Text', 'Answer', {
  inText: Message('text'),
})
  .then('f9dfba', 'Robomotion.ChatAssistant.ChatOut', 'Chat Out', {});

f.edge('63b7c9', 2, 'a04f9a', 0);   // port 2 = the answer
```

A message with no attachments is **not** an error: `local_files` is `[]` and
`attachment_count` is `0`. Branch on `msg.attachment_count` with a Function if the two cases
need different handling — do not add a Catch for it.

Files the other way — `DownloadFile`, or `Image`/`Video` with a local path — work in
conversational mode from 1.9.0. Before that they were refused.

## 5. Widgets in conversational mode

**Every widget works in both modes** from 1.9.0. `ButtonGroup`, `Dropdown`, `Checkbox`,
`RadioButton`, `Datepicker`, `Textbox`, `UploadFile`, `DownloadFile`, `Auth`, `CustomWidget`,
and the display-only nodes.

The composer is locked for the whole turn, so a mid-turn `ButtonGroup` is unambiguous: there
is nowhere else for the user to answer. This is what lets an agent ask a real multiple-choice
question instead of falling back to "reply with 1, 2 or 3".

The pairing worth knowing: **Hermes `clarify` → `ButtonGroup` → `Callback Out`**, and
**Tool Approve → `ButtonGroup` (Approve/Deny) → `Callback Out`**. Both of those callbacks
*do* block, so the `Callback Out` is required — the agent is waiting on the answer.

```ts
f.node('37baa4', 'Robomotion.HermesAgent.Callback.CallbackIn', 'Clarify', {
  optCallbackType: 'clarify',
});
f.node('90e80e', 'Robomotion.ChatAssistant.ButtonGroup', 'Ask', {
  inLabel:   Message('question'),
  optButtonsArray: JS(`["Yes", "No"]`),
  outResult: Message('answer'),
});
f.node('b16150', 'Robomotion.HermesAgent.Callback.CallbackOut', 'Answer', {
  inCallerId: Message('caller_id'),
  inResult:   Message('answer'),
});

f.edge('63b7c9', 1, '37baa4', 0);   // port 1 = callbacks
f.edge('37baa4', 0, '90e80e', 0);
f.edge('90e80e', 0, 'b16150', 0);
```

Do **not** put a `ChatOut` on a callback branch. The callback branch is inside the turn; the
turn ends on the main branch.

## 6. Giving the agent a tool

A tool is a small branch that hangs off the agent's **port 0**. The agent calls it by name,
waits, and reads what comes back:

`Agent` port 0 → `Tool In` → the work → `Tool Out`

- **`Tool In`** (`Robomotion.HermesAgent.Tool.ToolIn`) describes the tool to the model:
  `inToolName` (the name the model sees, snake_case), `inToolDescription` (one accurate
  line — a vague one gets the tool used badly), and `func`, the **JSON schema of its
  parameters**. The arguments arrive in `msg.parameters`; `msg.caller_id` says which call
  this is.
- **The work** is ordinary nodes — a SQL query, an HTTP call, a Function.
- **`Tool Out`** (`Robomotion.HermesAgent.Tool.ToolOut`) hands the result back:
  `inCallerId: Message('caller_id')` (the value Tool In received) and `inResult`, any
  JSON value.

```ts
f.node('d0c8e4', 'Robomotion.HermesAgent.Tool.ToolIn', 'Order Status', {
  inToolName:        Custom('order_status'),
  inToolDescription: Custom('The status of one order, by its order number.'),
  func: `{
  "type": "object",
  "properties": {
    "order_id": {
      "type": "string",
      "description": "The order number, e.g. A-1042"
    }
  },
  "required": ["order_id"]
}`,
})
  .then('f49621', 'Core.Programming.Function', 'Look Up The Order', {
    func: `var id = String(msg.parameters.order_id || '');

msg.result = { order_id: id, status: 'shipped' };

return msg;`,
  })
  .then('19156d', 'Robomotion.HermesAgent.Tool.ToolOut', 'Order Answer', {
    inCallerId: Message('caller_id'),
    inResult:   Message('result'),
  });

f.edge('63b7c9', 0, 'd0c8e4', 0);   // port 0 = tools
```

Several tools, and toolkit nodes (`<Package>.Agents.Toolkit`), all hang off the same port 0.
A tool branch ends at `Tool Out`, never at `ChatOut` — it runs inside the turn.

## 7. The model, AI credits, and the agent's own tools

**AI credits.** `optUseRobomotionCredits: true` bills the model to the workspace's
Robomotion AI credits — no API key, no vault item. Calls go through OpenRouter, so pick one
of the `openrouter/...` entries of `optModelName` (for example
`'openrouter/deepseek-v4.1-flash'`); the list is in
`robomotion describe node Robomotion.HermesAgent.Agent.HermesAgent`. With credits on,
`optProvider`, `optBaseUrl` and `optApiKey` are ignored. For `optModelName: 'custom'`, put
an OpenRouter model id (`anthropic/...`, `google/...`) in `optModel`.

**Tool search.** `optToolSearch` defaults to `'auto'`, which makes the agent look its
tools up before it uses them — and that lookup can leak into the reply ("let me load the
tools…"). With a handful of tools, set `optToolSearch: 'off'` so every tool is simply
there. `'on'` is for an agent wired to a large catalog.

**Built-in toolsets.** `optEnabledToolsets` limits the agent's own plugins (terminal, file,
todo, …) to the ones you name — `Custom('["file"]')`, or `Custom('[]')` for Hermes'
defaults. A chat assistant that should only use the tools you wired does not need a
terminal.

```ts
f.node('63b7c9', 'Robomotion.HermesAgent.Agent.HermesAgent', 'Agent', {
  inQuery:     Message('payload.text'),
  inSessionId: Message('session_id'),
  optUseRobomotionCredits: true,
  optModelName:  'openrouter/deepseek-v4.1-flash',
  optToolSearch: 'off',
  optEnabledToolsets: Custom('["file"]'),
});
```

## 8. Checklist

- [ ] Nothing is `.then()`-chained from the agent: the answer is `f.edge('<agent>', 2, …)`,
      callbacks port 1, tools port 0.
- [ ] Every branch — including the Catch branch — ends at `ChatOut` (tool and callback
      branches end at `Tool Out` / `Callback Out`, or nowhere).
- [ ] The Catch node's `optNodes` has `type: 'catch'`.
- [ ] `Core.Trigger.Catch` → `Error` → `ChatOut` present.
- [ ] `optTurnTimeout` set on `ChatIn` for anything that calls an LLM or a slow API.
- [ ] Streaming: no `Text` node repeating the streamed answer.
- [ ] Streaming: one `StreamingText` with `optEndStream: true` before `ChatOut`, same
      `inStreamingID` as the chunk node.
- [ ] `Callback Out` on the branches that block (`clarify`, `pre_*`, `post_*`, Tool Approve);
      none needed on `stream_delta`, `tool_start`, `tool_complete`, `thinking`, `status`.
- [ ] `GetAttachments` between `ChatIn` and anything that needs a real file path.
- [ ] `addDependency('Robomotion.ChatAssistant', '1.9.0')` or later for `GetAttachments`,
      `optEndStream`, `optTurnTimeout` and the lifted widget gate; and
      `addDependency('Robomotion.HermesAgent', …)` with a published version
      (`robomotion describe package Robomotion.HermesAgent`).
- [ ] Ran `robomotion validate` before saving (`git add -A && git commit && git push`).
- [ ] When the person asks to try it: the `running-chat-assistant` skill (`robomotion agent push`,
      `create`, `start`, `chat`) runs it as an Agent in the real chat page. `robomotion run` cannot:
      nothing sends a Chat In flow a message.
