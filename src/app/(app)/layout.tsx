import Link from "next/link";
import { redirect } from "next/navigation";
import { BusinessNav } from "@/components/business-nav";
import { requireVenueOwner } from "@/lib/auth/require-venue-owner";

export default async function BusinessAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await requireVenueOwner();
  if (auth.error === "auth") redirect("/auth/login");
  if (auth.error === "role") {
    const role = auth.profile?.role ?? "unknown";
    const metaRole = auth.user?.user_metadata?.role as string | undefined;
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-bold">Venue owner access only</h1>
        <p className="mt-3 text-sm text-wtva-muted">
          This account is not a venue owner
          {role !== "unknown" ? ` (current role: ${role})` : ""}.
          Register here with a business account, or ask an admin to set your role to{" "}
          <code className="text-foreground">venueOwner</code>
          {metaRole === "venueOwner"
            ? " — try signing out and back in. If this persists, ask an admin to set role to venueOwner in Supabase."
            : "."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/auth/register"
            className="inline-block rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background"
          >
            Register business
          </Link>
          <a
            href={process.env.NEXT_PUBLIC_CUSTOMER_APP_URL ?? "http://localhost:3001"}
            className="inline-block rounded-lg border border-wtva-dark-300 px-4 py-2 text-sm font-semibold"
          >
            Go to customer app
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="hidden border-b border-wtva-dark-300 md:block">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="font-bold">WTVA Business</span>
          <nav className="flex gap-6 text-sm text-wtva-muted">
            <Link href="/">Home</Link>
            <Link href="/venues">Venues</Link>
            <Link href="/events">Events</Link>
            <Link href="/browse">Browse talent</Link>
            <Link href="/bookings">Bookings</Link>
            <Link href="/redeem">Redeem</Link>
            <Link href="/promoters">Promoters</Link>
            <Link href="/promotions">Promotions</Link>
            <Link href="/settings">Settings</Link>
          </nav>
        </div>
      </header>
      <main className="min-h-screen pb-20 md:pb-8">{children}</main>
      <BusinessNav />
    </>
  );
}
