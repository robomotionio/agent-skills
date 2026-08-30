# Archetype: dashboard

## Choose it when

The person wants to WATCH something: "see how the shop is doing", "keep an eye on orders", "a screen for the wall". The verbs are look, monitor, track, check. Nobody edits anything; at most they press Refresh. If the request includes deciding or entering data, it's a different archetype (approval-queue or form-and-table) that may CONTAIN a dashboard-style overview.

## Screens

- **overview** (`/`): a `Grid` of `Card` stat tiles on top (the 3-6 numbers that matter), a `DataTable` of the most recent records below, a Refresh `Button`, and a "last updated" line. That one screen is usually the whole app.
- Optional **detail** (`/detail`) only if the person asks to click into a row.

Sample data: a `SAMPLE_METRICS` and `SAMPLE_RECENT` const per screen with realistic numbers, deleted when the collections go live.

## Backend shape

- Collections carry the state: one for the headline numbers, one for the recent records. The robot refreshes them on its own schedule and via `App Update Data`; screens just subscribe.
- One action: refresh on demand. It drives one scrape/fetch pipeline, so queue it - two overlapping refreshes fight over the same browser.
- An event only if a threshold matters ("tell everyone when we sell out"). Refreshing alone needs no event: the collection delta already updates every screen.

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
  "collections": {
    "metrics": {
      "description": "The headline numbers shown on the overview.",
      "record": { "$ref": "#/types/Metric" },
      "key": "name",
      "scope": "shared"
    },
    "recentOrders": {
      "description": "The most recent orders, newest first.",
      "record": { "$ref": "#/types/Order" },
      "key": "id",
      "scope": "shared",
      "max_records": 200
    }
  },
  "screens": {
    "overview": { "description": "See the headline numbers and the latest orders at a glance.", "route": "/" }
  }
}
```
