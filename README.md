# Smart Campus Lost & Found

A campus lost & found web app that uses **Gemini Vision AI** to automatically extract structured attributes from item photos, generate titles and descriptions, and semantically match lost items to found items — going beyond simple keyword search.

> "White earbuds near the union" matches "found AirPods Pro at Student Union food court" because Gemini understands they're the same thing.

## How It Works

**Finder Flow** — Upload a photo of a found item → Gemini auto-generates a title & description → add location details → system matches against existing lost items → review matches and contact the owner.

**Loser Flow** — Optionally upload a photo → describe what you lost → system matches against existing found items → matched finders are notified.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** Vercel Postgres
- **Image Storage:** Vercel Blob
- **Auth:** NextAuth.js (Google OAuth)
- **AI:** Gemini 2.0 Flash (`@google/generative-ai`)
- **Styling:** Tailwind CSS
- **Deploy:** Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- A Google Cloud project with OAuth credentials
- A Gemini API key
- A Vercel account (for Postgres, Blob storage, and deployment)

### Environment Variables

Create a `.env.local` file:

```
GEMINI_API_KEY=
POSTGRES_URL=
BLOB_READ_WRITE_TOKEN=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
```

### Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Features

### MVP

- Google OAuth sign-in
- Photo upload with client-side compression
- Gemini-powered title/description generation (editable before submit)
- Report found items (photo, title, description, location, taken/left status)
- Report lost items (optional photo, title, description, location, optional reward)
- Automatic semantic matching on new item upload
- Match display with score, reasoning, and contact info
- My Items dashboard
- Mobile-responsive layout

### Stretch

- Email notifications on new matches
- "Similar items" suggestions

## Project Structure

```
app/
├── page.tsx                    # Landing page
├── report/found/page.tsx       # Report found item
├── report/lost/page.tsx        # Report lost item
├── my-items/page.tsx           # User's items dashboard
├── items/[id]/page.tsx         # Item detail + matches
└── api/                        # API routes (auth, items, matching)

lib/
├── gemini.ts                   # Gemini client & prompts
├── db.ts                       # SQL query helpers
├── auth.ts                     # NextAuth config
└── types.ts                    # Shared TypeScript types

components/
├── ItemCard.tsx
├── MatchCard.tsx
├── PhotoUpload.tsx
└── ItemForm.tsx
```

## License

MIT
