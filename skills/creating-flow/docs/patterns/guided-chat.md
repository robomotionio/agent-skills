# Guided Chat Assistant

How a **guided** `Robomotion.ChatAssistant` flow behaves, and the wiring it needs: fixed
options, reading the answers, asking again after a refusal, and the error path.

**Related:** `conversational-chat.md` (the other mode: a message box, one turn per message) ·
`assistant-migration.md` (porting a legacy `Robomotion.Assistant` form) · `branches.md`
(`Label` / `GoTo`) · the `running-chat-assistant` skill (testing it in the real chat page).

> Everything below is **`Robomotion.ChatAssistant` 1.9.1**. Pin the latest published version
> (`robomotion describe package Robomotion.ChatAssistant`) and check each widget with
> `robomotion describe node Robomotion.ChatAssistant.<Widget>`.

## 1. The shape

**One conversation is one run: `ChatIn → Text → question → question → … → Text → ChatOut`.**

The page has no message box. `ChatIn` fires when the page opens, the flow says what it has to
say (`Text`), and each question widget **holds the flow until the person answers it**; the
answer lands on the widget's `outResult` and the flow carries on to the next node. `ChatOut`
ends the conversation.

| Widget | Asks for | Its options | `msg.<x>.value` is |
|---|---|---|---|
| `Textbox` | typed text (`inLabel`, `inPlaceholder`, `optMaxLength: Custom('40')`, `optRows: Custom('4')` for a text area, `optInputType: 'text' \| 'number'`, `optMasked: true` for a secret) | — | the text typed |
| `ButtonGroup` | one press (`inMultiSelect: 'single'`, the default) or several and ✓ (`'multi'`) | `optCustomLabels` | the label pressed (`'multi'`: an array of labels) |
| `Checkbox` | ticks, then ✓ | `optCustomOptions` | an **array** of the labels ticked |
| `Dropdown` | one pick from a list (`inPlaceholder`) | `optCustomOptions` | the label picked |
| `RadioButton`, `Datepicker`, `UploadFile` | one pick · a date · files | see `describe node` | see `describe node` |

Around them, the display-only nodes: `Text` (Markdown), `Header`, `Divider`, `Image`, `Error`.

Every widget has 1 input and 1 output. `ChatIn` has 0 inputs, `ChatOut` 0 outputs: start the
chain at one, wire *to* the other.

## 2. Fixed options: `optCustomLabels` / `optCustomOptions`

For options the flow knows when it is written, list them on the node. `ButtonGroup` calls the
list `optCustomLabels`; `Checkbox`, `Dropdown` and `RadioButton` call it `optCustomOptions`.
Each item is a **scope object holding a `label`**:

```ts
optCustomLabels: [
  { scope: 'Custom', name: { label: 'Tune-up' } },
  { scope: 'Custom', name: { label: 'Brake service' } },
],
```

`robomotion describe node` shows this property only as `type: array`, and **`robomotion
validate` does not check the item shape**: a bare `['Tune-up', 'Brake service']` validates,
but the node reads each item's `label` and finds none. Write the items exactly as above. The label is also the value the flow
receives.

Options the flow works out at run time go in the other property, `optButtonsArray` /
`optCheckboxArray` / `optDropdownArray`, as `Message('<field>')` pointing at an array a Function
built: `['Yes', 'No']`, or `[{ id, label, value }]` when the value differs from the label. The
node uses the fixed list when it has one.

### Two things the page does with labels

- **Buttons are Title-Cased on screen.** The page shows `Brake service` as *Brake Service* and
  lowercases the rest of each word (`VIP pickup` shows as *Vip Pickup*). The flow still receives
  the label as written, so compare against that: `msg.service.value === 'Brake service'`.
  Checkbox labels are shown as written.
- **A Checkbox cannot be confirmed with nothing ticked.** Its ✓ appears only after the first
  tick. When every box is optional, add an option that means none (`None, thanks`) and drop
  it when you read the answer, or the person is stuck on that question.

## 3. Reading the answers: `outResult` is an object

`outResult` is the page's reply, **`{ id, value }`**, not the value itself. Read `.value`:

```js
var name = String(msg.name.value || '').trim();     // Textbox → the text
var service = msg.service.value;                    // ButtonGroup → 'Brake service'
var extras = msg.extras.value || [];                // Checkbox → ['Chain clean', 'None, thanks']
```

`msg.service === 'Brake service'` is always false, and `'Service: ' + msg.service` prints
`[object Object]`. In a scope helper, the same path: `inText: Message('name.value')`.

## 4. The whole flow

A workshop booking: the name, the service, the day, and the extras. Saturday is too short for a
full service, so that pair is refused and the service question is asked again.

```ts
import { flow, Message, Custom, JS, Global, Flow, Credential, AI } from '@robomotion/sdk';

flow.create('<flow-id>', 'Bike Service Desk', (f) => {
  f.addDependency('Robomotion.ChatAssistant', '1.9.1');

  // 1. Greet, then ask one question at a time
  f.node('338175', 'Robomotion.ChatAssistant.ChatIn', 'Chat In', {})
    .then('5b220c', 'Robomotion.ChatAssistant.Text', 'Say Hello', {
      inText: Custom('Welcome to the bike workshop. A few quick questions and your service is booked.'),
    })
    .then('70ded8', 'Robomotion.ChatAssistant.Textbox', 'Ask For The Name', {
      inLabel: Custom('Your name'),
      inPlaceholder: Custom('First name is fine'),
      optMaxLength: Custom('40'),
      outResult: Message('name'),
    })
    .then('4ee514', 'Robomotion.ChatAssistant.ButtonGroup', 'Ask For The Service', {
      inLabel: Custom('Which service does the bike need?'),
      optCustomLabels: [
        { scope: 'Custom', name: { label: 'Tune-up' } },
        { scope: 'Custom', name: { label: 'Brake service' } },
        { scope: 'Custom', name: { label: 'Full service' } },
      ],
      outResult: Message('service'),
    })
    .then('d88b41', 'Robomotion.ChatAssistant.ButtonGroup', 'Ask For The Day', {
      inLabel: Custom('Which day can you bring it in? We are closed on Sunday.'),
      optCustomLabels: [
        { scope: 'Custom', name: { label: 'Monday' } },
        { scope: 'Custom', name: { label: 'Wednesday' } },
        { scope: 'Custom', name: { label: 'Friday' } },
        { scope: 'Custom', name: { label: 'Saturday' } },
      ],
      outResult: Message('day'),
    })
    .then('859e76', 'Core.Programming.Function', 'Is There Time That Day', {
      outputs: 2,
      func: `msg.service_name = String(msg.service.value || '');
msg.day_name = String(msg.day.value || '');

if (msg.day_name === 'Saturday' && msg.service_name === 'Full service') {
  return [null, msg];
}

return [msg, null];`,
    });

  // 2. A refusal that asks again
  f.node('15d834', 'Robomotion.ChatAssistant.Text', 'Say Saturday Is Short', {
    inText: Custom('Saturday is too short for a full service. Pick another service, or another day.'),
  })
    .then('656f5a', 'Core.Flow.GoTo', 'Go To The Service Question', {
      optNodes: { ids: ['55a1d5'], type: 'goto', all: false },
    });

  f.node('55a1d5', 'Core.Flow.Label', 'The Service Question', {});
  f.edge('55a1d5', 0, '4ee514', 0);

  // 3. Extras, then the booking
  f.node('7278b7', 'Robomotion.ChatAssistant.Checkbox', 'Ask For Extras', {
    inLabel: Custom('Anything else? Tick what you want, or "None, thanks", then confirm.'),
    optCustomOptions: [
      { scope: 'Custom', name: { label: 'Chain clean' } },
      { scope: 'Custom', name: { label: 'Tyre check' } },
      { scope: 'Custom', name: { label: 'None, thanks' } },
    ],
    outResult: Message('extras'),
  })
    .then('9958f5', 'Core.Programming.Function', 'Book It', {
      func: `var picked = msg.extras.value || [];
var extras = [];

for (var i = 0; i < picked.length; i++) {
  if (picked[i] !== 'None, thanks') {
    extras.push(picked[i]);
  }
}

var name = String(msg.name.value || '').trim();

msg.ref = 'BIKE-' + name.slice(0, 3).toUpperCase() + '-' + msg.day_name.slice(0, 3).toUpperCase();

msg.summary = 'Booked, ' + name + '.\\n\\n'
  + '- Service: ' + msg.service_name + '\\n'
  + '- Day: ' + msg.day_name + '\\n'
  + '- Extras: ' + (extras.length > 0 ? extras.join(', ') : 'none') + '\\n'
  + '- Reference: **' + msg.ref + '**';

return msg;`,
    })
    .then('71fa7b', 'Robomotion.ChatAssistant.Text', 'Read The Booking Back', {
      inText: Message('summary'),
    })
    .then('9ab875', 'Robomotion.ChatAssistant.ChatOut', 'Chat Out', {});

  f.edge('859e76', 0, '7278b7', 0);   // port 0: there is time → the extras
  f.edge('859e76', 1, '15d834', 0);   // port 1: refused → say why, ask again

  // 4. Anything that fails: say so and hand the chat back
  f.node('c78258', 'Core.Trigger.Catch', 'Catch', {
    optNodes: { type: 'catch', ids: [], all: true },
  })
    .then('d81e28', 'Robomotion.ChatAssistant.Error', 'Say Something Went Wrong', {
      inErrorLabel: Custom('Something went wrong'),
      inErrorMessage: Custom('The booking could not be finished. Please try again, or call the workshop.'),
    })
    .then('c2d262', 'Robomotion.ChatAssistant.ChatOut', 'Chat Out (error)', {});
}).start();
```

What to notice:

- **Asking again is a `Label` / `GoTo`.** The refusal says why (`Text`), then a `GoTo` jumps to
  a `Label` wired into the question. Nothing is wired *into* the Label (it has 0 inputs), and
  the question keeps its own wire from the node before it. The same shape asks a `Textbox` again
  after an answer that does not check out (an order number that is not found).
- **The rule is its own Function with `outputs: 2`** (`conditions.md`): port 0 carries on, port 1
  refuses. Wire both with `f.edge()`.
- **The error path ends at `ChatOut`.** `Catch → Error → ChatOut`: without it a failing node
  leaves the person looking at a question that will never be answered. `Error` shows the label
  and the message; keep the message in the person's words.
- **No `Stop`, no `End`.** A chat flow ends every conversation at `ChatOut`; `robomotion
  validate` does not ask for a Stop in a Chat In flow.

## 5. Trying it

`robomotion run` cannot: nothing opens the chat page. The `running-chat-assistant` skill runs it
as an Agent (`robomotion agent create --mode guided`) and answers each question from the terminal:
a `Textbox` with `"text"`, a `ButtonGroup` with `--click "Label"`, a `Checkbox` with
`--check "Label"` then `--submit` (at least one tick first). It has no step for a `Dropdown`,
`RadioButton` or `Datepicker`, so a flow meant to be tested there asks short fixed lists with a
`ButtonGroup`. For the flow above:

```bash
robomotion agent chat --expect "bike workshop" Sam --click "Full service" --click Saturday \
  --expect "too short" --click Tune-up --click Saturday --check "None, thanks" --submit --expect BIKE-SAM-SAT
```

## 6. Checklist

- [ ] One chain from `ChatIn` to `ChatOut`; every branch (the refusal via its `GoTo`, the Catch
      branch) ends at a `ChatOut`.
- [ ] Fixed options as `[{ scope: 'Custom', name: { label: '…' } }]` in `optCustomLabels`
      (ButtonGroup) or `optCustomOptions` (Checkbox, Dropdown, RadioButton).
- [ ] Every answer read as `msg.<x>.value`; a Checkbox's value is an array of labels.
- [ ] Compared against the label as written, not as the page Title-Cases it.
- [ ] An optional Checkbox has a "none" option.
- [ ] A refusal says why, then `GoTo` → `Label` → the question again.
- [ ] `Core.Trigger.Catch` (`optNodes.type: 'catch'`) → `Error` → `ChatOut`.
- [ ] `addDependency('Robomotion.ChatAssistant', …)` pinned to a published version.
- [ ] `robomotion validate`, then save (`git add -A && git commit && git push`).
