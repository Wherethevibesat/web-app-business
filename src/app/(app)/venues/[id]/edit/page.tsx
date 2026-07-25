import Link from "next/link";
import { notFound } from "next/navigation";
import { StripeConnectPanel } from "@/components/stripe-connect-panel";
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
    <div className="w-full">
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
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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

      <div className="mt-8 rounded-xl border border-wtva-dark-300 bg-white p-5 shadow-sm">
        <h2 className="font-semibold">Stripe payouts</h2>
        <p className="mt-1 text-sm text-wtva-muted">
          Paid tickets, VIP packages, and curated vibe bookings for this venue use Stripe
          Connect. WTVA keeps {settings.event_ticket_commission_pct}% on ticket sales and{" "}
          {settings.vip_commission_pct}% on VIP sales (vibe bookings use the Build Your Night
          fee), then Stripe routes the venue share to your connected account.
        </p>
        <div className="mt-4">
          <StripeConnectPanel venueId={venue.id} stripeState={stripeState} />
        </div>
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
