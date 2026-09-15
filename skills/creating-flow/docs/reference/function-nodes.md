# Function nodes: glue code, written only where necessary

Robomotion is a low-code platform. **The program is the flow.** A person
reads it on the canvas one node per step, each named after what it does,
and opens a node to see how that step works. We do write code, but only
where it is necessary: a `Core.Programming.Function` node is the glue
between two steps, shaping the message so the next node can take it. It is
not where the program lives.

Two things follow, and `robomotion validate` refuses their opposites.

## 1. Code is written for a person to read

Whoever opens a Function node sees its code in an editor. It is formatted
the way any code review would expect: **one statement per line, a block's
lines on their own lines, indented, a blank line between parts, names that
say what they hold.** Never several statements crammed on one line, never a
whole function body between braces on one line, never a line that runs
past the editor. `robomotion validate` refuses a Function whose code has
"several statements on one line" or "a whole block on one line".

There is **no line limit**. A long Function that does one thing and reads
top to bottom is fine. A short one nobody can read is not.

```javascript
// Not this
function q(s) { return "'" + String(s == null ? '' : s).replace(/'/g, "''") + "'"; }
if (!name) { msg.refused = 'A vendor needs a name.'; return [null, msg]; }

// This
var name = String(p.name || '').trim();

if (!name) {
  msg.refused = 'A vendor needs a name.';
  return [null, msg];
}
```

## 2. The work goes into nodes; the Function keeps only its own step

A Function holds what THAT step does and nothing else. The moment a
Function opens with helpers the step did not need - quoting, id makers,
formatters, row shapers - it is a library first and a step second, and the
person who came to change one line has to scroll past the library to find
it. `robomotion validate` refuses the same block opening three or more
Function nodes ("the same block opens N Function nodes").

Where the urge to write a helper comes from, and where the work belongs:

| The urge | Where it belongs |
|---|---|
| a `q()` to quote SQL values, `WHERE` clauses built by concatenation | **SQL lives in the SQL node**, in its `func` property, with `{{{field}}}` placeholders the package fills from `msg`: `SELECT * FROM vendors WHERE id = '{{{vendor_id}}}'`. The Function before it sets `msg.vendor_id`. |
| `rowsOf()`, `vendorOf()`, `invoiceOf()` row shapers | The query names and aliases the columns the screen wants (`v.name AS vendor_name`); the Function after it hands them over: `msg.result = { vendors: msg.table.rows }`. |
| `newId()` | The package's own id node, or one line: `msg.id = Date.now().toString(36);` |
| `money()`, `pad()`, `todayStr()` | The screen formats (the kit's `Money`, `DateTime`); the flow hands over numbers and ISO strings. A date inside SQL is `strftime(...)` in the query. |
| `whoOf(msg)` | One line, where it is needed: `msg.who = (msg.identity && msg.identity.email) \|\| 'someone';` |
| a validation library (`if (!name) ... if (!email) ...` for every field) | One Function per rule the person would name ("Check the amount", "Check the vendor exists"), `outputs: 2`, wired to a `Respond Error` that says why. A rule is a step; the person sees it on the canvas. |
| `try { ... } catch` around a package call | `continueOnError: true` on the node, or a `Core.Flow.Catch`. Error handling is a wire. |
| loops, `map`, `filter`, `reduce` over rows | `Core.Programming.ForEach` with `Label` / `GoTo` when each row is a step; SQL when it is a query (`SUM`, `COUNT`, `GROUP BY`). A one-line `filter` is fine when the rows are already in `msg` and the result is one more field. |
| building a table for a data node | `msg.table = { columns: [...], rows: [...] }`; `./patterns/data-tables.md`. |
| the same three lines in three nodes | Three nodes with the same three lines. That is not duplication to fix; it is three steps a person can read on their own. |

## What it looks like

The public template library (`robomotionio/robomotion-templates`) is the
model. Its 1,842 Function nodes are the glue between steps: most are a
handful of lines, the longest around sixty, almost none declare a helper
function. A SQLite step from one of them:

```typescript
.then('c4a8e2', 'Core.Programming.Function', 'Only what was asked', {
  outputs: 2,
  func: `var p = msg.params || {};

msg.vendor_id = String(p.vendor_id || '');
msg.filter = '%' + String(p.filter || '') + '%';

if (!msg.vendor_id) {
  msg.refused = 'Say which vendor.';
  return [null, msg];
}

return [msg, null];`,
})
.then('d5b9f3', 'Robomotion.SQLite.Query', 'Read the vendor\'s invoices', {
  optConnectionString: Message('db'),
  outResult: Message('invoices'),
  func: `SELECT id, number, amount, due_date, status
FROM invoices
WHERE vendor_id = '{{{vendor_id}}}' AND number LIKE '{{{filter}}}'
ORDER BY due_date`,
})
.then('e6c0a4', 'Core.Programming.Function', 'Hand the rows over', {
  func: `msg.result = {
  rows: msg.invoices.rows,
  total: msg.invoices.rows.length
};

return msg;`,
})
```

Three steps with names a person understands, the SQL where a database
person expects it, and code anyone can read.

## Why this exists

A vendor-invoice app (2026-09-15) had fifty-three Function nodes that each
opened with the same fourteen helper functions, one crammed line each, and
then assembled SQL by string concatenation. On the canvas it looked like a
flow; inside every node it was a minified JavaScript program. Faik: "this
is the most horrifying thing I have seen in Robomotion in eight years. We
are a low-code platform. We do write code, but when it is necessary; the
program is the flow, and the Function node is glue code. Humans will read
this."
