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

Create a new lost or found item. Automatically triggers Gemini semantic matching against unresolved items of the opposite type.

### Request

**Content-Type:** `multipart/form-data`

| Field         | Type   | Required | Description                          |
|---------------|--------|----------|--------------------------------------|
| `photo`       | File   | No       | Item photo (uploaded to Vercel Blob) |
| `title`       | String | Yes      | Item title                           |
| `description` | String | Yes      | Item description                     |
| `location`    | String | Yes      | Where the item was lost/found        |
| `type`        | String | Yes      | `"lost"` or `"found"`               |
| `extracted`   | String | No       | JSON string of `ExtractedAttributes` |
| `taken`       | String | Found only | `"true"` or `"false"`             |
| `reward`      | String | Lost only  | Optional reward description        |

### Response `201 Created`

```json
{
  "item": { "id": "uuid", "type": "lost", "title": "...", "..." : "..." },
  "matches": [
    { "id": "uuid", "lost_item_id": "uuid", "found_item_id": "uuid", "score": 0.85, "reasoning": "..." }
  ]
}
```

### Flow

1. Validate required fields
2. Upload photo to Vercel Blob (if provided)
3. Parse `extracted` JSON (if provided)
4. Insert item into database
5. Query up to 20 unresolved items of the opposite type
6. Send to Gemini for semantic matching (best-effort — failures are logged but don't block item creation)
7. Insert matches with score > 0.3
8. Return created item + matches

### Error Responses

| Status | Body | Description |
|--------|------|-------------|
| 400 | `{ "error": "Title is required" }` | Missing title |
| 400 | `{ "error": "Description is required" }` | Missing description |
| 400 | `{ "error": "Location is required" }` | Missing location |
| 400 | `{ "error": "Type must be 'lost' or 'found'" }` | Invalid type |
| 400 | `{ "error": "File must be an image" }` | Non-image file |
| 401 | `{ "error": "Unauthorized" }` | Not signed in |
| 500 | `{ "error": "Failed to create item" }` | Server error |

---

## `GET /api/items/mine`

List the current user's items with match counts, sorted by most recent.

### Request

No parameters required. The user is identified from the session.

### Response `200 OK`

```json
{
  "items": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "type": "lost",
      "title": "Blue Stanley Cup",
      "photo_url": "https://...",
      "description": "A blue 40oz Stanley tumbler...",
      "location": "Science Building Room 201",
      "extracted": { "category": "water_bottle", "..." : "..." },
      "taken": null,
      "reward": "$10",
      "resolved": false,
      "created_at": "2026-02-20T12:00:00.000Z",
      "match_count": 2
    }
  ]
}
```

### Error Responses

| Status | Body | Description |
|--------|------|-------------|
| 401 | `{ "error": "Unauthorized" }` | Not signed in |
| 500 | `{ "error": "Failed to fetch items" }` | Server error |

### Notes

- Returns all items for the current user (both lost and found, resolved and unresolved).
- Each item includes a `match_count` field with the total number of matches.
- Items are sorted by `created_at` descending (most recent first).

---

## `GET /api/items/:id`

Get a single item with its matches and related user/item info.

### Request

| Parameter | Type   | Location | Description |
|-----------|--------|----------|-------------|
| `id`      | UUID   | Path     | Item ID     |

### Response `200 OK`

```json
{
  "item": {
    "id": "uuid",
    "user_id": "uuid",
    "type": "found",
    "title": "Blue Stanley Cup",
    "photo_url": "https://...",
    "description": "A blue 40oz Stanley tumbler...",
    "location": "Science Building Room 201",
    "extracted": { "category": "water_bottle", "..." : "..." },
    "taken": false,
    "reward": null,
    "resolved": false,
    "created_at": "2026-02-20T12:00:00.000Z",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "Jane Doe",
      "phone": null,
      "image": "https://...",
      "created_at": "2026-02-20T10:00:00.000Z"
    }
  },
  "matches": [
    {
      "id": "uuid",
      "lost_item_id": "uuid",
      "found_item_id": "uuid",
      "score": 0.85,
      "reasoning": "Same brand, color, and location...",
      "created_at": "2026-02-20T12:05:00.000Z",
      "item": {
        "id": "uuid",
        "type": "lost",
        "title": "Lost Stanley Tumbler",
        "..." : "..."
      },
      "user": {
        "id": "uuid",
        "email": "other@example.com",
        "name": "John Smith",
        "phone": null,
        "image": "https://...",
        "created_at": "2026-02-20T09:00:00.000Z"
      }
    }
  ]
}
```

### Error Responses

| Status | Body | Description |
|--------|------|-------------|
| 401 | `{ "error": "Unauthorized" }` | Not signed in |
| 404 | `{ "error": "Item not found" }` | No item with that ID |
| 500 | `{ "error": "Failed to fetch item" }` | Server error |

### Notes

- The `item` object includes the owner's `user` info (for contact purposes).
- Each match includes the related `item` (the opposite-type item) and its owner `user` info.
- Matches are sorted by `score` descending (best match first).
- Any authenticated user can view any item — access is not restricted to the item owner.

---

## `POST /api/items/:id/resolve`

Mark an item as resolved (reunited with owner). Only the item owner can resolve their items.

### Request

| Parameter | Type   | Location | Description |
|-----------|--------|----------|-------------|
| `id`      | UUID   | Path     | Item ID     |

No request body is required.

### Response `200 OK`

```json
{ "success": true }
```

### Error Responses

| Status | Body | Description |
|--------|------|-------------|
| 400 | `{ "error": "Item is already resolved" }` | Item was already resolved |
| 401 | `{ "error": "Unauthorized" }` | Not signed in |
| 403 | `{ "error": "You can only resolve your own items" }` | Not the item owner |
| 404 | `{ "error": "Item not found" }` | No item with that ID |
| 500 | `{ "error": "Failed to resolve item" }` | Server error |

### Notes

- Only the item owner (the user who created it) can mark it as resolved.
- Resolving an item sets `resolved = true` in the database.
- Resolved items are excluded from future matching queries (`getUnresolvedItemsByType`).

---

## `POST /api/match`

Trigger matching for an existing item against unresolved candidates of the opposite type. Useful for re-running matching after new items have been reported.

### Request

**Content-Type:** `application/json`

```json
{ "item_id": "uuid" }
```

### Response `200 OK`

```json
{
  "matches": [
    { "id": "uuid", "lost_item_id": "uuid", "found_item_id": "uuid", "score": 0.85, "reasoning": "..." }
  ]
}
```

Returns `{ "matches": [] }` when no candidates exist or none score above 0.3.

### Error Responses

| Status | Body | Description |
|--------|------|-------------|
| 400 | `{ "error": "item_id is required" }` | Missing or invalid item_id |
| 401 | `{ "error": "Unauthorized" }` | Not signed in |
| 404 | `{ "error": "Item not found" }` | No item with that ID |
| 500 | `{ "error": "Failed to match items" }` | Gemini or database error |

---

## Authentication

All endpoints (except `GET /api/auth/*`) require an active NextAuth session. The middleware at `middleware.ts` protects `/report/*` and `/my-items/*` pages. API routes check for `session.userId` and return 401 if missing.

Authentication is via Google OAuth. See [architecture.md](./architecture.md) for details.
