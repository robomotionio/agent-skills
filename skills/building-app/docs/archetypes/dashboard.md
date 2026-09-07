# Archetype: dashboard

## Choose it when

The person wants to WATCH something: "see how the shop is doing", "keep an eye on orders", "a screen for the wall". The verbs are look, monitor, track, check. Nobody edits anything; at most they press Refresh. If the request includes deciding or entering data, it's a different archetype (approval-queue or form-and-table) that may CONTAIN a dashboard-style overview.

## Screens

- **overview** (`/`): a `Grid` of `Stat` tiles on top (the 3-6 numbers that matter, each with its change against the previous period and `upIsGood={false}` where a rise is bad), a `DateRangePicker` for the period when the numbers are over one, a `Chart` when one of those numbers is really a shape - takings by month, tickets by day, us against the competition week by week - a `DataTable` of the most recent records below, a Refresh `Button`, and a "last updated" line. That one screen is usually the whole app.
- Optional **detail** (`/detail`) only if the person asks to click into a row.

Sample data: a `SAMPLE_METRICS` and `SAMPLE_RECENT` const per screen with realistic numbers, and a `SAMPLE_SERIES` for the chart, kept as the fallback the screen shows before the first answer arrives.

Never hand-write a stat tile. `Stat` is the kit's own and carries the label, the value, the change with its direction and an optional sparkline; a `Card` with your own `text-3xl` and your own green loses all of that and looks like a different app.

`Chart` is the only way to draw one: writing SVG by hand or adding a charting library both break the kit-only rule. One line or one set of bars is `data={{label, value}[]}`. **Several is `series`**, and that is what most dashboard questions actually are - us against three rivals, this branch against the others, this month against last. Each entry is `{ name, points: [{x, y}] }`, `xKind="time"` puts them in date order, and `legend` names them. One chart with four lines, never four charts.

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
    "TrendSeries": {
      "type": "object",
      "properties": {
        "name":   { "type": "string" },
        "points": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "x": { "type": "string" },
              "y": { "type": "number" }
            },
            "required": ["x", "y"]
          }
        }
      },
      "required": ["name", "points"]
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
      "params": {
        "type": "object",
        "properties": {
          "from": { "type": "string", "format": "date" },
          "to":   { "type": "string", "format": "date" }
        }
      },
      "result": {
        "type": "object",
        "properties": {
          "metrics": { "type": "array", "items": { "$ref": "#/types/Metric" } },
          "trends":  { "type": "array", "items": { "$ref": "#/types/TrendSeries" } },
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
