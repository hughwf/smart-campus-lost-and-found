# Architecture

## Overview

Smart Campus Lost & Found is a Next.js 14 App Router application. Users upload photos of lost or found items, Gemini AI extracts structured attributes, and the system semantically matches items across reports.

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Browser    │────▶│  Next.js API  │────▶│  Gemini 2.0     │
│  (React UI)  │◀────│  Routes       │◀────│  Flash          │
└─────────────┘     └──────┬───────┘     └─────────────────┘
                           │
                    ┌──────┴───────┐
                    │              │
              ┌─────▼─────┐ ┌─────▼──────┐
              │  Vercel    │ │  Vercel    │
              │  Postgres  │ │  Blob      │
              └───────────┘ └────────────┘
```

## Tech Stack

| Layer          | Technology                          |
|----------------|-------------------------------------|
| Framework      | Next.js 14 (App Router, TypeScript) |
| Database       | Vercel Postgres (PostgreSQL)        |
| Image Storage  | Vercel Blob                         |
| Authentication | NextAuth.js (Google OAuth)          |
| AI             | Gemini 2.0 Flash                    |
| Styling        | Tailwind CSS                        |
| Deployment     | Vercel                              |

## Directory Structure

```
app/                          # Next.js App Router
├── api/                      # API route handlers
│   ├── auth/[...nextauth]/   # NextAuth OAuth endpoints
│   ├── items/                # Item CRUD
│   │   ├── route.ts          # POST - create item
│   │   ├── generate/route.ts # POST - AI generate title/description
│   │   ├── mine/route.ts     # GET - user's items
│   │   └── [id]/
│   │       ├── route.ts      # GET - item detail
│   │       └── resolve/route.ts # POST - mark resolved
│   └── match/route.ts        # POST - trigger matching
├── report/                   # Report forms (protected)
│   ├── found/page.tsx
│   └── lost/page.tsx
├── my-items/page.tsx          # User dashboard (protected)
├── items/[id]/page.tsx        # Item detail
├── layout.tsx                 # Root layout with Providers
└── page.tsx                   # Landing page

lib/                           # Shared server-side code
├── auth.ts                    # NextAuth configuration
├── db.ts                      # Database query helpers
├── gemini.ts                  # Gemini AI client & functions
└── types.ts                   # TypeScript interfaces

components/                    # React components
├── Header.tsx                 # Navigation + auth
├── Providers.tsx              # NextAuth SessionProvider
├── PhotoUpload.tsx            # Photo upload widget
├── ItemCard.tsx               # Item list card
├── ItemForm.tsx               # Report item form
└── MatchCard.tsx              # Match display card
```

## Authentication

Authentication uses NextAuth.js with Google OAuth:

1. User signs in via Google on the client.
2. On first sign-in, `signIn` callback upserts the user into the `users` table.
3. The `session` callback attaches `userId` (from the database) to the session object.
4. `middleware.ts` protects `/report/*` and `/my-items/*` routes, redirecting unauthenticated users.
5. API routes use `getServerSession(authOptions)` and check `session.userId`.

For full details including Google OAuth setup and environment variables, see [authentication.md](./authentication.md).

## Database

Three tables in Vercel Postgres:

- **`users`** — Google OAuth profiles (id, email, name, phone, image).
- **`items`** — Lost and found items with AI-extracted attributes stored as JSONB.
- **`matches`** — AI-generated matches linking lost items to found items with scores and reasoning.

Query helpers are in `lib/db.ts`. See [api.md](./api.md) for endpoint details.

## AI Pipeline

Two Gemini-powered features (see [gemini-integration.md](./gemini-integration.md)):

1. **Generation** — Photo upload triggers `generateTitleAndDescription()`, which returns a suggested title, description, and structured `extracted` attributes. The user reviews and edits before submitting.

2. **Matching** — On item creation, `matchItems()` compares the new item against all unresolved items of the opposite type, returning scored matches with reasoning. Only matches above 0.3 are saved.

## Data Flow

### Reporting an Item

```
Photo upload
  → POST /api/items/generate
  → Gemini extracts title, description, attributes
  → User reviews/edits in form
  → POST /api/items
  → Photo saved to Vercel Blob
  → Item saved to Postgres
  → matchItems() runs against opposite-type items
  → Matches saved to Postgres
  → Response: item + matches
```

### Viewing Items

```
GET /api/items/mine
  → Authenticate user from session
  → Query items by user_id with match counts
  → Return items sorted by most recent
```

### Item Detail

```
GET /api/items/:id
  → Authenticate user from session
  → Fetch item with owner info
  → Fetch all matches with related items and users
  → Return item + matches (sorted by score)
```

### Resolving an Item

```
POST /api/items/:id/resolve
  → Authenticate user from session
  → Verify item exists
  → Verify user owns the item
  → Set resolved = true
  → Item excluded from future matching
```

## Environment Variables

| Variable              | Purpose                    |
|-----------------------|----------------------------|
| `GEMINI_API_KEY`      | Gemini API authentication  |
| `POSTGRES_URL`        | Vercel Postgres connection |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob access      |
| `GOOGLE_CLIENT_ID`    | Google OAuth client ID     |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret|
| `NEXTAUTH_SECRET`     | NextAuth session encryption|
| `NEXTAUTH_URL`        | App base URL for NextAuth  |
