import Link from "next/link";
import { requireVenueOwner, getOwnerVenue } from "@/lib/auth/require-venue-owner";
import { getHomeStats } from "@/lib/data/business";

export default async function BusinessHomePage() {
  const auth = await requireVenueOwner();
  if (auth.error) return null;
  const venue = await getOwnerVenue(auth.user!.id);
  const stats = await getHomeStats(auth.user!.id, venue?.id ?? null);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">Welcome, {auth.profile?.name}</h1>
      <p className="text-wtva-muted">
        {venue?.name ?? (
          <>
            No venue linked yet.{" "}
            <Link href="/venues/new" className="underline text-foreground">
              Add your venue
            </Link>
          </>
        )}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-wtva-dark-300 bg-wtva-card p-5">
          <p className="text-sm text-wtva-muted">Events</p>
          <p className="text-2xl font-bold">{stats.events}</p>
        </div>
        <div className="rounded-xl border border-wtva-dark-300 bg-wtva-card p-5">
          <p className="text-sm text-wtva-muted">Check-ins</p>
          <p className="text-2xl font-bold">{stats.checkIns}</p>
        </div>
        <div className="rounded-xl border border-wtva-dark-300 bg-wtva-card p-5">
          <p className="text-sm text-wtva-muted">Bookings</p>
          <p className="text-2xl font-bold">{stats.bookings}</p>
        </div>
        <div className="rounded-xl border border-wtva-dark-300 bg-wtva-card p-5">
          <p className="text-sm text-wtva-muted">Promotions</p>
          <p className="text-2xl font-bold">{stats.promotions}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {!venue && (
          <Link href="/venues/new" className="rounded-xl border border-foreground bg-wtva-card p-5 hover:border-foreground">
            Add your venue →
          </Link>
        )}
        <Link href="/events/new" className="rounded-xl border border-wtva-dark-300 bg-wtva-card p-5 hover:border-foreground">
          Add event →
        </Link>
        <Link href="/events" className="rounded-xl border border-wtva-dark-300 bg-wtva-card p-5 hover:border-foreground">
          Manage events →
        </Link>
        <Link href="/browse" className="rounded-xl border border-wtva-dark-300 bg-wtva-card p-5 hover:border-foreground">
          Browse talent →
        </Link>
        <Link href="/promotions/new" className="rounded-xl border border-wtva-dark-300 bg-wtva-card p-5 hover:border-foreground">
          New promotion →
        </Link>
      </div>
    </div>
  );
}
