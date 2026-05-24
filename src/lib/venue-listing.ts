import type { PlatformSettings } from "@/lib/data/platform-settings";
import { getStripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { listingExpiresAt } from "@/lib/driver-listing";

export async function verifyVenueListingPayment(params: {
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
  if (intent.metadata.type !== "venue_listing") {
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
    throw new Error("Payment amount does not match the listing fee.");
  }

  return intent;
}

export async function applyVenueListingPayment(params: {
  venueId: string;
  userId: string;
  paymentIntentId: string;
  amount: number;
  settings: PlatformSettings;
  autoPublish: boolean;
}) {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const expires = listingExpiresAt(params.settings.venue_listing_months);

  const { error } = await admin
    .from("venues")
    .update({
      listing_paid_at: now,
      listing_expires_at: expires,
      listing_payment_intent_id: params.paymentIntentId,
      published: params.autoPublish,
      updated_at: now,
    })
    .eq("id", params.venueId)
    .eq("owner_id", params.userId);

  if (error) throw error;

  try {
    await admin.from("platform_transactions").insert({
      user_id: params.userId,
      type: "venue_listing",
      amount: params.amount,
      description: `Venue listing (${params.settings.venue_listing_months} months)`,
      status: "completed",
      stripe_payment_intent_id: params.paymentIntentId,
      metadata: { venue_id: params.venueId },
    });
  } catch {
    // non-blocking
  }
}
