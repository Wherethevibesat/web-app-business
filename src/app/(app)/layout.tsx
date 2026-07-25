import Link from "next/link";
import { redirect } from "next/navigation";
import { BusinessNav } from "@/components/business-nav";
import { BusinessSidebar } from "@/components/business-sidebar";
import { BusinessTopbar } from "@/components/business-topbar";
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
          Sign in with a business account, register a new one, or ask an admin to
          set your role to <code className="text-foreground">venueOwner</code>
          {metaRole === "venueOwner"
            ? " — try signing out and back in."
            : "."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/auth/register"
            className="inline-block rounded-full bg-accent-gradient px-4 py-2 text-sm font-semibold text-white shadow-accent"
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

  const displayName = auth.profile?.name?.trim() || "";
  const email = auth.profile?.email || auth.user?.email || "";

  return (
    <div className="flex min-h-screen items-stretch bg-background">
      <BusinessSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <BusinessTopbar name={displayName} email={email} />
        <main className="min-w-0 flex-1 pb-20 md:pb-0">
          <div className="w-full max-w-none p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
      <BusinessNav />
    </div>
  );
}
