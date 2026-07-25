import Link from "next/link";
import { requireVenueOwner, getOwnerVenue } from "@/lib/auth/require-venue-owner";
import { listVenuePackageStops } from "@/lib/data/package-stops";

function formatCents(cents: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  pending_review: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
  archived: "Archived",
};

export default async function PackageStopsPage() {
  const auth = await requireVenueOwner();
  if (auth.error) return null;
  const venue = await getOwnerVenue(auth.user!.id, auth.supabase);
  if (!venue) {
    return (
      <div className="w-full">
        <h1 className="text-2xl font-bold">Build Your Night</h1>
        <p className="mt-3 text-wtva-muted">
          Link a venue first, then create priced stops for WTVA packages.{" "}
          <Link href="/venues/new" className="underline text-foreground">
            Add venue
          </Link>
        </p>
      </div>
    );
  }

  const stops = await listVenuePackageStops(auth.supabase, venue.id as string).catch(() => []);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Package stops</h1>
          <p className="mt-1 text-sm text-wtva-muted">
            Price brunch, day party, night, and after-hours offers for curated Build Your Night
            packages.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href="/package-stops/guests"
            className="rounded-full border border-wtva-dark-300 px-4 py-2 text-sm font-semibold"
          >
            Guests
          </Link>
          <Link
            href="/package-stops/new"
            className="rounded-full bg-accent-gradient shadow-accent px-4 py-2 text-sm font-semibold text-white"
          >
            New stop
          </Link>
        </div>
      </div>

      <ul className="mt-6 space-y-2">
        {stops.map((stop) => (
          <li key={stop.id}>
            <Link
              href={`/package-stops/${stop.id}/edit`}
              className="block rounded-xl border border-wtva-dark-300 bg-wtva-card px-4 py-4 hover:border-accent/40"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{stop.title}</p>
                  <p className="text-sm text-wtva-muted capitalize">
                    {String(stop.slot_type).replace(/_/g, " ")} · {formatCents(stop.price_cents)}
                  </p>
                </div>
                <span className="rounded-full border border-wtva-dark-300 px-2.5 py-0.5 text-xs font-semibold">
                  {STATUS_LABEL[stop.status] ?? stop.status}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {stops.length === 0 && (
        <p className="mt-6 text-wtva-muted">
          No stops yet. Create an offer, accept the package terms, and submit for WTVA review.
        </p>
      )}
    </div>
  );
}
