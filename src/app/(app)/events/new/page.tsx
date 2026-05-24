import Link from "next/link";
import { EventForm } from "@/components/event-form";
import { getOwnerVenue, requireVenueOwner } from "@/lib/auth/require-venue-owner";
import { listNeighborhoodOptions } from "@/lib/data/neighborhoods";
import { getPlatformSettings } from "@/lib/data/platform-settings";
import { getPublishableKey } from "@/lib/stripe/server";

export default async function NewEventPage() {
  const auth = await requireVenueOwner();
  const venue = auth.user ? await getOwnerVenue(auth.user.id) : null;
  const [neighborhoods, platformSettings, publishableKey] = await Promise.all([
    listNeighborhoodOptions().catch(() => []),
    getPlatformSettings(),
    getPublishableKey(),
  ]);

  if (!venue) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold">Add event</h1>
        <p className="text-sm text-wtva-muted">
          Link a venue to your account before creating events.{" "}
          <Link href="/venues/new" className="underline">
            Add your venue
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">Add event</h1>
      <div className="mt-6">
        <EventForm
          ownerId={auth.user!.id}
          venueName={venue.name as string}
          venueNeighborhood={venue.neighborhood as string | null}
          neighborhoods={neighborhoods}
          platformSettings={platformSettings}
          publishableKey={publishableKey}
        />
      </div>
    </div>
  );
}
