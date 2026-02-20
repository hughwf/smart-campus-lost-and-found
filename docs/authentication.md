# Authentication

Authentication uses **NextAuth.js v4** with **Google OAuth**. Users sign in with their Google account, and the app creates a database record on first sign-in.

---

## Auth Flow

1. User clicks "Sign in with Google" in the header.
2. NextAuth redirects to Google's OAuth consent screen.
3. Google redirects back to `/api/auth/callback/google` with an authorization code.
4. NextAuth exchanges the code for user profile data.
5. The `signIn` callback upserts the user into the `users` table via `upsertUser()`.
6. The `session` callback looks up the database user by email and attaches `userId` to the session.
7. The client receives a session cookie; `useSession()` provides auth state throughout the app.

---

## Configuration Files

| File | Purpose |
|------|---------|
| `lib/auth.ts` | NextAuth options: Google provider, `signIn` and `session` callbacks |
| `app/api/auth/[...nextauth]/route.ts` | Route handler exporting GET and POST |
| `components/Providers.tsx` | Client-side `SessionProvider` wrapper |
| `components/Header.tsx` | Sign-in/sign-out UI with avatar and name |
| `middleware.ts` | Protects `/report/*` and `/my-items/*` routes |
| `types/next-auth.d.ts` | Type augmentation adding `userId` to the `Session` interface |

---

## Google OAuth Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project (or select an existing one).
3. Navigate to **APIs & Services → Credentials**.
4. Click **Create Credentials → OAuth client ID**.
5. Select **Web application** as the application type.
6. Add authorized JavaScript origins:
   - `http://localhost:3000` (development)
   - Your production URL (deployment)
7. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://your-domain.com/api/auth/callback/google` (deployment)
8. Copy the **Client ID** and **Client Secret**.

---

## Environment Variables

Add these to `.env.local`:

```
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
```

- `NEXTAUTH_SECRET` encrypts the session cookie. Generate it with `openssl rand -base64 32`.
- `NEXTAUTH_URL` must match the app's base URL. On Vercel, this is set automatically.

---

## Session Object

The session is augmented with a `userId` field (declared in `types/next-auth.d.ts`):

```ts
interface Session {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  userId?: string; // UUID from the users table
}
```

Access it server-side with `getServerSession(authOptions)` or client-side with `useSession()`.

---

## Route Protection

### Middleware (pages)

`middleware.ts` uses the NextAuth middleware export to protect page routes:

```ts
export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/report/:path*", "/my-items/:path*"],
};
```

Unauthenticated users are redirected to the NextAuth sign-in page, then returned to their original destination after authentication.

### API Routes

API routes should check for a valid session manually:

```ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const session = await getServerSession(authOptions);
if (!session?.userId) {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
```

---

## Header Component

`components/Header.tsx` renders different states:

- **Loading** — a skeleton placeholder while the session is being fetched.
- **Authenticated** — shows the user's Google avatar, name, a "My Items" link, and a "Sign out" button.
- **Unauthenticated** — shows a "Sign in with Google" button.

---

## Database Integration

On first sign-in, `upsertUser(email, name, image)` in `lib/db.ts` creates a row in the `users` table using `INSERT ... ON CONFLICT (email) DO UPDATE`. Subsequent sign-ins update the name and avatar in case they changed on the Google side.
