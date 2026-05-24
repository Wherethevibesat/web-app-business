import { requirePromoter } from "@/lib/auth/require-promoter";
import { listApprovedVenueIds } from "@/lib/data/promoter-venues";
import { listEventsForPromoter } from "@/lib/data/promoter-events";
import { OfferForm } from "@/components/promoter/offer-form";

export default async function NewPromoterOfferPage() {
  const auth = await requirePromoter();
  if (auth.error) return null;

  const venueIds = await listApprovedVenueIds(auth.user!.id, auth.supabase);
  const events = await listEventsForPromoter(auth.user!.id, venueIds, auth.supabase);

  const eventOptions = events.map((e) => ({
    id: e.id as string,
    title: e.title as string,
    venue_id: e.venue_id as string,
    starts_at: e.starts_at as string,
  }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">Create offer</h1>
      <div className="mt-6">
        <OfferForm events={eventOptions} approvedVenueIds={venueIds} />
      </div>
    </div>
  );
}
