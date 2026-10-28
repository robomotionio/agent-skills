---
name: creating-form
description: Builds a Robomotion Form by conversation - a public web page anyone can answer through a link, no account needed, each answer encrypted in the visitor's browser and added to a queue - and the flow that reads the answers. Owns the loop - questions → form.json → push → publish a link (queue created when missing) → open the link and answer it → the flow takes the answer off the queue → changes by prompt on the same link. Use when people outside the workspace send something in - applications, requests, sign-ups, claims, orders, surveys, files.
triggers: [robomotion form, public form, web form, online form, intake form, application form, registration form, sign-up form, signup form, contact form, request form, order form, feedback form, survey, questionnaire, form link, form submissions, /\bforms?\b[^.!?]*\b(link|anyone|public|submissions?|answers?|queue|fill(ed)? (it )?in|send (it )?in)\b/, /\b(collect|gather|accept|receive)\b[^.!?]*\b(applications?|requests?|submissions?|sign-?ups?|claims?|responses?|files?)\b/]
---

# Building a Robomotion Form

A **form** is a page on the internet with a link. Whoever has the link can answer it: no account, no login, nothing to install. Every answer is locked in the visitor's browser before it leaves, with the public half of an **RSA Key Pair** from the person's Vault, and lands as one item on a **queue**. The flow behind the form takes items off that queue with `Core.Queue.Get`, which unlocks them with the private half of the same Vault item, on the robot.

```
form.json ──push──▶ the form ──publish──▶ link ──visitor answers──▶ queue item ──Core.Queue.Get──▶ the flow
   ▲                                     (same link)
   └── a change by prompt: edit, push, reload the link
```

**Form or app?** A form is for people *outside* the workspace sending something in. Screens the team itself works in (approve, track, a list of requests, a dashboard) are an app: `building-app`. Both together is common: the form takes the request in, the app is where the team handles it. Build the form here.

## Words

The person never hears: JSON, schema, field id, instance, RSA, AES, public key, private key, base58, encrypt, payload, ciphertext, any id, any command (`robomotion form push`), tool name (`save_flow`) or file name (`form.json`). Say **form**, **question**, **the link**, **answers**, **the list the answers land on** (or the queue's name, if they already used "queue"), **the lock key in your Vault**. Show the questions as a plain list, the way the page will show them.

## Before the first form (once per project)

1. **A signed-in flow project.** `robomotion create flow "<name>"` makes one (sign-in on first use). The form lives in it as `form.json`, beside `main.ts`.
2. **A robot on this computer**, the one the flow will run on: `running-flow` step 2. `publish` runs a short flow on it.
3. **An RSA Key Pair item in a vault that robot can open.** Look before asking:
   ```bash
   robomotion get vaults
   robomotion get vault-items <vault-id> --json     # an RSA Key Pair item has "category": 8
   ```
   One item can lock many forms; reuse it. If there is none, ask the person once, in plain words, to make one in Robomotion: **Vault → open a vault (or New Vault) → Add Item → RSA Key → generate → Save**, then give the robot that vault: **Robots → the robot → Inject Vault Secret**. Never ask for the vault's secret key or their password, and never try to make the key pair yourself.

## The conversation (one question per turn)

1. **What is it for and who answers it?** Only if not said. That sets the title, the short line under it and the thank-you text.
2. **The questions.** Draft them yourself from what they said, then show them as a short list with what is required:
   > The form will ask: first and last name\*, email\*, phone, which track (RPA Developer, Web Automation, Data)\*, why they want to join\*, and their CV as a file\*. (\* = required) Anything to add or change?
3. **What happens to an answer.** Only if not said: what the robot should do with each one (save to a sheet, send an email, create a record). That is the flow.
4. **One link for everyone, or one per person?** Default to one link that stays open (`permanent`). A `--disposable` link closes after one answer: one per person, made one at a time.

Colours and logo: use the brand colour if they mention one (`theme.color`); a logo needs a URL. Do not ask about either.

## Build it

1. **Write `form.json`** at the project root. The format, every question type and the value each one sends: [docs/form-json.md](docs/form-json.md). Give every question a short `snake_case` id; it is the key the flow reads (`msg.item.email`).
2. **Check it**: `robomotion form validate`. Fix every error; read the warnings (they are things the page ignores).
3. **Save it**: `robomotion form push`. Creates the form the first time, updates it after.
4. **Publish**:
   ```bash
   robomotion form publish --queue "<Queue Name>" --key <vault-id>/<item-id> --robot "<robot>"
   ```
   It pushes again, creates the queue when missing, reads the lock key's public half on the robot, and prints the **link** and an **embed** link (for an `<iframe>` on their own site). `--robot` is needed once per project; `--key` and `--queue` are remembered. Name the queue for what lands on it ("Internship Applications").
5. **See it as a visitor.** When you have a `form_in_preview` tool, do this step with it: `read` gives the questions as a visitor sees them, `answer` fills them in and presses the button, in the Form preview the person is looking at. Otherwise open the link in a browser (`exploring-browser`'s `browser_open`, headed) and snapshot it: the title, every question in order, the required marks, the dropdown's choices. Then answer it once with realistic test values (a small file for a file question) and press the submit button: the page must say the thank-you text. Close the browser. If submitting is refused with a captcha message, ask the person to send one test answer themselves from the link.
6. **The flow** (`creating-flow`): take one answer off the queue and do the work.
   ```ts
   f.node('1a2b3c', 'Core.Trigger.Inject', 'Start', {})
     .then('2b3c4d', 'Core.Queue.Get', 'Take The Next Answer', {
       optQueueName: Custom('<Queue Name>'),
       optAESKey: Credential({ vaultId: '<vault-id>', itemId: '<item-id>' }),   // the same RSA Key Pair item
       optStart: true,                    // marks it in progress so no other robot takes it
       outID: Message('item_id'),
       outData: Message('item'),          // { <question id>: <value>, ... }
     });
   ```
   An empty queue is not an error: `item_id` and `item` stay unset, so branch on `msg.item_id` before reading, with a `Core.Programming.Function` of `outputs: 2` (`return msg.item_id ? [msg, null] : [null, msg];`; there is no If node). When the work is done, `Core.Queue.Update` with `inStatus: 'successful'` (or `'failed'`) and `inItemID: Message('item_id')`. To work through every waiting answer, loop back to Get until it comes back empty. Every answer also starts any trigger that names this queue, so a published flow can run on each answer by itself.
7. **Run it** (`running-flow`): `robomotion validate`, then `robomotion run`. The test answer from step 5 must come out with every question's value; a `Core.Programming.Debug` on `item` shows them. Never say it works without that.
8. **Tell the person**, in their words: the link, that anyone with it can answer, and what happens to each answer.

## Changes by prompt

The link reads the form every time it opens, so a change needs no new link:

1. Edit `form.json` as asked (add, remove, reword, reorder a question; required or not; a choice; the thank-you text; the colour).
2. `robomotion form validate`, then `robomotion form push`.
3. Reload the link in the browser and check the change is there.
4. If a question was **added or removed**, update the flow to read or stop reading it, and run it once more.

Keep ids stable: rewording a question keeps its id, because the flow reads by id. Changing an id is a change to the flow too.

`robomotion form status` lists the links, open or closed, and how many answers each took. `robomotion form unpublish <link>` closes one; answers already on the queue stay.

## Things to say plainly when they matter

- **Files** go to storage on their own and the answer carries a link to the file, not the file. The file itself is **not** locked like the answers are: anyone with that file link can open it. If the form collects sensitive documents, tell the person before publishing.
- The page does not limit a file question to one kind of file. If only PDFs are wanted, say so in the question's label and have the flow check the file's extension.
- A file can be up to 50 MB.
- The person can open and edit the form in Robomotion too: **Forms → My Forms**. A change made there is not in `form.json`; ask before overwriting it with a push.

## When it goes wrong

| What you see | What it means | Do |
|---|---|---|
| `could not read the public key: Vault ... locked` / no access | The robot was not given that vault | Pass on the link in the robot's error (`/designer/?vault=...&robot=...`): the person opens it and presses Allow, which gives the robot the vault, then publish again |
| `that vault item has no public key` | `--key` names an item that is not an RSA Key Pair | Pick the item with `"category": 8` |
| `reading the public key runs a short flow on your robot` | No robot known for this project | `--robot <name>` (`robomotion get robots`) |
| `could not create the queue: upgrade_plan` | The plan has no queues | Tell the person; nothing to fix in the form |
| `forms_limit_reached` / `form_instances_limit_reached` | The plan's form or link limit | `robomotion form unpublish` an old link, or tell the person |
| The link shows "Form Not Found" | The link was closed, or the form deleted | `robomotion form status`; publish a new link |
| Queue Get gives an error unlocking the item | The flow's `optAESKey` is not the item the link was published with | Use the same `<vault-id>/<item-id>` as `robomotion form status` shows |
| The flow gets no item | Nobody answered yet, or another run took it | Answer the link once more; check the queue in Robomotion's Queues page |
