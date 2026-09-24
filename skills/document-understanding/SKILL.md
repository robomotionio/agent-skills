---
name: document-understanding
description: "Reads fields and tables out of documents (invoices, receipts, purchase orders, statements, IDs, payslips, forms, any PDF or scan) with a Document Understanding reader, by conversation with a non-technical person: set up or reuse a reader, confirm its fields in plain words, try it on one sample, then build the flow with the Document Understanding nodes and a human check for uncertain documents. Use when the person wants values read from documents."
triggers: [invoice, receipt, payslip, purchase order, delivery note, utility bill, bank statements, scanned, document understanding, /\bocr\b/, /\b(read|extract|pull|capture|scan|parse|digiti[sz]e)\b[^.!?]*\b(pdfs?|documents?|forms?|statements?|bills?|scans?)\b/, /\bfrom (the|these|those|my|our|each|every) (pdfs?|scans?|documents?|forms?)\b/]
---

# Reading documents

A **document reader** (a Document Understanding project) knows what kind of documents to expect and which values to pull out of them. The flow sends each file to the reader and gets the values back, plus a yes/no for "a person should check this". You set the reader up with the `du_*` tools (Robomotion's Build view has them; elsewhere, create the reader in Robomotion's Documents section and use its id), then write the flow.

## Words

The person never hears: project, taxonomy, schema, template, field id, confidence, job, version, JSON, selector, or any id. Say **reader**, **the values it found**, **I'm not sure about**, **someone checks it**. Show values as a short list, as printed on the document. Ids in tool results are for `main.ts` only.

## The conversation (one question per turn)

1. **Where do the files come from?** Ask only if not said: a folder on this computer, an email inbox, a download. You need a real path to at least one sample; an attached PDF is not on disk, so ask for the folder instead.
2. **Reuse first.** `du_list_projects`. If a reader already reads this kind of document, use it and say so in one line.
3. **Set one up.** Pick the template yourself (`du_list_templates` if unsure; never show the list). With sample files: `du_create_project_from_samples` (1 to 3 samples). Without: `du_create_project` with the template, or with `fields` when nothing fits.
4. **Confirm the fields in plain words.** Name what it will read in one sentence ("It will read the invoice number, date, supplier, total and the line items."). Then ask at most one question per turn, only where the meaning is unclear: "Is 'Total' the amount to pay, including tax?", "Do you also need the PO number?" Apply answers with `du_update_schema`; a `description` saying where the value is on the page helps the reader.
5. **Try it on one sample.** `du_process`. Show what it found:
   > From *invoice-0412.pdf*: Invoice number INV-0412, Date 14 March 2026, Total 1,200.00 EUR. I'm not sure about the due date, so invoices like this one will go to a person to check.

   Ask "Does that look right?" If a value is wrong, fix the field's `description` (or type) with `du_update_schema` and try again, at most twice, then move on.
6. **Ask what happens next,** only what is still unknown: where the values go (an Excel file, a sheet, a folder of CSVs), and whether the robot should wait for a person to check uncertain documents or leave them for later.

If `du_process` says no computer picked the document up, say plainly that document reading is not running on any of their computers yet, and carry on building the flow: it will work once it is.

## The flow

Follow `creating-flow` for everything else (hex ids, `validate_flow`, `save_flow`). Look up each node's exact properties (`get_node_schema`, or `robomotion describe node <type>`), and pin the package with `f.addDependency('Robomotion.DocumentUnderstanding', '<a published version from robomotion describe package>')`.

| Node | Use |
|---|---|
| `Robomotion.DocumentUnderstanding.ProcessDocument` | `inFilePath`, `inProjectId` (the reader's id, `Custom('...')`). `optCreateReview: 'yes'` opens a check for a person when unsure (the default `'no'` never does). Outputs `msg.result`, `msg.fields` (value per field id), `msg.needsReview`, `msg.reviewTaskId`. |
| `Robomotion.DocumentUnderstanding.WaitForReview` | `inTaskId: Message('reviewTaskId')`. Holds the flow until the person has checked it (`optTimeout`, default one hour; `optContinueOnTimeout: 'continue'` to go on instead of failing). Its output is `msg.validatedResult`; set `outResult: Message('result')` so both paths carry `msg.result`. |
| `Robomotion.DocumentUnderstanding.Export` | `inResult: Message('result')` gives `msg.fieldsTable` (`optFieldsLayout: 'columns'` for one row per document) and `msg.lineItemsTable` (`optTableID` picks the table). Both are `{columns, rows}`: write them with the nodes in `creating-flow`'s `./docs/patterns/data-tables.md`. |
| `CreateReviewTask`, `GetReviewResult`, `Digitize`, `Classify`, `Extract` | Rarely needed: a check sent without waiting, polling a check later, or the steps one by one. |

Shape, inside the usual loop over the files:

```
ProcessDocument -> Function "Needs a check?" (outputs: 2, msg.needsReview)
  port 0 (yes) -> WaitForReview -> Export
  port 1 (no)  -------------------> Export -> write the row (Excel / CSV / sheet)
```

A document the person rejects comes back with `msg.outcome === 'rejected'`: skip its row and log why.
