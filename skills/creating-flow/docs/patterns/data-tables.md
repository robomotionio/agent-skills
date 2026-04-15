# Data Tables

Universal tabular data format used across all Robomotion data packages: CSV, Excel (local & 365), Google Sheets, Airtable, SQLite, DOM parsing, Pandas, and DataTable operations.

**Related:** `loops.md` (iterating `table.rows`) · `browser.md` (extracting tables from pages with `RunScript`).

## When NOT to use

- **Single-object data** — use `msg.field` directly; don't wrap one row in a `{columns, rows}` structure.
- **Free-form JSON** — array of heterogeneous objects → stay as an array; don't force a columns list.
- **Logs and diagnostics** — `console.log` in a Function or `Core.Flow.Log` are better than building a table.

## Philosophy

> "The data table is just a simple JSON object"

Unlike heavy object structures used by other RPA tools, Robomotion uses a lightweight, universal JSON format that's easy to manipulate with standard JavaScript.

## Format

Robomotion uses a simple JSON structure for all tabular data:

```javascript
msg.table = {
  "columns": ["name", "age", "location"],
  "rows": [
    {"name": "John", "age": 54, "location": "Boston"},
    {"name": "Jane", "age": 47, "location": "London"}
  ]
}
```

- **columns**: JavaScript array of strings (column names)
- **rows**: Array of JSON objects (each row holds key-value pairs for every column)

### Single Row Format

When working with individual rows (InsertRow, AddRow, ForEach output), a row is a JSON object:

```javascript
var my_row = {"name": "Tom", "age": 28, "location": "Chicago"};

// NOT an array!
var wrong_row = ["Tom", 28, "Chicago"];  // WRONG!
```

### Accessing Data

```javascript
msg.table.columns      // ["name", "age", "location"]
msg.table.rows         // Array of row objects
msg.table.rows[0]      // First row object: {"name": "John", "age": 54, ...}
msg.table.rows[0].name // "John"
msg.table.rows.length  // Number of rows
```

## Column Naming Conventions

When reading from Excel/CSV with `GetRange` or `Read`:

| Option | Column Names |
|--------|--------------|
| **Without Headers** | Auto-named as "A", "B", "C", etc. |
| **With Headers** | Match the file exactly ("Price Range") |
| **With Headers + Jsonify** | Lowercase, spaces -> underscores ("price_range") |

Example with Jsonify enabled:
- "First Name" -> "first_name"
- "Price Range" -> "price_range"
- "ORDER ID" -> "order_id"
- "Name" -> "name"
- "URL" -> "url"
- "Screenshot Path" -> "screenshot_path"

### CRITICAL: Row Keys Must Match Column Names

When writing with `SetRange`, **row object keys MUST exactly match the column names**:

```javascript
// CORRECT: Keys match columns exactly
msg.table = {
  "columns": ["name", "url", "screenshot_path"],
  "rows": [
    { "name": "Petco", "url": "https://petco.com", "screenshot_path": "/tmp/petco.png" }
  ]
};

// WRONG: Keys don't match columns (will write empty cells!)
msg.table = {
  "columns": ["Name", "URL", "Screenshot Path"],
  "rows": [
    { "name": "Petco", "url": "https://petco.com", "screenshot_path": "/tmp/petco.png" }
    // Keys are lowercase but columns are capitalized - MISMATCH!
  ]
};
```

### Best Practice: Use Jsonify-Style Keys Consistently

When using `optJsonify: true` on GetRange, always use lowercase keys with underscores throughout your flow:

```typescript
// Reading with jsonify - columns become lowercase
f.node('4a7c91', 'Core.Excel.GetRange', 'Read Data', {
  inFileDescriptor: { name: 'excel_fd', scope: 'Message' },
  optHeaders: true,
  optJsonify: true,  // "Name" -> "name", "Screenshot Path" -> "screenshot_path"
  outRange: { name: 'stores', scope: 'Message' }
});

// In loop, access with lowercase keys
// msg.store.name, msg.store.url (NOT msg.store.Name)

// When building results, use matching lowercase keys
func: `
msg.results.push({
  "name": msg.store_name,
  "url": msg.store_url,
  "screenshot_path": msg.saved_path
});
return msg;
`

// When writing back, use lowercase columns
func: `
msg.final_table = {
  "columns": ["name", "url", "screenshot_path"],
  "rows": msg.results
};
return msg;
`
```

## Operations Using This Format

| Operation | Direction |
|-----------|-----------|
| `Core.CSV.ReadCSV` | **Returns** |
| `Core.CSV.WriteCSV` | **Expects** |
| `Core.Excel.GetRange` | **Returns** |
| `Core.Excel.SetRange` | **Expects** |
| `Core.Browser.RunScript` | **Returns** JSON string (parse with Function) |
| `Robomotion.GoogleSheets.GetRange` | **Returns** |
| `Robomotion.GoogleSheets.SetRange` / `AppendRange` | **Expects** |
| `Robomotion.Excel365.RangeRead` / `TablesGetRows` | **Returns** |
| `Robomotion.Excel365.RangeWrite` | **Expects** |
| `Robomotion.Airtable.GetBaseSchema` | **Returns** tables array |
| `Robomotion.SQLite.Query` | **Returns** |
| `Robomotion.SQLite.Insert` | **Expects** |
| `Robomotion.DOMParser.ExtractTable` | **Returns** |
| `Robomotion.Pandas.*`, `Robomotion.DataTable.*` | **Uses** |

## Reading Data

### CSV with Headers
```typescript
f.node('8b3e72', 'Core.CSV.ReadCSV', 'Read CSV', {
  inFilePath: Custom('data.csv'),
  optHeaders: true,
  outTable: Message('table')
});
// msg.table.columns = ["name", "age", "location"]
// msg.table.rows[0] = {"name": "John", "age": 54, "location": "Boston"}
```

### Excel Range (Local)
```typescript
f.node('c5f4a1', 'Core.Excel.GetRange', 'Get Range', {
  inFileDescriptor: Message('excel_fd'),
  inFromCell: Custom('A1'),
  inToCell: Custom('C10'),
  optHeaders: true,
  optJsonify: true,
  outRange: Message('table')
});
// With jsonify: "Price Range" -> "price_range"
```

### Excel 365 (Cloud)
```typescript
f.node('d2e8b6', 'Robomotion.Excel365.RangeRead', 'Read Range', {
  inClientID: Message('client_id'),
  inWorkbookId: Message('workbook_id'),
  inSheetName: Custom('Sheet1'),
  inRange: Custom('A1:C10'),
  optHeaders: true,
  optJsonify: true,
  outTable: Message('table')
});
```

### Google Sheets
```typescript
f.node('e9c3d4', 'Robomotion.GoogleSheets.GetRange', 'Get Range', {
  inClientID: Message('sheets_client'),
  inSpreadsheetId: Custom('spreadsheet-id'),
  inRange: Custom('Sheet1!A1:C10'),
  optHeaders: true,
  optJsonify: true,
  outTable: Message('table')
});
```

### DOM Parser (Extract HTML Table)
```typescript
f.node('f1a7b2', 'Robomotion.DOMParser.ExtractTable', 'Extract Table', {
  inHTML: Message('html_content'),
  inSelector: Custom('table.data'),
  optHeaders: true,
  outTable: Message('table')
});
// Extracts table from HTML string into { columns, rows } format
```

## Iterating Over Rows

Use `Core.Programming.ForEach` on `table.rows`:

```typescript
f.node('1a2b3c', 'Core.CSV.ReadCSV', 'Read CSV', {
  inFilePath: Custom('products.csv'),
  optHeaders: true,
  outTable: Message('products')
});

// Label before loop
f.node('4d5e6f', 'Core.Flow.Label', 'Next Product', {});
f.edge('1a2b3c', 0, '4d5e6f', 0);

f.node('7a8b9c', 'Core.Programming.ForEach', 'For Each', {
  optInput: Message('products.rows'),  // CRITICAL: .rows
  optOutput: Message('product')
});
f.edge('4d5e6f', 0, '7a8b9c', 0);

// Loop body (port 0) — Log has 0 outputs, connect via edge only
f.node('d0e1f2', 'Core.Flow.Log', 'Log Name', {
  inText: Message('product.name')
});
f.edge('7a8b9c', 0, 'd0e1f2', 0);

f.node('a3b4c5', 'Core.Flow.Log', 'Log Price', {
  inText: Message('product.price')
});
f.edge('7a8b9c', 0, 'a3b4c5', 0);

f.node('6d7e8f', 'Core.Flow.GoTo', 'Goto', {
  optNodes: { ids: ['4d5e6f'], type: 'goto', all: false }
});
f.edge('7a8b9c', 0, '6d7e8f', 0);

// After loop (port 1)
f.node('9a0b1c', 'Core.Flow.Stop', 'Done', {});
f.edge('7a8b9c', 1, '9a0b1c', 0);
```

**Important**: Iterate over `table.rows`, not `table` directly.

## Manipulating Data

### Add Row
```typescript
f.node('2c3d4e', 'Core.Programming.Function', 'Add Row', {
  func: `
    msg.table.rows.push({
      "name": "Tom",
      "age": 28,
      "location": "Chicago"
    });
    return msg;
  `
});
```

### Filter Rows
```typescript
f.node('5f6a7b', 'Core.Programming.Function', 'Filter', {
  func: `
    msg.filtered = {
      columns: msg.table.columns,
      rows: msg.table.rows.filter(function(row) { return row.age > 30; })
    };
    return msg;
  `
});
```

### Map/Transform Rows
```typescript
f.node('8c9d0e', 'Core.Programming.Function', 'Transform', {
  func: `
    msg.table.rows = msg.table.rows.map(function(row) {
      row.fullName = row.firstName + " " + row.lastName;
      return row;
    });
    return msg;
  `
});
```

### Sort Rows
```typescript
f.node('1f2a3b', 'Core.Programming.Function', 'Sort', {
  func: `
    msg.table.rows.sort(function(a, b) { return a.price - b.price; });
    return msg;
  `
});
```

### Remove Duplicates
```typescript
f.node('4c5d6e', 'Core.Programming.Function', 'Remove Duplicates', {
  func: `
    var seen = {};
    msg.table.rows = msg.table.rows.filter(function(row) {
      if (seen[row.email]) return false;
      seen[row.email] = true;
      return true;
    });
    return msg;
  `
});
```

## Creating Tables

### Initialize Empty Table
```typescript
f.node('7f8a9b', 'Core.Programming.Function', 'Initialize', {
  func: `
    msg.results = {
      columns: ["url", "title", "price"],
      rows: []
    };
    return msg;
  `
});
```

### Build Table in Loop

Initialize a table with `{ columns: [...], rows: [] }`, then use `rows.push({...})` inside a ForEach loop body to accumulate data. See `loops.md` for the ForEach + Label/GoTo wiring pattern.

## Writing Data

**CRITICAL**: All write operations expect the `{ columns, rows }` format or an array of objects with `optHeader: true`.

### Simple Array of Objects (with optHeader)

When writing simple data, you can use an array of objects and enable headers:

```typescript
// Prepare data as array of objects
f.node('7e8f9a', 'Core.Programming.Function', 'Prepare Data', {
  func: `
msg.data = [
  { "Name": "John", "Age": 30 },
  { "Name": "Jane", "Age": 25 }
];
return msg;
  `
});

// Write with optHeader: true
f.node('0b1c2d', 'Core.Excel.SetRange', 'Write Data', {
  inFileDescriptor: { name: 'excel_fd', scope: 'Message' },
  inStartCell: { name: 'A1', scope: 'Custom' },
  inTable: { name: 'data', scope: 'Message' },
  optHeader: true  // IMPORTANT: Writes column headers from object keys
});
```

### Write to CSV
```typescript
f.node('3e4f5a', 'Core.CSV.WriteCSV', 'Write CSV', {
  inFilePath: Custom('/output/data.csv'),
  inTable: Message('table'),
  optHeaders: true
});
```

### Write to Excel
```typescript
f.node('6b7c8d', 'Core.Excel.Create', 'Create Excel', {
  inPath: Custom('/output/report.xlsx'),
  outFileDescriptor: Message('excel_fd'),
  optOverwrite: true
})
  .then('9e0f1a', 'Core.Excel.SetRange', 'Set Range', {
    inFileDescriptor: Message('excel_fd'),
    inStartCell: Custom('A1'),
    inTable: Message('table')
  })
  .then('2b3c4d', 'Core.Excel.Save', 'Save', {
    inFileDescriptor: Message('excel_fd')
  })
  .then('5e6f7a', 'Core.Excel.Close', 'Close', {
    inFileDescriptor: Message('excel_fd')
  });
```

### Insert into SQLite
```typescript
f.node('8b9c0d', 'Robomotion.SQLite.Insert', 'Insert', {
  inConnectionId: Message('conn_id'),
  inTable: Custom('products'),
  inData: Message('table')
});
```

### Write to Excel 365 (Cloud)
```typescript
f.node('1e2f3a', 'Robomotion.Excel365.RangeWrite', 'Write Range', {
  inClientID: Message('client_id'),
  inWorkbookId: Message('workbook_id'),
  inSheetName: Custom('Sheet1'),
  inRange: Custom('A1'),
  inTable: Message('table'),
  optHeader: true
});
```

### Write to Google Sheets
```typescript
// SetRange - overwrites existing data
f.node('4b5c6d', 'Robomotion.GoogleSheets.SetRange', 'Set Range', {
  inClientID: Message('sheets_client'),
  inSpreadsheetId: Custom('spreadsheet-id'),
  inRange: Custom('Sheet1!A1'),
  inTable: Message('table')
});

// AppendRange - adds rows to end of existing data
f.node('7e8f9b', 'Robomotion.GoogleSheets.AppendRange', 'Append', {
  inClientID: Message('sheets_client'),
  inSpreadsheetId: Custom('spreadsheet-id'),
  inRange: Custom('Sheet1!A1'),
  inTable: Message('table')
});
```

## API Response to Table

```typescript
f.node('0a1b2c', 'Core.Net.HttpRequest', 'HTTP Request', {
  optUrl: Custom('https://api.example.com/users'),
  optMethod: 'get',
  outBody: Message('response')
})
  .then('3d4e5f', 'Core.Programming.Function', 'Transform', {
    func: `
      msg.users = {
        columns: ["id", "name", "email"],
        rows: msg.response.data.map(function(user) {
          return { id: user.id, name: user.name, email: user.email };
        })
      };
      return msg;
    `
  });
```

## Quick Reference

| Operation | Method |
|-----------|--------|
| Read CSV | `Core.CSV.ReadCSV` |
| Write CSV | `Core.CSV.WriteCSV` |
| Read local Excel | `Core.Excel.GetRange` |
| Write local Excel | `Core.Excel.SetRange` |
| Read Excel 365 | `Robomotion.Excel365.RangeRead` |
| Write Excel 365 | `Robomotion.Excel365.RangeWrite` |
| Read Google Sheets | `Robomotion.GoogleSheets.GetRange` |
| Write Google Sheets | `Robomotion.GoogleSheets.SetRange`, `AppendRange` |
| Extract HTML table | `Robomotion.DOMParser.ExtractTable` |
| SQLite query | `Robomotion.SQLite.Query` |
| SQLite insert | `Robomotion.SQLite.Insert` |
| Iterate rows | `ForEach` on `table.rows` |
| Add row | `rows.push(rowObj)` in Function |
| Filter rows | `rows.filter()` in Function |
| Transform rows | `rows.map()` in Function |
| Sort rows | `rows.sort()` in Function |
| Row count | `table.rows.length` |
| Access field | `row.fieldName` |
