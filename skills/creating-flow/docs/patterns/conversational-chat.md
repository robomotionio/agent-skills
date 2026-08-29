# Conversational Chat Assistant

How a **conversational** `Robomotion.ChatAssistant` flow actually behaves, and the three
wirings you almost always need: the turn contract, streaming, and attachments.

**Related:** `assistant-migration.md` (porting a legacy `Robomotion.Assistant` flow) ·
`exceptions.md` (the Catch branch every conversational flow needs).

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
f.node('c10001', 'Robomotion.ChatAssistant.ChatIn', 'Chat In', {
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
f.node('c10001', 'Robomotion.ChatAssistant.ChatIn', 'Chat In', {
  optTurnTimeout: 300,
})
  .then('a20001', 'Robomotion.HermesAgent.Agent.HermesAgent', 'Agent', {
    inQuery:     Message('payload.text'),
    inSessionId: Message('session_id'),
  })
  .then('t30001', 'Robomotion.ChatAssistant.Text', 'Answer', {
    inText: Message('text'),        // Hermes' outText; Text always renders Markdown
  })
  .then('c40001', 'Robomotion.ChatAssistant.ChatOut', 'Chat Out', {});

// The error path — hand the chat back, and say why
f.node('x50001', 'Core.Trigger.Catch', 'Catch', {
  optNodes: { ids: [], all: true },
});
f.node('e50002', 'Robomotion.ChatAssistant.Error', 'Show Error', {
  inErrorLabel:   Custom('Something went wrong'),
  inErrorMessage: Message('error.message'),
});
f.node('c50003', 'Robomotion.ChatAssistant.ChatOut', 'Chat Out (error)', {});

f.edge('x50001', 0, 'e50002', 0);
f.edge('e50002', 0, 'c50003', 0);
```

A Catch branch that ends anywhere other than `ChatOut` is worse than no Catch branch: the
user sees the error *and* a dead composer.

## 3. Wiring two: streaming

A conversational agent that shows nothing until the whole turn is done feels broken next to
the assistants people compare it to. Stream it.

Requires `Robomotion.HermesAgent` **0.21.0+** for the `stream_delta` callback.

```ts
f.node('c10001', 'Robomotion.ChatAssistant.ChatIn', 'Chat In', { optTurnTimeout: 300 })
  .then('a20001', 'Robomotion.HermesAgent.Agent.HermesAgent', 'Agent', {
    inQuery:     Message('payload.text'),
    inSessionId: Message('session_id'),
  })
  // Close the bubble the deltas were filling, THEN end the turn.
  .then('s30001', 'Robomotion.ChatAssistant.StreamingText', 'End Stream', {
    inStreamingID: Message('session_id'),
    optEndStream:  true,
  })
  .then('c40001', 'Robomotion.ChatAssistant.ChatOut', 'Chat Out', {});

// The deltas. Callback In hangs off the agent's `callbacks` port — index 1.
f.node('k20002', 'Robomotion.HermesAgent.Callback.CallbackIn', 'Stream Delta', {
  optCallbackType: 'stream_delta',
});
f.node('s20003', 'Robomotion.ChatAssistant.StreamingText', 'Stream Chunk', {
  inText:        Message('payload'),
  inStreamingID: Message('session_id'),
});

f.edge('a20001', 1, 'k20002', 0);   // port 1 = callbacks (0 = tools, 2 = output)
f.edge('k20002', 0, 's20003', 0);
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
f.node('k20004', 'Robomotion.HermesAgent.Callback.CallbackIn', 'Tool Start', {
  optCallbackType: 'tool_start',
});
f.node('p20005', 'Robomotion.ChatAssistant.Progress', 'Working', {
  inTitle: Message('payload'),
});
f.edge('a20001', 1, 'k20004', 0);
f.edge('k20004', 0, 'p20005', 0);
```

## 4. Wiring three: attachments

The composer uploads attachments **before** it sends the message, so `msg.payload.files` is
a list of names and versions — **never files on disk**. `GetAttachments` (1.9.0+) downloads
them and hands you local paths, which is what an agent's `Files` input, a document parser or
a `Core.FileSystem` node actually wants.

```ts
f.node('c10001', 'Robomotion.ChatAssistant.ChatIn', 'Chat In', { optTurnTimeout: 300 })
  .then('g20001', 'Robomotion.ChatAssistant.GetAttachments', 'Get Attachments', {
    inFiles:     Message('payload.files'),   // the default; the whole payload works too
    // inDirectory omitted = a fresh temp directory
  })
  .then('a20002', 'Robomotion.HermesAgent.Agent.HermesAgent', 'Agent', {
    inQuery:     Message('payload.text'),
    inSessionId: Message('session_id'),
    inFiles:     Message('local_files'),     // GetAttachments' output
  })
  .then('t20003', 'Robomotion.ChatAssistant.Text', 'Answer', {
    inText: Message('text'),
  })
  .then('c20004', 'Robomotion.ChatAssistant.ChatOut', 'Chat Out', {});
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
f.node('k30001', 'Robomotion.HermesAgent.Callback.CallbackIn', 'Clarify', {
  optCallbackType: 'clarify',
});
f.node('b30002', 'Robomotion.ChatAssistant.ButtonGroup', 'Ask', {
  inLabel:   Message('question'),
  optButtonsArray: JS(`["Yes", "No"]`),
  outResult: Message('answer'),
});
f.node('o30003', 'Robomotion.HermesAgent.Callback.CallbackOut', 'Answer', {
  inCallerId: Message('caller_id'),
  inResult:   Message('answer'),
});

f.edge('a20001', 1, 'k30001', 0);
f.edge('k30001', 0, 'b30002', 0);
f.edge('b30002', 0, 'o30003', 0);
```

Do **not** put a `ChatOut` on a callback branch. The callback branch is inside the turn; the
turn ends on the main branch.

## 6. Checklist

- [ ] Every branch — including the Catch branch — ends at `ChatOut`.
- [ ] `Core.Trigger.Catch` → `Error` → `ChatOut` present.
- [ ] `optTurnTimeout` set on `ChatIn` for anything that calls an LLM or a slow API.
- [ ] Streaming: no `Text` node repeating the streamed answer.
- [ ] Streaming: one `StreamingText` with `optEndStream: true` before `ChatOut`, same
      `inStreamingID` as the chunk node.
- [ ] `Callback Out` on the branches that block (`clarify`, `pre_*`, `post_*`, Tool Approve);
      none needed on `stream_delta`, `tool_start`, `tool_complete`, `thinking`, `status`.
- [ ] `GetAttachments` between `ChatIn` and anything that needs a real file path.
- [ ] `addDependency('Robomotion.ChatAssistant', '1.9.0')` or later for `GetAttachments`,
      `optEndStream`, `optTurnTimeout` and the lifted widget gate.
- [ ] Ran `validate_flow` before `save_flow`.
