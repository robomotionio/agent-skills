# The project format: one file, two readers

A flow project is a git repository shared by two tools that must both be able
to open, change and save it:

- **The CLI / Claude Code** runs `main.ts` and `subflows/*.ts` with Bun
  (`robomotion build`, `robomotion run`, the robot). To Bun the file is a
  program: imports, helpers, loops, anything TypeScript allows.
- **The Flow Designer** never runs the file. It **reads** it the way a
  person reads source code: statically, one file at a time, without running
  anything or following an import. It draws the nodes it found, and on every
  save it **regenerates the whole file from the canvas**. Whatever it did not
  understand is not on the canvas, and the next Designer save writes the file
  without it - for good, in git.

So a flow file is **a declaration, not a program**. The person who opens your
flow in the Designer must see every node with every value, and a save from
there must not lose anything. `robomotion validate` refuses the shapes below
with "the Flow Designer cannot read it"; fix the file, never bypass the check.

## What the Designer reads

| The file may | The file may not |
|---|---|
| `import { flow, Message, Custom, JS, Global, Flow, Credential, AI } from '@robomotion/sdk'` (the one import) | import from anywhere else: `../src/helpers`, `./shared`, npm packages |
| write every node as `f.node(id, type, name, { ...props })` / `.then(...)` / `f.edge(...)` **inside** the `flow.create` / `subflow.create` callback | build nodes in a helper (`openDb(f)`, `action('name')`), a loop, a `.map()`, or a conditional |
| give a prop a literal (string, number, boolean, null), an array or object of literals, or a scope helper over one (`Message('x')`, `Custom(3)`, `Credential({ vaultId, itemId })`) | give a prop a call, a ternary, a computed value, a function |
| build a string from **same-file** `const`s with a template, `+`, or `['line', 'line'].join('\n')` - `func: \`${HELPERS}\nreturn msg;\`` where `const HELPERS = '...'` is at the top of the SAME file | interpolate an imported name, a function result, a parameter |
| declare `const` strings and objects at the top of the file and use them in props | spread a shared object into props (`{ ...SQL_FROM_MSG, outResult }`) or use shorthand props (`{ sql }`) |
| write node ids, types and names as string literals | compute an id or a name |

Each file stands alone: a helper string used by three subflows is declared in
each of the three files. Repetition is the cost of a file two tools can read;
pay it.

## What survives a Designer save

Only what the nodes carry: ids, types, names, props, wires, dependencies,
variables. Comments, blank lines, the order of `const`s, a `const` nobody
uses, and the formatting are all regenerated from the canvas. Put nothing in
the file that is not in a node.

## How the two sides hand over

- **Claude Code → Designer:** `robomotion validate` (which runs this check),
  then `git add -A && git commit && git push`. The Designer loads the pushed files; the
  person sees the same nodes the robot runs.
- **Designer → Claude Code:** the person saves; the server commits the
  regenerated files. `git pull` before editing; expect the file to look
  different (regenerated) but mean the same. Never "clean it up" into
  helpers again.

## Why this exists

A vendor-invoice app (2026-09-15) put its SQL helpers in `src/invoices.ts`
and wrote every Function as ``func: `${SQL_HELPERS}...` ``. The robot ran it
perfectly; the Designer showed **"return msg;"** in all fifty-three Function
nodes, because the reader could not see the import and fell back to the
node's default. One Designer save would have written "return msg;" into git
and the app would have answered nothing.
