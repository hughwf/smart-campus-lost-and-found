"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import PhotoUpload from "@/components/PhotoUpload";
import { ExtractedAttributes } from "@/lib/types";

interface ItemFormProps {
  type: "lost" | "found";
}

const CAMPUS_LOCATIONS = [
  "Student Union",
  "Main Library",
  "Science Building",
  "Engineering Hall",
  "Recreation Center",
  "Dining Hall",
  "Parking Garage A",
  "Parking Garage B",
  "Arts Building",
  "Business School",
  "Health Center",
  "Residence Halls",
  "Athletic Fields",
  "Campus Bookstore",
];

export default function ItemForm({ type }: ItemFormProps) {
  const router = useRouter();

  const [photo, setPhoto] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [customLocation, setCustomLocation] = useState("");
  const [extracted, setExtracted] = useState<ExtractedAttributes | null>(null);

  // Found-only: taken toggle
  const [taken, setTaken] = useState(false);

  // Lost-only: reward
  const [reward, setReward] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiGenerated, setAiGenerated] = useState(false);

  const handleGenerated = useCallback(
    (data: {
      title: string;
      description: string;
      extracted: ExtractedAttributes;
    }) => {
      setTitle(data.title);
      setDescription(data.description);
      setExtracted(data.extracted);
      setAiGenerated(true);
    },
    []
  );

  const handleGenerateError = useCallback(() => {
    setAiGenerated(false);
  }, []);

  const resolvedLocation =
    location === "__custom" ? customLocation.trim() : location;

  const isValid =
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    resolvedLocation.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("location", resolvedLocation);
      formData.append("type", type);

      if (photo) {
        formData.append("photo", photo);
      }

      if (extracted) {
        formData.append("extracted", JSON.stringify(extracted));
      }

      if (type === "found") {
        formData.append("taken", taken ? "true" : "false");
      }

      if (type === "lost" && reward.trim()) {
        formData.append("reward", reward.trim());
      }

      const res = await fetch("/api/items", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create item");
      }

      const data = await res.json();
      router.push(`/items/${data.item.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Photo Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Photo{type === "found" && " *"}
        </label>
        <PhotoUpload
          type={type}
          required={type === "found"}
          onPhotoSelected={setPhoto}
          onGenerated={handleGenerated}
          onGenerateError={handleGenerateError}
        />
        {type === "lost" && (
          <p className="mt-1 text-xs text-gray-500">
            Optional — helps finders confirm a match visually
          </p>
        )}
      </div>

      {/* Title */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Title *
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Blue Stanley Cup"
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-ua-oasis focus:border-transparent"
        />
        {aiGenerated && title && (
          <p className="mt-1 text-xs text-ua-leaf">
            AI-suggested — edit if needed
          </p>
        )}
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Description *
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the item — color, brand, distinguishing features..."
          required
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-ua-oasis focus:border-transparent resize-vertical"
        />
        {aiGenerated && description && (
          <p className="mt-1 text-xs text-ua-leaf">
            AI-suggested — edit if needed
          </p>
        )}
      </div>

      {/* Location */}
      <div>
        <label
          htmlFor="location"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Location *
        </label>
        <select
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-ua-oasis focus:border-transparent bg-white"
        >
          <option value="" disabled>
            {type === "lost"
              ? "Where did you lose it?"
              : "Where did you find it?"}
          </option>
          {CAMPUS_LOCATIONS.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
          <option value="__custom">Other (type below)</option>
        </select>
        {location === "__custom" && (
          <input
            type="text"
            value={customLocation}
            onChange={(e) => setCustomLocation(e.target.value)}
            placeholder="Enter the location"
            required
            className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-ua-oasis focus:border-transparent"
          />
        )}
      </div>

      {/* Found-only: Taken toggle */}
      {type === "found" && (
        <div>
          <span className="block text-sm font-medium text-gray-700 mb-2">
            Did you take the item with you?
          </span>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setTaken(true)}
              className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium border transition-colors min-h-[44px] ${
                taken
                  ? "bg-green-50 border-ua-leaf text-ua-leaf"
                  : "border-gray-300 text-gray-600 hover:border-gray-400"
              }`}
            >
              I took it with me
            </button>
            <button
              type="button"
              onClick={() => setTaken(false)}
              className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium border transition-colors min-h-[44px] ${
                !taken
                  ? "bg-amber-50 border-ua-mesa text-ua-mesa"
                  : "border-gray-300 text-gray-600 hover:border-gray-400"
              }`}
            >
              I left it there
            </button>
          </div>
        </div>
      )}

      {/* Lost-only: Reward */}
      {type === "lost" && (
        <div>
          <label
            htmlFor="reward"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Reward (optional)
          </label>
          <input
            id="reward"
            type="text"
            value={reward}
            onChange={(e) => setReward(e.target.value)}
            placeholder='e.g. "$10 Starbucks gift card"'
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-ua-oasis focus:border-transparent"
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={!isValid || submitting}
        className={`w-full py-3 px-4 rounded-lg text-sm font-semibold text-white transition-colors min-h-[48px] ${
          type === "lost"
            ? "bg-ua-red hover:bg-ua-chili disabled:bg-ua-red/50"
            : "bg-ua-leaf hover:bg-ua-river disabled:bg-ua-leaf/50"
        } disabled:cursor-not-allowed`}
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Submitting & finding matches...
          </span>
        ) : type === "lost" ? (
          "Report Lost Item"
        ) : (
          "Report Found Item"
        )}
      </button>
    </form>
  );
}
