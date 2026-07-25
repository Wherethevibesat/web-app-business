import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AccountSettingsForm } from "@/components/account-settings-form";
import { BusinessSettingsPanel } from "@/components/business-settings-panel";
import { SettingsTabs } from "@/components/settings-tabs";
import { getOwnerVenue, requireVenueOwner } from "@/lib/auth/require-venue-owner";
import { getVenueOwnerStripeConnectState } from "@/lib/stripe/connect";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const auth = await requireVenueOwner();
  if (auth.error) return null;

  const { tab: rawTab } = await searchParams;
  const tab = rawTab === "business" ? "business" : "account";
  if (!rawTab || rawTab !== tab) {
    redirect(`/settings?tab=${tab}`);
  }

  const venue = await getOwnerVenue(auth.user!.id, auth.supabase);
  const stripeState = await getVenueOwnerStripeConnectState(auth.user!.id).catch(
    () => null,
  );
  const email = auth.profile?.email || auth.user?.email || "";
  const name = auth.profile?.name?.trim() || "";

  return (
    <div>
      <div className="mb-2">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-wtva-muted">
          {tab === "account"
            ? "Your profile, email, and password."
            : "Venue details, onboarding, and Stripe payouts."}
        </p>
      </div>

      <Suspense fallback={null}>
        <SettingsTabs />
      </Suspense>

      {tab === "account" && (
        <AccountSettingsForm email={email} fullName={name} />
      )}

      {tab === "business" && (
        <BusinessSettingsPanel venue={venue} stripeState={stripeState} />
      )}
    </div>
  );
}
