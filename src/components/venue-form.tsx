"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { OpeningHoursEditor } from "@/components/opening-hours-editor";
import { VenueImageUpload } from "@/components/venue-image-upload";
import {
  defaultOpeningHours,
  formatHoursLabel,
  normalizeOpeningHours,
  parseOpeningHours,
} from "@/lib/types/opening-hours";
import {
  DEFAULT_VENUE_TYPE,
  VENUE_TYPES,
  type BusinessVenueFormData,
} from "@/lib/types/venue";

type NeighborhoodOption = { id: string; name: string; slug: string };

type VenueFormProps = {
  ownerId: string;
  initial?: Partial<BusinessVenueFormData> & { opening_hours?: unknown };
  neighborhoods: NeighborhoodOption[];
  mode: "create" | "edit";
  venueId?: string;
};

export function VenueForm({ ownerId, initial, neighborhoods, mode, venueId }: VenueFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<BusinessVenueFormData>(() => ({
    id: initial?.id,
    name: initial?.name ?? "",
    venue_type: initial?.venue_type ?? DEFAULT_VENUE_TYPE,
    address: initial?.address ?? "",
    neighborhood: initial?.neighborhood ?? "",
    description: initial?.description ?? "",
    image_url: initial?.image_url ?? "",
    phone: initial?.phone ?? "",
    hours_label: initial?.hours_label ?? "",
    opening_hours: initial?.opening_hours
      ? parseOpeningHours(initial.opening_hours)
      : defaultOpeningHours(),
    website_url: initial?.website_url ?? "",
    instagram_url: initial?.instagram_url ?? "",
    facebook_url: initial?.facebook_url ?? "",
    tiktok_url: initial?.tiktok_url ?? "",
    twitter_url: initial?.twitter_url ?? "",
  }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof BusinessVenueFormData>(key: K, value: BusinessVenueFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const opening_hours = normalizeOpeningHours(form.opening_hours);
    const hours_label = formatHoursLabel(opening_hours);
    const payload = { ...form, opening_hours, hours_label };

    const url = mode === "edit" && venueId ? `/api/venues/${venueId}` : "/api/venues";
    const method = mode === "edit" ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(payload),
    });

    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to save venue");
      return;
    }

    router.push("/venues");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <p className="text-sm text-wtva-muted">
        {mode === "create"
          ? "Add your venue so you can post events, promotions, and accept check-ins."
          : "Update your venue details. Changes appear in customer search and on your venue page."}
      </p>

      <VenueImageUpload
        ownerId={ownerId}
        value={form.image_url}
        onChange={(url) => update("image_url", url)}
      />

      <div>
        <label className="mb-1 block text-sm font-medium">Venue name *</label>
        <input
          required
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          className="w-full rounded-lg border border-wtva-dark-300 bg-wtva-dark-400 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Venue type *</label>
          <select
            required
            value={form.venue_type}
            onChange={(e) => update("venue_type", e.target.value)}
            className="w-full rounded-lg border border-wtva-dark-300 bg-wtva-dark-400 px-3 py-2 text-sm"
          >
            {VENUE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Neighborhood *</label>
          <select
            required
            value={form.neighborhood}
            onChange={(e) => update("neighborhood", e.target.value)}
            className="w-full rounded-lg border border-wtva-dark-300 bg-wtva-dark-400 px-3 py-2 text-sm"
          >
            <option value="">Select neighborhood</option>
            {neighborhoods.map((n) => (
              <option key={n.id} value={n.name}>
                {n.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Address</label>
        <input
          value={form.address}
          onChange={(e) => update("address", e.target.value)}
          placeholder="Street address"
          className="w-full rounded-lg border border-wtva-dark-300 bg-wtva-dark-400 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Phone</label>
        <input
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
          className="w-full rounded-lg border border-wtva-dark-300 bg-wtva-dark-400 px-3 py-2 text-sm"
        />
      </div>

      <OpeningHoursEditor
        value={form.opening_hours}
        onChange={(opening_hours) => update("opening_hours", opening_hours)}
      />

      <div>
        <label className="mb-1 block text-sm font-medium">Description</label>
        <textarea
          rows={4}
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          className="w-full rounded-lg border border-wtva-dark-300 bg-wtva-dark-400 px-3 py-2 text-sm"
        />
      </div>

      <fieldset className="space-y-4 rounded-lg border border-wtva-dark-300 p-4">
        <legend className="px-1 text-sm font-medium">Website & social</legend>
        <div>
          <label className="mb-1 block text-xs text-wtva-muted">Website</label>
          <input
            type="url"
            value={form.website_url}
            onChange={(e) => update("website_url", e.target.value)}
            placeholder="https://yourvenue.com"
            className="w-full rounded-lg border border-wtva-dark-300 bg-wtva-dark-400 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-wtva-muted">Instagram</label>
          <input
            type="url"
            value={form.instagram_url}
            onChange={(e) => update("instagram_url", e.target.value)}
            placeholder="https://instagram.com/yourvenue"
            className="w-full rounded-lg border border-wtva-dark-300 bg-wtva-dark-400 px-3 py-2 text-sm"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-wtva-muted">Facebook</label>
            <input
              type="url"
              value={form.facebook_url}
              onChange={(e) => update("facebook_url", e.target.value)}
              placeholder="https://facebook.com/…"
              className="w-full rounded-lg border border-wtva-dark-300 bg-wtva-dark-400 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-wtva-muted">TikTok</label>
            <input
              type="url"
              value={form.tiktok_url}
              onChange={(e) => update("tiktok_url", e.target.value)}
              placeholder="https://tiktok.com/@…"
              className="w-full rounded-lg border border-wtva-dark-300 bg-wtva-dark-400 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs text-wtva-muted">X (Twitter)</label>
          <input
            type="url"
            value={form.twitter_url}
            onChange={(e) => update("twitter_url", e.target.value)}
            placeholder="https://x.com/yourvenue"
            className="w-full rounded-lg border border-wtva-dark-300 bg-wtva-dark-400 px-3 py-2 text-sm"
          />
        </div>
      </fieldset>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background disabled:opacity-50"
        >
          {loading ? "Saving…" : mode === "create" ? "Add venue" : "Save changes"}
        </button>
        <Link
          href="/venues"
          className="rounded-lg border border-wtva-dark-300 px-4 py-2 text-sm font-semibold"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
