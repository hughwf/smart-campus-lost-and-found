import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getItemById, getUnresolvedItemsByType, createMatch } from "@/lib/db";
import { matchItems } from "@/lib/gemini";

// POST /api/match - Trigger matching for an item against opposite-type candidates
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { item_id } = body;

    if (!item_id || typeof item_id !== "string") {
      return NextResponse.json(
        { error: "item_id is required" },
        { status: 400 }
      );
    }

    const itemWithUser = await getItemById(item_id);
    if (!itemWithUser) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Get unresolved items of the opposite type
    const oppositeType = itemWithUser.type === "lost" ? "found" : "lost";
    const candidates = await getUnresolvedItemsByType(oppositeType);

    if (candidates.length === 0) {
      return NextResponse.json({ matches: [] });
    }

    const matchResults = await matchItems(itemWithUser, candidates);

    // Insert qualifying matches into the database
    const createdMatches = await Promise.all(
      matchResults.map((m) => {
        const lostId =
          itemWithUser.type === "lost" ? itemWithUser.id : m.candidate_id;
        const foundId =
          itemWithUser.type === "found" ? itemWithUser.id : m.candidate_id;
        return createMatch(lostId, foundId, m.score, m.reasoning);
      })
    );

    return NextResponse.json({ matches: createdMatches });
  } catch (error) {
    console.error("Match error:", error);
    return NextResponse.json(
      { error: "Failed to match items" },
      { status: 500 }
    );
  }
}
