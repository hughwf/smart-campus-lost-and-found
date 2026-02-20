# API Reference

All endpoints require authentication via NextAuth.js session unless otherwise noted.

---

## `POST /api/items/generate`

Generate a title, description, and structured attributes from an item photo using Gemini AI.

### Request

**Content-Type:** `multipart/form-data`

| Field  | Type   | Required | Description                            |
|--------|--------|----------|----------------------------------------|
| `photo`| File   | Yes      | Image file (JPEG, PNG, WebP, etc.)     |
| `type` | String | Yes      | `"lost"` or `"found"`                  |

### Response `200 OK`

```json
{
  "title": "Blue Stanley Cup",
  "description": "A blue 40oz Stanley tumbler with a few scratches on the bottom. Has a straw lid.",
  "extracted": {
    "category": "water_bottle",
    "subcategory": "tumbler",
    "brand": "Stanley",
    "color": "blue",
    "size": "40oz",
    "distinguishing_features": ["scratches on bottom", "straw lid"],
    "condition": "good"
  }
}
```

### Error Responses

| Status | Body | Description |
|--------|------|-------------|
| 400 | `{ "error": "Photo is required" }` | No photo attached |
| 400 | `{ "error": "Type must be 'lost' or 'found'" }` | Missing or invalid type |
| 400 | `{ "error": "File must be an image" }` | Non-image file uploaded |
| 401 | `{ "error": "Unauthorized" }` | Not signed in |
| 500 | `{ "error": "Failed to generate item details. Please fill in manually." }` | Gemini API error |
| 502 | `{ "error": "Failed to generate valid item details" }` | Gemini returned malformed data |

### Notes

- The response is a *suggestion* — the user should be able to edit all fields before submitting.
- If the endpoint returns a 500 or 502, the client should fall back to manual entry.

---

## `POST /api/items`

Create a new lost or found item.

**Status:** Not yet implemented.

### Expected Request

**Content-Type:** `multipart/form-data`

| Field         | Type   | Required | Description                          |
|---------------|--------|----------|--------------------------------------|
| `photo`       | File   | Found: yes, Lost: optional | Item photo |
| `title`       | String | Yes      | Item title                           |
| `description` | String | Yes      | Item description                     |
| `location`    | String | Yes      | Where the item was lost/found        |
| `type`        | String | Yes      | `"lost"` or `"found"`               |
| `taken`       | String | Found only | `"true"` or `"false"`             |
| `reward`      | String | Lost only  | Optional reward description        |

### Expected Flow

1. Upload photo to Vercel Blob
2. Insert item into database
3. Query unresolved items of the opposite type
4. Send to Gemini for semantic matching
5. Insert matches with score > 0.3
6. Return created item + matches

---

## `GET /api/items/mine`

List the current user's items with match counts.

**Status:** Not yet implemented.

---

## `GET /api/items/:id`

Get a single item with its matches and related user info.

**Status:** Not yet implemented.

---

## `POST /api/items/:id/resolve`

Mark an item as resolved (reunited with owner).

**Status:** Not yet implemented.

---

## `POST /api/match`

Trigger matching for an item against candidates of the opposite type.

**Status:** Not yet implemented.

---

## Authentication

All endpoints (except `GET /api/auth/*`) require an active NextAuth session. The middleware at `middleware.ts` protects `/report/*` and `/my-items/*` pages. API routes check for `session.userId` and return 401 if missing.

Authentication is via Google OAuth. See [architecture.md](./architecture.md) for details.
