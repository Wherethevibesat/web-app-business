import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { PromoterNav } from "@/components/promoter-nav";
import { SignOutButton } from "@/components/sign-out-button";
import { requirePromoter } from "@/lib/auth/require-promoter";

export default async function PromoterLayout({ children }: { children: React.ReactNode }) {
  const auth = await requirePromoter();
  if (auth.error === "auth") redirect("/auth/login");
  if (auth.error === "role") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-bold">Promoter access only</h1>
        <p className="mt-3 text-sm text-wtva-muted">
          Register as a promoter to manage tables and VIP offers.
        </p>
        <Link
          href="/auth/register?role=promoter"
          className="mt-6 inline-block rounded-full bg-accent-gradient shadow-accent px-4 py-2 text-sm font-semibold text-white"
        >
          Register promoter
        </Link>
      </div>
    );
  }

  return (
    <>
      <header className="hidden border-b border-wtva-dark-300 bg-white shadow-sm md:block">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3.5">
          <BrandLogo href="/promoter" label="Promoter" heightClass="h-11" />
          <div className="flex items-center gap-6">
            <nav className="flex gap-5 text-sm font-semibold text-foreground/75">
              <Link href="/promoter" className="hover:text-accent">Home</Link>
              <Link href="/promoter/profile" className="hover:text-accent">Profile</Link>
              <Link href="/promoter/venues" className="hover:text-accent">Venues</Link>
              <Link href="/promoter/events" className="hover:text-accent">Events</Link>
              <Link href="/promoter/offers" className="hover:text-accent">Offers</Link>
              <Link href="/promoter/inbox" className="hover:text-accent">Inbox</Link>
            </nav>
            <SignOutButton className="text-sm font-semibold text-wtva-muted hover:text-accent" />
          </div>
        </div>
      </header>
      <main className="min-h-screen pb-20 md:pb-8">{children}</main>
      <PromoterNav />
    </>
  );
}
