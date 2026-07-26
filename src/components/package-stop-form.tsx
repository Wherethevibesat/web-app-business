"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const SLOT_TYPES = [
  { value: "brunch", label: "Brunch" },
  { value: "day_party", label: "Day party" },
  { value: "lounge", label: "Lounge / cocktails" },
  { value: "night", label: "Night / main event" },
  { value: "after_hours", label: "After hours" },
  { value: "other", label: "Other" },
];

export function PackageStopForm({
  initial,
}: {
  initial?: {
    id?: string;
    title?: string;
    description?: string;
    slot_type?: string;
    price_cents?: number;
    inclusions?: string[];
    capacity?: number | null;
    arrival_window?: string | null;
    image_url?: string | null;
    why_picked?: string | null;
    duration_label?: string | null;
    dress_code?: string | null;
    crowd_label?: string | null;
    contract_accepted?: boolean;
    diy_pool?: boolean;
  };
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [slotType, setSlotType] = useState(initial?.slot_type ?? "brunch");
  const [price, setPrice] = useState(
    initial?.price_cents != null ? (initial.price_cents / 100).toFixed(2) : "",
  );
  const [inclusions, setInclusions] = useState((initial?.inclusions ?? []).join("\n"));
  const [capacity, setCapacity] = useState(initial?.capacity?.toString() ?? "");
  const [arrivalWindow, setArrivalWindow] = useState(initial?.arrival_window ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? "");
  const [whyPicked, setWhyPicked] = useState(initial?.why_picked ?? "");
  const [durationLabel, setDurationLabel] = useState(initial?.duration_label ?? "");
  const [dressCode, setDressCode] = useState(initial?.dress_code ?? "");
  const [crowdLabel, setCrowdLabel] = useState(initial?.crowd_label ?? "");
  const [contractAccepted, setContractAccepted] = useState(Boolean(initial?.contract_accepted));
  const [diyLive, setDiyLive] = useState(Boolean(initial?.diy_pool));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(opts: {
    submitForReview?: boolean;
    publishToDiy?: boolean;
    unpublishDiy?: boolean;
  }) {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    const priceCents = Math.round(Number(price) * 100);
    if (!Number.isFinite(priceCents) || priceCents < 0) {
      setError("Enter a valid price");
      return;
    }
    const needsContract = opts.submitForReview || opts.publishToDiy;
    if (needsContract && !contractAccepted) {
      setError("Accept the participation terms to go live or submit for curated review");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch("/api/package-stops", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: initial?.id,
        title,
        description,
        slotType,
        priceCents,
        inclusions,
        capacity,
        arrivalWindow,
        imageUrl,
        whyPicked,
        durationLabel,
        dressCode,
        crowdLabel,
        contractAccepted,
        submitForReview: Boolean(opts.submitForReview),
        publishToDiy: Boolean(opts.publishToDiy),
        unpublishDiy: Boolean(opts.unpublishDiy),
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Could not save");
      return;
    }
    if (opts.publishToDiy) setDiyLive(true);
    if (opts.unpublishDiy) setDiyLive(false);
    router.push("/package-stops");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-500">{error}</p>}
      <label className="block text-sm">
        <span className="font-medium">Title</span>
        <input
          className="mt-1 w-full rounded-lg border border-wtva-dark-300 bg-wtva-card px-3 py-2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Sunday Brunch Package"
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium">Slot type</span>
        <select
          className="mt-1 w-full rounded-lg border border-wtva-dark-300 bg-wtva-card px-3 py-2"
          value={slotType}
          onChange={(e) => setSlotType(e.target.value)}
        >
          {SLOT_TYPES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        <span className="font-medium">Price per person (USD)</span>
        <input
          type="number"
          min="0"
          step="0.01"
          className="mt-1 w-full rounded-lg border border-wtva-dark-300 bg-wtva-card px-3 py-2"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="200.00"
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium">Arrival window</span>
        <input
          className="mt-1 w-full rounded-lg border border-wtva-dark-300 bg-wtva-card px-3 py-2"
          value={arrivalWindow}
          onChange={(e) => setArrivalWindow(e.target.value)}
          placeholder="11:00 AM – 2:00 PM"
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium">What’s included (one per line)</span>
        <textarea
          className="mt-1 min-h-24 w-full rounded-lg border border-wtva-dark-300 bg-wtva-card px-3 py-2"
          value={inclusions}
          onChange={(e) => setInclusions(e.target.value)}
          placeholder={"Bottomless mimosas\nReserved seating"}
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium">Description</span>
        <textarea
          className="mt-1 min-h-20 w-full rounded-lg border border-wtva-dark-300 bg-wtva-card px-3 py-2"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium">Guest highlight</span>
        <span className="mt-0.5 block text-xs text-wtva-muted">
          Short note guests see when building a vibe — what’s special about this experience.
        </span>
        <textarea
          className="mt-1 min-h-16 w-full rounded-lg border border-wtva-dark-300 bg-wtva-card px-3 py-2"
          value={whyPicked}
          onChange={(e) => setWhyPicked(e.target.value)}
          placeholder="Reserved patio seating, bottomless mimosas, 2-minute walk to nightlife…"
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block text-sm">
          <span className="font-medium">Duration</span>
          <input
            className="mt-1 w-full rounded-lg border border-wtva-dark-300 bg-wtva-card px-3 py-2"
            value={durationLabel}
            onChange={(e) => setDurationLabel(e.target.value)}
            placeholder="2.5 Hours"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Dress code</span>
          <input
            className="mt-1 w-full rounded-lg border border-wtva-dark-300 bg-wtva-card px-3 py-2"
            value={dressCode}
            onChange={(e) => setDressCode(e.target.value)}
            placeholder="Smart casual"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Crowd</span>
          <input
            className="mt-1 w-full rounded-lg border border-wtva-dark-300 bg-wtva-card px-3 py-2"
            value={crowdLabel}
            onChange={(e) => setCrowdLabel(e.target.value)}
            placeholder="Lively"
          />
        </label>
      </div>
      <label className="block text-sm">
        <span className="font-medium">Capacity (optional)</span>
        <input
          type="number"
          min="1"
          className="mt-1 w-full rounded-lg border border-wtva-dark-300 bg-wtva-card px-3 py-2"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium">Image URL (optional)</span>
        <input
          className="mt-1 w-full rounded-lg border border-wtva-dark-300 bg-wtva-card px-3 py-2"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />
      </label>

      <label className="flex items-start gap-3 rounded-xl border border-wtva-dark-300 bg-wtva-card p-4 text-sm">
        <input
          type="checkbox"
          className="mt-1"
          checked={contractAccepted}
          onChange={(e) => setContractAccepted(e.target.checked)}
        />
        <span>
          I agree WTVA may list this experience in the DIY / random vibe pool and curated
          multi-stop vibes, honor confirmed guests at the listed price/inclusions, and settle
          payouts per WTVA’s terms.
        </span>
      </label>

      {diyLive && (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800">
          Live in DIY pool — guests can add this to Build Your Own or Surprise Me vibes.
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => save({})}
          className="rounded-full border border-wtva-dark-300 px-5 py-2.5 text-sm font-semibold"
        >
          Save draft
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            diyLive ? save({ unpublishDiy: true }) : save({ publishToDiy: true })
          }
          className="rounded-full border border-accent px-5 py-2.5 text-sm font-semibold text-accent"
        >
          {busy ? "Saving…" : diyLive ? "Take off DIY pool" : "Go live in DIY pool"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => save({ submitForReview: true })}
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white"
        >
          {busy ? "Saving…" : "Submit for curated review"}
        </button>
      </div>
    </div>
  );
}
