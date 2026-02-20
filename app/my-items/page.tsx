"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import ItemCard from "@/components/ItemCard";
import { ItemWithMatchCount } from "@/lib/types";

type Filter = "all" | "lost" | "found";

export default function MyItemsPage() {
  const { data: session } = useSession();
  const [items, setItems] = useState<ItemWithMatchCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    async function fetchItems() {
      try {
        const res = await fetch("/api/items/mine");
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to fetch items");
        }
        const data = await res.json();
        setItems(data.items);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    fetchItems();
  }, []);

  const filtered = filter === "all" ? items : items.filter((i) => i.type === filter);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-8 px-4">
        <div className="h-8 bg-gray-200 rounded w-40 mb-6 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="animate-pulse rounded-xl border border-gray-200 overflow-hidden">
              <div className="w-full aspect-video bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-16" />
                <div className="h-5 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto py-8 px-4">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block">
          &larr; Back
        </Link>
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">{error}</div>
      </div>
    );
  }

  const tabs: { label: string; value: Filter; count: number }[] = [
    { label: "All", value: "all", count: items.length },
    { label: "Lost", value: "lost", count: items.filter((i) => i.type === "lost").length },
    { label: "Found", value: "found", count: items.filter((i) => i.type === "found").length },
  ];

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Items</h1>
        <Link
          href="/report/lost"
          className="text-sm font-medium px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
        >
          Report Item
        </Link>
      </div>

      {/* Filter tabs */}
      {items.length > 0 && (
        <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`text-sm font-medium px-4 py-1.5 rounded-md transition-colors ${
                filter === tab.value
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      )}

      {/* Items grid or empty state */}
      {items.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-12 text-center">
          <p className="text-gray-400 text-4xl mb-4">📋</p>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">No items yet</h2>
          <p className="text-gray-500 mb-6">
            Report a lost or found item to get started. We&apos;ll automatically match it with potential matches.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/report/lost"
              className="text-sm font-medium px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
            >
              Report Lost Item
            </Link>
            <Link
              href="/report/found"
              className="text-sm font-medium px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors"
            >
              Report Found Item
            </Link>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <p className="text-gray-500">
            No {filter} items. Try a different filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
