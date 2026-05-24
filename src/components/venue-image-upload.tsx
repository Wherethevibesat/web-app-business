"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { uploadVenueImage } from "@/lib/venue-image-upload";

type VenueImageUploadProps = {
  ownerId: string;
  value: string;
  onChange: (url: string) => void;
};

export function VenueImageUpload({ ownerId, value, onChange }: VenueImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadVenueImage(file, ownerId);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium">Venue photo</p>
        <p className="text-xs text-wtva-muted">Upload a cover image (JPG, PNG, or WebP, max 5 MB).</p>
      </div>

      {value ? (
        <div className="relative aspect-[21/9] max-h-48 w-full overflow-hidden rounded-lg border border-wtva-dark-300">
          <Image src={value} alt="Venue preview" fill className="object-cover" unoptimized />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="rounded-lg border border-wtva-dark-300 px-4 py-2 text-sm font-semibold disabled:opacity-50"
        >
          {uploading ? "Uploading…" : value ? "Replace photo" : "Upload photo"}
        </button>
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-sm text-wtva-muted underline"
          >
            Remove
          </button>
        ) : null}
      </div>

      <div>
        <label className="mb-1 block text-xs text-wtva-muted">Or paste image URL</label>
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…"
          className="w-full rounded-lg border border-wtva-dark-300 bg-wtva-dark-400 px-3 py-2 text-sm"
        />
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
