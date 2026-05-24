"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PromoterProfileInquiryRow } from "@/lib/types/promoter";

export function ProfileInboxPanel({ initial }: { initial: PromoterProfileInquiryRow[] }) {
  const router = useRouter();
  const [inquiries, setInquiries] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  async function setStatus(id: string, status: string) {
    setBusy(id);
    const res = await fetch("/api/promoter/profile-inquiries", {
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
        prev.map((i) =>
          i.id === id ? { ...i, status: status as PromoterProfileInquiryRow["status"] } : i,
        ),
      );
      router.refresh();
    }
  }

  if (inquiries.length === 0) {
    return <p className="text-sm text-wtva-muted">No profile contact messages yet.</p>;
  }

  return (
    <ul className="space-y-3">
      {inquiries.map((i) => (
        <li key={i.id} className="rounded-xl border border-wtva-dark-300 bg-wtva-card p-4">
          <div className="flex flex-wrap justify-between gap-2">
            <div>
              <p className="font-semibold">{i.guest_name}</p>
              <p className="text-xs text-wtva-muted">From public profile</p>
              {i.preferred_event && (
                <p className="mt-1 text-sm text-wtva-muted">Interested in: {i.preferred_event}</p>
              )}
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
                  className="rounded-lg bg-foreground px-3 py-1 text-xs font-semibold text-background"
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
                className="rounded-lg bg-foreground px-3 py-1 text-xs font-semibold text-background"
              >
                Mark booked
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

