# Comments, Grouping & Sugiyama Layout

How to make a flow **readable on the Designer canvas**: a titled description box, logical
phases fenced by colored comment boxes with group-description text, and a layered
(Sugiyama-style) left-to-right node arrangement. This is visual polish — it never changes
runtime behaviour — but it's what turns a wall of nodes into something a human can scan.

**Related:** `loops.md` (loop-back wiring the layout must accommodate) · `branches.md`.

## Two files: logic vs. layout

- **`main.ts`** — the graph. Comments are real nodes here: `Core.Flow.Comment` with an
  `optText` markdown string. That's the only comment-related thing in `main.ts`.
- **`main.designer.ts`** — the canvas layout. A pure data module:

```ts
export default {
  flowId: 'f01d9e3',
  sourceHash: '3e55245e',            // hash of main.ts; a staleness marker for tooling only —
                                     // validate/run never read the designer or this hash
  positions: { 'c00001': { x: 60, y: 0 }, 'a10001': { x: 600, y: 250 }, /* every node id */ },
  cameraPositions: { main: { x: 20, y: 60, zoom: 0.58 } },  // initial framing
  nodeColors: { 'd40000': '#6610F2' },                       // per-node card tint (hex)
  nodeIcons: {},
  commentExtras: {                                            // per comment box: color + size
    'c00001': { colorIndex: 4, size: { width: 440, height: 265 } },
    'c00002': { size: { width: 1180, height: 977 } },
  },
};
```

Coordinates are **designer space**. The canvas fit-scales the whole graph to the viewport,
so always reason in designer units, not rendered pixels.

## Comment nodes: title box + phase headers

A `Core.Flow.Comment` renders as a rounded rectangle holding markdown. Give it a `### heading`
and a short description; blank lines make paragraphs; `**bold**` and `` `code` `` work.

```ts
f.node('c00001', 'Core.Flow.Comment', 'Comment', {
  optText: '### Invoice Inbox to Ledger\n\nReads vendor-invoice e-mails out of the mailbox and posts each one as a bill in the ERP. It handles the two that go wrong: a duplicate (skipped) and one that fails the 3-way match (blocked).\n\nWrites invoice-posting.csv.',
});
```

Use them in two roles:

1. **Title box** — one per flow, top-left (`x:60, y:0`), `colorIndex: 4` (purple). Flow name as
   `### Heading`, then a 2–4 sentence narrative of what the robot does and what it writes.
2. **Phase-header boxes** — one per logical phase (sign-in, scrape, reconcile, report…).
   Numbered heading (`### 1. Pull the ledger's open questions`) plus a sentence describing the
   phase. The box is sized to **enclose that phase's nodes** (see sizing below).

### Coloring (`commentExtras[id].colorIndex`)

Omit `colorIndex` for the default gray. The palette (renderer light/dark pairs) is:

| idx | color | idx | color | idx | color |
|----|-------|----|-------|----|-------|
| 0 | gray (default) | 3 | green | 6 | red |
| 1 | light gray | **4** | **purple → title box** | 7 | amber |
| 2 | blue | 5 | pink | 8 | indigo |

Reserve **4 (purple)** for the title box. Use **2 (blue)** / **6 (red)** / **7 (amber)** sparingly
to highlight a phase that deserves attention (a decision/branch phase, an exception phase).
Most phase headers stay default gray.

Color loop **Label/GoTo** cards via `nodeColors` (e.g. `'#6610F2'` purple) so the reader sees
the loop's back-edge endpoints at a glance.

## Sugiyama layout style

Lay the graph out in **layers, left-to-right**, the way `layout-engine.cjs` does:

- **Layer = longest-path depth** from the trigger. The main chain flows rightward; each step is a
  new column. Grid constants: rows `ROW_H = 70` apart, columns `COL_W = 260`, main chain at
  `x = 600 + layer·COL_W`.
- **Order within a layer by barycenter** — put each node near the average y of its predecessors,
  then resolve collisions. This minimizes edge crossings.
- **Convergence nodes** (multiple predecessors — e.g. a `Stop` several branches wire into) sit at
  the **mean y of their predecessors**. Never force a **single-predecessor** node to align to a
  column baseline — let it sit on its parent's row, or the wires kink.
- **Loop-back edges** (`GoTo → Label`) and **`Catch`** wires do **not** count toward layering — a
  loop's `GoTo` bridges back/forward and its card is allowed to sit at a phase boundary.
- `Start` is offset left of the first column; `Stop` offset right of the last.

**Presentation as phase-columns.** In the polished templates each *phase* is a vertical stack of
its nodes (execution order top→bottom) under its comment header, and phases progress left→right;
parallel chains inside a phase become adjacent sub-columns (~360 apart). Nodes begin **~250 below**
the phase header (`comment.y = 0`, first node row `y = 250`) — that top band holds the header text.

Get a first pass from the layout tool, then **hand-tune** (group into phases, add/size comment
boxes, color loop cards, set the camera). Regenerate screenshots and check the result visually —
the layout is only "done" once it renders cleanly.

## Sizing the group boxes (designer units)

A phase box must fully enclose its nodes with consistent padding. Compute each node's rectangle
from its top-left position + its rendered size:

| node kind | size (w × h) |
|---|---|
| default (most nodes) | 200 × 47 |
| `Function` / `SubFlow` | 200 × (35 + (ports−2)·12) |
| `Switch` / `ForEach` / `ForkBranch` | 80 × (50 + (ports−3)·12) |
| `Label` / `GoTo` / `Inject` / `Catch` | 150 × 36 |
| `Stop` | 160 × 36 |

Then set `commentExtras[id].size`:

- **left**: box left edge = leftmost node.x − **64**  (put the comment's `x` there).
- **top**: comment `y = 0`; the header text lives in the ~**250** band above the first node row.
- **right**: rightmost *content* node's right + **40**, but capped to clear the next phase's box by
  **≥16**. A single loop `GoTo`/`Catch` card may bridge *past* the right edge into the next phase —
  that's intentional; exclude it when computing the content max-x.
- **bottom**: lowest node's bottom + **50**.
- **Never overlap.** Adjacent boxes keep a ≥16 gap. If a box's right edge crosses the next box's
  left edge, it's a defect — **shrink the over-wide box**, don't move its neighbour.

### Text-only boxes clip — size to the text

`.node-comment` is `overflow: hidden`, so a **title box or narrative-only callout whose text is
taller than the box gets its text cut off at the bottom**. These boxes aren't sized by nodes — size
their **height to the rendered text** plus ~22 bottom padding. Title boxes are 440 wide; a
2-paragraph description needs ≈247–283 tall (font 12px / line-height 1.5, 16px padding, `###` = 14px).
Don't eyeball it — measure the rendered height (headless render with the renderer's CSS), or grow
generously since the title box is standalone and has empty space below it.

## Gotcha: builds flatten the designer

`robomotion run` / the local build step can **overwrite `main.designer.ts` with a flat auto-layout**
(comments stacked at x=0, every node in one row). After running or building a flow you were
hand-laying-out, restore the tuned designer (`git checkout -- '*/main.designer.ts'`) before
committing. The flattening is cosmetic — runtime output is unaffected.
