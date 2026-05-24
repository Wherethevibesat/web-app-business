import Link from "next/link";
import { notFound } from "next/navigation";
import { EventForm } from "@/components/event-form";
import { getOwnerEvent } from "@/lib/data/events";
import { listNeighborhoodOptions } from "@/lib/data/neighborhoods";
import { getPlatformSettings } from "@/lib/data/platform-settings";
import { getOwnerVenue, requireVenueOwner } from "@/lib/auth/require-venue-owner";
import { getPublishableKey } from "@/lib/stripe/server";

type EditEventPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditEventPage({ params }: EditEventPageProps) {
  const { id } = await params;
  const auth = await requireVenueOwner();
  const venue = auth.user ? await getOwnerVenue(auth.user.id) : null;

  if (!venue) notFound();

  const [event, neighborhoods, platformSettings, publishableKey] = await Promise.all([
    getOwnerEvent(auth.user!.id, venue.id as string, id),
    listNeighborhoodOptions().catch(() => []),
    getPlatformSettings(),
    getPublishableKey(),
  ]);

  if (!event || (event.status !== "pending_review" && event.status !== "draft")) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">Edit event</h1>
      <p className="mt-1 text-sm text-wtva-muted">
        <Link href="/events" className="underline">
          Back to events
        </Link>
      </p>
      <div className="mt-6">
        <EventForm
          ownerId={auth.user!.id}
          venueName={venue.name as string}
          venueNeighborhood={venue.neighborhood as string | null}
          neighborhoods={neighborhoods}
          platformSettings={platformSettings}
          publishableKey={publishableKey}
          initial={{
            id: event.id,
            title: event.title,
            description: event.description ?? "",
            event_type: event.event_type,
            neighborhood: event.neighborhood ?? "",
            starts_at: event.starts_at,
            ends_at: event.ends_at ?? "",
            image_url: event.image_url ?? "",
          }}
        />
      </div>
    </div>
  );
}
