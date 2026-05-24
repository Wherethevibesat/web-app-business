import { NextResponse } from "next/server";
import { requireDriver, getOwnerDriverCompany } from "@/lib/auth/require-driver";
import { createOwnerVehicle, listCompanyVehicles } from "@/lib/data/driver-vehicles";
import type { DriverVehicleFormData } from "@/lib/types/driver";

function parseVehicle(body: Record<string, unknown>): DriverVehicleFormData {
  const packages = Array.isArray(body.packages) ? body.packages : [];
  return {
    name: typeof body.name === "string" ? body.name : "",
    description: typeof body.description === "string" ? body.description : "",
    capacity: typeof body.capacity === "string" ? body.capacity : "",
    image_urls: Array.isArray(body.image_urls)
      ? body.image_urls.filter((u): u is string => typeof u === "string")
      : [],
    is_active: body.is_active !== false,
    packages: packages.map((p: Record<string, unknown>) => ({
      id: typeof p.id === "string" ? p.id : undefined,
      label: typeof p.label === "string" ? p.label : "",
      duration_hours: typeof p.duration_hours === "string" ? p.duration_hours : String(p.duration_hours ?? ""),
      price_dollars: typeof p.price_dollars === "string" ? p.price_dollars : String(p.price_dollars ?? ""),
      description: typeof p.description === "string" ? p.description : "",
      is_active: p.is_active !== false,
    })),
  };
}

export async function GET(request: Request) {
  const auth = await requireDriver(request);
  if (auth.error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const company = await getOwnerDriverCompany(auth.user!.id, auth.supabase);
  if (!company) return NextResponse.json({ vehicles: [] });

  const vehicles = await listCompanyVehicles(company.id as string, auth.supabase);
  return NextResponse.json({ vehicles });
}

export async function POST(request: Request) {
  const auth = await requireDriver(request);
  if (auth.error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const company = await getOwnerDriverCompany(auth.user!.id, auth.supabase);
  if (!company) return NextResponse.json({ error: "Create your company profile first" }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  const form = parseVehicle(body);
  if (!form.name.trim()) return NextResponse.json({ error: "Vehicle name is required" }, { status: 400 });
  if (form.packages.length === 0) {
    return NextResponse.json({ error: "Add at least one package (hours + price)" }, { status: 400 });
  }

  try {
    const id = await createOwnerVehicle(company.id as string, form, auth.supabase);
    return NextResponse.json({ id });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to add vehicle" },
      { status: 500 },
    );
  }
}
