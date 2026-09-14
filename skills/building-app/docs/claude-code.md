# Building an app outside the Build view

Read this when the Build view's tools are not registered (see "Which surface
you are on" in `SKILL.md`): Claude Code, a terminal, any assistant with a
shell. Everything else in `SKILL.md` still holds - the contract, the kit, the
flow rules, the plain words. What changes is that **nobody does anything for
you.** In the Build view a harness presses every button after a start, holds
the turn when screens were never read, and brings the preview up on its own.
Here each of those is a step you take, in this order, or it does not happen.

The Robomotion plugin for Claude Code adds a stop check that holds your
hand-over once for each step below that was skipped. It reads what the
commands recorded, not what you say you ran, so the only way past it is to
run the step.

## 0. Before anything: the login

    robomotion whoami

If it says you are not logged in, do not ask for the key and do not suggest
editing a shell profile. Ask the person to run, in the prompt:

    ! robomotion login

It asks for their API key without showing it and keeps it for every later
command. Wait for them to say it is done, then run `robomotion whoami` again.

## 1. The project

- **A new app in an empty folder:** `robomotion app create "<short name>"`.
  It makes the robot's side, checks it out right here, creates the app on it,
  and installs the screens. Git is set up to save with the same login.
- **A flow checkout that has no app yet:** the same command, inside it.
- **An app that exists:** `robomotion app sync` in its checkout.

Clarifying questions (at most three, one at a time) use **AskUserQuestion**
with short options. Progress goes in **TodoWrite**, phrased in the person's
words ("Make the list of items"), never internal steps.

## 2. Write the promises down, first

Before writing any screen, write what the person asked for as short checkable
lines in `.robomotion/request-checks.md`: counts, order, what an empty case
shows, what is refused and what stays unchanged when it is, what each screen
shows, and name each screen by the label its navigation will show. Never
mention the file to the person.

## 3. Build

Follow `SKILL.md`: `app.json` and `mcp.json`, `robomotion app codegen` from
`app/`, screens with sample data as a fallback, the flow one subflow per
screen. Start the screens once, **in the background** (it keeps running):

    robomotion app dev

It prints the local address. Read its output when a change does not show.

## 4. Check, save

    robomotion app validate

Fix until it passes, after every batch of changes. Then save:

    git add -A && git commit -m "<what changed>" && git push

## 5. The robot

A new app has no robot. Ask with **AskUserQuestion** - header "Robot",
question "Your app needs a robot to run on. Shall I set one up?", options
"Yes, set it up" / "Not now". On yes, in the same turn:

    robomotion app robot
    robomotion app start

After every later save that changed the robot's side, the running session
still runs the old steps: `robomotion app start --restart`.

## 6. Press every button: the smoke pass

After every start or restart, run it yourself - here nothing runs it for you:

    robomotion app smoke

It presses each action once through the app's own door and prints the same
report the Build view reads. Classify each row with the table in `SKILL.md`
(step 6b) and act on it. `robomotion app press <action> --params '{...}'`
proves a path the stand-in values could not. When something fails, read
`robomotion app logs` before explaining anything.

Then the records the pass wrote:

- **`left_behind` names a create** whose record stayed because the app has no
  way to remove it: add a delete action for that record (contract, flow,
  screen), save, restart, smoke again.
- **Take away only what this pass or your own presses made** - the ids in
  `created_ids`, or ids your own `press` calls returned. Never delete an id you
  read from a list, and never one the person entered. A press you did not make
  is theirs.
- **An update is not a leftover.** `updated_existing` names writes that changed
  a record that was already there; leave it, and never "tidy" it with a delete.
- The hand-over says nothing to the person about test records. If the pass
  left one you could not remove, say so in one plain sentence.

## 7. Read every screen, against the promises

With `robomotion app dev` running, for each screen `request-checks.md` names:

    robomotion app screen "<label>"

It opens the screens in a headless browser, reaches the screen through the
app's own navigation, and prints the text it shows plus console errors. Check
every line of `request-checks.md` against that text; reading a screen is not
checking it. A fix to what a screen shows is confirmed by reading that screen
again, never only by pressing the action.

## 8. Hand over

Say what the app does and what to press, in the person's words. Give them the
address `robomotion app dev` printed so they can open it in their browser
(this is where the Build view's "never quote 127.0.0.1" does not apply: here
the screens run on their own computer). No ids, no file names, nothing about
test data unless something was left behind. Offer to publish; never publish
unasked (`robomotion app publish`).
