import { requireDriver } from "@/lib/auth/require-driver";
import { VehicleForm } from "@/components/driver/vehicle-form";

export default async function DriverFleetNewPage() {
  const auth = await requireDriver();
  if (auth.error) return null;

  return (
    <div className="px-4 py-8">
      <h1 className="mx-auto mb-6 max-w-lg text-2xl font-bold">Add vehicle</h1>
      <VehicleForm />
    </div>
  );
}
