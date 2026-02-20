"use client";

import { useSession, signIn } from "next-auth/react";
import Link from "next/link";

export default function Home() {
  const { status } = useSession();

  function handleCTA(path: string) {
    if (status === "authenticated") {
      return undefined; // Let the Link handle navigation
    }
    return (e: React.MouseEvent) => {
      e.preventDefault();
      signIn("google", { callbackUrl: path });
    };
  }

  return (
    <main className="min-h-[calc(100vh-3.5rem)]">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-4 py-20 sm:py-28">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight max-w-xl">
          Lost something on campus?
        </h1>
        <p className="text-gray-600 mt-4 mb-10 max-w-md text-lg">
          Report lost or found items and let AI match them automatically.
          Reunite with your stuff faster.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link
            href="/report/lost"
            onClick={handleCTA("/report/lost")}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-8 rounded-lg transition-colors text-center"
          >
            I Lost Something
          </Link>
          <Link
            href="/report/found"
            onClick={handleCTA("/report/found")}
            className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-8 rounded-lg transition-colors text-center"
          >
            I Found Something
          </Link>
        </div>

        {status === "unauthenticated" && (
          <p className="text-sm text-gray-400 mt-4">
            Sign in with Google to get started
          </p>
        )}
      </section>

      {/* How it works */}
      <section className="bg-gray-50 border-t px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">
            How it works
          </h2>
          <div className="grid sm:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl mb-3">📸</div>
              <h3 className="font-semibold mb-1">1. Report</h3>
              <p className="text-sm text-gray-600">
                Upload a photo or describe the item. AI fills in the details for
                you.
              </p>
            </div>
            <div>
              <div className="text-3xl mb-3">🤖</div>
              <h3 className="font-semibold mb-1">2. Match</h3>
              <p className="text-sm text-gray-600">
                Gemini compares attributes like color, brand, and condition to
                find matches.
              </p>
            </div>
            <div>
              <div className="text-3xl mb-3">🎉</div>
              <h3 className="font-semibold mb-1">3. Reunite</h3>
              <p className="text-sm text-gray-600">
                Get notified when a match is found and connect with the other
                person.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
