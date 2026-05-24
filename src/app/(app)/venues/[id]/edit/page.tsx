import Link from "next/link";
import { notFound } from "next/navigation";
import { VenueForm } from "@/components/venue-form";
import { requireVenueOwner } from "@/lib/auth/require-venue-owner";
import { listNeighborhoodOptions } from "@/lib/data/neighborhoods";
import { getOwnerVenueById } from "@/lib/data/venues";

export default async function EditVenuePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const auth = await requireVenueOwner();
  if (auth.error) return null;

  const { id } = await params;
  const [venue, neighborhoods] = await Promise.all([
    getOwnerVenueById(auth.user!.id, id).catch(() => null),
    listNeighborhoodOptions().catch(() => []),
  ]);

  if (!venue) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/venues" className="text-sm text-wtva-muted underline">
        ← Back to venues
      </Link>
      <h1 className="mt-4 text-2xl font-bold">Edit venue</h1>
      <div className="mt-6">
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
