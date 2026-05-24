import { requirePromoter } from "@/lib/auth/require-promoter";
import {
  listPromoterVenueLinks,
  listPublishedVenuesForPicker,
} from "@/lib/data/promoter-venues";
import { VenueLinksClient } from "@/components/promoter/venue-links-client";

export default async function PromoterVenuesPage() {
  const auth = await requirePromoter();
  if (auth.error) return null;

  const [links, venues] = await Promise.all([
    listPromoterVenueLinks(auth.user!.id, auth.supabase),
    listPublishedVenuesForPicker(auth.supabase),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">Venues</h1>
      <p className="mt-1 text-sm text-wtva-muted">
        Link to venues you promote. You need approval before creating offers.
      </p>
      <div className="mt-6">
        <VenueLinksClient initialLinks={links} venues={venues} />
      </div>
    </div>
  );
}
