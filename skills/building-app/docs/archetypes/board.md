# Archetype: board

## Choose it when

Things MOVE THROUGH NAMED STAGES and the person's job is to move them along: "deals through the pipeline", "repairs from booked to collected", "applications from applied to hired", "orders from picked to shipped". The verbs are move, drag, progress, advance, push it to the next stage - and the giveaway noun is a stage list they can recite ("new, in talks, quoted, won or lost").

Not this archetype when:

- each item needs a **yes or no** and then leaves - that is approval-queue, even if the person says "queue" and "move";
- the stages are just a **status column** nobody drags and the real job is entering records - that is form-and-table with a `StatusBadge`;
- the person wants to **watch numbers** about the stages rather than move anything - that is dashboard.

A board where nothing ever moves is a table with extra steps. If the stage only ever goes one way at one moment (submitted → done, by the robot), do not build a board.

## Screens

- **board** (`/`): one `Kanban`, one `KanbanColumn` per stage in the person's own order, one `KanbanCard` per item. Above it, one line of plain words about what is still in play ("Still open: 6 deals worth £48,200"), and one primary `Button` that opens a `Dialog` with the add `Form`.
  - **Never hand-roll dragging.** The kit owns it: `Kanban` drags with pointer events, so it works on a touch screen, and a focused card also moves with the Left and Right arrow keys. An app that writes its own `draggable` / `onDragStart` / `onDrop` gets neither - HTML5 drag is mouse-only and leaves no keyboard path at all - and a board only some people can use is a board that failed. `./docs/app-kit-reference.md` has the whole component.
  - **The action a `Kanban` is given is called with exactly `{ key, from, to }`** - which card, the column it left, the column it landed on. Declare the move action's params as those three names. Inventing `{ id, stage }` and hoping is how a board passes every check and answers "invalid parameters" on the first drag.
  - Each column's `meta` is what the person counts: how many, and their total where the items carry a number. `title` is the stage in their words, never the enum value.
  - `emptyState` per column, in words about that column ("Nothing in Quoted"), so an empty board still reads as a board.
  - Put whatever decides the stage ON the card - who it is, what it is worth, how old it is - and nothing else. A card is glanced at, not read.
  - A card that must not move yet (someone else's, locked, already finished) is `disabled`, not hidden.

Sample data: a `SAMPLE_ITEMS` const of 5-8 rows spread across the stages, so every column has something in it and the board reads as a board before a backend exists.

An item people also need to open and change is a second screen (`/items/:id`) or a `Drawer` from the card; do not grow the card into a form.

## Backend shape

- **`listItems`** gives the board everything it draws, in one answer. A board is read whole - do not page it. When there are more items than a person can look at, the flow filters to what is live (open stages, this month) and says so on screen.
- **`moveItem`** takes `{ key, from, to }` and is the only thing that writes a stage. The ROBOT decides whether the move is allowed - a stage order it holds, not one the screen sends - and refuses in a sentence a person can read ("A deal that is already won cannot go back to quoted"). `from` is what the board believed; when it disagrees with the record, somebody else moved it first, and saying so is better than overwriting them.
- **`addItem`** and **`deleteItem`** as the shape needs, with ids minted by the robot.
- The items live in a database the flow owns - `Robomotion.SQLite` by default - or in the system they belong to when they belong somewhere (a CRM, a spreadsheet, an ERP): look for a package first (workflow step 0c).
- **One broadcast event when anything moves.** The person who dragged the card sees it move because the kit ran the action; the event is for everybody ELSE's board. A board is the archetype most likely to be open on two screens at once.

## `app.json` fragment

```jsonc
{
  "types": {
    "Item": {
      "type": "object",
      "properties": {
        "id":      { "type": "string" },
        "title":   { "type": "string" },
        "owner":   { "type": "string" },
        "value":   { "type": "number" },
        "stage":   { "type": "string", "enum": ["new", "in_talks", "quoted", "won", "lost"] },
        "created_at": { "type": "string", "format": "date-time" }
      },
      "required": ["id", "title", "stage"]
    }
  },
  "actions": {
    "listItems": {
      "description": "See everything on the board, grouped by the stage it is at.",
      "params": { "type": "object" },
      "result": { "type": "object" },
      "timeout_ms": 30000
    },
    "moveItem": {
      "description": "Move one item to another stage.",
      "params": {
        "type": "object",
        "properties": {
          "key":  { "type": "string" },
          "from": { "type": "string" },
          "to":   { "type": "string" }
        },
        "required": ["key", "to"]
      },
      "result": { "$ref": "#/types/Item" },
      "timeout_ms": 30000,
      "concurrency": { "mode": "queue", "limit": 1 }
    },
    "addItem": {
      "description": "Put a new item on the board.",
      "params": {
        "type": "object",
        "properties": {
          "title": { "type": "string" },
          "owner": { "type": "string" },
          "value": { "type": "number" },
          "stage": { "type": "string", "enum": ["new", "in_talks", "quoted", "won", "lost"] }
        },
        "required": ["title"]
      },
      "result": { "$ref": "#/types/Item" },
      "timeout_ms": 30000
    }
  },
  "events": {
    "boardChanged": {
      "description": "Something moved, so every open board should refresh.",
      "payload": { "type": "object" }
    }
  },
  "screens": {
    "board": { "description": "Everything on the board, by stage.", "route": "/" }
  }
}
```

`moveItem` is queued at 1 because two drags landing at once on one record is exactly the race a board invites; the queue makes the second one read the first one's result.
