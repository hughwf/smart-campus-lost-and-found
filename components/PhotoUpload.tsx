"use client";

import { useState, useRef, useCallback } from "react";
import imageCompression from "browser-image-compression";
import Image from "next/image";
import { ExtractedAttributes } from "@/lib/types";

interface PhotoUploadProps {
  type: "lost" | "found";
  required?: boolean;
  onPhotoSelected: (file: File) => void;
  onGenerated: (data: {
    title: string;
    description: string;
    extracted: ExtractedAttributes;
  }) => void;
  onGenerateError: () => void;
}

type Status = "idle" | "compressing" | "generating" | "done" | "error";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];
const MAX_FILE_SIZE_MB = 0.5; // 500KB target
const MAX_WIDTH_OR_HEIGHT = 1920;

export default function PhotoUpload({
  type,
  required = false,
  onPhotoSelected,
  onGenerated,
  onGenerateError,
}: PhotoUploadProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File) => {
      setErrorMsg(null);

      if (!file.type.startsWith("image/") && !ACCEPTED_TYPES.includes(file.type)) {
        setErrorMsg("Please select an image file (JPG, PNG, WebP, or HEIC).");
        return;
      }

      // Show preview immediately from the original file
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      // Compress
      setStatus("compressing");
      let compressed: File;
      try {
        compressed = await imageCompression(file, {
          maxSizeMB: MAX_FILE_SIZE_MB,
          maxWidthOrHeight: MAX_WIDTH_OR_HEIGHT,
          useWebWorker: true,
          fileType: "image/jpeg",
        });
      } catch {
        // If compression fails, fall back to original file
        compressed = file;
      }

      onPhotoSelected(compressed);

      // Generate title/description via API
      setStatus("generating");
      try {
        const formData = new FormData();
        formData.append("photo", compressed);
        formData.append("type", type);

        const res = await fetch("/api/items/generate", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          throw new Error(`Generate failed: ${res.status}`);
        }

        const data = await res.json();
        setStatus("done");
        onGenerated(data);
      } catch {
        setStatus("error");
        setErrorMsg(
          "Could not auto-generate details. Please fill in the fields manually."
        );
        onGenerateError();
      }
    },
    [type, onPhotoSelected, onGenerated, onGenerateError]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleRemove = () => {
    setPreview(null);
    setStatus("idle");
    setErrorMsg(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        required={required && !preview}
      />

      {!preview ? (
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            border-2 border-dashed rounded-lg p-6 sm:p-8 text-center cursor-pointer
            transition-colors min-h-[120px] flex flex-col items-center justify-center
            ${
              dragOver
                ? "border-ua-oasis bg-blue-50"
                : "border-gray-300 hover:border-gray-400 bg-gray-50"
            }
          `}
        >
          <svg
            className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
          <p className="mt-2 text-sm font-medium text-gray-700">
            Tap to take a photo or upload
          </p>
          <p className="mt-1 text-xs text-gray-500">
            JPG, PNG, WebP, or HEIC — will be compressed automatically
          </p>
        </div>
      ) : (
        <div className="relative rounded-lg overflow-hidden border border-gray-200">
          <div className="relative aspect-video w-full bg-gray-100">
            <Image
              src={preview}
              alt="Item preview"
              fill
              className="object-contain"
              unoptimized
            />
          </div>

          {/* Status overlay */}
          {(status === "compressing" || status === "generating") && (
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
              <div className="h-8 w-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
              <p className="mt-2 text-sm font-medium text-white">
                {status === "compressing"
                  ? "Compressing image..."
                  : "Analyzing photo with AI..."}
              </p>
            </div>
          )}

          {/* Done badge */}
          {status === "done" && (
            <div className="absolute top-2 left-2 bg-ua-leaf text-white text-xs font-medium px-2 py-1 rounded">
              AI details generated
            </div>
          )}

          {/* Remove button */}
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-white/90 hover:bg-white text-gray-700 rounded-full p-2 shadow transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
            aria-label="Remove photo"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Error message */}
      {errorMsg && (
        <p className="mt-2 text-sm text-red-600">{errorMsg}</p>
      )}
    </div>
  );
}
