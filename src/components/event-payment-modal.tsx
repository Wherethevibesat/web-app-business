"use client";

import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import type { BusinessEventFormData } from "@/lib/types/event";
import type { PlatformSettings } from "@/lib/data/platform-settings";

type EventPaymentModalProps = {
  open: boolean;
  onClose: () => void;
  form: BusinessEventFormData;
  fee: number;
  publishableKey: string;
  onPublished: (paymentIntentId: string) => Promise<void>;
};

function PaymentInner({
  form,
  fee,
  onPublished,
  onClose,
}: {
  form: BusinessEventFormData;
  fee: number;
  onPublished: (paymentIntentId: string) => Promise<void>;
  onClose: () => void;
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
        return_url: `${window.location.origin}/events/new?paid=1`,
      },
      redirect: "if_required",
    });

    if (submitError) {
      setError(submitError.message ?? "Payment failed");
      setLoading(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      try {
        await onPublished(paymentIntent.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not publish event");
        setLoading(false);
      }
      return;
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <p className="text-sm text-wtva-muted">
        Pay <span className="font-semibold text-foreground">${fee.toFixed(2)}</span> to publish{" "}
        <span className="font-semibold text-foreground">{form.title || "this event"}</span>{" "}
        immediately — no admin approval needed.
      </p>
      <PaymentElement />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-wtva-dark-300 px-4 py-2 text-sm font-semibold"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 rounded-lg bg-foreground py-2 text-sm font-semibold text-background disabled:opacity-50"
        >
          {loading ? "Processing…" : `Pay $${fee.toFixed(2)} & publish`}
        </button>
      </div>
    </form>
  );
}

export function EventPaymentModal({
  open,
  onClose,
  form,
  fee,
  publishableKey,
  onPublished,
}: EventPaymentModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setClientSecret(null);
      setLoadError(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/events/create-intent", { method: "POST" });
      const data = await res.json();
      if (cancelled) return;
      if (!res.ok) {
        setLoadError(data.error ?? "Could not start payment");
        return;
      }
      setClientSecret(data.clientSecret);
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-xl border border-wtva-dark-300 bg-wtva-dark-400 p-5">
        <h2 className="text-lg font-bold">Pay & publish</h2>
        {loadError && <p className="mt-3 text-sm text-red-400">{loadError}</p>}
        {!loadError && !clientSecret && (
          <p className="mt-3 text-sm text-wtva-muted">Preparing secure checkout…</p>
        )}
        {clientSecret && (
          <div className="mt-4">
            <Elements stripe={loadStripe(publishableKey)} options={{ clientSecret }}>
              <PaymentInner
                form={form}
                fee={fee}
                onPublished={onPublished}
                onClose={onClose}
              />
            </Elements>
          </div>
        )}
      </div>
    </div>
  );
}
