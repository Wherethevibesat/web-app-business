"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type EventOption = { id: string; title: string; venue_id: string; starts_at: string };

export function OfferForm({
  events,
  approvedVenueIds,
}: {
  events: EventOption[];
  approvedVenueIds: string[];
}) {
  const router = useRouter();
  const [eventId, setEventId] = useState(events[0]?.id ?? "");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [capacity, setCapacity] = useState("1");
  const [allowPay, setAllowPay] = useState(true);
  const [allowInquire, setAllowInquire] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedEvent = events.find((e) => e.id === eventId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEvent) return;
    setLoading(true);
    setError(null);
    const res = await fetch("/api/promoter/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_id: eventId,
        venue_id: selectedEvent.venue_id,
        name,
        description,
        price_dollars: price,
        capacity,
        allow_pay: allowPay,
        allow_inquire: allowInquire,
      }),
    });
    const body = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(body.error ?? "Save failed");
      return;
    }
    router.push("/promoter/offers");
    router.refresh();
  }

  if (approvedVenueIds.length === 0) {
    return (
      <p className="text-sm text-wtva-muted">
        Get at least one venue approved before creating offers.
      </p>
    );
  }

  if (events.length === 0) {
    return (
      <p className="text-sm text-wtva-muted">
        No events available. Create an event or wait for venue events to publish.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-4">
      <div>
        <label className="text-sm font-medium">Event</label>
        <select
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          className="mt-1 w-full rounded-lg border border-wtva-dark-300 bg-wtva-card px-3 py-2 text-sm"
        >
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.title} · {new Date(ev.starts_at).toLocaleDateString()}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium">Offer name *</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="VIP Section"
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
          <label className="text-sm font-medium">Price ($) *</label>
          <input
            required
            type="number"
            min={0}
            step={1}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="mt-1 w-full rounded-lg border border-wtva-dark-300 bg-wtva-card px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Capacity *</label>
          <input
            required
            type="number"
            min={1}
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            className="mt-1 w-full rounded-lg border border-wtva-dark-300 bg-wtva-card px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={allowInquire} onChange={(e) => setAllowInquire(e.target.checked)} />
          Allow inquire
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={allowPay} onChange={(e) => setAllowPay(e.target.checked)} />
          Allow pay (coming soon)
        </label>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-foreground py-3 text-sm font-semibold text-background disabled:opacity-50"
      >
        {loading ? "Saving…" : "Create offer"}
      </button>
    </form>
  );
}
