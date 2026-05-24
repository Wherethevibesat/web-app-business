import type { PlatformSettings } from "@/lib/data/platform-settings";
import { getStripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function verifyDriverListingPayment(params: {
  paymentIntentId: string;
  userId: string;
  companyId: string;
  expectedFee: number;
}) {
  const stripe = getStripe();
  const intent = await stripe.paymentIntents.retrieve(params.paymentIntentId);

  if (intent.status !== "succeeded") {
    throw new Error("Payment has not completed yet.");
  }
  if (intent.metadata.type !== "driver_listing") {
    throw new Error("Invalid payment type.");
  }
  if (intent.metadata.user_id !== params.userId) {
    throw new Error("Payment does not belong to this account.");
  }
  if (intent.metadata.company_id !== params.companyId) {
    throw new Error("Payment does not match this company.");
  }

  const expectedCents = Math.round(params.expectedFee * 100);
  if ((intent.amount_received ?? intent.amount) < expectedCents) {
    throw new Error("Payment amount does not match the listing fee.");
  }

  return intent;
}

export function listingExpiresAt(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString();
}

export async function applyDriverListingPayment(params: {
  companyId: string;
  userId: string;
  paymentIntentId: string;
  amount: number;
  settings: PlatformSettings;
}) {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const expires = listingExpiresAt(params.settings.driver_listing_months);

  const { error } = await admin
    .from("driver_companies")
    .update({
      listing_paid_at: now,
      listing_expires_at: expires,
      listing_payment_intent_id: params.paymentIntentId,
      status: "pending_review",
      published: false,
      updated_at: now,
    })
    .eq("id", params.companyId)
    .eq("owner_id", params.userId);

  if (error) throw error;

  try {
    await admin.from("platform_transactions").insert({
      user_id: params.userId,
      type: "driver_listing",
      amount: params.amount,
      description: `Driver listing (${params.settings.driver_listing_months} months)`,
      status: "completed",
      stripe_payment_intent_id: params.paymentIntentId,
      metadata: { company_id: params.companyId },
    });
  } catch {
    // non-blocking
  }
}
