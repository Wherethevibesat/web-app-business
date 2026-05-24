import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatHoursLabel, normalizeOpeningHours } from "@/lib/types/opening-hours";
import type { BusinessVenueFormData, BusinessVenueRow } from "@/lib/types/venue";

const VENUE_SELECT =
  "id, name, venue_type, address, neighborhood, description, image_url, phone, hours_label, opening_hours, website_url, instagram_url, facebook_url, tiktok_url, twitter_url, subscription_tier, verified, verification_status, published, is_open, owner_id, latitude, longitude, created_at, updated_at";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

function venueIdForOwner(ownerId: string, name: string): string {
  const slug = slugify(name);
  const suffix = ownerId.replace(/-/g, "").slice(0, 8);
  return slug ? `${slug}-${suffix}` : `v-${suffix}`;
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed || null;
}

function venuePayload(form: BusinessVenueFormData) {
  const opening_hours = normalizeOpeningHours(form.opening_hours);
  return {
    name: form.name.trim(),
    venue_type: form.venue_type,
    address: emptyToNull(form.address),
    neighborhood: emptyToNull(form.neighborhood),
    description: emptyToNull(form.description),
    image_url: emptyToNull(form.image_url),
    phone: emptyToNull(form.phone),
    opening_hours,
    hours_label: formatHoursLabel(opening_hours),
    website_url: emptyToNull(form.website_url),
    instagram_url: emptyToNull(form.instagram_url),
    facebook_url: emptyToNull(form.facebook_url),
    tiktok_url: emptyToNull(form.tiktok_url),
    twitter_url: emptyToNull(form.twitter_url),
  };
}

async function ownerVenueIds(
  ownerId: string,
  supabase: SupabaseClient,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("venues")
    .select("id")
    .eq("owner_id", ownerId);

  if (error) {
    const admin = createAdminClient();
    const { data: adminData, error: adminError } = await admin
      .from("venues")
      .select("id")
      .eq("owner_id", ownerId);
    if (adminError) throw adminError;
    return (adminData ?? []).map((row) => row.id as string);
  }

  return (data ?? []).map((row) => row.id as string);
}

async function insertVenue(
  payload: Record<string, unknown>,
  supabase: SupabaseClient,
): Promise<void> {
  const { error } = await supabase.from("venues").insert(payload);
  if (!error) return;

  const admin = createAdminClient();
  const { error: adminError } = await admin.from("venues").insert(payload);
  if (adminError) throw adminError;
}

async function updateVenueRow(
  venueId: string,
  ownerId: string,
  payload: Record<string, unknown>,
  supabase: SupabaseClient,
): Promise<void> {
  const { error } = await supabase
    .from("venues")
    .update(payload)
    .eq("id", venueId)
    .eq("owner_id", ownerId);

  if (!error) return;

  const admin = createAdminClient();
  const { error: adminError } = await admin
    .from("venues")
    .update(payload)
    .eq("id", venueId)
    .eq("owner_id", ownerId);

  if (adminError) throw adminError;
}

export async function listOwnerVenues(
  ownerId: string,
  supabase?: SupabaseClient,
): Promise<BusinessVenueRow[]> {
  const client = supabase ?? (await createClient());
  const { data, error } = await client
    .from("venues")
    .select(VENUE_SELECT)
    .eq("owner_id", ownerId)
    .order("name", { ascending: true });

  if (error) {
    const admin = createAdminClient();
    const { data: adminData, error: adminError } = await admin
      .from("venues")
      .select(VENUE_SELECT)
      .eq("owner_id", ownerId)
      .order("name", { ascending: true });
    if (adminError) throw adminError;
    return (adminData ?? []) as BusinessVenueRow[];
  }

  return (data ?? []) as BusinessVenueRow[];
}

export async function getOwnerVenueById(
  ownerId: string,
  venueId: string,
  supabase?: SupabaseClient,
): Promise<BusinessVenueRow | null> {
  const client = supabase ?? (await createClient());
  const { data, error } = await client
    .from("venues")
    .select(VENUE_SELECT)
    .eq("id", venueId)
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (error) {
    const admin = createAdminClient();
    const { data: adminData, error: adminError } = await admin
      .from("venues")
      .select(VENUE_SELECT)
      .eq("id", venueId)
      .eq("owner_id", ownerId)
      .maybeSingle();
    if (adminError) throw adminError;
    return adminData as BusinessVenueRow | null;
  }

  return data as BusinessVenueRow | null;
}

export async function createOwnerVenue(
  ownerId: string,
  form: BusinessVenueFormData,
  supabase: SupabaseClient,
): Promise<string> {
  try {
    await supabase.rpc("claim_venue_owner_role");
  } catch {
    /* optional — may already be venueOwner */
  }

  const existingIds = await ownerVenueIds(ownerId, supabase);
  const id = form.id?.trim() || venueIdForOwner(ownerId, form.name);
  if (existingIds.includes(id)) {
    throw new Error("You already have a venue with this id. Choose a different name.");
  }

  const { data: idTaken } = await supabase.from("venues").select("id").eq("id", id).maybeSingle();
  if (idTaken) {
    throw new Error("This venue id is already taken. Try a different venue name.");
  }

  const now = new Date().toISOString();
  await insertVenue(
    {
      id,
      ...venuePayload(form),
      subscription_tier: "silver",
      verified: false,
      verification_status: "none",
      published: true,
      is_open: true,
      owner_id: ownerId,
      created_at: now,
      updated_at: now,
    },
    supabase,
  );

  return id;
}

export async function updateOwnerVenue(
  ownerId: string,
  venueId: string,
  form: BusinessVenueFormData,
  supabase: SupabaseClient,
): Promise<void> {
  await updateVenueRow(
    venueId,
    ownerId,
    {
      ...venuePayload(form),
      updated_at: new Date().toISOString(),
    },
    supabase,
  );
}
