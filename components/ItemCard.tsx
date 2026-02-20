"use client";

import Image from "next/image";
import Link from "next/link";
import { ItemWithMatchCount } from "@/lib/types";

interface ItemCardProps {
  item: ItemWithMatchCount;
}

export default function ItemCard({ item }: ItemCardProps) {
  const isFound = item.type === "found";

  return (
    <Link
      href={`/items/${item.id}`}
      className="block border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden"
    >
      {/* Thumbnail */}
      {item.photo_url ? (
        <div className="relative w-full aspect-video bg-gray-100">
          <Image
            src={item.photo_url}
            alt={item.title}
            fill
            className="object-cover"
          />
        </div>
      ) : (
        <div className="w-full aspect-video bg-gray-100 flex items-center justify-center">
          <span className="text-gray-300 text-4xl">📦</span>
        </div>
      )}

      <div className="p-4 space-y-2">
        {/* Badges row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-xs font-semibold uppercase px-2 py-0.5 rounded-full ${
              isFound
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {item.type}
          </span>
          {item.resolved && (
            <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              Resolved
            </span>
          )}
          {item.match_count > 0 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
              {item.match_count} {item.match_count === 1 ? "match" : "matches"}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-gray-900 truncate">{item.title}</h3>

        {/* Description preview */}
        <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>

        {/* Location & date */}
        <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
          {item.location && (
            <span className="truncate mr-2">{item.location}</span>
          )}
          <span className="shrink-0">
            {new Date(item.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      </div>
    </Link>
  );
}
