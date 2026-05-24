import { requirePromoter } from "@/lib/auth/require-promoter";
import { listPromoterVenueLinks } from "@/lib/data/promoter-venues";
import { PromoterEventForm } from "@/components/promoter/event-form";

export default async function NewPromoterEventPage() {
  const auth = await requirePromoter();
  if (auth.error) return null;

  const links = await listPromoterVenueLinks(auth.user!.id, auth.supabase);
  const approvedVenues = links
    .filter((l) => l.status === "approved" && l.venue)
    .map((l) => ({ id: l.venue_id, name: l.venue!.name }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">Create event</h1>
      <div className="mt-6">
        <PromoterEventForm approvedVenues={approvedVenues} />
      </div>
    </div>
  );
}
