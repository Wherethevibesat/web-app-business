import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { DriverCompanyFormData, DriverCompanyRow } from "@/lib/types/driver";

const SELECT =
  "id, owner_id, company_name, description, contact_phone, contact_email, city, image_url, status, published, listing_paid_at, listing_expires_at, listing_payment_intent_id, created_at, updated_at";

function emptyToNull(value: string): string | null {
  const t = value.trim();
  return t || null;
}

function companyPayload(form: DriverCompanyFormData) {
  return {
    company_name: form.company_name.trim(),
    description: form.description.trim(),
    contact_phone: emptyToNull(form.contact_phone),
    contact_email: emptyToNull(form.contact_email),
    city: emptyToNull(form.city),
    image_url: emptyToNull(form.image_url),
    updated_at: new Date().toISOString(),
  };
}

export async function getOwnerCompany(
  ownerId: string,
  supabase?: SupabaseClient,
): Promise<DriverCompanyRow | null> {
  const client = supabase ?? (await createClient());
  const { data, error } = await client
    .from("driver_companies")
    .select(SELECT)
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (error || !data) {
    const admin = createAdminClient();
    const { data: adminData } = await admin
      .from("driver_companies")
      .select(SELECT)
      .eq("owner_id", ownerId)
      .maybeSingle();
    return (adminData as DriverCompanyRow | null) ?? null;
  }
  return data as DriverCompanyRow;
}

export async function createOwnerCompany(
  ownerId: string,
  form: DriverCompanyFormData,
  supabase: SupabaseClient,
): Promise<string> {
  const existing = await getOwnerCompany(ownerId, supabase);
  if (existing) throw new Error("You already have a driver company profile.");

  const payload = {
    owner_id: ownerId,
    ...companyPayload(form),
    status: "draft",
    published: false,
  };

  const { data, error } = await supabase
    .from("driver_companies")
    .insert(payload)
    .select("id")
    .single();

  if (!error && data) return data.id as string;

  const admin = createAdminClient();
  const { data: adminData, error: adminError } = await admin
    .from("driver_companies")
    .insert(payload)
    .select("id")
    .single();
  if (adminError) throw adminError;
  return adminData!.id as string;
}

export async function updateOwnerCompany(
  companyId: string,
  ownerId: string,
  form: DriverCompanyFormData,
  supabase: SupabaseClient,
): Promise<void> {
  const payload = companyPayload(form);
  const { error } = await supabase
    .from("driver_companies")
    .update(payload)
    .eq("id", companyId)
    .eq("owner_id", ownerId);

  if (!error) return;

  const admin = createAdminClient();
  const { error: adminError } = await admin
    .from("driver_companies")
    .update(payload)
    .eq("id", companyId)
    .eq("owner_id", ownerId);
  if (adminError) throw adminError;
}
