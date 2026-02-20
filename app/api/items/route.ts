import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { put } from "@vercel/blob";
import {
  createItem,
  getUnresolvedItemsByType,
  createMatch,
} from "@/lib/db";
import { matchItems } from "@/lib/matching";
import { ExtractedAttributes } from "@/lib/types";

// POST /api/items - Create a new lost or found item
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();

    const title = formData.get("title") as string | null;
    const description = formData.get("description") as string | null;
    const location = formData.get("location") as string | null;
    const type = formData.get("type") as string | null;
    const photo = formData.get("photo") as File | null;
    const taken = formData.get("taken") as string | null;
    const reward = formData.get("reward") as string | null;
    const extractedRaw = formData.get("extracted") as string | null;

    // Validation
    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (!description || description.trim().length === 0) {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 }
      );
    }

    if (!location || location.trim().length === 0) {
      return NextResponse.json(
        { error: "Location is required" },
        { status: 400 }
      );
    }

    if (type !== "lost" && type !== "found") {
      return NextResponse.json(
        { error: "Type must be 'lost' or 'found'" },
        { status: 400 }
      );
    }

    // Upload photo to Vercel Blob if provided
    let photoUrl: string | null = null;
    if (photo && photo.size > 0) {
      if (!photo.type.startsWith("image/")) {
        return NextResponse.json(
          { error: "File must be an image" },
          { status: 400 }
        );
      }
      try {
        const blob = await put(`items/${Date.now()}-${photo.name}`, photo, {
          access: "public",
        });
        photoUrl = blob.url;
      } catch (err) {
        console.error("Photo upload failed (non-blocking):", err);
      }
    }

    // Parse extracted attributes if provided
    let extracted: ExtractedAttributes | null = null;
    if (extractedRaw) {
      try {
        extracted = JSON.parse(extractedRaw) as ExtractedAttributes;
      } catch {
        // Ignore parse errors — extracted is optional
      }
    }

    // Insert item into database
    const item = await createItem({
      user_id: session.userId,
      type,
      title: title.trim(),
      photo_url: photoUrl,
      description: description.trim(),
      location: location.trim(),
      extracted,
      taken: type === "found" ? taken === "true" : null,
      reward: type === "lost" ? (reward?.trim() || null) : null,
    });

    // Trigger matching (best-effort — failures don't block item creation)
    let matches: Awaited<ReturnType<typeof createMatch>>[] = [];
    let matchError: string | null = null;
    try {
      const oppositeType = item.type === "lost" ? "found" : "lost";
      const candidates = await getUnresolvedItemsByType(oppositeType);

      if (candidates.length > 0) {
        const matchResults = await matchItems(item, candidates);

        matches = await Promise.all(
          matchResults.map((m) => {
            const lostId =
              item.type === "lost" ? item.id : m.candidate_id;
            const foundId =
              item.type === "found" ? item.id : m.candidate_id;
            return createMatch(lostId, foundId, m.score, m.reasoning);
          })
        );
      }
    } catch (error) {
      console.error("Matching failed (non-blocking):", error);
      matchError = "Automatic matching failed. You can try again from the item page.";
    }

    return NextResponse.json({ item, matches, matchError }, { status: 201 });
  } catch (error) {
    console.error("Create item error:", error);
    return NextResponse.json(
      { error: "Failed to create item" },
      { status: 500 }
    );
  }
}
