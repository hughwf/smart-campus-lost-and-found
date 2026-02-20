import { GoogleGenerativeAI } from "@google/generative-ai";
import { GenerateResponse } from "./types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateTitleAndDescription(
  photoBase64: string,
  mimeType: string,
  type: "lost" | "found"
): Promise<GenerateResponse> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `You are helping a student describe a ${type} item for a campus lost & found system.

Given this photo, generate:
1. A short title (2-4 words, like "Blue Stanley Cup" or "AirPods Pro Case")
2. A natural description (1-3 sentences) that a student would write, mentioning key identifying features

Also extract structured attributes for matching.

Respond with ONLY valid JSON:
{
  "title": "short item title",
  "description": "natural human-readable description",
  "extracted": {
    "category": "one of: electronics, clothing, accessories, bags, keys, id_cards, books, water_bottle, jewelry, sports_equipment, other",
    "subcategory": "specific item type",
    "brand": "brand if identifiable, null otherwise",
    "color": "primary color(s)",
    "size": "size if applicable, null otherwise",
    "distinguishing_features": ["list of unique identifying features"],
    "condition": "new/good/worn/damaged"
  }
}`;

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        mimeType,
        data: photoBase64,
      },
    },
  ]);

  const text = result.response.text();
  const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();

  try {
    return JSON.parse(cleaned) as GenerateResponse;
  } catch {
    // Retry with stricter prompt
    const retry = await model.generateContent([
      prompt + "\n\nIMPORTANT: Respond with ONLY valid JSON, no markdown formatting.",
      {
        inlineData: {
          mimeType,
          data: photoBase64,
        },
      },
    ]);
    const retryText = retry.response.text().replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(retryText) as GenerateResponse;
  }
}

