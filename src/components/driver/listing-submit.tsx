"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

function PayForm({
  fee,
  months,
  onDone,
}: {
  fee: number;
  months: number;
  onDone: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);

    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/driver/company?paid=1` },
      redirect: "if_required",
    });

    if (submitError) {
      setError(submitError.message ?? "Payment failed");
      setLoading(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      const res = await fetch("/api/driver/submit-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Could not submit listing");
        setLoading(false);
        return;
      }
      onDone();
      return;
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <p className="text-sm text-wtva-muted">
        Pay <span className="font-semibold text-foreground">${fee.toFixed(2)}</span> for{" "}
        <span className="font-semibold">{months}</span> month{months === 1 ? "" : "s"} of listing.
        Admin will review before you appear on the app.
      </p>
      <PaymentElement />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-foreground py-3 text-sm font-semibold text-background disabled:opacity-50"
      >
        {loading ? "Processing…" : "Pay & submit for review"}
      </button>
    </form>
  );
}

export function ListingSubmit({
  fee,
  months,
  listingActive,
  status,
}: {
  fee: number;
  months: number;
  listingActive: boolean;
  status: string;
}) {
  const router = useRouter();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [publishableKey, setPublishableKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function startPayment() {
    setLoading(true);
    setError(null);
    const settingsRes = await fetch("/api/driver/settings");
    const settingsBody = await settingsRes.json();
    const intentRes = await fetch("/api/driver/listing-intent", { method: "POST" });
    const intentBody = await intentRes.json();
    setLoading(false);
    if (!intentRes.ok) {
      setError(intentBody.error ?? "Could not start payment");
      return;
    }
    setPublishableKey(settingsBody.publishableKey);
    setClientSecret(intentBody.clientSecret);
  }

  if (done || status === "pending_review") {
    return (
      <p className="rounded-lg border border-wtva-dark-300 bg-wtva-card p-4 text-sm text-wtva-muted">
        Listing submitted for admin review. You&apos;ll appear on the customer app once approved.
      </p>
    );
  }

  if (listingActive && status === "published") {
    return (
      <p className="text-sm text-green-400">Your listing is live on WTVA.</p>
    );
  }

  if (fee <= 0) {
    return (
      <button
        type="button"
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          const res = await fetch("/api/driver/submit-listing", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mode: "review" }),
          });
          setLoading(false);
          if (res.ok) {
            setDone(true);
            router.refresh();
          }
        }}
        className="rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background"
      >
        Submit for review
      </button>
    );
  }

  if (!clientSecret || !publishableKey) {
    return (
      <div>
        {error && <p className="mb-2 text-sm text-red-400">{error}</p>}
        <button
          type="button"
          disabled={loading}
          onClick={startPayment}
          className="rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background disabled:opacity-50"
        >
          {loading ? "Loading…" : `Pay $${fee.toFixed(2)} & submit for review`}
        </button>
      </div>
    );
  }

  const stripePromise = loadStripe(publishableKey);
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PayForm
        fee={fee}
        months={months}
        onDone={() => {
          setDone(true);
          router.refresh();
        }}
      />
    </Elements>
  );
}
