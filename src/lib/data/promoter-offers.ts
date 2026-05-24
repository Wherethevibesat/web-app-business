import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PromoterOfferFormData, PromoterOfferRow } from "@/lib/types/promoter";

export async function listPromoterOffers(
  promoterId: string,
  supabase: SupabaseClient,
): Promise<PromoterOfferRow[]> {
  const { data, error } = await supabase
    .from("promoter_offers")
    .select("*, event:events(id, title, starts_at), venue:venues(id, name)")
    .eq("promoter_id", promoterId)
    .order("created_at", { ascending: false });

  if (error) {
    const admin = createAdminClient();
    const { data: adminData, error: adminError } = await admin
      .from("promoter_offers")
      .select("*")
      .eq("promoter_id", promoterId)
      .order("created_at", { ascending: false });
    if (adminError) throw adminError;
    return (adminData ?? []) as PromoterOfferRow[];
  }

  const offers = (data ?? []).map(normalizeOffer);
  return attachSlotsUsed(offers, supabase);
}

async function attachSlotsUsed(
  offers: PromoterOfferRow[],
  supabase: SupabaseClient,
): Promise<PromoterOfferRow[]> {
  if (offers.length === 0) return offers;
  const ids = offers.map((o) => o.id);
  const { data } = await supabase
    .from("promoter_inquiries")
    .select("offer_id, status")
    .in("offer_id", ids)
    .in("status", ["reserved", "booked"]);

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const id = row.offer_id as string;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return offers.map((o) => ({ ...o, slots_used: counts.get(o.id) ?? 0 }));
}

export async function createPromoterOffer(
  promoterId: string,
  form: PromoterOfferFormData,
  supabase: SupabaseClient,
) {
  const priceCents = Math.round(parseFloat(form.price_dollars || "0") * 100);
  const capacity = Math.max(1, parseInt(form.capacity || "1", 10));

  const payload = {
    promoter_id: promoterId,
    venue_id: form.venue_id,
    event_id: form.event_id,
    name: form.name.trim(),
    description: form.description.trim(),
    price_cents: priceCents,
    capacity,
    allow_pay: form.allow_pay,
    allow_inquire: form.allow_inquire,
    is_active: true,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("promoter_offers")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    const admin = createAdminClient();
    const { data: adminData, error: adminError } = await admin
      .from("promoter_offers")
      .insert(payload)
      .select("id")
      .single();
    if (adminError) throw adminError;
    return adminData.id as string;
  }
  return data.id as string;
}

function normalizeOffer(row: Record<string, unknown>): PromoterOfferRow {
  const event = Array.isArray(row.event) ? row.event[0] : row.event;
  const venue = Array.isArray(row.venue) ? row.venue[0] : row.venue;
  return {
    ...(row as unknown as PromoterOfferRow),
    event: event as PromoterOfferRow["event"],
    venue: venue as PromoterOfferRow["venue"],
  };
}
