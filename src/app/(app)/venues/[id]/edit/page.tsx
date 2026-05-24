import Link from "next/link";
import { notFound } from "next/navigation";
import { VenueForm } from "@/components/venue-form";
import { VenueListingSubmit } from "@/components/venue-listing-submit";
import { requireVenueOwner } from "@/lib/auth/require-venue-owner";
import { getPlatformSettings } from "@/lib/data/platform-settings";
import { listNeighborhoodOptions } from "@/lib/data/neighborhoods";
import { getOwnerVenueById } from "@/lib/data/venues";

export default async function EditVenuePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paid?: string }>;
}) {
  const auth = await requireVenueOwner();
  if (auth.error) return null;

  const { id } = await params;
  const { paid } = await searchParams;
  const [venue, neighborhoods, settings] = await Promise.all([
    getOwnerVenueById(auth.user!.id, id).catch(() => null),
    listNeighborhoodOptions().catch(() => []),
    getPlatformSettings(),
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
