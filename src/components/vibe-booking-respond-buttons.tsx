"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function VibeBookingRespondButtons({ stopId }: { stopId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"confirm" | "decline" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function respond(decision: "confirm" | "decline") {
    setBusy(decision);
    setError(null);
    const res = await fetch(`/api/vibe-bookings/${stopId}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) {
      setError(data.error ?? "Could not update");
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-4 space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy != null}
          onClick={() => respond("confirm")}
          className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy === "confirm" ? "Confirming…" : "Confirm"}
        </button>
        <button
          type="button"
          disabled={busy != null}
          onClick={() => respond("decline")}
          className="rounded-full border border-wtva-dark-300 px-4 py-2 text-sm font-semibold disabled:opacity-60"
        >
          {busy === "decline" ? "Declining…" : "Decline"}
        </button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
