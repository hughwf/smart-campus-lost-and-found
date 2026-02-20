# Gemini AI Integration

The app uses **Gemini 2.0 Flash** (`@google/generative-ai`) for two core features: generating item details from photos and semantically matching lost/found items.

## Setup

Requires the `GEMINI_API_KEY` environment variable. The client is initialized in `lib/gemini.ts`:

```ts
import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
```

---

## Title & Description Generation

**Function:** `generateTitleAndDescription(photoBase64, mimeType, type)`

**Purpose:** Given a photo of an item, generate a human-readable title, description, and structured attributes for matching.

### Input

| Parameter     | Type                | Description                        |
|---------------|---------------------|------------------------------------|
| `photoBase64` | `string`            | Base64-encoded image data          |
| `mimeType`    | `string`            | Image MIME type (e.g. `image/jpeg`)|
| `type`        | `"lost" \| "found"` | Item type for prompt context       |

### Output (`GenerateResponse`)

```ts
{
  title: string;           // 2-4 word title
  description: string;     // 1-3 sentence description
  extracted: {
    category: string;      // e.g. "electronics", "clothing"
    subcategory: string;   // e.g. "earbuds", "jacket"
    brand: string | null;
    color: string;
    size: string | null;
    distinguishing_features: string[];
    condition: "new" | "good" | "worn" | "damaged";
  }
}
```

### Valid Categories

`electronics`, `clothing`, `accessories`, `bags`, `keys`, `id_cards`, `books`, `water_bottle`, `jewelry`, `sports_equipment`, `other`

### Error Handling & Retry Logic

1. Gemini is prompted to return **only valid JSON**.
2. The response is stripped of markdown fences (`` ```json ... ``` ``).
3. If `JSON.parse` fails, a **retry** is attempted with a stricter prompt appending: `"IMPORTANT: Respond with ONLY valid JSON, no markdown formatting."`
4. If the retry also fails, the error propagates to the API route, which returns a 500 so the client can fall back to manual entry.

### Response Validation

The API route (`/api/items/generate`) validates Gemini's response before returning it:

- `title` and `description` must be non-empty strings.
- `extracted.category` must be one of the valid category enums.
- `extracted.condition` must be one of: `new`, `good`, `worn`, `damaged`.
- `extracted.brand` and `extracted.size` must be `string | null`.
- `extracted.distinguishing_features` must be an array of strings.

If validation fails, the endpoint returns a 502.

---

## Item Matching

**Function:** `matchItems(newItem, candidates)`

**Purpose:** Semantically match a newly reported item against candidates of the opposite type (lost vs found).

### Input

| Parameter    | Type     | Description                                 |
|--------------|----------|---------------------------------------------|
| `newItem`    | `Item`   | The newly created item                      |
| `candidates` | `Item[]` | Unresolved items of the opposite type       |

### Output (`MatchResult[]`)

```ts
{
  candidate_id: string;  // UUID of the matched item
  score: number;         // 0.0 to 1.0 confidence
  reasoning: string;     // Brief explanation of why they match
}
```

Only matches with `score > 0.3` are returned.

### Matching Criteria

The prompt instructs Gemini to consider:

- **Category** — are they the same type of item?
- **Color** — do the colors match?
- **Brand** — same brand or compatible?
- **Distinguishing features** — scratches, engravings, stickers, etc.
- **Location proximity** — were they lost/found in similar areas?
- **Time proximity** — how close in time were they reported?

### Error Handling

If the Gemini call or JSON parsing fails, `matchItems` returns an empty array — matching failures are non-blocking.
