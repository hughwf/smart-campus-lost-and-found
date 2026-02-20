import { Item, MatchResult } from "./types";

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

function colorsOverlap(a: string, b: string): boolean {
  const na = normalize(a);
  const nb = normalize(b);
  return na.includes(nb) || nb.includes(na);
}

function stringsMatch(a: string, b: string): boolean {
  const na = normalize(a);
  const nb = normalize(b);
  return na === nb || na.includes(nb) || nb.includes(na);
}

function featuresOverlap(a: string[], b: string[]): boolean {
  const setA = a.map(normalize);
  const setB = b.map(normalize);
  return setA.some((fa) => setB.some((fb) => fa.includes(fb) || fb.includes(fa)));
}

export function matchItems(
  newItem: Item,
  candidates: Item[]
): MatchResult[] {
  if (candidates.length === 0) return [];

  const results: MatchResult[] = [];

  for (const candidate of candidates) {
    const ext = newItem.extracted;
    const cExt = candidate.extracted;

    // Both items need extracted attributes to compare
    if (!ext || !cExt) continue;

    let score = 0;
    const reasons: string[] = [];

    // Category (30 points) — exact match
    if (ext.category === cExt.category) {
      score += 30;
      reasons.push(`Category match (${ext.category})`);
    }

    // Color (25 points) — fuzzy match
    if (colorsOverlap(ext.color, cExt.color)) {
      score += 25;
      reasons.push(`Color match (${ext.color})`);
    }

    // Brand (20 points) — when both present
    if (ext.brand && cExt.brand && stringsMatch(ext.brand, cExt.brand)) {
      score += 20;
      reasons.push(`Brand match (${ext.brand})`);
    }

    // Subcategory (10 points) — fuzzy match
    if (stringsMatch(ext.subcategory, cExt.subcategory)) {
      score += 10;
      reasons.push(`Subcategory match (${ext.subcategory})`);
    }

    // Location (10 points) — fuzzy match on item location field
    if (
      newItem.location &&
      candidate.location &&
      stringsMatch(newItem.location, candidate.location)
    ) {
      score += 10;
      reasons.push(`Location match (${newItem.location})`);
    }

    // Distinguishing features (5 points) — any overlap
    if (
      ext.distinguishing_features.length > 0 &&
      cExt.distinguishing_features.length > 0 &&
      featuresOverlap(ext.distinguishing_features, cExt.distinguishing_features)
    ) {
      score += 5;
      reasons.push("Distinguishing features overlap");
    }

    const normalized = score / 100;

    if (normalized > 0.3) {
      results.push({
        candidate_id: candidate.id,
        score: normalized,
        reasoning: reasons.join(", "),
      });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  return results;
}
