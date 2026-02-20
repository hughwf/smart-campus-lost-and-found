# Smart Campus Lost & Found

**AI-powered lost and found for university campuses** — built at HackArizona 2025.

Report a lost or found item, optionally snap a photo, and let Gemini Vision AI do the rest. The system automatically generates descriptions, extracts structured attributes, and semantically matches lost items to found items — so "white earbuds near the union" finds "AirPods Pro at Student Union food court."

## The Problem

Campus lost and founds are broken. Bulletin boards get ignored, keyword-based systems miss obvious matches, and students give up before checking. Items pile up unclaimed.

## Our Solution

We use **Gemini 2.0 Flash** to understand what an item *is* rather than relying on exact keywords. When a student uploads a photo of something they found, Gemini extracts the brand, color, condition, and category. When another student reports a lost item, the AI compares semantic meaning — not just strings — and surfaces matches with confidence scores and reasoning.

## How It Works

1. **Sign in** with your university Google account
2. **Report** a lost or found item (photo + description)
3. **AI generates** a title, description, and structured attributes from the photo
4. **Matching engine** compares your item against all unresolved items of the opposite type
5. **View matches** with confidence scores, AI reasoning, and contact info to coordinate return

## Key Features

- Gemini Vision AI auto-generates titles and descriptions from photos
- Semantic matching that understands items beyond keyword overlap
- Match scores with human-readable AI reasoning
- Photo upload with client-side compression
- Personal dashboard to track your items and matches
- Mobile-responsive UI with University of Arizona branding
- Google OAuth authentication

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router, TypeScript) |
| AI | Gemini 2.0 Flash (`@google/generative-ai`) |
| Database | Vercel Postgres |
| Image Storage | Vercel Blob |
| Auth | NextAuth.js (Google OAuth) |
| Styling | Tailwind CSS |
| Icons | lucide-react |
| Deploy | Vercel |

## Architecture

```
User uploads photo
       │
       ▼
┌─────────────┐     ┌──────────────┐
│ PhotoUpload  │────▶│ Gemini Flash │
│ (compress)   │     │ Vision API   │
└─────────────┘     └──────┬───────┘
                           │ title, description,
                           │ extracted attributes
                           ▼
                    ┌──────────────┐
                    │ Item Created │
                    │ (Postgres)   │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ Match Engine │──▶ scores + reasoning
                    │ (Gemini AI)  │
                    └──────────────┘
```

## Project Structure

```
app/
├── page.tsx                    # Landing page
├── report/found/page.tsx       # Report found item
├── report/lost/page.tsx        # Report lost item
├── my-items/page.tsx           # User dashboard
├── items/[id]/page.tsx         # Item detail + matches
└── api/                        # REST endpoints

lib/
├── gemini.ts                   # Gemini client & prompts
├── db.ts                       # SQL query helpers
├── auth.ts                     # NextAuth config
└── types.ts                    # TypeScript interfaces

components/
├── Header.tsx                  # Nav + auth
├── PhotoUpload.tsx             # Drag-and-drop with compression
├── ItemForm.tsx                # Report form with AI pre-fill
├── ItemCard.tsx                # Item grid card
└── MatchCard.tsx               # Match display with scores
```

## Getting Started

### Prerequisites

- Node.js 18+
- Google Cloud project with OAuth credentials
- [Gemini API key](https://aistudio.google.com/apikey)
- Vercel account (Postgres + Blob storage)

### Setup

```bash
git clone https://github.com/hughwf/smart-campus-lost-and-found.git
cd smart-campus-lost-and-found
npm install
```

Create `.env.local`:

```
GEMINI_API_KEY=
POSTGRES_URL=
BLOB_READ_WRITE_TOKEN=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
```

Run the database migration, then start the dev server:

```bash
node scripts/migrate.mjs
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Team

Built by the Smart Campus Lost & Found team at **HackArizona 2025**.

## License

MIT
