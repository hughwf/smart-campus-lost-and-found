import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateTitleAndDescription } from "@/lib/gemini";
import { ExtractedAttributes } from "@/lib/types";

const VALID_CATEGORIES: ExtractedAttributes["category"][] = [
  "electronics",
  "clothing",
  "accessories",
  "bags",
  "keys",
  "id_cards",
  "books",
  "water_bottle",
  "jewelry",
  "sports_equipment",
  "other",
];

const VALID_CONDITIONS: ExtractedAttributes["condition"][] = [
  "new",
  "good",
  "worn",
  "damaged",
];

function validateGenerateResponse(data: unknown): data is {
  title: string;
  description: string;
  extracted: ExtractedAttributes;
} {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;

  if (typeof obj.title !== "string" || obj.title.length === 0) return false;
  if (typeof obj.description !== "string" || obj.description.length === 0)
    return false;
  if (typeof obj.extracted !== "object" || obj.extracted === null) return false;

  const ext = obj.extracted as Record<string, unknown>;

  if (!VALID_CATEGORIES.includes(ext.category as ExtractedAttributes["category"]))
    return false;
  if (typeof ext.subcategory !== "string") return false;
  if (ext.brand !== null && typeof ext.brand !== "string") return false;
  if (typeof ext.color !== "string") return false;
  if (ext.size !== null && typeof ext.size !== "string") return false;
  if (
    !Array.isArray(ext.distinguishing_features) ||
    !ext.distinguishing_features.every((f: unknown) => typeof f === "string")
  )
    return false;
  if (!VALID_CONDITIONS.includes(ext.condition as ExtractedAttributes["condition"]))
    return false;

  return true;
}

// POST /api/items/generate - Generate title and description from a photo using Gemini
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const photo = formData.get("photo") as File | null;
    const type = formData.get("type") as string | null;

    if (!photo) {
      return NextResponse.json({ error: "Photo is required" }, { status: 400 });
    }

    if (type !== "lost" && type !== "found") {
      return NextResponse.json(
        { error: "Type must be 'lost' or 'found'" },
        { status: 400 }
      );
    }

    const bytes = await photo.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = photo.type;

    if (!mimeType.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    const result = await generateTitleAndDescription(base64, mimeType, type);

    if (!validateGenerateResponse(result)) {
      return NextResponse.json(
        { error: "Failed to generate valid item details" },
        { status: 502 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json(
      { error: "Failed to generate item details. Please fill in manually." },
      { status: 500 }
    );
  }
}
