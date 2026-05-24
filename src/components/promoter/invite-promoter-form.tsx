"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type VenueOption = { id: string; name: string };

export function InvitePromoterForm({ venues }: { venues: VenueOption[] }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [venueId, setVenueId] = useState(venues[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);

    const res = await fetch("/api/venues/promoter-links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, venueId }),
    });
    const body = await res.json().catch(() => ({}));
    setBusy(false);

    if (!res.ok) {
      setError(body.error ?? "Failed to add promoter");
      return;
    }

    setSuccess(`${body.promoter?.name ?? email} is now linked to your venue.`);
    setEmail("");
    router.refresh();
  }

  if (venues.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-wtva-dark-300 p-4 text-sm text-wtva-muted">
        Add a venue first before inviting promoters.
      </p>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border border-wtva-dark-300 bg-wtva-card p-5"
    >
      <h2 className="font-semibold">Add promoter</h2>
      <p className="mt-1 text-sm text-wtva-muted">
        Link an existing promoter by email. They must already have a promoter account.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-wtva-muted">Promoter email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="promoter@example.com"
            className="mt-1 w-full rounded-lg border border-wtva-dark-300 bg-wtva-dark-400 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="text-wtva-muted">Venue</span>
          <select
            required
            value={venueId}
            onChange={(e) => setVenueId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-wtva-dark-300 bg-wtva-dark-400 px-3 py-2 text-sm"
          >
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      {success && <p className="mt-3 text-sm text-green-400">{success}</p>}

      <button
        type="submit"
        disabled={busy}
        className="mt-4 rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background disabled:opacity-50"
      >
        {busy ? "Adding…" : "Add promoter"}
      </button>
      <p className="mt-3 text-xs text-wtva-muted">
        New promoters can register at{" "}
        <a href="/auth/register?role=promoter" className="underline">
          business signup
        </a>
        .
      </p>
    </form>
  );
}
