import { NextResponse } from "next/server";
import { requireDriver, getOwnerDriverCompany } from "@/lib/auth/require-driver";
import {
  createOwnerCompany,
  getOwnerCompany,
  updateOwnerCompany,
} from "@/lib/data/driver-companies";
import type { DriverCompanyFormData } from "@/lib/types/driver";

function parseForm(body: Record<string, unknown>): DriverCompanyFormData {
  return {
    company_name: typeof body.company_name === "string" ? body.company_name : "",
    description: typeof body.description === "string" ? body.description : "",
    contact_phone: typeof body.contact_phone === "string" ? body.contact_phone : "",
    contact_email: typeof body.contact_email === "string" ? body.contact_email : "",
    city: typeof body.city === "string" ? body.city : "",
    image_url: typeof body.image_url === "string" ? body.image_url : "",
  };
}

function validate(form: DriverCompanyFormData): string | null {
  if (!form.company_name.trim()) return "Company name is required";
  return null;
}

export async function GET(request: Request) {
  const auth = await requireDriver(request);
  if (auth.error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const company = await getOwnerCompany(auth.user!.id, auth.supabase);
  return NextResponse.json({ company });
}

export async function POST(request: Request) {
  const auth = await requireDriver(request);
  if (auth.error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const form = parseForm(body);
  const err = validate(form);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  try {
    const id = await createOwnerCompany(auth.user!.id, form, auth.supabase);
    return NextResponse.json({ id });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create company" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const auth = await requireDriver(request);
  if (auth.error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const company = await getOwnerDriverCompany(auth.user!.id, auth.supabase);
  if (!company) return NextResponse.json({ error: "No company profile" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const form = parseForm(body);
  const err = validate(form);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  try {
    await updateOwnerCompany(company.id as string, auth.user!.id, form, auth.supabase);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update company" },
      { status: 500 },
    );
  }
}
