import Link from "next/link";
import { requireDriver } from "@/lib/auth/require-driver";
import { getOwnerCompany } from "@/lib/data/driver-companies";
import { getPlatformSettings } from "@/lib/data/platform-settings";
import { ListingSubmit } from "@/components/driver/listing-submit";
import { getDriverStripeConnectState } from "@/lib/stripe/connect";

export default async function DriverCompanyPage({
  searchParams,
}: {
  searchParams: Promise<{ paid?: string; stripe_error?: string }>;
}) {
  const auth = await requireDriver();
  if (auth.error) return null;

  const { paid, stripe_error } = await searchParams;
  const [company, settings, stripeState] = await Promise.all([
    getOwnerCompany(auth.user!.id, auth.supabase),
    getPlatformSettings(),
    getDriverStripeConnectState(auth.user!.id).catch(() => null),
  ]);

  if (!company) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold">Driver company</h1>
        <p className="mt-3 text-sm text-wtva-muted">Create your company profile to continue.</p>
        <Link href="/driver/company/new" className="mt-5 inline-block rounded-full bg-accent-gradient shadow-accent px-4 py-2 text-sm font-semibold text-white">
          Create company profile
        </Link>
      </div>
    );
  }

  const listingActive =
    !!company.listing_expires_at && new Date(company.listing_expires_at).getTime() > Date.now();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{company.company_name}</h1>
        <p className="text-sm text-wtva-muted">Status: {company.status.replace("_", " ")}</p>
      </div>

      {paid === "1" && (
        <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          Payment received. Your listing is pending admin review.
        </p>
      )}

      {stripe_error && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {stripe_error}
        </p>
      )}

      <div className="rounded-xl border border-wtva-dark-300 bg-wtva-card p-5">
        <p className="text-sm text-wtva-muted">Listing status</p>
        {company.listing_expires_at ? (
          <p className="mt-1 text-sm">
            Expires {new Date(company.listing_expires_at).toLocaleDateString()}
          </p>
        ) : (
          <p className="mt-1 text-sm text-wtva-muted">No active listing yet.</p>
        )}
        <div className="mt-4">
          <ListingSubmit
            fee={settings.driver_listing_fee}
            months={settings.driver_listing_months}
            listingActive={listingActive}
            status={company.status}
          />
        </div>
      </div>

      <div className="rounded-xl border border-wtva-dark-300 bg-wtva-card p-5">
        <h2 className="font-semibold">Stripe payouts</h2>
        <p className="mt-2 text-sm text-wtva-muted">
          Driver bookings use Stripe Connect. WTVA keeps the admin-set{" "}
          {settings.driver_booking_commission_pct}% commission and sends the rest to your Stripe
          account.
        </p>

        {!stripeState && (
          <p className="mt-4 text-sm text-amber-300">
            Stripe payouts are not configured on this environment yet.
          </p>
        )}

        {stripeState?.status === "not_connected" && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-wtva-muted">
              Connect Stripe before customers can pay for your driver packages.
            </p>
            <Link
              href="/api/driver/stripe/onboarding"
              className="inline-block rounded-full bg-accent-gradient shadow-accent px-4 py-2 text-sm font-semibold text-white"
            >
              Connect Stripe
            </Link>
          </div>
        )}

        {stripeState?.status === "pending" && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-amber-300">
              Finish Stripe onboarding to unlock customer payments.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/api/driver/stripe/onboarding"
                className="inline-block rounded-full bg-accent-gradient shadow-accent px-4 py-2 text-sm font-semibold text-white"
              >
                Finish onboarding
              </Link>
              <Link
                href="/api/driver/stripe/dashboard"
                className="inline-block rounded-lg border border-wtva-dark-300 px-4 py-2 text-sm font-semibold"
              >
                Open Stripe dashboard
              </Link>
            </div>
          </div>
        )}

        {stripeState?.status === "active" && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-green-400">
              Stripe payouts are ready. Customers can pay for your driver packages now.
            </p>
            <Link
              href="/api/driver/stripe/dashboard"
              className="inline-block rounded-lg border border-wtva-dark-300 px-4 py-2 text-sm font-semibold"
            >
              Open Stripe dashboard
            </Link>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-wtva-dark-300 bg-wtva-card p-5">
        <h2 className="font-semibold">Company details</h2>
        <p className="mt-2 text-sm text-wtva-muted">{company.description || "No description yet."}</p>
        <p className="mt-2 text-sm text-wtva-muted">City: {company.city ?? "-"}</p>
        <Link href="/driver/company/new" className="mt-4 inline-block text-sm underline">
          Edit details
        </Link>
      </div>
    </div>
  );
}
