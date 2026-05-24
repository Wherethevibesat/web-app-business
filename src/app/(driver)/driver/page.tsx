import Link from "next/link";
import { requireDriver } from "@/lib/auth/require-driver";
import { getOwnerCompany } from "@/lib/data/driver-companies";
import { listCompanyVehicles } from "@/lib/data/driver-vehicles";
import { listCompanyBookings } from "@/lib/data/driver-bookings";

export default async function DriverHomePage() {
  const auth = await requireDriver();
  if (auth.error) return null;

  const company = await getOwnerCompany(auth.user!.id, auth.supabase);
  const [vehicles, bookings] = company
    ? await Promise.all([
        listCompanyVehicles(company.id, auth.supabase).catch(() => []),
        listCompanyBookings(company.id, auth.supabase).catch(() => []),
      ])
    : [[], []];

  const pending = bookings.filter((b) => b.status === "pending_driver").length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold">Driver dashboard</h1>
      <p className="mt-1 text-sm text-wtva-muted">
        Manage your listing, fleet, packages, and booking approvals.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-wtva-dark-300 bg-wtva-card p-5">
          <p className="text-sm text-wtva-muted">Company profile</p>
          <p className="text-2xl font-bold">{company ? "Ready" : "Missing"}</p>
        </div>
        <div className="rounded-xl border border-wtva-dark-300 bg-wtva-card p-5">
          <p className="text-sm text-wtva-muted">Vehicles</p>
          <p className="text-2xl font-bold">{vehicles.length}</p>
        </div>
        <div className="rounded-xl border border-wtva-dark-300 bg-wtva-card p-5">
          <p className="text-sm text-wtva-muted">Pending bookings</p>
          <p className="text-2xl font-bold">{pending}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <Link href={company ? "/driver/company" : "/driver/company/new"} className="rounded-xl border border-wtva-dark-300 bg-wtva-card p-5 hover:border-foreground">
          {company ? "Manage company" : "Create company"} ?
        </Link>
        <Link href="/driver/fleet" className="rounded-xl border border-wtva-dark-300 bg-wtva-card p-5 hover:border-foreground">
          Manage fleet & packages ?
        </Link>
        <Link href="/driver/bookings" className="rounded-xl border border-wtva-dark-300 bg-wtva-card p-5 hover:border-foreground">
          Review booking requests ?
        </Link>
      </div>
    </div>
  );
}
