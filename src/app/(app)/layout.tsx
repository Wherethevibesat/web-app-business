import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
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
        <h1 className="text-xl font-bold">Business portal access</h1>
        <p className="mt-3 text-sm text-wtva-muted">
          This login isn&apos;t set up as a venue owner
          {role !== "unknown" ? ` (current role: ${role})` : ""}.
          Sign in with a business account, register a new one, or ask an admin to set
          your role to <code className="text-foreground">venueOwner</code>
          {metaRole === "venueOwner"
            ? " — try signing out and back in."
            : "."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/auth/register"
            className="inline-block rounded-full bg-accent-gradient shadow-accent px-4 py-2 text-sm font-semibold text-white"
          >
            Register business
          </Link>
          <Link
            href="/auth/login"
            className="inline-block rounded-lg border border-wtva-dark-300 px-4 py-2 text-sm font-semibold"
          >
            Sign in with another account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="hidden border-b border-wtva-dark-300 bg-white shadow-sm md:block">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3.5">
          <BrandLogo href="/" label="Business" heightClass="h-11" />
          <nav className="flex gap-5 text-sm font-semibold text-foreground/75">
            <Link href="/" className="hover:text-accent">Home</Link>
            <Link href="/venues" className="hover:text-accent">Venues</Link>
            <Link href="/events" className="hover:text-accent">Events</Link>
            <Link href="/browse" className="hover:text-accent">Browse talent</Link>
            <Link href="/bookings" className="hover:text-accent">Bookings</Link>
            <Link href="/promoters" className="hover:text-accent">Promoters</Link>
            <Link href="/promotions" className="hover:text-accent">Promotions</Link>
            <Link href="/package-stops" className="hover:text-accent">Night packages</Link>
            <Link href="/vibe-bookings" className="hover:text-accent">Vibe bookings</Link>
            <Link href="/settings" className="hover:text-accent">Settings</Link>
          </nav>
        </div>
      </header>
      <main className="min-h-screen pb-20 md:pb-8">{children}</main>
      <BusinessNav />
    </>
  );
}
