import Link from "next/link";
import { requirePromoter } from "@/lib/auth/require-promoter";
import { listApprovedVenueIds, listPromoterVenueLinks } from "@/lib/data/promoter-venues";
import { listEventsForPromoter } from "@/lib/data/promoter-events";

export default async function PromoterEventsPage() {
  const auth = await requirePromoter();
  if (auth.error) return null;

  const venueIds = await listApprovedVenueIds(auth.user!.id, auth.supabase);
  const links = await listPromoterVenueLinks(auth.user!.id, auth.supabase);
  const events = await listEventsForPromoter(auth.user!.id, venueIds, auth.supabase);
  const approvedVenues = links
    .filter((l) => l.status === "approved" && l.venue)
    .map((l) => ({ id: l.venue_id, name: l.venue!.name }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Events</h1>
        <Link
          href="/promoter/events/new"
          className="rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background"
        >
          New event
        </Link>
      </div>
      <ul className="mt-6 space-y-3">
        {events.length === 0 ? (
          <li className="text-sm text-wtva-muted">No events yet.</li>
        ) : (
          events.map((e) => (
            <li
              key={e.id as string}
              className="rounded-xl border border-wtva-dark-300 bg-wtva-card px-4 py-3 text-sm"
            >
              <p className="font-semibold">{e.title as string}</p>
              <p className="text-wtva-muted">
                {new Date(e.starts_at as string).toLocaleString()} · {e.status as string}
                {e.created_by_promoter_id ? ` · promoter event (${e.promoter_event_approval})` : ""}
              </p>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
