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
  venueId,
  fee,
  months,
  onDone,
}: {
  venueId: string;
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
      confirmParams: {
        return_url: `${window.location.origin}/venues/${venueId}/edit?paid=1`,
      },
      redirect: "if_required",
    });

    if (submitError) {
      setError(submitError.message ?? "Payment failed");
      setLoading(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      const res = await fetch("/api/venues/submit-listing", {
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
        Admin will review before you appear on the customer app (unless auto-approve is on).
      </p>
      <PaymentElement />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-foreground py-3 text-sm font-semibold text-background disabled:opacity-50"
      >
        {loading ? "Processing..." : "Pay & submit for review"}
      </button>
    </form>
  );
}

export function VenueListingSubmit({
  venueId,
  fee,
  months,
  listingActive,
  published,
  listingPaid,
}: {
  venueId: string;
  fee: number;
  months: number;
  listingActive: boolean;
  published: boolean;
  listingPaid: boolean;
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
    const settingsRes = await fetch("/api/venues/settings");
    const settingsBody = await settingsRes.json();
    const intentRes = await fetch("/api/venues/listing-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ venueId }),
    });
    const intentBody = await intentRes.json();
    setLoading(false);
    if (!intentRes.ok) {
      setError(intentBody.error ?? "Could not start payment");
      return;
    }
    setPublishableKey(settingsBody.publishableKey);
    setClientSecret(intentBody.clientSecret);
  }

  if (published && listingActive) {
    return <p className="text-sm text-green-400">Your venue is live on WTVA.</p>;
  }

  if (done || (listingPaid && !published)) {
    return (
      <p className="rounded-lg border border-wtva-dark-300 bg-wtva-card p-4 text-sm text-wtva-muted">
        Listing payment received. Admin will review before your venue appears on the customer app.
      </p>
    );
  }

  if (fee <= 0) {
    return (
      <button
        type="button"
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          const res = await fetch("/api/venues/submit-listing", {
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
          {loading ? "Loading..." : `Pay $${fee.toFixed(2)} & submit for review`}
        </button>
      </div>
    );
  }

  const stripePromise = loadStripe(publishableKey);
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PayForm
        venueId={venueId}
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
