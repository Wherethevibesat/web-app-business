import Link from "next/link";
import { requireDriver } from "@/lib/auth/require-driver";
import { getOwnerCompany } from "@/lib/data/driver-companies";
import { listCompanyVehicles } from "@/lib/data/driver-vehicles";

export default async function DriverFleetPage() {
  const auth = await requireDriver();
  if (auth.error) return null;

  const company = await getOwnerCompany(auth.user!.id, auth.supabase);
  if (!company) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-sm text-wtva-muted">Create your company profile first.</p>
        <Link href="/driver/company/new" className="mt-3 inline-block underline">Go to company profile</Link>
      </div>
    );
  }

  const vehicles = await listCompanyVehicles(company.id, auth.supabase).catch(() => []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Fleet</h1>
        <Link href="/driver/fleet/new" className="rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background">
          Add vehicle
        </Link>
      </div>

      {vehicles.length === 0 ? (
        <p className="mt-8 text-sm text-wtva-muted">No vehicles yet.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {vehicles.map((v) => (
            <li key={v.id} className="flex items-center justify-between rounded-xl border border-wtva-dark-300 bg-wtva-card p-4">
              <div>
                <p className="font-semibold">{v.name}</p>
                <p className="text-sm text-wtva-muted">Capacity: {v.capacity ?? "-"}</p>
              </div>
              <Link href={`/driver/fleet/${v.id}/edit`} className="text-sm underline">Edit</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
