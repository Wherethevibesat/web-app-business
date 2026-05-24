import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PromoterInquiryRow, PromoterInquiryStatus, PromoterProfileInquiryRow } from "@/lib/types/promoter";

export async function listPromoterInquiries(
  promoterId: string,
  supabase: SupabaseClient,
): Promise<PromoterInquiryRow[]> {
  const { data, error } = await supabase
    .from("promoter_inquiries")
    .select("*, offer:promoter_offers(name, price_cents), event:events(title, starts_at)")
    .eq("promoter_id", promoterId)
    .order("created_at", { ascending: false });

  if (error) {
    const admin = createAdminClient();
    const { data: adminData, error: adminError } = await admin
      .from("promoter_inquiries")
      .select("*")
      .eq("promoter_id", promoterId)
      .order("created_at", { ascending: false });
    if (adminError) throw adminError;
    return (adminData ?? []) as PromoterInquiryRow[];
  }

  return (data ?? []).map(normalizeInquiry);
}

export async function listPromoterProfileInquiries(
  promoterId: string,
  supabase: SupabaseClient,
): Promise<PromoterProfileInquiryRow[]> {
  const { data, error } = await supabase
    .from("promoter_profile_inquiries")
    .select("*")
    .eq("promoter_id", promoterId)
    .order("created_at", { ascending: false });

  if (error) {
    const admin = createAdminClient();
    const { data: adminData, error: adminError } = await admin
      .from("promoter_profile_inquiries")
      .select("*")
      .eq("promoter_id", promoterId)
      .order("created_at", { ascending: false });
    if (adminError) throw adminError;
    return (adminData ?? []) as PromoterProfileInquiryRow[];
  }

  return (data ?? []) as PromoterProfileInquiryRow[];
}

export async function updateProfileInquiryStatus(
  inquiryId: string,
  promoterId: string,
  status: PromoterInquiryStatus,
  promoterNotes: string,
  supabase: SupabaseClient,
) {
  const { data: inquiry } = await supabase
    .from("promoter_profile_inquiries")
    .select("id")
    .eq("id", inquiryId)
    .eq("promoter_id", promoterId)
    .maybeSingle();

  if (!inquiry) throw new Error("Inquiry not found");

  const patch = {
    status,
    promoter_notes: promoterNotes.trim(),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("promoter_profile_inquiries")
    .update(patch)
    .eq("id", inquiryId)
    .eq("promoter_id", promoterId);

  if (error) {
    const admin = createAdminClient();
    const { error: adminError } = await admin
      .from("promoter_profile_inquiries")
      .update(patch)
      .eq("id", inquiryId);
    if (adminError) throw adminError;
  }
}

export async function getProfileInquiryForEmail(inquiryId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("promoter_profile_inquiries")
    .select("guest_name, guest_email, status, promoter_notes, preferred_event")
    .eq("id", inquiryId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    guestName: data.guest_name as string,
    guestEmail: data.guest_email as string,
    status: data.status as string,
    promoterNotes: (data.promoter_notes as string) ?? "",
    preferredEvent: (data.preferred_event as string) ?? "",
  };
}

export async function updateInquiryStatus(
  inquiryId: string,
  promoterId: string,
  status: PromoterInquiryStatus,
  promoterNotes: string,
  supabase: SupabaseClient,
) {
  const { data: inquiry } = await supabase
    .from("promoter_inquiries")
    .select("id, offer_id, status")
    .eq("id", inquiryId)
    .eq("promoter_id", promoterId)
    .maybeSingle();

  if (!inquiry) throw new Error("Inquiry not found");

  if (status === "reserved" || status === "booked") {
    await assertCapacity(inquiry.offer_id as string, inquiryId, supabase);
  }

  const patch = {
    status,
    promoter_notes: promoterNotes.trim(),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("promoter_inquiries")
    .update(patch)
    .eq("id", inquiryId)
    .eq("promoter_id", promoterId);

  if (error) {
    const admin = createAdminClient();
    const { error: adminError } = await admin
      .from("promoter_inquiries")
      .update(patch)
      .eq("id", inquiryId);
    if (adminError) throw adminError;
  }
}

export async function getInquiryForEmail(inquiryId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("promoter_inquiries")
    .select(
      "guest_name, guest_email, status, promoter_notes, offer:promoter_offers(name), event:events(title)",
    )
    .eq("id", inquiryId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const offer = Array.isArray(data.offer) ? data.offer[0] : data.offer;
  const event = Array.isArray(data.event) ? data.event[0] : data.event;
  return {
    guestName: data.guest_name as string,
    guestEmail: data.guest_email as string,
    status: data.status as string,
    promoterNotes: (data.promoter_notes as string) ?? "",
    offerName: (offer as { name: string } | null)?.name ?? "Offer",
    eventTitle: (event as { title: string } | null)?.title ?? "Event",
  };
}

async function assertCapacity(
  offerId: string,
  excludeInquiryId: string,
  supabase: SupabaseClient,
) {
  const admin = createAdminClient();
  const { data: offer } = await admin
    .from("promoter_offers")
    .select("capacity")
    .eq("id", offerId)
    .maybeSingle();
  if (!offer) throw new Error("Offer not found");

  const { count } = await admin
    .from("promoter_inquiries")
    .select("id", { count: "exact", head: true })
    .eq("offer_id", offerId)
    .in("status", ["reserved", "booked"])
    .neq("id", excludeInquiryId);

  if ((count ?? 0) >= (offer.capacity as number)) {
    throw new Error("This offer is at capacity.");
  }
}

function normalizeInquiry(row: Record<string, unknown>): PromoterInquiryRow {
  const offer = Array.isArray(row.offer) ? row.offer[0] : row.offer;
  const event = Array.isArray(row.event) ? row.event[0] : row.event;
  return {
    ...(row as unknown as PromoterInquiryRow),
    offer: offer as PromoterInquiryRow["offer"],
    event: event as PromoterInquiryRow["event"],
  };
}
