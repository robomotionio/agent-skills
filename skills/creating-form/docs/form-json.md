# form.json

One JSON object: the form's title, its sections of questions, what the submit button and the thank-you say, and its colour. It is the same object the Designer's form builder saves, so a form made here opens there, and back.

```json
{
  "id": "internship_application",
  "title": "Summer Internship Application",
  "description": "Apply for the summer internship. It takes about five minutes.",
  "sections": [
    {
      "id": "about_you",
      "title": "About you",
      "layout": "vertical",
      "fields": [
        {
          "id": "name_row", "type": "container", "label": "", "required": false, "properties": {},
          "isContainer": true, "containerLayout": "column_2",
          "children": [
            { "id": "first_name", "type": "text", "label": "First name", "required": true, "placeholder": "Ada", "properties": { "columnIndex": 0 } },
            { "id": "last_name", "type": "text", "label": "Last name", "required": true, "placeholder": "Lovelace", "properties": { "columnIndex": 1 } }
          ]
        },
        { "id": "email", "type": "email", "label": "Email", "required": true, "placeholder": "you@example.com", "properties": {} },
        {
          "id": "track", "type": "dropdown", "label": "Which track?", "required": true, "properties": {},
          "options": [
            { "label": "RPA Developer", "value": "rpa_developer" },
            { "label": "Web Automation", "value": "web_automation" },
            { "label": "Data", "value": "data" }
          ]
        }
      ]
    },
    {
      "id": "documents",
      "title": "Documents",
      "layout": "vertical",
      "fields": [
        { "id": "why", "type": "textarea", "label": "Why do you want to join?", "required": true, "properties": {},
          "validation": { "minLength": 50, "customMessage": "A few sentences, please (50 characters or more)." } },
        { "id": "cv", "type": "file", "label": "Your CV (PDF)", "required": true, "properties": {} }
      ]
    }
  ],
  "settings": {
    "submitButtonText": "Send application",
    "successMessage": "Thank you! We will get back to you within two weeks.",
    "showProgressBar": false
  },
  "theme": { "color": "#2563EB" }
}
```

## Top level

| Key | | |
|---|---|---|
| `title` | required | The heading; also the form's name in Robomotion |
| `description` | | One line under the title |
| `sections` | required | At least one. Each `{ "id", "title"?, "layout": "vertical", "fields": [...] }` |
| `settings.submitButtonText` | | Default "Submit" |
| `settings.successMessage` | | Shown after a successful answer |
| `settings.showProgressBar` | | Shows page progress on a form with several pages |
| `theme.color` | | `#rrggbb`: the bar on top, buttons and accents |
| `theme.logoUrl` | | An image URL shown above the title |
| `id`, `category`, `tags` | | Labels for the form list; `id` is not the field namespace |

`settings.redirectUrl` exists in the builder but the page does not redirect; leave it out.

**Pages:** a section with `"isPageBreak": true` starts a new page (Next / Back buttons; each page is checked before moving on). Not on the first section.

## A question

```json
{
  "id": "phone",                 // the key in the answer: msg.item.phone. snake_case, unique in the whole form
  "type": "phone",
  "label": "Phone number",
  "required": false,
  "placeholder": "+1 555 123 4567",
  "properties": {},              // always present; layout hints go here
  "validation": { "minLength": 7, "maxLength": 20, "pattern": "^[+0-9 ()-]+$", "min": 0, "max": 100, "customMessage": "..." },
  "options": [{ "label": "Shown", "value": "sent" }],        // dropdown, radio, checkbox
  "conditionalLogic": { ... }    // below
}
```

`validation`: `minLength` / `maxLength` / `pattern` (a JavaScript regular expression) check text; `min` / `max` check a `number`. `customMessage` replaces the error text. `email`, `url` and `phone` check their own shape.

## Types, and what each sends

Every value arrives in the answer under the question's id. Most are strings, even numbers.

| `type` | Shows | Sends |
|---|---|---|
| `text`, `textarea`, `password` | A text box (textarea: several lines) | `"..."` |
| `email`, `url` | A text box that checks the shape | `"ada@example.com"` |
| `phone` | A phone box | `"+15551234567"` (digits, `+` kept) |
| `international_phone` | Country code picker + number | `"+44 7700 900123"` |
| `number` | A number box | `"42"` (a string) |
| `date`, `time` | Pickers | `"2026-07-01"`, `"14:30"` |
| `dropdown`, `radio` | One choice of `options` (required list) | the chosen `value` |
| `checkbox` | With `options`: several choices. Without: one box labelled with `label` | `["a","c"]`, or `["true"]` when the single box is ticked |
| `rating` | Stars 1 to 5 | `"4"` |
| `scale` | 1 to 10 | `"7"` |
| `fullname` | First + last name boxes | `"Ada|Lovelace"` |
| `address` | Street, city, state, ZIP, country | `"1 Main St|Springfield|IL|62701|United States"` |
| `country_dropdown` | A country list | the country |
| `currency_dropdown` | Currency + amount | `"EUR|1200"` |
| `country_city` | Country, then its cities | `"Germany|Berlin"` |
| `file` | Drag and drop or browse, up to 50 MB | a link to the uploaded file: `"https://files.robomotion.io/forms/<form>/<uuid>-cv.pdf"` |
| `signature` | A box to sign in | a `data:image/png;base64,...` image |
| `hidden` | Nothing | its value in the form's `data` (below) |
| `heading` | A heading: `label`, size `properties.headingLevel` `h1`..`h5` | nothing |
| `paragraph` | Text: the `placeholder` (yes, placeholder), size `properties.fontSize` `xs`..`xl` | nothing |
| `divider`, `spacer` | A line; empty space of `properties.height` px | nothing |

Pipe-joined values (`fullname`, `address`, `currency_dropdown`, `country_city`) are split in the flow: `msg.item.full_name.split('|')`. A question left empty is missing from the answer, not `""`.

## Side by side: containers

A container puts its `children` in columns. It is not a question and sends nothing of its own; its children send their values at the top level, by their own ids.

```json
{ "id": "name_row", "type": "container", "label": "", "required": false, "properties": {},
  "isContainer": true, "containerLayout": "column_2", "children": [ ... ] }
```

`containerLayout`: `row` (1 column), `column_2`, `column_3`, `column_1_2` (narrow + wide), `column_2_1`. Each child says its column with `properties.columnIndex` (0-based). No container inside a container.

## Repeating entries: arrays

Add `"isArray": true` to a container for a list the visitor grows ("Add guest"): references, line items, family members.

```json
{ "id": "guests", "type": "container", "label": "Guests", "required": false, "properties": {},
  "isContainer": true, "isArray": true, "minItems": 1, "maxItems": 10, "arrayItemName": "Guest",
  "containerLayout": "column_2",
  "children": [
    { "id": "name", "type": "text", "label": "Name", "required": true, "properties": { "columnIndex": 0 } },
    { "id": "email", "type": "email", "label": "Email", "required": false, "properties": { "columnIndex": 1 } }
  ] }
```

Sends `"guests": [{ "name": "...", "email": "..." }, ...]` under the container's id. Use a plural id; child ids are short because they live inside each entry. A required array needs at least one complete entry.

## Show a question only when...: conditional logic

```json
"conditionalLogic": {
  "enabled": true,
  "logicType": "any",
  "conditions": [
    { "id": "c1", "sourceFieldId": "track", "operator": "equals", "value": "data", "action": "show" }
  ]
}
```

- `operator`: `equals`, `not_equals`, `contains`, `not_contains`, `is_empty`, `is_not_empty`, `greater_than`, `less_than`, `in_list`, `not_in_list` (`value` a comma-separated string or a list).
- `action`: `show`, `hide`, `enable`, `disable`, `require`. With `show`, the question is hidden until the condition holds; with `hide`, shown until it does.
- `logicType`: `all` (every condition) or `any` (one is enough). Use one action per question.
- Compare against the option's `value`, not its label. A hidden question is not checked and is not required.
- Works on a container too (shows or hides the whole group).

## Pre-filled answers

A top-level `data` object fills questions before the visitor types, and a `hidden` question carries its value into every answer:

```json
"data": { "source": "website", "country": "Germany" }
```

Use it to tag where answers came from (one form per source). Values on the link itself (`?source=...`) are not read: the page drops the query string of a link.
