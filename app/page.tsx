import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">Smart Campus Lost &amp; Found</h1>
      <p className="text-gray-600 mb-8 text-center max-w-md">
        AI-powered matching to reunite you with your lost items. Report what you
        lost or found and let Gemini do the rest.
      </p>
      <div className="flex gap-4">
        <Link
          href="/report/lost"
          className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          I Lost Something
        </Link>
        <Link
          href="/report/found"
          className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          I Found Something
        </Link>
      </div>
    </div>
  );
}
