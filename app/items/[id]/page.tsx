"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import MatchCard from "@/components/MatchCard";
import { ItemWithUser, MatchWithDetails, ExtractedAttributes } from "@/lib/types";

function AttributeChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 bg-ua-cool-gray text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full">
      <span className="text-gray-400">{label}:</span> {value}
    </span>
  );
}

function AttributeChips({ extracted }: { extracted: ExtractedAttributes }) {
  const chips: { label: string; value: string }[] = [];

  chips.push({ label: "Category", value: extracted.category.replace("_", " ") });
  if (extracted.subcategory) chips.push({ label: "Type", value: extracted.subcategory });
  chips.push({ label: "Color", value: extracted.color });
  if (extracted.brand) chips.push({ label: "Brand", value: extracted.brand });
  if (extracted.size) chips.push({ label: "Size", value: extracted.size });
  chips.push({ label: "Condition", value: extracted.condition });
  for (const feat of extracted.distinguishing_features) {
    chips.push({ label: "Feature", value: feat });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((c, i) => (
        <AttributeChip key={i} label={c.label} value={c.value} />
      ))}
    </div>
  );
}

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const hadMatchError = searchParams.get("matchError") === "1";

  const [item, setItem] = useState<ItemWithUser | null>(null);
  const [matches, setMatches] = useState<MatchWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [rematching, setRematching] = useState(false);
  const [rematchError, setRematchError] = useState<string | null>(null);

  const isOwner = session?.userId === item?.user_id;

  const fetchItem = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/items/${id}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch item");
      }
      const data = await res.json();
      setItem(data.item);
      setMatches(data.matches);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchItem();
  }, [fetchItem]);

  async function handleRematch() {
    setRematching(true);
    setRematchError(null);
    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Matching failed");
      }
      // Re-fetch item to get updated matches
      await fetchItem();
    } catch (err) {
      setRematchError(err instanceof Error ? err.message : "Matching failed");
    } finally {
      setRematching(false);
    }
  }

  async function handleResolve() {
    if (!confirm("Mark this item as resolved? This means it has been returned to its owner.")) return;
    setResolving(true);
    try {
      const res = await fetch(`/api/items/${id}/resolve`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to resolve");
      }
      setItem((prev) => (prev ? { ...prev, resolved: true } : prev));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to resolve item");
    } finally {
      setResolving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-6 sm:py-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-16" />
          <div className="h-8 bg-gray-200 rounded w-2/3" />
          <div className="h-48 sm:h-64 bg-gray-200 rounded-xl" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="max-w-3xl mx-auto py-6 sm:py-8 px-4">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-flex items-center min-h-[44px]">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Link>
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          <p>{error || "Item not found"}</p>
          <button
            onClick={fetchItem}
            className="mt-3 text-sm font-medium px-4 py-2 rounded-lg bg-ua-red text-white hover:bg-ua-chili transition-colors min-h-[44px]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const isFound = item.type === "found";
  const isLost = item.type === "lost";

  return (
    <div className="max-w-3xl mx-auto py-6 sm:py-8 px-4">
      <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-flex items-center min-h-[44px]">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-xs font-semibold uppercase px-2 py-0.5 rounded-full ${
                isFound
                  ? "bg-green-50 text-ua-leaf"
                  : "bg-red-50 text-ua-red"
              }`}
            >
              {item.type}
            </span>
            {item.resolved && (
              <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-ua-azurite">
                Resolved
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-ua-blue">{item.title}</h1>
        </div>

        {isOwner && !item.resolved && (
          <button
            onClick={handleResolve}
            disabled={resolving}
            className={`shrink-0 text-sm font-medium px-4 py-2.5 rounded-lg text-white transition-colors min-h-[44px] w-full sm:w-auto ${
              resolving
                ? "bg-gray-400 cursor-not-allowed"
                : isFound
                  ? "bg-ua-leaf hover:bg-ua-river"
                  : "bg-ua-red hover:bg-ua-chili"
            }`}
          >
            {resolving ? "Resolving..." : "Mark as Resolved"}
          </button>
        )}
      </div>

      {/* Photo */}
      {item.photo_url && (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-100 mb-6">
          <Image
            src={item.photo_url}
            alt={item.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Details */}
      <div className="space-y-4 mb-8">
        <div>
          <h2 className="text-sm font-medium text-gray-500">Description</h2>
          <p className="text-gray-900 mt-1">{item.description}</p>
        </div>

        {item.location && (
          <div>
            <h2 className="text-sm font-medium text-gray-500">Location</h2>
            <p className="text-gray-900 mt-1">{item.location}</p>
          </div>
        )}

        <div>
          <h2 className="text-sm font-medium text-gray-500">Reported</h2>
          <p className="text-gray-900 mt-1">
            {new Date(item.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        </div>

        {isFound && item.taken !== null && (
          <div>
            <h2 className="text-sm font-medium text-gray-500">Status</h2>
            <p className="text-gray-900 mt-1">
              {item.taken ? "Taken (held by finder)" : "Left in place"}
            </p>
          </div>
        )}

        {isLost && item.reward && (
          <div>
            <h2 className="text-sm font-medium text-gray-500">Reward</h2>
            <p className="text-gray-900 mt-1">{item.reward}</p>
          </div>
        )}

        {/* Extracted attributes */}
        {item.extracted && (
          <div>
            <h2 className="text-sm font-medium text-gray-500 mb-2">Attributes</h2>
            <AttributeChips extracted={item.extracted} />
          </div>
        )}
      </div>

      {/* Matches section */}
      <div className="border-t pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-ua-blue">
            {matches.length > 0
              ? `Potential Matches (${matches.length})`
              : "No Matches Yet"}
          </h2>

          {isOwner && !item.resolved && (
            <button
              onClick={handleRematch}
              disabled={rematching}
              className="shrink-0 text-sm font-medium px-4 py-2.5 rounded-lg border border-ua-azurite text-ua-azurite hover:bg-ua-azurite hover:text-white transition-colors min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {rematching ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Searching...
                </span>
              ) : (
                "Find Matches"
              )}
            </button>
          )}
        </div>

        {(rematchError || (hadMatchError && matches.length === 0)) && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4">
            <p className="text-sm text-amber-700">
              {rematchError || "Automatic matching didn't run during creation. Tap \"Find Matches\" to search for matches now."}
            </p>
          </div>
        )}

        {matches.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-6 text-center">
            <p className="text-gray-500">
              {isFound
                ? "No lost items match this found item yet. Try \"Find Matches\" or check back as people report lost items."
                : "No found items match your lost item yet. Try \"Find Matches\" or check back as people report found items."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                currentItemPhotoUrl={item.photo_url}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
