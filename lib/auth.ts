import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { upsertUser } from "./db";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (user.email) {
        await upsertUser(user.email, user.name ?? null, user.image ?? null);
      }
      return true;
    },
    async session({ session }) {
      if (session.user?.email) {
        const dbUser = await (
          await import("./db")
        ).getUserByEmail(session.user.email);
        if (dbUser) {
          session.userId = dbUser.id;
        }
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
