"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DriverBookingRow } from "@/lib/types/driver";

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

export function BookingsPanel({ initial }: { initial: DriverBookingRow[] }) {
  const router = useRouter();
  const [bookings, setBookings] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  async function respond(id: string, action: "accept" | "decline") {
    setBusy(id);
    const res = await fetch("/api/driver/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingId: id,
        action,
        driverNotes: notes[id] ?? "",
      }),
    });
    setBusy(null);
    if (res.ok) {
      setBookings((prev) =>
        prev.map((b) =>
          b.id === id ? { ...b, status: action === "accept" ? "accepted" : "declined" } : b,
        ),
      );
      router.refresh();
    }
  }

  if (bookings.length === 0) {
    return <p className="text-sm text-wtva-muted">No bookings yet.</p>;
  }

  return (
    <ul className="space-y-4">
      {bookings.map((b) => (
        <li key={b.id} className="rounded-xl border border-wtva-dark-300 bg-wtva-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-semibold">{b.vehicle?.name ?? "Vehicle"}</p>
              <p className="text-sm text-wtva-muted">
                {new Date(b.scheduled_starts_at).toLocaleString()} · {formatPrice(b.price_cents)}
              </p>
            </div>
            <span className="rounded-full bg-wtva-dark-300 px-2 py-0.5 text-xs font-medium capitalize">
              {b.status.replace("_", " ")}
            </span>
          </div>
          <p className="mt-2 text-sm">
            <span className="text-wtva-muted">Pickup:</span> {b.pickup_address}
          </p>
          {b.dropoff_address && (
            <p className="text-sm">
              <span className="text-wtva-muted">Dropoff:</span> {b.dropoff_address}
            </p>
          )}
          {b.customer_notes && (
            <p className="mt-1 text-sm text-wtva-muted">Customer: {b.customer_notes}</p>
          )}
          {b.status === "pending_driver" && (
            <div className="mt-3 space-y-2">
              <textarea
                placeholder="Note to customer (optional)"
                value={notes[b.id] ?? ""}
                onChange={(e) => setNotes((n) => ({ ...n, [b.id]: e.target.value }))}
                className="w-full rounded border border-wtva-dark-300 bg-wtva-dark-400 px-3 py-2 text-sm"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy === b.id}
                  onClick={() => respond(b.id, "accept")}
                  className="rounded-full bg-accent-gradient shadow-accent px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Accept
                </button>
                <button
                  type="button"
                  disabled={busy === b.id}
                  onClick={() => respond(b.id, "decline")}
                  className="rounded-lg border border-wtva-dark-300 px-3 py-1.5 text-xs"
                >
                  Decline
                </button>
              </div>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
