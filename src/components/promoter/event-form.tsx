"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PromoterEventForm({
  approvedVenues,
}: {
  approvedVenues: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [venueId, setVenueId] = useState(approvedVenues[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState("Party");
  const [neighborhood, setNeighborhood] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/promoter/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        venue_id: venueId,
        title,
        description,
        event_type: eventType,
        neighborhood,
        starts_at: startsAt,
        ends_at: endsAt || null,
      }),
    });
    const body = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(body.error ?? "Save failed");
      return;
    }
    router.push("/promoter/events");
    router.refresh();
  }

  if (approvedVenues.length === 0) {
    return <p className="text-sm text-wtva-muted">Approve a venue first.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-4">
      <div>
        <label className="text-sm font-medium">Venue</label>
        <select
          value={venueId}
          onChange={(e) => setVenueId(e.target.value)}
          className="mt-1 w-full rounded-lg border border-wtva-dark-300 bg-wtva-card px-3 py-2 text-sm"
        >
          {approvedVenues.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium">Title *</label>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded-lg border border-wtva-dark-300 bg-wtva-card px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-lg border border-wtva-dark-300 bg-wtva-card px-3 py-2 text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Type</label>
          <input
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="mt-1 w-full rounded-lg border border-wtva-dark-300 bg-wtva-card px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Neighborhood</label>
          <input
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
            className="mt-1 w-full rounded-lg border border-wtva-dark-300 bg-wtva-card px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">Starts at *</label>
        <input
          required
          type="datetime-local"
          value={startsAt}
          onChange={(e) => setStartsAt(e.target.value)}
          className="mt-1 w-full rounded-lg border border-wtva-dark-300 bg-wtva-card px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Ends at</label>
        <input
          type="datetime-local"
          value={endsAt}
          onChange={(e) => setEndsAt(e.target.value)}
          className="mt-1 w-full rounded-lg border border-wtva-dark-300 bg-wtva-card px-3 py-2 text-sm"
        />
      </div>
      <p className="text-xs text-wtva-muted">
        Promoter-created events need venue or admin approval before appearing on the main calendar.
      </p>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-accent-gradient shadow-accent py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {loading ? "Submitting…" : "Submit event for review"}
      </button>
    </form>
  );
}
