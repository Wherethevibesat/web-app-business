import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  DriverPackageRow,
  DriverVehicleFormData,
  DriverVehicleRow,
} from "@/lib/types/driver";

const VEHICLE_SELECT =
  "id, company_id, name, description, capacity, image_urls, is_active, sort_order, created_at, updated_at";

export async function listCompanyVehicles(
  companyId: string,
  supabase: SupabaseClient,
): Promise<DriverVehicleRow[]> {
  const { data, error } = await supabase
    .from("driver_vehicles")
    .select(VEHICLE_SELECT)
    .eq("company_id", companyId)
    .order("sort_order")
    .order("created_at");

  if (error) {
    const admin = createAdminClient();
    const { data: adminData, error: adminError } = await admin
      .from("driver_vehicles")
      .select(VEHICLE_SELECT)
      .eq("company_id", companyId)
      .order("sort_order");
    if (adminError) throw adminError;
    return (adminData ?? []) as DriverVehicleRow[];
  }
  return (data ?? []) as DriverVehicleRow[];
}

export async function getOwnerVehicle(
  vehicleId: string,
  companyId: string,
  supabase: SupabaseClient,
): Promise<DriverVehicleRow | null> {
  const { data } = await supabase
    .from("driver_vehicles")
    .select(VEHICLE_SELECT)
    .eq("id", vehicleId)
    .eq("company_id", companyId)
    .maybeSingle();
  return (data as DriverVehicleRow | null) ?? null;
}

export async function listVehiclePackages(
  vehicleId: string,
  supabase: SupabaseClient,
): Promise<DriverPackageRow[]> {
  const { data, error } = await supabase
    .from("driver_vehicle_packages")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .order("sort_order");

  if (error) {
    const admin = createAdminClient();
    const { data: adminData } = await admin
      .from("driver_vehicle_packages")
      .select("*")
      .eq("vehicle_id", vehicleId)
      .order("sort_order");
    return (adminData ?? []) as DriverPackageRow[];
  }
  return (data ?? []) as DriverPackageRow[];
}

function parseCapacity(value: string): number | null {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function createOwnerVehicle(
  companyId: string,
  form: DriverVehicleFormData,
  supabase: SupabaseClient,
): Promise<string> {
  const { data, error } = await supabase
    .from("driver_vehicles")
    .insert({
      company_id: companyId,
      name: form.name.trim(),
      description: form.description.trim(),
      capacity: parseCapacity(form.capacity),
      image_urls: form.image_urls.filter(Boolean),
      is_active: form.is_active,
    })
    .select("id")
    .single();

  if (error) {
    const admin = createAdminClient();
    const { data: adminData, error: adminError } = await admin
      .from("driver_vehicles")
      .insert({
        company_id: companyId,
        name: form.name.trim(),
        description: form.description.trim(),
        capacity: parseCapacity(form.capacity),
        image_urls: form.image_urls.filter(Boolean),
        is_active: form.is_active,
      })
      .select("id")
      .single();
    if (adminError) throw adminError;
    return adminData!.id as string;
  }

  const vehicleId = data!.id as string;
  await syncPackages(vehicleId, form.packages, supabase);
  return vehicleId;
}

export async function updateOwnerVehicle(
  vehicleId: string,
  companyId: string,
  form: DriverVehicleFormData,
  supabase: SupabaseClient,
): Promise<void> {
  const payload = {
    name: form.name.trim(),
    description: form.description.trim(),
    capacity: parseCapacity(form.capacity),
    image_urls: form.image_urls.filter(Boolean),
    is_active: form.is_active,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("driver_vehicles")
    .update(payload)
    .eq("id", vehicleId)
    .eq("company_id", companyId);

  if (error) {
    const admin = createAdminClient();
    const { error: adminError } = await admin
      .from("driver_vehicles")
      .update(payload)
      .eq("id", vehicleId)
      .eq("company_id", companyId);
    if (adminError) throw adminError;
  }

  await syncPackages(vehicleId, form.packages, supabase);
}

async function syncPackages(
  vehicleId: string,
  packages: DriverVehicleFormData["packages"],
  supabase: SupabaseClient,
) {
  const admin = createAdminClient();

  await admin.from("driver_vehicle_packages").delete().eq("vehicle_id", vehicleId);

  const rows = packages
    .filter((p) => p.duration_hours.trim() && p.price_dollars.trim())
    .map((p, i) => ({
      vehicle_id: vehicleId,
      label: p.label.trim() || `${p.duration_hours}h package`,
      duration_hours: parseFloat(p.duration_hours),
      price_cents: Math.round(parseFloat(p.price_dollars) * 100),
      description: p.description.trim(),
      is_active: p.is_active,
      sort_order: i,
    }));

  if (rows.length === 0) return;

  const { error } = await supabase.from("driver_vehicle_packages").insert(rows);
  if (error) {
    const { error: adminError } = await admin.from("driver_vehicle_packages").insert(rows);
    if (adminError) throw adminError;
  }
}
