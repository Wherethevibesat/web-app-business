import { requireVenueOwner } from "@/lib/auth/require-venue-owner";
import {
  listAllLinksForVenueOwner,
  listOwnerVenues,
  listPendingLinksForVenueOwner,
} from "@/lib/data/promoter-venues";
import { listPendingPromoterEventsForVenueOwner } from "@/lib/data/promoter-events";
import { ApprovedPromotersList } from "@/components/promoter/approved-promoters-list";
import { InvitePromoterForm } from "@/components/promoter/invite-promoter-form";
import { VenueOwnerPromoterEventsPanel } from "@/components/promoter/venue-owner-promoter-events-panel";
import { VenueOwnerPromotersPanel } from "@/components/promoter/venue-owner-promoters-panel";

export default async function VenueOwnerPromotersPage() {
  const auth = await requireVenueOwner();
  if (auth.error) return null;

  const [venues, pendingLinks, allLinks, pendingEvents] = await Promise.all([
    listOwnerVenues(auth.user!.id, auth.supabase).catch(() => []),
    listPendingLinksForVenueOwner(auth.user!.id, auth.supabase).catch(() => []),
    listAllLinksForVenueOwner(auth.user!.id, auth.supabase).catch(() => []),
    listPendingPromoterEventsForVenueOwner(auth.user!.id, auth.supabase).catch(() => []),
  ]);

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold">Promoters</h1>
      <p className="mt-1 text-sm text-wtva-muted">
        Add promoters to your venues, approve their events, or review access requests.
      </p>

      {pendingEvents.length > 0 && (
        <section className="mt-6 rounded-xl border border-amber-500/40 bg-amber-500/10 p-5">
          <h2 className="font-semibold text-amber-100">
            Promoter events awaiting approval ({pendingEvents.length})
          </h2>
          <p className="mt-1 text-sm text-wtva-muted">
            Events promoters submitted for your venues. Approve to publish on the customer app.
          </p>
          <div className="mt-4">
            <VenueOwnerPromoterEventsPanel initial={pendingEvents} />
          </div>
        </section>
      )}

      <div className="mt-6">
        <InvitePromoterForm venues={venues as { id: string; name: string }[]} />
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Your promoters</h2>
        <div className="mt-3">
          <ApprovedPromotersList links={allLinks as never[]} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Promoter events</h2>
        <p className="mt-1 text-sm text-wtva-muted">
          Events promoters create for your venues (also shown on the Events page when pending).
        </p>
        <div className="mt-3">
          <VenueOwnerPromoterEventsPanel initial={pendingEvents} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Pending requests</h2>
        <p className="mt-1 text-sm text-wtva-muted">
          Promoters who requested access to your venues.
        </p>
        <div className="mt-3">
          <VenueOwnerPromotersPanel initial={pendingLinks as never[]} />
        </div>
      </section>
    </div>
  );
}
