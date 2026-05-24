import Link from "next/link";
import { requireVenueOwner, getOwnerVenue } from "@/lib/auth/require-venue-owner";

export default async function SettingsPage() {
  const auth = await requireVenueOwner();
  if (auth.error) return null;
  const venue = await getOwnerVenue(auth.user!.id);

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-2xl font-bold">Settings</h1>
      <div className="mt-6 rounded-xl border border-wtva-dark-300 bg-wtva-card p-5 space-y-2 text-sm">
        <p><span className="text-wtva-muted">Account:</span> {auth.profile?.email}</p>
        <p><span className="text-wtva-muted">Venue:</span> {venue?.name ?? "Not assigned"}</p>
        <p><span className="text-wtva-muted">Tier:</span> {venue?.subscription_tier ?? "—"}</p>
        <p><span className="text-wtva-muted">Verification:</span> {venue?.verification_status ?? "—"}</p>
      </div>
      <Link href={venue ? "/venues" : "/venues/new"} className="mt-4 inline-block rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background">
        {venue ? "Manage venues" : "Add your venue"}
      </Link>
      <Link href="/onboarding" className="mt-4 ml-3 inline-block text-sm underline text-wtva-muted">
        Business onboarding (setup)
      </Link>
      <form action="/auth/signout" method="post" className="mt-6">
        <button type="submit" className="text-sm text-red-400">Sign out</button>
      </form>
    </div>
  );
}
