import type { PlatformSettings } from "@/lib/data/platform-settings";
import { getStripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type EventSubmissionMode = "paid" | "review";

export function resolveEventStatus(
  settings: PlatformSettings,
  mode: EventSubmissionMode,
  paid: boolean,
): "published" | "pending_review" {
  if (mode === "paid" && paid && settings.event_submission_fee > 0) {
    return "published";
  }
  if (settings.auto_approve_events) {
    return "published";
  }
  return "pending_review";
}

export async function verifyEventSubmissionPayment(params: {
  paymentIntentId: string;
  userId: string;
  venueId: string;
  expectedFee: number;
}) {
  const stripe = getStripe();
  const intent = await stripe.paymentIntents.retrieve(params.paymentIntentId);

  if (intent.status !== "succeeded") {
    throw new Error("Payment has not completed yet.");
  }
  if (intent.metadata.type !== "event_submission") {
    throw new Error("Invalid payment type.");
  }
  if (intent.metadata.user_id !== params.userId) {
    throw new Error("Payment does not belong to this account.");
  }
  if (intent.metadata.venue_id !== params.venueId) {
    throw new Error("Payment does not match this venue.");
  }

  const expectedCents = Math.round(params.expectedFee * 100);
  if ((intent.amount_received ?? intent.amount) < expectedCents) {
    throw new Error("Payment amount does not match the event posting fee.");
  }

  return intent;
}

export async function recordEventSubmissionPayment(params: {
  userId: string;
  amount: number;
  paymentIntentId: string;
  eventIds: string[];
  venueId: string;
}) {
  try {
    const admin = createAdminClient();
    await admin.from("platform_transactions").insert({
      user_id: params.userId,
      type: "event_submission",
      amount: params.amount,
      description: `Event posting (${params.eventIds.length} listing${params.eventIds.length === 1 ? "" : "s"})`,
      status: "completed",
      stripe_payment_intent_id: params.paymentIntentId,
      metadata: {
        venue_id: params.venueId,
        event_ids: params.eventIds,
      },
    });
  } catch {
    // Non-blocking — events still publish if transaction log fails
  }
}

export function assertSubmissionAllowed(
  settings: PlatformSettings,
  mode: EventSubmissionMode,
  paid: boolean,
  options?: { stripeConfigured?: boolean },
) {
  const fee = settings.event_submission_fee;
  const stripeConfigured = options?.stripeConfigured ?? true;

  if (settings.require_payment && fee > 0 && !paid) {
    if (mode === "review" && !stripeConfigured) {
      return;
    }
    throw new Error(`Payment of $${fee.toFixed(2)} is required to post events.`);
  }
  if (mode === "paid" && fee <= 0) {
    throw new Error("Event posting is free — no payment needed.");
  }
  if (mode === "review" && settings.require_payment && fee > 0 && stripeConfigured) {
    throw new Error("Payment is required. Use pay & publish to post this event.");
  }
}
