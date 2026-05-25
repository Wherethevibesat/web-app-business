import type Stripe from "stripe";
import { businessPortalUrl } from "@/lib/email/send";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";

type StripeAccountRow = {
  stripe_account_id: string;
};

export type StripeConnectState = {
  accountId: string | null;
  status: "not_connected" | "pending" | "active";
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
};

function isDeletedAccount(
  account: Stripe.Account | Stripe.DeletedAccount,
): account is Stripe.DeletedAccount {
  return "deleted" in account && account.deleted === true;
}

function emptyState(): StripeConnectState {
  return {
    accountId: null,
    status: "not_connected",
    chargesEnabled: false,
    payoutsEnabled: false,
    detailsSubmitted: false,
  };
}

function toConnectState(account: Stripe.Account): StripeConnectState {
  const chargesEnabled = Boolean(account.charges_enabled);
  const payoutsEnabled = Boolean(account.payouts_enabled);
  const detailsSubmitted = Boolean(account.details_submitted);
  return {
    accountId: account.id,
    status: chargesEnabled && payoutsEnabled && detailsSubmitted ? "active" : "pending",
    chargesEnabled,
    payoutsEnabled,
    detailsSubmitted,
  };
}

async function getLatestStripeAccount(userId: string): Promise<StripeAccountRow | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("stripe_accounts")
    .select("stripe_account_id")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("connected_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as StripeAccountRow | null) ?? null;
}

async function saveStripeAccount(params: {
  userId: string;
  account: Stripe.Account;
  accountName?: string | null;
  email?: string | null;
  fallbackLabel?: string;
}) {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const state = toConnectState(params.account);

  await admin
    .from("stripe_accounts")
    .update({ is_default: false, updated_at: now })
    .eq("user_id", params.userId);

  const { error } = await admin.from("stripe_accounts").upsert(
    {
      user_id: params.userId,
      stripe_account_id: params.account.id,
      account_name:
        params.accountName?.trim() ||
        params.account.business_profile?.name ||
        params.account.email ||
        params.email?.trim() ||
        params.fallbackLabel ||
        "Stripe payouts",
      email: params.account.email ?? params.email?.trim() ?? null,
      last4: null,
      account_type: params.account.type ?? "express",
      is_default: true,
      status: state.status === "active" ? "active" : "pending",
      connected_at: now,
      updated_at: now,
      metadata: {
        details_submitted: state.detailsSubmitted,
        charges_enabled: state.chargesEnabled,
        payouts_enabled: state.payoutsEnabled,
        requirements_currently_due: params.account.requirements?.currently_due ?? [],
      },
    },
    { onConflict: "stripe_account_id" },
  );

  if (error) throw error;
}

async function getOrCreateStripeAccount(params: {
  userId: string;
  email?: string | null;
  accountName?: string | null;
  role: "driver" | "venueOwner";
  fallbackLabel: string;
}) {
  const stripe = getStripe();
  const existing = await getLatestStripeAccount(params.userId);

  if (existing?.stripe_account_id) {
    const account = await stripe.accounts.retrieve(existing.stripe_account_id);
    if (!isDeletedAccount(account)) {
      await saveStripeAccount({ ...params, account });
      return account;
    }
  }

  const account = await stripe.accounts.create({
    type: "express",
    country: "US",
    email: params.email ?? undefined,
    metadata: {
      user_id: params.userId,
      role: params.role,
    },
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });

  await saveStripeAccount({ ...params, account });
  return account;
}

async function getStripeConnectState(userId: string): Promise<StripeConnectState> {
  const existing = await getLatestStripeAccount(userId);
  if (!existing?.stripe_account_id) {
    return emptyState();
  }

  const stripe = getStripe();
  const account = await stripe.accounts.retrieve(existing.stripe_account_id);
  if (isDeletedAccount(account)) {
    return emptyState();
  }

  await saveStripeAccount({ userId, account });
  return toConnectState(account);
}

async function createStripeOnboardingLink(params: {
  userId: string;
  email?: string | null;
  accountName?: string | null;
  role: "driver" | "venueOwner";
  fallbackLabel: string;
  refreshPath: string;
  returnPath: string;
}) {
  const stripe = getStripe();
  const account = await getOrCreateStripeAccount(params);
  const link = await stripe.accountLinks.create({
    account: account.id,
    type: "account_onboarding",
    refresh_url: businessPortalUrl(params.refreshPath),
    return_url: businessPortalUrl(params.returnPath),
  });
  return link.url;
}

async function createStripeDashboardLink(userId: string) {
  const stripe = getStripe();
  const existing = await getLatestStripeAccount(userId);
  if (!existing?.stripe_account_id) {
    throw new Error("Connect Stripe first.");
  }

  const loginLink = await stripe.accounts.createLoginLink(existing.stripe_account_id);
  return loginLink.url;
}

export async function getDriverStripeConnectState(
  userId: string,
): Promise<StripeConnectState> {
  return getStripeConnectState(userId);
}

export async function getVenueOwnerStripeConnectState(
  userId: string,
): Promise<StripeConnectState> {
  return getStripeConnectState(userId);
}

export async function createDriverStripeOnboardingLink(params: {
  userId: string;
  email?: string | null;
  accountName?: string | null;
}) {
  return createStripeOnboardingLink({
    ...params,
    role: "driver",
    fallbackLabel: "Driver payouts",
    refreshPath: "/driver/company?stripe=refresh",
    returnPath: "/driver/company?stripe=return",
  });
}

export async function createVenueOwnerStripeOnboardingLink(params: {
  userId: string;
  email?: string | null;
  accountName?: string | null;
  venueId: string;
}) {
  return createStripeOnboardingLink({
    userId: params.userId,
    email: params.email,
    accountName: params.accountName,
    role: "venueOwner",
    fallbackLabel: "Venue payouts",
    refreshPath: `/venues/${params.venueId}/edit?stripe=refresh`,
    returnPath: `/venues/${params.venueId}/edit?stripe=return`,
  });
}

export async function createDriverStripeDashboardLink(userId: string) {
  return createStripeDashboardLink(userId);
}

export async function createVenueOwnerStripeDashboardLink(userId: string) {
  return createStripeDashboardLink(userId);
}
