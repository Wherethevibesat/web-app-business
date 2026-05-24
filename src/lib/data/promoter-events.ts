import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PromoterEventFormData } from "@/lib/types/promoter";

export type PromoterEventForReview = {
  id: string;
  title: string;
  venue_id: string;
  starts_at: string;
  ends_at: string | null;
  status: string;
  promoter_event_approval: string;
  created_by_promoter_id: string;
  venue?: { name: string } | null;
  promoter?: { name: string; email: string } | null;
};

export async function listEventsForPromoter(
  promoterId: string,
  approvedVenueIds: string[],
  supabase: SupabaseClient,
) {
  if (approvedVenueIds.length === 0) return [];

  const { data, error } = await supabase
    .from("events")
    .select("id, title, venue_id, starts_at, ends_at, status, promoter_event_approval, created_by_promoter_id")
    .in("venue_id", approvedVenueIds)
    .order("starts_at", { ascending: false })
    .limit(100);

  if (error) throw error;

  return (data ?? []).filter(
    (e) =>
      e.status === "published" ||
      e.created_by_promoter_id === promoterId,
  );
}

export async function createPromoterEvent(
  promoterId: string,
  form: PromoterEventFormData,
  supabase: SupabaseClient,
) {
  const payload = {
    venue_id: form.venue_id,
    title: form.title.trim(),
    description: form.description.trim(),
    event_type: form.event_type || "Party",
    neighborhood: form.neighborhood.trim() || null,
    starts_at: new Date(form.starts_at).toISOString(),
    ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
    status: "pending_review",
    submitted_by: promoterId,
    created_by_promoter_id: promoterId,
    promoter_event_approval: "pending",
    featured: false,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from("events").insert(payload).select("id").single();
  if (error) {
    const admin = createAdminClient();
    const { data: adminData, error: adminError } = await admin
      .from("events")
      .insert(payload)
      .select("id")
      .single();
    if (adminError) throw adminError;
    return adminData.id as string;
  }
  return data.id as string;
}

function formatEventStartsAt(iso: string) {
  return new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

export async function sendPromoterEventRequestNotifications(
  eventId: string,
  promoterId: string,
) {
  const admin = createAdminClient();
  const { data: event } = await admin
    .from("events")
    .select("id, title, starts_at, venue:venues(id, name, owner_id)")
    .eq("id", eventId)
    .maybeSingle();
  if (!event) return;

  const venue = Array.isArray(event.venue) ? event.venue[0] : event.venue;
  if (!venue) return;

  const { data: promoter } = await admin
    .from("users")
    .select("name, email")
    .eq("id", promoterId)
    .maybeSingle();
  if (!promoter?.email) return;

  const { data: admins } = await admin.from("users").select("email").eq("role", "admin");

  const {
    notifyVenueOwnerPromoterEventRequest,
    notifyAdminsPromoterEventRequest,
  } = await import("@/lib/email/promoter-notifications");

  const startsAt = formatEventStartsAt(event.starts_at as string);
  const venueName = venue.name as string;
  const promoterName = promoter.name as string;
  const promoterEmail = promoter.email as string;
  const eventTitle = event.title as string;

  notifyAdminsPromoterEventRequest({
    adminEmails: (admins ?? []).map((a) => a.email as string).filter(Boolean),
    promoterName,
    promoterEmail,
    eventTitle,
    venueName,
    startsAt,
  });

  const ownerId = venue.owner_id as string | null;
  if (!ownerId) return;

  const { data: owner } = await admin
    .from("users")
    .select("name, email")
    .eq("id", ownerId)
    .maybeSingle();
  if (!owner?.email) return;

  notifyVenueOwnerPromoterEventRequest({
    ownerEmail: owner.email as string,
    ownerName: owner.name as string,
    promoterName,
    promoterEmail,
    eventTitle,
    venueName,
    startsAt,
  });
}

export async function reviewPromoterEvent(
  eventId: string,
  approval: "approved" | "rejected",
  publish: boolean,
  supabase: SupabaseClient,
) {
  const patch: Record<string, unknown> = {
    promoter_event_approval: approval,
    updated_at: new Date().toISOString(),
  };
  if (approval === "approved" && publish) {
    patch.status = "published";
  } else if (approval === "rejected") {
    patch.status = "cancelled";
  }
  const { error } = await supabase.from("events").update(patch).eq("id", eventId);
  if (error) {
    const admin = createAdminClient();
    const { error: adminError } = await admin.from("events").update(patch).eq("id", eventId);
    if (adminError) throw adminError;
  }
}

export async function listPendingPromoterEventsForVenueOwner(
  ownerId: string,
  supabase: SupabaseClient,
): Promise<PromoterEventForReview[]> {
  const { data: venues } = await supabase
    .from("venues")
    .select("id")
    .eq("owner_id", ownerId);
  const venueIds = (venues ?? []).map((v) => v.id as string);
  if (venueIds.length === 0) return [];

  const select =
    "id, title, venue_id, starts_at, ends_at, status, promoter_event_approval, created_by_promoter_id, venue:venues(name), promoter:users!events_created_by_promoter_id_fkey(name, email)";

  const { data, error } = await supabase
    .from("events")
    .select(select)
    .in("venue_id", venueIds)
    .not("created_by_promoter_id", "is", null)
    .eq("promoter_event_approval", "pending")
    .order("starts_at", { ascending: true });

  if (error) {
    const admin = createAdminClient();
    const { data: adminData, error: adminError } = await admin
      .from("events")
      .select(select)
      .in("venue_id", venueIds)
      .not("created_by_promoter_id", "is", null)
      .eq("promoter_event_approval", "pending")
      .order("starts_at", { ascending: true });
    if (adminError) throw adminError;
    return (adminData ?? []).map(normalizeEventForReview);
  }

  return (data ?? []).map(normalizeEventForReview);
}

export async function reviewPromoterEventForVenueOwner(
  eventId: string,
  ownerId: string,
  approval: "approved" | "rejected",
  publish: boolean,
  supabase: SupabaseClient,
) {
  const pending = await listPendingPromoterEventsForVenueOwner(ownerId, supabase);
  if (!pending.some((e) => e.id === eventId)) {
    throw new Error("Event not found or not pending your approval");
  }
  await reviewPromoterEvent(eventId, approval, publish, supabase);
}

export async function getPromoterEventForEmail(eventId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("events")
    .select(
      "id, title, venue:venues(name), promoter:users!events_created_by_promoter_id_fkey(name, email)",
    )
    .eq("id", eventId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const venue = Array.isArray(data.venue) ? data.venue[0] : data.venue;
  const promoter = Array.isArray(data.promoter) ? data.promoter[0] : data.promoter;
  return {
    eventTitle: data.title as string,
    venueName: (venue as { name: string } | null)?.name ?? "",
    promoterName: (promoter as { name: string; email: string } | null)?.name ?? "",
    promoterEmail: (promoter as { name: string; email: string } | null)?.email ?? "",
  };
}

function normalizeEventForReview(row: Record<string, unknown>): PromoterEventForReview {
  const venue = Array.isArray(row.venue) ? row.venue[0] : row.venue;
  const promoter = Array.isArray(row.promoter) ? row.promoter[0] : row.promoter;
  return {
    ...(row as unknown as PromoterEventForReview),
    venue: venue as PromoterEventForReview["venue"],
    promoter: promoter as PromoterEventForReview["promoter"],
  };
}
