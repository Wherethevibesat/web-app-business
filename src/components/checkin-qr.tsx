"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";

export function CheckinQr({
  venueId,
  venueName,
  checkInUrl,
  initialRequire,
}: {
  venueId: string;
  venueName: string;
  checkInUrl: string;
  initialRequire: boolean;
}) {
  const [require, setRequire] = useState(initialRequire);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle(next: boolean) {
    setSaving(true);
    setError(null);
    const prev = require;
    setRequire(next);
    const res = await fetch(`/api/venues/${venueId}/qr`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ require: next }),
    });
    setSaving(false);
    if (!res.ok) {
      setRequire(prev);
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to save");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center rounded-2xl border border-wtva-dark-300 bg-white p-6 text-center print:border-0">
        <div className="rounded-xl bg-white p-3">
          <QRCodeSVG value={checkInUrl} size={240} level="M" includeMargin />
        </div>
        <p className="mt-4 text-lg font-bold text-black">{venueName}</p>
        <p className="text-sm text-gray-600">Scan to check in &amp; earn points</p>
      </div>

      <div className="flex items-start justify-between gap-4 rounded-xl border border-wtva-dark-300 bg-wtva-card p-4">
        <div>
          <p className="font-medium">Require QR to check in</p>
          <p className="text-sm text-wtva-muted">
            When on, guests must scan this code (and be on-site) to earn points here.
          </p>
          {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={require}
          disabled={saving}
          onClick={() => toggle(!require)}
          className={`relative mt-1 h-6 w-11 shrink-0 rounded-full transition-colors ${
            require ? "bg-emerald-500" : "bg-wtva-dark-300"
          } disabled:opacity-50`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
              require ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      <div className="flex flex-wrap gap-3 print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background"
        >
          Print QR
        </button>
      </div>
    </div>
  );
}
