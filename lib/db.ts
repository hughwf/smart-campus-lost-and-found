import { sql } from "@vercel/postgres";
import {
  Item,
  ItemWithMatchCount,
  ItemWithUser,
  Match,
  MatchWithDetails,
  User,
} from "./types";

// ─── Users ───────────────────────────────────────────────

export async function getUserByEmail(email: string): Promise<User | null> {
  const { rows } = await sql<User>`
    SELECT * FROM users WHERE email = ${email}
  `;
  return rows[0] ?? null;
}

export async function getUserById(id: string): Promise<User | null> {
  const { rows } = await sql<User>`
    SELECT * FROM users WHERE id = ${id}
  `;
  return rows[0] ?? null;
}

export async function upsertUser(
  email: string,
  name: string | null,
  image: string | null
): Promise<User> {
  const { rows } = await sql<User>`
    INSERT INTO users (email, name, image)
    VALUES (${email}, ${name}, ${image})
    ON CONFLICT (email) DO UPDATE SET name = ${name}, image = ${image}
    RETURNING *
  `;
  return rows[0];
}

// ─── Items ───────────────────────────────────────────────

export async function createItem(
  item: Omit<Item, "id" | "created_at" | "resolved">
): Promise<Item> {
  const { rows } = await sql<Item>`
    INSERT INTO items (user_id, type, title, photo_url, description, location, extracted, taken, reward)
    VALUES (
      ${item.user_id},
      ${item.type},
      ${item.title},
      ${item.photo_url ?? null},
      ${item.description},
      ${item.location ?? null},
      ${item.extracted ? JSON.stringify(item.extracted) : null},
      ${item.taken ?? null},
      ${item.reward ?? null}
    )
    RETURNING *
  `;
  return rows[0];
}

export async function getItemById(id: string): Promise<ItemWithUser | null> {
  const { rows } = await sql`
    SELECT
      i.*,
      row_to_json(u) AS user
    FROM items i
    JOIN users u ON u.id = i.user_id
    WHERE i.id = ${id}
  `;
  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    ...row,
    user: row.user,
  } as unknown as ItemWithUser;
}

export async function getItemsByUserId(
  userId: string
): Promise<ItemWithMatchCount[]> {
  const { rows } = await sql`
    SELECT
      i.*,
      COALESCE(mc.cnt, 0)::int AS match_count
    FROM items i
    LEFT JOIN (
      SELECT lost_item_id AS item_id, COUNT(*) AS cnt FROM matches GROUP BY lost_item_id
      UNION ALL
      SELECT found_item_id AS item_id, COUNT(*) AS cnt FROM matches GROUP BY found_item_id
    ) mc ON mc.item_id = i.id
    WHERE i.user_id = ${userId}
    ORDER BY i.created_at DESC
  `;
  return rows as unknown as ItemWithMatchCount[];
}

export async function getUnresolvedItemsByType(
  type: "lost" | "found"
): Promise<Item[]> {
  const { rows } = await sql<Item>`
    SELECT * FROM items
    WHERE type = ${type} AND resolved = FALSE
    ORDER BY created_at DESC
    LIMIT 20
  `;
  return rows;
}

export async function resolveItem(id: string): Promise<void> {
  await sql`UPDATE items SET resolved = TRUE WHERE id = ${id}`;
}

// ─── Matches ─────────────────────────────────────────────

export async function createMatch(
  lostItemId: string,
  foundItemId: string,
  score: number,
  reasoning: string | null
): Promise<Match> {
  const { rows } = await sql<Match>`
    INSERT INTO matches (lost_item_id, found_item_id, score, reasoning)
    VALUES (${lostItemId}, ${foundItemId}, ${score}, ${reasoning})
    RETURNING *
  `;
  return rows[0];
}

export async function getMatchesForItem(
  itemId: string
): Promise<MatchWithDetails[]> {
  const { rows } = await sql`
    SELECT
      m.*,
      row_to_json(related_item) AS item,
      row_to_json(related_user) AS user
    FROM matches m
    JOIN items related_item ON related_item.id = CASE
      WHEN m.lost_item_id = ${itemId} THEN m.found_item_id
      ELSE m.lost_item_id
    END
    JOIN users related_user ON related_user.id = related_item.user_id
    WHERE m.lost_item_id = ${itemId} OR m.found_item_id = ${itemId}
    ORDER BY m.score DESC
  `;
  return rows as unknown as MatchWithDetails[];
}
