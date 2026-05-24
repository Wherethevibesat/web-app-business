import Link from "next/link";
import { VenueForm } from "@/components/venue-form";
import { requireVenueOwner } from "@/lib/auth/require-venue-owner";
import { listNeighborhoodOptions } from "@/lib/data/neighborhoods";

export default async function NewVenuePage() {
  const auth = await requireVenueOwner();
  if (auth.error) return null;

  const neighborhoods = await listNeighborhoodOptions().catch(() => []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">Add venue</h1>
      <div className="mt-6">
        <VenueForm ownerId={auth.user!.id} neighborhoods={neighborhoods} mode="create" />
      </div>
    </div>
  );
}
