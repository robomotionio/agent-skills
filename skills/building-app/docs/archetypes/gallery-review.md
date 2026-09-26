# Archetype: gallery-review

## Choose it when

PICTURES are the work, and a PERSON looks at them: "the robot collects the site photos and I approve them", "show me the product shots and let me mark what's wrong", "review the scanned pages and send back the bad ones", "check the screenshots the robot took". The tell is that the person's judgement is about what they SEE, and what they say back points at a place in the picture ("this corner", "the logo here"). If the picture is only a source of numbers to check, it is a document-review; if the decision is yes/no on a row with a thumbnail beside it, it is an approval-queue with an `Image` in the pane.

## Screens

- **gallery** (`/`, icon `images`): the pictures as an `ImageGrid` (`selectable`: click ticks several, Enter opens the one in focus), a `SegmentedControl` above it for where each one is up to (to review / changes asked / approved / all) and a `SearchInput` in a `Toolbar` beside **View** and **Review**. One primary **Approve** in the `Screen` actions approves every ticked picture. A `Lightbox` over the same rows is the full-screen look, with **Review** in its header. Put the `SegmentedControl` on its own line, not inside the `Toolbar`: four options leave no room for the toolbar's buttons on a phone.
- **review** (`/review?id=...`, icon `pencil`): the one picture in `ImageMarkup` with its own tool bar (`onToolChange`) and undo (`useMarkHistory`), and beside it:
  - **What the robot made of it**: a `DescriptionList` and a `Meter` for how sure it was (`uncertain` below about 0.6).
  - **What needs fixing**: `MarkList` bound to the same marks, then a `Composer` whose sentence goes out with them.
  - **Before and after**: when the picture has a previous version, an `ImageCompare` of the two with what was asked last time under it (`MarkList readOnly`).
  - **The marks go to the robot twice.** As data (`marks`, every coordinate a fraction of the picture), and burned into a copy for whoever redoes the picture: `markup.current.exportAnnotated()` → `useFileUpload().upload(new File([blob], ...))` → `annotatedFile: FileRef` in the call. Call `markGesture` on the composer's wrapper right before `run` - the upload took a while, and the call still belongs to the box the person pressed Send in.

Sample pictures: a few drawn locally as SVG data URLs in `lib/mock.ts` (no network, never an image model), shown only while the app has never had a backend (`useConnection()`'s `state === "unconfigured"`), with `sampleSrc(file)` giving the drawn picture for a sample file and `undefined` for every file the robot saved, which `Image` resolves itself. Presses always go to the robot: nothing on these screens pretends a picture was approved.

## Backend shape

- `listPictures` is a paged read (`{filter, status, offset, limit}` → `{rows, total}`); each row carries the saved picture as a `FileRef` (`App Save File` - the kit turns it into a link) and a `thumb`, a 96 px data URL of a few kilobytes (`Image Processing › To Data URL`), which `ImageGrid` shows blurred until the picture lands. A wall of 700 pictures is 700 thumbnails in pages, never one message.
- `getPicture` is one row, for the review screen's `?id=`.
- `requestChanges` is the long one: `progress: true` (the robot narrates "passing it on"), a generous timeout, `queue`/1. The flow fetches `annotatedFile` with `App Get File`, keeps the marks with the picture, and whatever redoes the picture gets the clean original, the annotated copy and the sentence. When the fix must stay inside the marked region, the flow puts the new pixels back with `Image Processing › Composite Image` and a mask, so nothing outside the marks changes.
- `approvePicture` is a quick write that flips the status.
- The pictures, their versions and where each one is up to live in a database the flow owns (`Robomotion.SQLite` unless they belong in a system of record). `pictureReady` says one arrived or came back fixed; the gallery asks its read again rather than patching its list, because events are not buffered.

## `app.json` fragment

```jsonc
{
  "types": {
    "PictureMark": {
      "type": "object",
      "properties": {
        "id":     { "type": "string" },
        "n":      { "type": "integer" },
        "kind":   { "type": "string", "enum": ["pin", "box", "arrow", "freehand", "brush"] },
        "at":     { "type": "array", "items": { "type": "number" } },
        "rect":   { "type": "array", "items": { "type": "number" } },
        "points": { "type": "array", "items": { "type": "array", "items": { "type": "number" } } },
        "width":  { "type": "number" },
        "note":   { "type": "string" }
      },
      "required": ["id", "n", "kind"]
    },
    "Picture": {
      "type": "object",
      "properties": {
        "id":         { "type": "string" },
        "title":      { "type": "string" },
        "file":       { "$ref": "#/types/FileRef" },
        "thumb":      { "type": "string", "description": "A tiny preview as a data URL." },
        "previous":   { "$ref": "#/types/FileRef" },
        "confidence": { "type": "number" },
        "status":     { "type": "string", "enum": ["to_review", "changes_requested", "approved"] },
        "taken_at":   { "type": "string", "format": "date-time" }
      },
      "required": ["id", "title", "file", "status", "taken_at"]
    }
  },
  "actions": {
    "listPictures": {
      "description": "Look up the photos, a page at a time.",
      "params": { "type": "object" },
      "result": { "type": "object" },
      "timeout_ms": 30000
    },
    "getPicture": {
      "description": "Look up one photo.",
      "params": { "type": "object", "properties": { "id": { "type": "string" } }, "required": ["id"] },
      "result": { "$ref": "#/types/Picture" },
      "timeout_ms": 30000
    },
    "requestChanges": {
      "description": "Send a photo back with the places that need fixing marked on it and a sentence about what to change.",
      "params": {
        "type": "object",
        "properties": {
          "id":            { "type": "string" },
          "marks":         { "type": "array", "items": { "$ref": "#/types/PictureMark" } },
          "annotatedFile": { "$ref": "#/types/FileRef" },
          "note":          { "type": "string" }
        },
        "required": ["id", "marks", "annotatedFile", "note"]
      },
      "result": { "$ref": "#/types/Picture" },
      "timeout_ms": 180000,
      "concurrency": { "mode": "queue", "limit": 1 },
      "progress": true
    },
    "approvePicture": {
      "description": "Mark a photo as good to use.",
      "params": { "type": "object", "properties": { "id": { "type": "string" } }, "required": ["id"] },
      "result": { "$ref": "#/types/Picture" },
      "timeout_ms": 30000
    }
  },
  "events": {
    "pictureReady": {
      "description": "A photo arrived or came back fixed, and is ready to look at.",
      "payload": { "$ref": "#/types/Picture" },
      "audience": "broadcast"
    }
  },
  "screens": {
    "gallery": { "description": "Every photo, filtered by where it is up to.", "route": "/" },
    "review":  { "description": "One photo: approve it, or mark what needs fixing and say what should change.", "route": "/review" }
  }
}
```
