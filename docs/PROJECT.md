# Smart Campus Lost & Found

A campus lost & found app where Gemini Vision extracts structured attributes from item photos, auto-generates titles and descriptions, and semantically matches lost items to found items automatically. Finders review matches and contact losers directly.

---

## How It Works

### Finder Flow
1. Finder signs in (Google OAuth)
2. Uploads a photo of the found item
3. Gemini auto-generates a title and description — finder can edit before submitting
4. Finder adds location details and whether they took the item or left it
5. Item is saved; Gemini matches it against existing lost items
6. When new lost items are posted later, Gemini re-matches and the finder gets notified
7. Finder reviews matches, sees loser's contact info, and decides whether to reach out

### Loser Flow
1. Loser signs in (Google OAuth)
2. Optionally uploads a photo of the item (for the finder to visually confirm)
3. Gemini auto-generates a title and description — loser can edit before submitting
4. Loser adds location where they think they lost it, and optionally offers a reward
5. Item is saved; Gemini matches it against existing found items
6. Matching finders are notified and can review the match

The core value: fuzzy semantic matching that keyword search can't do. "White earbuds near the union" matches "found AirPods Pro at Student Union food court" because Gemini understands they're the same thing.

---

## Tech Stack

| Layer | Tool |
|-------|------|
| Framework | Next.js 14 (App Router) |
| Database | Vercel Postgres |
| Image Storage | Vercel Blob |
| Auth | NextAuth.js (Google OAuth) |
| AI | Gemini 2.0 Flash via `@google/generative-ai` |
| Styling | Tailwind CSS |
| Deploy | Vercel |

---

## Database Schema

```sql
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT UNIQUE NOT NULL,
  name            TEXT,
  phone           TEXT,
  image           TEXT,
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) NOT NULL,
  type            VARCHAR(5) NOT NULL CHECK (type IN ('lost', 'found')),
  title           TEXT NOT NULL,
  photo_url       TEXT,
  description     TEXT NOT NULL,
  location        TEXT,
  extracted       JSONB,
  -- Found items only
  taken           BOOLEAN,
  -- Lost items only
  reward          TEXT,
  resolved        BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE matches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lost_item_id    UUID REFERENCES items(id),
  found_item_id   UUID REFERENCES items(id),
  score           FLOAT NOT NULL,
  reasoning       TEXT,
  created_at      TIMESTAMP DEFAULT NOW()
);
```

The `extracted` JSONB column stores Gemini's structured output:

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

---

## API Endpoints

### `POST /api/items`
Create a new lost or found item.

**Input:** photo (file), title, description, location, type (lost|found), taken (found only), reward (lost only)

**Flow:**
1. Upload photo to Vercel Blob → get URL
2. Insert into `items` table (user_id from session)
3. Query all unresolved items of the opposite type
4. Send new item + candidates to Gemini for matching
5. Insert matches with score > 0.3 into `matches` table
6. Return created item + matches

### `POST /api/items/generate`
Generate title and description from a photo using Gemini.

**Input:** photo (file), type (lost|found)

**Returns:** suggested title, suggested description

Called before form submission so the user can review and edit.

### `GET /api/items/mine`
List the current user's items with their matches.

### `GET /api/items/:id`
Single item with its matches. For found items, includes the loser's contact info on each match.

### `POST /api/items/:id/resolve`
Mark item as resolved.

---

## Gemini Integration

### Title + Description Generation (on photo upload)

```
You are helping a student describe a {type} item for a campus lost & found system.

Given this photo, generate:
1. A short title (2-4 words, like "Blue Stanley Cup" or "AirPods Pro Case")
2. A natural description (1-3 sentences) that a student would write, mentioning key identifying features

Also extract structured attributes for matching.

Respond with ONLY valid JSON:
{
  "title": "short item title",
  "description": "natural human-readable description",
  "extracted": {
    "category": "one of: electronics, clothing, accessories, bags, keys, id_cards, books, water_bottle, jewelry, sports_equipment, other",
    "subcategory": "specific item type",
    "brand": "brand if identifiable, null otherwise",
    "color": "primary color(s)",
    "size": "size if applicable, null otherwise",
    "distinguishing_features": ["list of unique identifying features"],
    "condition": "new/good/worn/damaged"
  }
}
```

### Matching (on item upload, against opposite type)

```
You are matching lost items with found items for a campus lost & found.

Here is a newly reported {type} item:
- Title: {title}
- Description: {description}
- Attributes: {extracted}
- Location: {location}
- Date: {created_at}

Here are candidate {opposite_type} items:
{candidates as numbered list with title, description, attributes, location, date}

For each candidate, assess the probability this is the SAME physical object.
Consider: category, color, brand, distinguishing features, location proximity, time proximity.

Respond with ONLY valid JSON:
{
  "matches": [
    {
      "candidate_id": "uuid",
      "score": 0.0 to 1.0,
      "reasoning": "brief explanation"
    }
  ]
}

Only include candidates with score > 0.3. Sort by score descending.
```

### Error Handling
- Wrap all Gemini calls in try/catch
- If JSON parsing fails, retry once with a stricter prompt
- If generation fails entirely, let the user fill in title/description manually
- Limit candidates to 20 most recent to avoid token limits

---

## Pages

### Landing Page (`/`)
- Explains what the app does
- Two main CTAs: "I Lost Something" / "I Found Something"
- Sign in with Google

### Report Found Item (`/report/found`)
- Photo upload (required)
- Gemini generates title + description → shown in editable fields
- Location: dropdown of common campus landmarks + free text option
- Toggle: "I took it with me" / "I left it at the location"
- Date and time (defaults to now)
- On submit: loading state → redirect to item detail with matches

### Report Lost Item (`/report/lost`)
- Photo upload (optional, for visual confirmation by finder)
- Gemini generates title + description → shown in editable fields (or manual entry if no photo)
- Location: where they think they lost it
- Reward field (optional)
- On submit: loading state → redirect to item detail

### My Items (`/my-items`)
- List of user's posted items (both lost and found)
- Each item shows match count badge if matches exist
- Links to item detail

### Item Detail (`/items/[id]`)
- Full photo, title, description, extracted attributes as tag chips
- Location, date/time, taken/left status (found items), reward (lost items)
- **For found items (finder's view):** match section showing potential matches
  - Loser's photo (if provided) for side-by-side comparison
  - Match score and Gemini's reasoning
  - Loser's contact info (from their account)
  - "Mark as Resolved" button
- **For lost items (loser's view):** status of whether matches have been found
  - "Mark as Resolved" button

---

## Features — MVP (must ship)

- [x] Google OAuth sign-in
- [x] Photo upload with client-side image compression before upload
- [x] Gemini title/description generation from photo (editable)
- [x] Report found item (photo, title, description, location, taken/left, date)
- [x] Report lost item (optional photo, title, description, location, optional reward)
- [x] Automatic matching on new item upload
- [ ] Match display with score, reasoning, and contact info (finder's view)
- [ ] My Items dashboard
- [ ] Mobile-responsive layout

## Features — Stretch (if time allows)

- [ ] Email notifications when a new match is found
- [ ] "Similar items" suggestions (e.g. "3 other people also lost AirPods this week")

---

## File Structure

```
app/
├── layout.tsx
├── page.tsx                      -- Landing page
├── report/
│   ├── found/
│   │   └── page.tsx              -- Report found item form
│   └── lost/
│       └── page.tsx              -- Report lost item form
├── my-items/
│   └── page.tsx                  -- User's items dashboard
├── items/
│   └── [id]/
│       └── page.tsx              -- Item detail + matches
└── api/
    ├── auth/
    │   └── [...nextauth]/
    │       └── route.ts          -- NextAuth Google OAuth
    ├── items/
    │   ├── route.ts              -- POST (create)
    │   ├── mine/
    │   │   └── route.ts          -- GET (user's items)
    │   ├── generate/
    │   │   └── route.ts          -- POST (Gemini title/description)
    │   └── [id]/
    │       ├── route.ts          -- GET (detail)
    │       └── resolve/
    │           └── route.ts      -- POST (resolve)
    └── match/
        └── route.ts              -- POST (trigger matching)

lib/
├── gemini.ts                     -- Gemini client, prompts, generation + matching functions
├── db.ts                         -- SQL query helpers
├── auth.ts                       -- NextAuth config
└── types.ts                      -- Shared TypeScript types

components/
├── ItemCard.tsx
├── MatchCard.tsx
├── PhotoUpload.tsx               -- Photo upload with compression + AI generation
└── ItemForm.tsx
```

---

## Environment Variables

```
GEMINI_API_KEY=
POSTGRES_URL=
BLOB_READ_WRITE_TOKEN=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
```
