"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { StripeConnectState } from "@/lib/stripe/connect";
import { Button } from "@/components/ui/button";

export function StripeConnectPanel({
  venueId,
  stripeState,
}: {
  venueId: string;
  stripeState: StripeConnectState | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function disconnect() {
    if (
      !confirm(
        "Disconnect Stripe from your business?\n\nYou won’t receive payouts until you connect again.",
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/venues/stripe/disconnect", {
        method: "POST",
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(body.error ?? "Disconnect failed");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Disconnect failed");
    } finally {
      setBusy(false);
    }
  }

  if (!stripeState) {
    return (
      <p className="text-sm text-amber-700">
        Stripe payouts are not configured on this environment yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}

      {stripeState.status === "not_connected" && (
        <>
          <p className="text-sm text-wtva-muted">
            Connect Stripe so customers can pay for tickets, VIP, and vibe stops —
            and so you get paid.
          </p>
          <Link
            href={`/api/venues/stripe/onboarding?venueId=${venueId}`}
            className="inline-flex rounded-full bg-accent-gradient px-4 py-2 text-sm font-semibold text-white shadow-accent"
          >
            Connect Stripe
          </Link>
        </>
      )}

      {stripeState.status === "pending" && (
        <>
          <p className="text-sm text-amber-700">
            Almost there — finish Stripe onboarding to unlock payouts.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/api/venues/stripe/onboarding?venueId=${venueId}`}
              className="inline-flex rounded-full bg-accent-gradient px-4 py-2 text-sm font-semibold text-white shadow-accent"
            >
              Continue setup
            </Link>
            <Link
              href={`/api/venues/stripe/dashboard?venueId=${venueId}`}
              className="inline-flex rounded-full border border-wtva-dark-300 px-4 py-2 text-sm font-semibold"
            >
              Open Stripe
            </Link>
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={disconnect}
              className="text-red-600"
            >
              {busy ? "Disconnecting…" : "Disconnect"}
            </Button>
          </div>
        </>
      )}

      {stripeState.status === "active" && (
        <>
          <p className="text-sm text-emerald-700">
            Stripe is connected. Payouts are ready for this venue.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/api/venues/stripe/dashboard?venueId=${venueId}`}
              className="inline-flex rounded-full border border-wtva-dark-300 px-4 py-2 text-sm font-semibold"
            >
              Open Stripe dashboard
            </Link>
            <Link
              href={`/api/venues/stripe/onboarding?venueId=${venueId}`}
              className="inline-flex rounded-full border border-wtva-dark-300 px-4 py-2 text-sm font-semibold"
            >
              Update Stripe details
            </Link>
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={disconnect}
              className="text-red-600"
            >
              {busy ? "Disconnecting…" : "Disconnect"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
