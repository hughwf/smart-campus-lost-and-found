"use client";

import Image from "next/image";
import { MatchWithDetails } from "@/lib/types";

interface MatchCardProps {
  match: MatchWithDetails;
  currentItemPhotoUrl: string | null;
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 75
      ? "bg-ua-leaf"
      : pct >= 50
        ? "bg-yellow-500"
        : "bg-orange-500";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-semibold text-gray-700 w-10 text-right">
        {pct}%
      </span>
    </div>
  );
}

export default function MatchCard({
  match,
  currentItemPhotoUrl,
}: MatchCardProps) {
  const { item: matchedItem, user: matchedUser, score, reasoning } = match;

  return (
    <div className="border border-gray-200 rounded-xl p-4 sm:p-5 space-y-4 bg-white shadow-sm">
      {/* Photos — stack on mobile, side-by-side on sm+ */}
      {(currentItemPhotoUrl || matchedItem.photo_url) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {currentItemPhotoUrl && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Your item</p>
              <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={currentItemPhotoUrl}
                  alt="Your item"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          )}
          {matchedItem.photo_url && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Matched item</p>
              <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={matchedItem.photo_url}
                  alt={matchedItem.title}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Match score */}
      <div>
        <p className="text-xs text-gray-500 mb-1">Match confidence</p>
        <ScoreBar score={score} />
      </div>

      {/* Matched item info */}
      <div>
        <h3 className="font-semibold text-gray-900">{matchedItem.title}</h3>
        {matchedItem.location && (
          <p className="text-sm text-gray-500 mt-0.5">{matchedItem.location}</p>
        )}
      </div>

      {/* Reasoning */}
      {reasoning && (
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">AI reasoning</p>
          <p className="text-sm text-gray-700">{reasoning}</p>
        </div>
      )}

      {/* Contact info */}
      <div className="border-t pt-3">
        <p className="text-xs text-gray-500 mb-2">Contact</p>
        <div className="flex items-center gap-3">
          {matchedUser.image && (
            <Image
              src={matchedUser.image}
              alt={matchedUser.name ?? "User"}
              width={32}
              height={32}
              className="rounded-full shrink-0"
            />
          )}
          <div className="text-sm min-w-0">
            {matchedUser.name && (
              <p className="font-medium text-gray-900">{matchedUser.name}</p>
            )}
            <a
              href={`mailto:${matchedUser.email}`}
              className="text-ua-oasis hover:underline break-all"
            >
              {matchedUser.email}
            </a>
            {matchedUser.phone && (
              <p className="text-gray-500">{matchedUser.phone}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
