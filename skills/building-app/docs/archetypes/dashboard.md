# Archetype: dashboard

## Choose it when

The person wants to WATCH something: "see how the shop is doing", "keep an eye on orders", "a screen for the wall". The verbs are look, monitor, track, check. Nobody edits anything; at most they press Refresh. If the request includes deciding or entering data, it's a different archetype (approval-queue or form-and-table) that may CONTAIN a dashboard-style overview.

## Screens

- **overview** (`/`): a `Grid` of `Card` stat tiles on top (the 3-6 numbers that matter), a `Chart` when one of those numbers is really a shape - takings by month, tickets by day, the split across categories - a `DataTable` of the most recent records below, a Refresh `Button`, and a "last updated" line. That one screen is usually the whole app.
- Optional **detail** (`/detail`) only if the person asks to click into a row.

Sample data: a `SAMPLE_METRICS` and `SAMPLE_RECENT` const per screen with realistic numbers, and a `SAMPLE_SERIES` for the chart, kept as the fallback the screen shows before the first answer arrives.

`Chart` takes `{label, value}[]` and draws it in the app's own accent. It is the only way to draw one: writing SVG by hand or adding a charting library both break the kit-only rule.

## Backend shape

- The numbers live in a database the flow owns - `Robomotion.SQLite` by default, or the system the robot fetched them from when that can be asked again cheaply. The robot writes them there as it collects them.
- One read action, `getOverview`, hands the screen everything on it: the numbers, the chart series and the last few records. A wall screen shows a small fixed amount, so it can hold those rows itself; a list people scroll and search is a paged action instead (`DataTable`'s `source`).
- One action for refresh on demand. It drives one scrape/fetch pipeline, so queue it - two overlapping refreshes fight over the same browser.
- An event when a threshold matters ("tell everyone when we sell out"), and when one person's Refresh should reach a screen nobody is standing at: a table only asks again when something on its own screen makes it, so a wall display would otherwise sit on this morning's numbers.

## `app.json` fragment

```jsonc
{
  "types": {
    "Metric": {
      "type": "object",
      "properties": {
        "name":  { "type": "string" },
        "value": { "type": "number" },
        "unit":  { "type": "string" }
      },
      "required": ["name", "value"]
    },
    "Order": {
      "type": "object",
      "properties": {
        "id":     { "type": "string" },
        "customer": { "type": "string" },
        "total":  { "type": "number" },
        "placed_at": { "type": "string", "format": "date-time" }
      },
      "required": ["id", "total"]
    }
  },
  "actions": {
    "getOverview": {
      "description": "See the headline numbers, the trend and the latest orders.",
      "params": { "type": "object", "properties": {} },
      "result": {
        "type": "object",
        "properties": {
          "metrics": { "type": "array", "items": { "$ref": "#/types/Metric" } },
          "recent":  { "type": "array", "items": { "$ref": "#/types/Order" } },
          "refreshed_at": { "type": "string", "format": "date-time" }
        }
      },
      "timeout_ms": 30000
    },
    "refreshNow": {
      "description": "Fetch the latest numbers right now instead of waiting for the next update.",
      "params": { "type": "object", "properties": {} },
      "result": {
        "type": "object",
        "properties": { "refreshed_at": { "type": "string", "format": "date-time" } }
      },
      "timeout_ms": 120000,
      "concurrency": { "mode": "queue", "limit": 1 },
      "progress": true
    }
  },
  "events": {
    "thresholdCrossed": {
      "description": "A number you care about crossed its limit.",
      "payload": {
        "type": "object",
        "properties": {
          "metric": { "type": "string" },
          "value":  { "type": "number" }
        }
      },
      "audience": "broadcast"
    }
  },
  "screens": {
    "overview": { "description": "See the headline numbers and the latest orders at a glance.", "route": "/" }
  }
}
```
