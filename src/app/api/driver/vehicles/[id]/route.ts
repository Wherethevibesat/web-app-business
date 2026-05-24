import { NextResponse } from "next/server";
import { requireDriver, getOwnerDriverCompany } from "@/lib/auth/require-driver";
import {
  getOwnerVehicle,
  listVehiclePackages,
  updateOwnerVehicle,
} from "@/lib/data/driver-vehicles";

function parseVehicle(body: Record<string, unknown>) {
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireDriver(request);
  if (auth.error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const company = await getOwnerDriverCompany(auth.user!.id, auth.supabase);
  if (!company) return NextResponse.json({ error: "No company" }, { status: 404 });

  const vehicle = await getOwnerVehicle(id, company.id as string, auth.supabase);
  if (!vehicle) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const packages = await listVehiclePackages(id, auth.supabase);
  return NextResponse.json({ vehicle, packages });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireDriver(request);
  if (auth.error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const company = await getOwnerDriverCompany(auth.user!.id, auth.supabase);
  if (!company) return NextResponse.json({ error: "No company" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const form = parseVehicle(body);
  if (!form.name.trim()) return NextResponse.json({ error: "Vehicle name is required" }, { status: 400 });

  try {
    await updateOwnerVehicle(id, company.id as string, form, auth.supabase);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update vehicle" },
      { status: 500 },
    );
  }
}
