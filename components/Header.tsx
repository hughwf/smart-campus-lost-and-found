"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";

export default function Header() {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-b border-ua-midnight bg-ua-blue sticky top-0 z-50">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-4 h-14">
        <Link href="/" className="font-bold text-lg text-white">
          Lost &amp; Found
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-4">
          {status === "loading" && (
            <div className="h-8 w-20 bg-white/20 rounded animate-pulse" />
          )}

          {status === "authenticated" && session.user && (
            <>
              <Link
                href="/my-items"
                className="text-sm text-white/80 hover:text-white transition-colors"
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
                <span className="text-sm font-medium text-white">
                  {session.user.name}
                </span>
                <button
                  onClick={() => signOut()}
                  className="text-sm text-white/60 hover:text-white ml-2 transition-colors"
                >
                  Sign out
                </button>
              </div>
            </>
          )}

          {status === "unauthenticated" && (
            <button
              onClick={() => signIn("google")}
              className="bg-white hover:bg-gray-100 text-ua-blue text-sm font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Sign in with Google
            </button>
          )}
        </nav>

        {/* Mobile hamburger button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden flex items-center justify-center w-10 h-10 text-white"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu panel */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/20 bg-ua-blue px-4 pb-4 pt-2 space-y-1">
          {status === "loading" && (
            <div className="h-8 w-32 bg-white/20 rounded animate-pulse" />
          )}

          {status === "authenticated" && session.user && (
            <>
              <div className="flex items-center gap-3 py-3 border-b border-white/10 mb-1">
                {session.user.image && (
                  <Image
                    src={session.user.image}
                    alt={session.user.name ?? "Avatar"}
                    width={36}
                    height={36}
                    className="rounded-full"
                  />
                )}
                <div>
                  <p className="text-sm font-medium text-white">{session.user.name}</p>
                  <p className="text-xs text-white/60">{session.user.email}</p>
                </div>
              </div>
              <Link
                href="/my-items"
                onClick={() => setMenuOpen(false)}
                className="block text-sm text-white/80 hover:text-white py-3 transition-colors"
              >
                My Items
              </Link>
              <Link
                href="/report/lost"
                onClick={() => setMenuOpen(false)}
                className="block text-sm text-white/80 hover:text-white py-3 transition-colors"
              >
                Report Lost Item
              </Link>
              <Link
                href="/report/found"
                onClick={() => setMenuOpen(false)}
                className="block text-sm text-white/80 hover:text-white py-3 transition-colors"
              >
                Report Found Item
              </Link>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  signOut();
                }}
                className="block text-sm text-white/60 hover:text-white py-3 transition-colors w-full text-left"
              >
                Sign out
              </button>
            </>
          )}

          {status === "unauthenticated" && (
            <button
              onClick={() => {
                setMenuOpen(false);
                signIn("google");
              }}
              className="w-full bg-white hover:bg-gray-100 text-ua-blue text-sm font-medium py-3 px-4 rounded-lg transition-colors mt-2"
            >
              Sign in with Google
            </button>
          )}
        </div>
      )}
    </header>
  );
}
