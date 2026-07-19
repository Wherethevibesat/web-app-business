import Link from "next/link";
import { requireVenueOwner } from "@/lib/auth/require-venue-owner";
import { listOwnerVenues } from "@/lib/data/venues";

export default async function VenuesPage() {
  const auth = await requireVenueOwner();
  if (auth.error) return null;

  const venues = await listOwnerVenues(auth.user!.id).catch(() => []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Your venues</h1>
        <Link
          href="/venues/new"
          className="rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background"
        >
          Add venue
        </Link>
      </div>

      {venues.length === 0 ? (
        <div className="mt-8 rounded-xl border border-wtva-dark-300 bg-wtva-card p-6">
          <p className="text-sm text-wtva-muted">
            No venue linked yet. Add your venue to start posting events and promotions.
          </p>
          <Link
            href="/venues/new"
            className="mt-4 inline-block rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background"
          >
            Add your venue
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {venues.map((venue) => (
            <li
              key={venue.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-wtva-dark-300 bg-wtva-card p-5"
            >
              <div>
                <p className="font-semibold">{venue.name}</p>
                <p className="text-sm text-wtva-muted">
                  {venue.venue_type}
                  {venue.neighborhood ? ` · ${venue.neighborhood}` : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/venues/${venue.id}/qr`}
                  className="rounded-lg border border-wtva-dark-300 px-4 py-2 text-sm font-semibold hover:border-foreground"
                >
                  QR code
                </Link>
                <Link
                  href={`/venues/${venue.id}/edit`}
                  className="rounded-lg border border-wtva-dark-300 px-4 py-2 text-sm font-semibold hover:border-foreground"
                >
                  Edit
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
