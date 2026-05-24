"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { PromoterVenueLinkRow } from "@/lib/types/promoter";

export function VenueLinksClient({
  initialLinks,
  venues,
}: {
  initialLinks: PromoterVenueLinkRow[];
  venues: { id: string; name: string; neighborhood: string | null }[];
}) {
  const router = useRouter();
  const [links, setLinks] = useState(initialLinks);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableVenues = useMemo(() => {
    const linked = new Set(links.map((l) => l.venue_id));
    return venues.filter((v) => !linked.has(v.id));
  }, [venues, links]);

  const filteredVenues = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return availableVenues;
    return availableVenues.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        (v.neighborhood ?? "").toLowerCase().includes(q),
    );
  }, [availableVenues, search]);

  async function requestLinks() {
    if (selected.length === 0) return;
    setLoading(true);
    setError(null);
    const res = await fetch("/api/promoter/venue-links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ venueIds: selected }),
    });
    const body = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(body.error ?? "Request failed");
      return;
    }
    setSelected([]);
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-semibold">Your venue links</h2>
        {links.length === 0 ? (
          <p className="mt-2 text-sm text-wtva-muted">No venues linked yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {links.map((l) => (
              <li
                key={l.id}
                className="flex justify-between rounded-lg border border-wtva-dark-300 bg-wtva-card px-4 py-3 text-sm"
              >
                <span>{l.venue?.name ?? l.venue_id}</span>
                <span className="capitalize text-wtva-muted">{l.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-semibold">Request new venues</h2>
        <p className="mt-1 text-sm text-wtva-muted">
          Select venues you promote for. The venue owner or admin must approve.
        </p>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by venue name or neighborhood…"
          className="mt-4 w-full rounded-lg border border-wtva-dark-300 bg-wtva-dark-400 px-3 py-2.5 text-sm outline-none focus:border-foreground"
        />
        <p className="mt-2 text-xs text-wtva-muted">
          {search.trim()
            ? `${filteredVenues.length} of ${availableVenues.length} venues`
            : `${availableVenues.length} venues available`}
          {selected.length > 0 ? ` · ${selected.length} selected` : ""}
        </p>
        <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto">
          {filteredVenues.length === 0 ? (
            <li className="rounded-lg border border-dashed border-wtva-dark-300 px-3 py-6 text-center text-sm text-wtva-muted">
              {availableVenues.length === 0
                ? "No new venues to request."
                : "No venues match your search."}
            </li>
          ) : (
            filteredVenues.map((v) => (
              <li key={v.id}>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-wtva-dark-300 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selected.includes(v.id)}
                    onChange={(e) => {
                      setSelected((prev) =>
                        e.target.checked
                          ? [...prev, v.id]
                          : prev.filter((id) => id !== v.id),
                      );
                    }}
                  />
                  <span className="text-sm">
                    {v.name}
                    {v.neighborhood ? ` · ${v.neighborhood}` : ""}
                  </span>
                </label>
              </li>
            ))
          )}
        </ul>
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        <button
          type="button"
          disabled={loading || selected.length === 0}
          onClick={requestLinks}
          className="mt-4 rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background disabled:opacity-50"
        >
          {loading ? "Sending…" : "Request access"}
        </button>
      </section>
    </div>
  );
}
