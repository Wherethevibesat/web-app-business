"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function BookingForm({
  talentUserId,
  venueId,
}: {
  talentUserId: string;
  venueId: string;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("50");
  const [eventAt, setEventAt] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ talentUserId, venueId, amount: Number(amount), eventAt, note }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/bookings");
      router.refresh();
    } else {
      alert("Booking failed");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-wtva-dark-300 bg-wtva-card p-5">
      <h2 className="font-semibold">Book talent</h2>
      <input
        type="datetime-local"
        required
        value={eventAt}
        onChange={(e) => setEventAt(e.target.value)}
        className="w-full rounded-lg border border-wtva-dark-300 bg-wtva-dark-400 px-3 py-2 text-sm"
      />
      <input
        type="number"
        required
        min={0}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount ($)"
        className="w-full rounded-lg border border-wtva-dark-300 bg-wtva-dark-400 px-3 py-2 text-sm"
      />
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note"
        className="w-full rounded-lg border border-wtva-dark-300 bg-wtva-dark-400 px-3 py-2 text-sm"
        rows={2}
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-foreground py-2 text-sm font-semibold text-background disabled:opacity-50"
      >
        {loading ? "Sending…" : "Create booking"}
      </button>
    </form>
  );
}
