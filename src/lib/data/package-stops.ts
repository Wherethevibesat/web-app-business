import type { SupabaseClient } from "@supabase/supabase-js";

export type PackageStopOfferInput = {
  id?: string;
  venueId: string;
  title: string;
  description?: string;
  slotType: string;
  priceCents: number;
  inclusions?: string[];
  capacity?: number | null;
  arrivalWindow?: string | null;
  imageUrl?: string | null;
  contractAccepted: boolean;
  submitForReview?: boolean;
};

export async function listVenuePackageStops(supabase: SupabaseClient, venueId: string) {
  const { data, error } = await supabase
    .from("package_stop_offers")
    .select("*")
    .eq("venue_id", venueId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function upsertVenuePackageStop(
  supabase: SupabaseClient,
  userId: string,
  input: PackageStopOfferInput,
) {
  const status = input.submitForReview
    ? "pending_review"
    : input.id
      ? undefined
      : "draft";

  const payload = {
    venue_id: input.venueId,
    title: input.title.trim(),
    description: input.description?.trim() ?? "",
    slot_type: input.slotType,
    price_cents: input.priceCents,
    inclusions: (input.inclusions ?? []).map((s) => s.trim()).filter(Boolean),
    capacity: input.capacity ?? null,
    arrival_window: input.arrivalWindow?.trim() || null,
    image_url: input.imageUrl?.trim() || null,
    contract_accepted: input.contractAccepted,
    contract_accepted_at: input.contractAccepted ? new Date().toISOString() : null,
    created_by: userId,
    updated_at: new Date().toISOString(),
    ...(status ? { status } : {}),
    ...(input.submitForReview ? { is_active: true } : {}),
  };

  if (input.id) {
    const { data, error } = await supabase
      .from("package_stop_offers")
      .update(payload)
      .eq("id", input.id)
      .select("id")
      .single();
    if (error) throw error;
    return data.id as string;
  }

  const { data, error } = await supabase
    .from("package_stop_offers")
    .insert(payload)
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}
