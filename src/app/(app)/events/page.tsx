import Link from "next/link";
import { requireVenueOwner, getOwnerVenue } from "@/lib/auth/require-venue-owner";
import { listOwnerEvents } from "@/lib/data/events";
import { listPendingPromoterEventsForVenueOwner } from "@/lib/data/promoter-events";
import { VenueOwnerPromoterEventsPanel } from "@/components/promoter/venue-owner-promoter-events-panel";

function statusLabel(status: string) {
  switch (status) {
    case "published":
      return "Live";
    case "pending_review":
      return "Pending review";
    case "draft":
      return "Draft";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

export default async function EventsPage() {
  const auth = await requireVenueOwner();
  const venue = auth.user ? await getOwnerVenue(auth.user.id) : null;

  let events: Awaited<ReturnType<typeof listOwnerEvents>> = [];
  let pendingPromoterEvents: Awaited<ReturnType<typeof listPendingPromoterEventsForVenueOwner>> = [];
  let error: string | null = null;

  if (auth.user) {
    pendingPromoterEvents = await listPendingPromoterEventsForVenueOwner(
      auth.user.id,
      auth.supabase,
    ).catch(() => []);
  }

  if (venue) {
    try {
      events = await listOwnerEvents(auth.user!.id, venue.id as string);
    } catch (e) {
      error = e instanceof Error ? e.message : "Could not load events";
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Events</h1>
          <p className="mt-1 text-sm text-wtva-muted">
            Submit events for your venue. Approved events show in customer Discover and search.
          </p>
        </div>
        {venue ? (
          <Link
            href="/events/new"
            className="rounded-full bg-accent-gradient shadow-accent px-4 py-2 text-sm font-semibold text-white"
          >
            Add event
          </Link>
        ) : null}
      </div>

      {!venue && (
        <p className="mt-8 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          No venue linked to your account yet. Complete onboarding or ask an admin to assign your
          venue in Settings.
        </p>
      )}

      {error && <p className="mt-6 text-sm text-red-400">{error}</p>}

      {pendingPromoterEvents.length > 0 && (
        <section className="mt-8 rounded-xl border border-amber-500/40 bg-amber-500/10 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold text-amber-100">
                Promoter events awaiting approval ({pendingPromoterEvents.length})
              </h2>
              <p className="mt-1 text-sm text-wtva-muted">
                Approve to publish on the customer app, or reject to decline.
              </p>
            </div>
            <Link href="/promoters" className="text-sm underline text-wtva-muted">
              All promoter tools
            </Link>
          </div>
          <div className="mt-4">
            <VenueOwnerPromoterEventsPanel initial={pendingPromoterEvents} />
          </div>
        </section>
      )}

      {venue && events.length === 0 && !error && (
        <p className="mt-10 rounded-xl border border-dashed border-wtva-dark-300 py-16 text-center text-wtva-muted">
          No events yet.{" "}
          <Link href="/events/new" className="underline">
            Create your first event
          </Link>
        </p>
      )}

      {events.length > 0 && (
        <div className="mt-8 overflow-hidden rounded-xl border border-wtva-dark-300">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-wtva-dark-300 bg-wtva-dark-400/50 text-wtva-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Event</th>
                <th className="px-4 py-3 font-semibold">When</th>
                <th className="px-4 py-3 font-semibold">Area</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold" />
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="border-b border-wtva-dark-300 last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-semibold">{event.title}</p>
                    <p className="text-xs text-wtva-muted">{event.event_type}</p>
                  </td>
                  <td className="px-4 py-3 text-wtva-muted">
                    {new Date(event.starts_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-wtva-muted">{event.neighborhood ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        event.status === "published"
                          ? "text-emerald-400"
                          : event.status === "pending_review"
                            ? "text-amber-300"
                            : "text-wtva-muted"
                      }
                    >
                      {statusLabel(event.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {event.status === "pending_review" || event.status === "draft" ? (
                      <Link href={`/events/${event.id}/edit`} className="text-xs font-semibold underline">
                        Edit
                      </Link>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
