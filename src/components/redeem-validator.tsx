"use client";

import { useState } from "react";

type ValidationResult = {
  reward_title: string;
  member_name: string;
  cost_points: number;
  redeemed_at: string;
};

export function RedeemValidator() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    const res = await fetch("/api/rewards/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code.trim() }),
    });
    const body = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(body.error ?? "Invalid code");
      return;
    }
    setResult(body as ValidationResult);
    setCode("");
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block text-sm text-wtva-muted">Redemption code</label>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="e.g. 3F9A1C7B"
          autoCapitalize="characters"
          className="w-full rounded-lg border border-wtva-dark-300 bg-wtva-dark-400 px-4 py-3 text-center font-mono text-2xl font-bold uppercase tracking-widest"
        />
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="w-full rounded-full bg-accent-gradient shadow-accent py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Checking…" : "Validate & redeem"}
        </button>
      </form>

      {result && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-5 text-center">
          <p className="text-lg font-bold text-emerald-400">Valid — reward redeemed</p>
          <p className="mt-2 text-xl font-semibold">{result.reward_title}</p>
          <p className="mt-1 text-sm text-wtva-muted">
            Redeemed by {result.member_name} · {result.cost_points.toLocaleString()} pts
          </p>
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-5 text-center">
          <p className="font-semibold text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
