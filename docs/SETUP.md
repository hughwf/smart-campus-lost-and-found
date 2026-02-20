# Setup Guide

## Prerequisites

- Node.js 18+
- A [Vercel](https://vercel.com) account (for Postgres, Blob storage, and deploy)
- A [Google Cloud](https://console.cloud.google.com) project with OAuth 2.0 credentials
- A [Google AI Studio](https://aistudio.google.com) API key for Gemini

## 1. Clone and install

```bash
git clone https://github.com/hughwf/smart-campus-lost-and-found.git
cd smart-campus-lost-and-found
npm install
```

## 2. Environment variables

Copy the template and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Where to get it |
|---|---|
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `POSTGRES_URL` | Vercel dashboard > Storage > Postgres > `.env.local` tab |
| `BLOB_READ_WRITE_TOKEN` | Vercel dashboard > Storage > Blob > `.env.local` tab |
| `GOOGLE_CLIENT_ID` | Google Cloud Console > APIs & Services > Credentials |
| `GOOGLE_CLIENT_SECRET` | Same as above |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` to generate one |
| `NEXTAUTH_URL` | `http://localhost:3000` for local dev |

### Google OAuth setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create or select a project
3. Navigate to **APIs & Services > Credentials**
4. Create an **OAuth 2.0 Client ID** (Web application)
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy the Client ID and Client Secret into your `.env.local`

## 3. Provision the database

Create a Vercel Postgres store from your Vercel dashboard, then run the seed script against it:

```bash
# Option A: paste into the Vercel Postgres SQL editor in the dashboard
# Option B: use psql with your POSTGRES_URL
psql "$POSTGRES_URL" -f scripts/seed.sql
```

This creates the `users`, `items`, and `matches` tables with all required indexes.

## 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 5. Deploy to Vercel

```bash
vercel
```

Make sure all environment variables from step 2 are set in your Vercel project settings. Update `NEXTAUTH_URL` to your production URL and add the production callback URL to your Google OAuth credentials.
