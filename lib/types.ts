export interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  image: string | null;
  created_at: Date;
}

export interface ExtractedAttributes {
  category:
    | "electronics"
    | "clothing"
    | "accessories"
    | "bags"
    | "keys"
    | "id_cards"
    | "books"
    | "water_bottle"
    | "jewelry"
    | "sports_equipment"
    | "other";
  subcategory: string;
  brand: string | null;
  color: string;
  size: string | null;
  distinguishing_features: string[];
  condition: "new" | "good" | "worn" | "damaged";
}

export interface Item {
  id: string;
  user_id: string;
  type: "lost" | "found";
  title: string;
  photo_url: string | null;
  description: string;
  location: string | null;
  extracted: ExtractedAttributes | null;
  taken: boolean | null;
  reward: string | null;
  resolved: boolean;
  created_at: Date;
}

export interface Match {
  id: string;
  lost_item_id: string;
  found_item_id: string;
  score: number;
  reasoning: string | null;
  created_at: Date;
}

export interface ItemWithUser extends Item {
  user: User;
}

export interface ItemWithMatchCount extends Item {
  match_count: number;
}

export interface MatchWithDetails extends Match {
  item: Item;
  user: User;
}

export interface ItemWithMatches extends Item {
  matches: MatchWithDetails[];
}

export interface GenerateResponse {
  title: string;
  description: string;
  extracted: ExtractedAttributes;
}

export interface MatchResult {
  candidate_id: string;
  score: number;
  reasoning: string;
}
