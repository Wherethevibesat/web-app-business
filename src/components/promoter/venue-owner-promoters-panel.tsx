"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type LinkRow = {
  id: string;
  venue_id: string;
  status: string;
  requested_at: string;
  venue?: { id: string; name: string } | null;
  promoter?: { id: string; name: string; email: string } | null;
};

export function VenueOwnerPromotersPanel({ initial }: { initial: LinkRow[] }) {
  const router = useRouter();
  const [links, setLinks] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);

  async function review(linkId: string, status: "approved" | "rejected") {
    setBusy(linkId);
    const res = await fetch("/api/venues/promoter-links", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ linkId, status }),
    });
    setBusy(null);
    if (res.ok) {
      setLinks((prev) => prev.filter((l) => l.id !== linkId));
      router.refresh();
    }
  }

  if (links.length === 0) {
    return <p className="text-sm text-wtva-muted">No pending promoter requests.</p>;
  }

  return (
    <ul className="space-y-3">
      {links.map((l) => (
        <li
          key={l.id}
          className="rounded-xl border border-wtva-dark-300 bg-wtva-card p-4 text-sm"
        >
          <p className="font-semibold">{l.promoter?.name ?? "Promoter"}</p>
          <p className="text-wtva-muted">{l.promoter?.email}</p>
          <p className="mt-1">Venue: {l.venue?.name ?? l.venue_id}</p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={busy === l.id}
              onClick={() => review(l.id, "approved")}
              className="rounded-full bg-accent-gradient shadow-accent px-3 py-1 text-xs font-semibold text-white"
            >
              Approve
            </button>
            <button
              type="button"
              disabled={busy === l.id}
              onClick={() => review(l.id, "rejected")}
              className="rounded-lg border border-wtva-dark-300 px-3 py-1 text-xs"
            >
              Reject
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
