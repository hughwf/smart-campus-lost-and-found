# Database Reference

Vercel Postgres (standard PostgreSQL). Schema lives in `scripts/seed.sql`.

## Tables

### `users`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK, auto-generated |
| `email` | TEXT | Unique, not null |
| `name` | TEXT | From Google profile |
| `phone` | TEXT | Optional |
| `image` | TEXT | Google avatar URL |
| `created_at` | TIMESTAMP | Defaults to `NOW()` |

### `items`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK, auto-generated |
| `user_id` | UUID | FK to `users.id` |
| `type` | VARCHAR(5) | `'lost'` or `'found'` |
| `title` | TEXT | Short title (Gemini-generated or manual) |
| `photo_url` | TEXT | Vercel Blob URL, nullable |
| `description` | TEXT | Natural-language description |
| `location` | TEXT | Where the item was lost/found |
| `extracted` | JSONB | Gemini-extracted structured attributes (see below) |
| `taken` | BOOLEAN | Found items only: did the finder take it? |
| `reward` | TEXT | Lost items only: optional reward |
| `resolved` | BOOLEAN | Defaults to `FALSE` |
| `created_at` | TIMESTAMP | Defaults to `NOW()` |

### `matches`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK, auto-generated |
| `lost_item_id` | UUID | FK to `items.id` |
| `found_item_id` | UUID | FK to `items.id` |
| `score` | FLOAT | 0.0 - 1.0, from Gemini matching |
| `reasoning` | TEXT | Gemini's explanation of the match |
| `created_at` | TIMESTAMP | Defaults to `NOW()` |

## `extracted` JSONB shape

Stored on each item after Gemini analysis. Defined as `ExtractedAttributes` in `lib/types.ts`.

```json
{
  "category": "electronics",
  "subcategory": "earbuds",
  "brand": "AirPods Pro",
  "color": "white",
  "size": null,
  "distinguishing_features": ["scratched case", "engraved initials 'JM'"],
  "condition": "good"
}
```

Valid categories: `electronics`, `clothing`, `accessories`, `bags`, `keys`, `id_cards`, `books`, `water_bottle`, `jewelry`, `sports_equipment`, `other`.

Valid conditions: `new`, `good`, `worn`, `damaged`.

## Indexes

| Index | Columns | Purpose |
|---|---|---|
| `idx_items_user_id` | `items(user_id)` | My Items dashboard queries |
| `idx_items_type_resolved` | `items(type, resolved)` | Fetching unresolved candidates for matching |
| `idx_matches_lost_item_id` | `matches(lost_item_id)` | Match lookups for a lost item |
| `idx_matches_found_item_id` | `matches(found_item_id)` | Match lookups for a found item |

## Query helpers (`lib/db.ts`)

All functions are async and use `@vercel/postgres` tagged template literals.

### Users

| Function | Returns | Description |
|---|---|---|
| `getUserByEmail(email)` | `User \| null` | Look up a user by email |
| `getUserById(id)` | `User \| null` | Look up a user by UUID |
| `upsertUser(email, name, image)` | `User` | Create or update user on sign-in |

### Items

| Function | Returns | Description |
|---|---|---|
| `createItem(item)` | `Item` | Insert a new lost or found item |
| `getItemById(id)` | `ItemWithUser \| null` | Single item JOINed with its user |
| `getItemsByUserId(userId)` | `ItemWithMatchCount[]` | User's items with match count badges |
| `getUnresolvedItemsByType(type)` | `Item[]` | Up to 20 unresolved candidates for matching |
| `resolveItem(id)` | `void` | Mark an item as resolved |

### Matches

| Function | Returns | Description |
|---|---|---|
| `createMatch(lostId, foundId, score, reasoning)` | `Match` | Insert a new match |
| `getMatchesForItem(itemId)` | `MatchWithDetails[]` | Matches with the related opposite item and its user |

## Running the seed script

```bash
psql "$POSTGRES_URL" -f scripts/seed.sql
```

All statements use `IF NOT EXISTS` / `IF NOT EXISTS` so the script is safe to run multiple times.
