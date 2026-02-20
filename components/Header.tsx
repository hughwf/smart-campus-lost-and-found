"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";

export default function Header() {
  const { data: session, status } = useSession();

  return (
    <header className="border-b bg-white">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-4 h-14">
        <Link href="/" className="font-bold text-lg">
          Lost &amp; Found
        </Link>

        <nav className="flex items-center gap-4">
          {status === "loading" && (
            <div className="h-8 w-20 bg-gray-100 rounded animate-pulse" />
          )}

          {status === "authenticated" && session.user && (
            <>
              <Link
                href="/my-items"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                My Items
              </Link>
              <div className="flex items-center gap-2">
                {session.user.image && (
                  <Image
                    src={session.user.image}
                    alt={session.user.name ?? "Avatar"}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                )}
                <span className="text-sm font-medium hidden sm:inline">
                  {session.user.name}
                </span>
                <button
                  onClick={() => signOut()}
                  className="text-sm text-gray-500 hover:text-gray-800 ml-2"
                >
                  Sign out
                </button>
              </div>
            </>
          )}

          {status === "unauthenticated" && (
            <button
              onClick={() => signIn("google")}
              className="bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Sign in with Google
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
