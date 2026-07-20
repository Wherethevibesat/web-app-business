"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { PromoterInquiryRow } from "@/lib/types/promoter";

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

export function InboxPanel({ initial }: { initial: PromoterInquiryRow[] }) {
  const router = useRouter();
  const [inquiries, setInquiries] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const grouped = useMemo(() => {
    const map = new Map<string, PromoterInquiryRow[]>();
    for (const i of inquiries) {
      const key = i.event?.starts_at?.slice(0, 10) ?? "unknown";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(i);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [inquiries]);

  async function setStatus(id: string, status: string) {
    setBusy(id);
    const res = await fetch("/api/promoter/inquiries", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inquiryId: id,
        status,
        promoterNotes: notes[id] ?? "",
      }),
    });
    setBusy(null);
    if (res.ok) {
      setInquiries((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: status as PromoterInquiryRow["status"] } : i)),
      );
      router.refresh();
    }
  }

  if (inquiries.length === 0) {
    return <p className="text-sm text-wtva-muted">No customer inquiries yet.</p>;
  }

  return (
    <div className="space-y-8">
      {grouped.map(([date, rows]) => (
        <section key={date}>
          <h2 className="text-sm font-semibold text-wtva-muted">
            {date === "unknown"
              ? "Unknown date"
              : new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
          </h2>
          <ul className="mt-3 space-y-3">
            {rows.map((i) => (
              <li
                key={i.id}
                className="rounded-xl border border-wtva-dark-300 bg-wtva-card p-4"
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <div>
                    <p className="font-semibold">{i.guest_name}</p>
                    <p className="text-sm text-wtva-muted">
                      {i.offer?.name ?? "Offer"}
                      {i.offer ? ` · ${formatPrice(i.offer.price_cents)}` : ""}
                    </p>
                    <p className="text-xs text-wtva-muted">{i.event?.title}</p>
                  </div>
                  <span className="rounded-full bg-wtva-dark-300 px-2 py-0.5 text-xs capitalize">
                    {i.status}
                  </span>
                </div>
                <p className="mt-2 text-sm">
                  <a href={`mailto:${i.guest_email}`} className="underline">
                    {i.guest_email}
                  </a>
                  {i.guest_phone ? ` · ${i.guest_phone}` : ""}
                </p>
                {i.party_size != null && (
                  <p className="text-sm text-wtva-muted">Party size: {i.party_size}</p>
                )}
                {i.arrival_time && (
                  <p className="text-sm text-wtva-muted">Arrival: {i.arrival_time}</p>
                )}
                {i.notes && <p className="mt-1 text-sm text-wtva-muted">{i.notes}</p>}
                <textarea
                  className="mt-3 w-full rounded border border-wtva-dark-300 bg-wtva-dark-400 px-3 py-2 text-sm"
                  rows={2}
                  placeholder="Note to customer (optional)"
                  value={notes[i.id] ?? ""}
                  onChange={(e) => setNotes((n) => ({ ...n, [i.id]: e.target.value }))}
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {i.status === "pending" && (
                    <>
                      <button
                        type="button"
                        disabled={busy === i.id}
                        onClick={() => setStatus(i.id, "reserved")}
                        className="rounded-lg border border-wtva-dark-300 px-3 py-1 text-xs font-semibold"
                      >
                        Reserved
                      </button>
                      <button
                        type="button"
                        disabled={busy === i.id}
                        onClick={() => setStatus(i.id, "booked")}
                        className="rounded-full bg-accent-gradient shadow-accent px-3 py-1 text-xs font-semibold text-white"
                      >
                        Booked
                      </button>
                      <button
                        type="button"
                        disabled={busy === i.id}
                        onClick={() => setStatus(i.id, "declined")}
                        className="rounded-lg px-3 py-1 text-xs text-red-400"
                      >
                        Decline
                      </button>
                    </>
                  )}
                  {i.status === "reserved" && (
                    <button
                      type="button"
                      disabled={busy === i.id}
                      onClick={() => setStatus(i.id, "booked")}
                      className="rounded-full bg-accent-gradient shadow-accent px-3 py-1 text-xs font-semibold text-white"
                    >
                      Mark booked
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
