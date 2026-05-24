import { notFound } from "next/navigation";
import { requireDriver } from "@/lib/auth/require-driver";
import { getOwnerCompany } from "@/lib/data/driver-companies";
import { getOwnerVehicle, listVehiclePackages } from "@/lib/data/driver-vehicles";
import { VehicleForm } from "@/components/driver/vehicle-form";

export default async function DriverFleetEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const auth = await requireDriver();
  if (auth.error) return null;
  const { id } = await params;

  const company = await getOwnerCompany(auth.user!.id, auth.supabase);
  if (!company) return notFound();

  const [vehicle, packages] = await Promise.all([
    getOwnerVehicle(id, company.id, auth.supabase),
    listVehiclePackages(id, auth.supabase),
  ]);

  if (!vehicle) return notFound();

  return (
    <div className="px-4 py-8">
      <h1 className="mx-auto mb-6 max-w-lg text-2xl font-bold">Edit vehicle</h1>
      <VehicleForm vehicleId={id} initial={vehicle} packages={packages} />
    </div>
  );
}
