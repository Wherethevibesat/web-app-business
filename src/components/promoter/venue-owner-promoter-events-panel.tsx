"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PromoterEventForReview } from "@/lib/data/promoter-events";

export function VenueOwnerPromoterEventsPanel({
  initial,
}: {
  initial: PromoterEventForReview[];
}) {
  const router = useRouter();
  const [events, setEvents] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function review(eventId: string, approval: "approved" | "rejected") {
    setBusy(eventId);
    setError(null);
    const res = await fetch("/api/venues/promoter-events", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId,
        approval,
        publish: approval === "approved",
      }),
    });
    const body = await res.json().catch(() => ({}));
    setBusy(null);

    if (!res.ok) {
      setError(body.error ?? "Could not update event");
      return;
    }

    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    router.refresh();
  }

  if (events.length === 0) {
    return (
      <p className="text-sm text-wtva-muted">
        No promoter events waiting for your approval.
      </p>
    );
  }

  return (
    <div>
      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
      <ul className="space-y-3">
        {events.map((e) => (
          <li
            key={e.id}
            className="rounded-xl border border-wtva-dark-300 bg-wtva-card p-4 text-sm"
          >
            <p className="font-semibold">{e.title}</p>
            <p className="mt-1 text-wtva-muted">
              {e.venue?.name ?? e.venue_id} ·{" "}
              {new Date(e.starts_at).toLocaleString()}
            </p>
            {e.promoter && (
              <p className="mt-1 text-wtva-muted">
                Submitted by {e.promoter.name}
                {e.promoter.email ? ` (${e.promoter.email})` : ""}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy === e.id}
                onClick={() => review(e.id, "approved")}
                className="rounded-full bg-accent-gradient shadow-accent px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
              >
                Approve & publish
              </button>
              <button
                type="button"
                disabled={busy === e.id}
                onClick={() => review(e.id, "rejected")}
                className="rounded-lg border border-wtva-dark-300 px-3 py-1.5 text-xs disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
