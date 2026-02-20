"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ClipboardList, ArrowLeft } from "lucide-react";
import ItemCard from "@/components/ItemCard";
import { ItemWithMatchCount } from "@/lib/types";

type Filter = "all" | "lost" | "found";

export default function MyItemsPage() {
  const [items, setItems] = useState<ItemWithMatchCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
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
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const filtered = filter === "all" ? items : items.filter((i) => i.type === filter);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-6 sm:py-8 px-4">
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
      <div className="max-w-5xl mx-auto py-6 sm:py-8 px-4">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block min-h-[44px] flex items-center">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Link>
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          <p>{error}</p>
          <button
            onClick={fetchItems}
            className="mt-3 text-sm font-medium px-4 py-2 rounded-lg bg-ua-red text-white hover:bg-ua-chili transition-colors min-h-[44px]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const tabs: { label: string; value: Filter; count: number }[] = [
    { label: "All", value: "all", count: items.length },
    { label: "Lost", value: "lost", count: items.filter((i) => i.type === "lost").length },
    { label: "Found", value: "found", count: items.filter((i) => i.type === "found").length },
  ];

  return (
    <div className="max-w-5xl mx-auto py-6 sm:py-8 px-4">
      <div className="flex items-center justify-between mb-6 gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-ua-blue">My Items</h1>
        <Link
          href="/report/lost"
          className="text-sm font-medium px-4 py-2 rounded-lg bg-ua-red hover:bg-ua-chili text-white transition-colors min-h-[44px] flex items-center shrink-0"
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
              className={`text-sm font-medium px-4 py-2 rounded-md transition-colors min-h-[40px] ${
                filter === tab.value
                  ? "bg-white text-ua-blue shadow-sm"
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
        <div className="bg-gray-50 rounded-xl p-8 sm:p-12 text-center">
          <div className="text-gray-400 mb-4 flex justify-center"><ClipboardList className="w-10 h-10" /></div>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">No items yet</h2>
          <p className="text-gray-500 mb-6">
            Report a lost or found item to get started. We&apos;ll automatically match it with potential matches.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/report/lost"
              className="text-sm font-medium px-4 py-2.5 rounded-lg bg-ua-red hover:bg-ua-chili text-white transition-colors min-h-[44px] flex items-center justify-center"
            >
              Report Lost Item
            </Link>
            <Link
              href="/report/found"
              className="text-sm font-medium px-4 py-2.5 rounded-lg bg-ua-leaf hover:bg-ua-river text-white transition-colors min-h-[44px] flex items-center justify-center"
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
