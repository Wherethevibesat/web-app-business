import Link from "next/link";
import { notFound } from "next/navigation";
import { VenueForm } from "@/components/venue-form";
import { VenueListingSubmit } from "@/components/venue-listing-submit";
import { requireVenueOwner } from "@/lib/auth/require-venue-owner";
import { getPlatformSettings } from "@/lib/data/platform-settings";
import { listNeighborhoodOptions } from "@/lib/data/neighborhoods";
import { getOwnerVenueById } from "@/lib/data/venues";
import { getVenueOwnerStripeConnectState } from "@/lib/stripe/connect";

export default async function EditVenuePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paid?: string; stripe_error?: string }>;
}) {
  const auth = await requireVenueOwner();
  if (auth.error) return null;

  const { id } = await params;
  const { paid, stripe_error } = await searchParams;
  const [venue, neighborhoods, settings, stripeState] = await Promise.all([
    getOwnerVenueById(auth.user!.id, id).catch(() => null),
    listNeighborhoodOptions().catch(() => []),
    getPlatformSettings(),
    getVenueOwnerStripeConnectState(auth.user!.id).catch(() => null),
  ]);

  if (!venue) notFound();

  const listingActive =
    !!venue.listing_expires_at && new Date(venue.listing_expires_at).getTime() > Date.now();
  const listingPaid = !!venue.listing_paid_at;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/venues" className="text-sm text-wtva-muted underline">
        Back to venues
      </Link>
      <h1 className="mt-4 text-2xl font-bold">Edit venue</h1>

      {paid === "1" && (
        <p className="mt-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          Payment received. Your listing is pending admin review.
        </p>
      )}

      {stripe_error && (
        <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {stripe_error}
        </p>
      )}

      <div className="mt-6 rounded-xl border border-wtva-dark-300 bg-wtva-card p-5">
        <h2 className="font-semibold">Venue listing</h2>
        <p className="mt-1 text-sm text-wtva-muted">
          Status: {venue.published ? "Published" : "Not published"}
          {venue.listing_expires_at
            ? ` - listing expires ${new Date(venue.listing_expires_at).toLocaleDateString()}`
            : ""}
        </p>
        <div className="mt-4">
          <VenueListingSubmit
            venueId={venue.id}
            fee={settings.venue_submission_fee}
            months={settings.venue_listing_months}
            listingActive={listingActive}
            published={!!venue.published}
            listingPaid={listingPaid}
          />
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-wtva-dark-300 bg-wtva-card p-5">
        <h2 className="font-semibold">Stripe payouts</h2>
        <p className="mt-1 text-sm text-wtva-muted">
          Paid tickets and VIP packages for this venue use Stripe Connect. WTVA keeps{" "}
          {settings.event_ticket_commission_pct}% on ticket sales and {settings.vip_commission_pct}
          % on VIP sales, then Stripe routes the rest to your connected account.
        </p>

        {!stripeState && (
          <p className="mt-4 text-sm text-amber-300">
            Stripe payouts are not configured on this environment yet.
          </p>
        )}

        {stripeState?.status === "not_connected" && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-wtva-muted">
              Connect Stripe before customers can pay for your venue's tickets or VIP packages.
            </p>
            <Link
              href={`/api/venues/stripe/onboarding?venueId=${venue.id}`}
              className="inline-block rounded-full bg-accent-gradient shadow-accent px-4 py-2 text-sm font-semibold text-white"
            >
              Connect Stripe
            </Link>
          </div>
        )}

        {stripeState?.status === "pending" && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-amber-300">
              Finish Stripe onboarding to unlock paid tickets and VIP checkout.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/api/venues/stripe/onboarding?venueId=${venue.id}`}
                className="inline-block rounded-full bg-accent-gradient shadow-accent px-4 py-2 text-sm font-semibold text-white"
              >
                Finish onboarding
              </Link>
              <Link
                href={`/api/venues/stripe/dashboard?venueId=${venue.id}`}
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
              Stripe payouts are ready for this venue.
            </p>
            <Link
              href={`/api/venues/stripe/dashboard?venueId=${venue.id}`}
              className="inline-block rounded-lg border border-wtva-dark-300 px-4 py-2 text-sm font-semibold"
            >
              Open Stripe dashboard
            </Link>
          </div>
        )}
      </div>

      <div className="mt-8">
        <VenueForm
          ownerId={auth.user!.id}
          mode="edit"
          venueId={venue.id}
          neighborhoods={neighborhoods}
          initial={{
            name: venue.name,
            venue_type: venue.venue_type,
            address: venue.address ?? "",
            neighborhood: venue.neighborhood ?? "",
            description: venue.description ?? "",
            image_url: venue.image_url ?? "",
            phone: venue.phone ?? "",
            hours_label: venue.hours_label ?? "",
            opening_hours: venue.opening_hours ?? undefined,
            website_url: venue.website_url ?? "",
            instagram_url: venue.instagram_url ?? "",
            facebook_url: venue.facebook_url ?? "",
            tiktok_url: venue.tiktok_url ?? "",
            twitter_url: venue.twitter_url ?? "",
          }}
        />
      </div>
    </div>
  );
}
