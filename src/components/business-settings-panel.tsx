import Link from "next/link";
import { StripeConnectPanel } from "@/components/stripe-connect-panel";
import type { StripeConnectState } from "@/lib/stripe/connect";

type VenueSummary = {
  id?: string;
  name?: string | null;
  subscription_tier?: string | null;
  verification_status?: string | null;
} | null;

export function BusinessSettingsPanel({
  venue,
  stripeState,
}: {
  venue: VenueSummary;
  stripeState: StripeConnectState | null;
}) {
  return (
    <div className="w-full max-w-3xl space-y-6">
      <div className="rounded-2xl border border-wtva-dark-300 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold tracking-tight">Venue</h2>
        <p className="mt-1 text-sm text-wtva-muted">
          Your business listing and verification status.
        </p>
        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-wtva-muted">Venue</dt>
            <dd className="mt-0.5 font-medium">
              {venue?.name ?? "Not assigned"}
            </dd>
          </div>
          <div>
            <dt className="text-wtva-muted">Tier</dt>
            <dd className="mt-0.5 font-medium">
              {venue?.subscription_tier ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-wtva-muted">Verification</dt>
            <dd className="mt-0.5 font-medium">
              {venue?.verification_status ?? "—"}
            </dd>
          </div>
        </dl>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={venue?.id ? `/venues/${venue.id}/edit` : venue ? "/venues" : "/venues/new"}
            className="inline-flex rounded-full bg-accent-gradient px-4 py-2 text-sm font-semibold text-white shadow-accent"
          >
            {venue ? "Manage venue" : "Add your venue"}
          </Link>
          <Link
            href="/onboarding"
            className="inline-flex rounded-full border border-wtva-dark-300 px-4 py-2 text-sm font-semibold hover:border-accent hover:text-accent"
          >
            Business onboarding
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-wtva-dark-300 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold tracking-tight">Stripe payouts</h2>
        <p className="mt-1 text-sm text-wtva-muted">
          Connect or disconnect Stripe for ticket, VIP, and vibe payouts.
        </p>
        <div className="mt-5">
          {venue?.id ? (
            <StripeConnectPanel venueId={venue.id} stripeState={stripeState} />
          ) : (
            <p className="text-sm text-wtva-muted">
              Add a venue first, then you can connect Stripe here.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
