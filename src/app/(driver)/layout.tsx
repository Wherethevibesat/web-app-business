import Link from "next/link";
import { redirect } from "next/navigation";
import { DriverNav } from "@/components/driver-nav";
import { requireDriver } from "@/lib/auth/require-driver";

export default async function DriverLayout({ children }: { children: React.ReactNode }) {
  const auth = await requireDriver();
  if (auth.error === "auth") redirect("/auth/login");
  if (auth.error === "role") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-bold">Driver access only</h1>
        <p className="mt-3 text-sm text-wtva-muted">
          This account is not a driver account. Register as a driver to continue.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/auth/register?role=driver" className="rounded-full bg-accent-gradient shadow-accent px-4 py-2 text-sm font-semibold text-white">
            Register driver
          </Link>
          <Link href="/" className="rounded-lg border border-wtva-dark-300 px-4 py-2 text-sm font-semibold">
            Venue dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="hidden border-b border-wtva-dark-300 bg-white shadow-sm md:block">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3.5">
          <span className="font-bold text-foreground">
            <span className="text-accent">WTVA</span> Driver
          </span>
          <nav className="flex gap-5 text-sm font-semibold text-foreground/75">
            <Link href="/driver" className="hover:text-accent">Home</Link>
            <Link href="/driver/company" className="hover:text-accent">Company</Link>
            <Link href="/driver/fleet" className="hover:text-accent">Fleet</Link>
            <Link href="/driver/bookings" className="hover:text-accent">Bookings</Link>
          </nav>
        </div>
      </header>
      <main className="min-h-screen pb-20 md:pb-8">{children}</main>
      <DriverNav />
    </>
  );
}
