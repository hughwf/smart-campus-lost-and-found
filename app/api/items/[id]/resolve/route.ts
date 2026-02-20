import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getItemById, resolveItem } from "@/lib/db";

// POST /api/items/:id/resolve - Mark an item as resolved
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const item = await getItemById(params.id);
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (item.user_id !== session.userId) {
      return NextResponse.json(
        { error: "You can only resolve your own items" },
        { status: 403 }
      );
    }

    if (item.resolved) {
      return NextResponse.json(
        { error: "Item is already resolved" },
        { status: 400 }
      );
    }

    await resolveItem(item.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Resolve item error:", error);
    return NextResponse.json(
      { error: "Failed to resolve item" },
      { status: 500 }
    );
  }
}
