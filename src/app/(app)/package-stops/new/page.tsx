import Link from "next/link";
import { PackageStopForm } from "@/components/package-stop-form";
import { requireVenueOwner, getOwnerVenue } from "@/lib/auth/require-venue-owner";

export default async function NewPackageStopPage() {
  const auth = await requireVenueOwner();
  if (auth.error) return null;
  const venue = await getOwnerVenue(auth.user!.id, auth.supabase);
  if (!venue) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-wtva-muted">
          <Link href="/venues/new" className="underline">
            Add a venue
          </Link>{" "}
          before creating package stops.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/package-stops" className="text-sm text-wtva-muted hover:text-foreground">
        ← Package stops
      </Link>
      <h1 className="mt-3 text-2xl font-bold">New package stop</h1>
      <p className="mt-1 text-sm text-wtva-muted">
        For {venue.name}. Approved stops can be assembled into multi-venue nights.
      </p>
      <div className="mt-6">
        <PackageStopForm />
      </div>
    </div>
  );
}
