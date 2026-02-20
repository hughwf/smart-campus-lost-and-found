import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getItemsByUserId } from "@/lib/db";

// GET /api/items/mine - List the current user's items with match counts
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const items = await getItemsByUserId(session.userId);
    return NextResponse.json({ items });
  } catch (error) {
    console.error("List user items error:", error);
    return NextResponse.json(
      { error: "Failed to fetch items" },
      { status: 500 }
    );
  }
}
