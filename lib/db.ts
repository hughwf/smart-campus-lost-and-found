import { sql } from "@vercel/postgres";
import { Item, Match, User } from "./types";

export async function getUserByEmail(email: string): Promise<User | null> {
  const { rows } = await sql<User>`
    SELECT * FROM users WHERE email = ${email}
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

export async function createItem(
  item: Omit<Item, "id" | "created_at" | "resolved">
): Promise<Item> {
  const { rows } = await sql<Item>`
    INSERT INTO items (user_id, type, title, photo_url, description, location, extracted, taken, reward)
    VALUES (
      ${item.user_id},
      ${item.type},
      ${item.title},
      ${item.photo_url},
      ${item.description},
      ${item.location},
      ${JSON.stringify(item.extracted)},
      ${item.taken},
      ${item.reward}
    )
    RETURNING *
  `;
  return rows[0];
}

export async function getItemById(id: string): Promise<Item | null> {
  const { rows } = await sql<Item>`
    SELECT * FROM items WHERE id = ${id}
  `;
  return rows[0] ?? null;
}

export async function getItemsByUserId(userId: string): Promise<Item[]> {
  const { rows } = await sql<Item>`
    SELECT * FROM items WHERE user_id = ${userId} ORDER BY created_at DESC
  `;
  return rows;
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

export async function getMatchesForItem(itemId: string): Promise<Match[]> {
  const { rows } = await sql<Match>`
    SELECT * FROM matches
    WHERE lost_item_id = ${itemId} OR found_item_id = ${itemId}
    ORDER BY score DESC
  `;
  return rows;
}

export async function resolveItem(id: string): Promise<void> {
  await sql`UPDATE items SET resolved = TRUE WHERE id = ${id}`;
}

export async function getUserById(id: string): Promise<User | null> {
  const { rows } = await sql<User>`
    SELECT * FROM users WHERE id = ${id}
  `;
  return rows[0] ?? null;
}
