import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isValidPromoterSlug,
  normalizePromoterSlug,
  slugifyPromoterName,
} from "@/lib/promoter-slug";

export type PromoterProfileRow = {
  user_id: string;
  display_name: string;
  bio: string;
  contact_phone: string | null;
  contact_email: string | null;
  profile_image_url: string | null;
  slug: string | null;
};

export type PromoterProfileFormData = {
  display_name: string;
  bio: string;
  contact_phone: string;
  contact_email: string;
  profile_image_url: string;
  slug: string;
};

export function profileNeedsSetup(profile: PromoterProfileRow | null): boolean {
  if (!profile) return true;
  if (!profile.display_name.trim()) return true;
  if (!profile.bio.trim()) return true;
  if (!profile.slug?.trim()) return true;
  return false;
}

export async function getPromoterProfile(
  promoterId: string,
  supabase: SupabaseClient,
): Promise<PromoterProfileRow | null> {
  const { data, error } = await supabase
    .from("promoter_profiles")
    .select("user_id, display_name, bio, contact_phone, contact_email, profile_image_url, slug")
    .eq("user_id", promoterId)
    .maybeSingle();

  if (error) {
    const admin = createAdminClient();
    const { data: adminData } = await admin
      .from("promoter_profiles")
      .select("user_id, display_name, bio, contact_phone, contact_email, profile_image_url, slug")
      .eq("user_id", promoterId)
      .maybeSingle();
    return (adminData as PromoterProfileRow | null) ?? null;
  }

  return (data as PromoterProfileRow | null) ?? null;
}

async function slugTaken(slug: string, excludeUserId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("promoter_profiles")
    .select("user_id")
    .eq("slug", slug)
    .neq("user_id", excludeUserId)
    .maybeSingle();
  return Boolean(data);
}

export async function updatePromoterProfile(
  promoterId: string,
  form: PromoterProfileFormData,
  supabase: SupabaseClient,
): Promise<PromoterProfileRow> {
  const displayName = form.display_name.trim();
  if (!displayName) throw new Error("Display name is required");

  let slug = normalizePromoterSlug(form.slug);
  if (!slug) slug = slugifyPromoterName(displayName);
  if (!isValidPromoterSlug(slug)) {
    throw new Error("Profile URL must be 2–48 characters: lowercase letters, numbers, and hyphens.");
  }

  if (await slugTaken(slug, promoterId)) {
    throw new Error("That profile URL is already taken. Choose another.");
  }

  const payload = {
    user_id: promoterId,
    display_name: displayName,
    bio: form.bio.trim(),
    contact_phone: form.contact_phone.trim() || null,
    contact_email: form.contact_email.trim() || null,
    profile_image_url: form.profile_image_url.trim() || null,
    slug,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("promoter_profiles").upsert(payload, {
    onConflict: "user_id",
  });

  if (error) {
    const admin = createAdminClient();
    const { error: adminError } = await admin.from("promoter_profiles").upsert(payload, {
      onConflict: "user_id",
    });
    if (adminError) throw adminError;
  }

  const updated = await getPromoterProfile(promoterId, supabase);
  if (!updated) throw new Error("Profile save failed");
  return updated;
}
