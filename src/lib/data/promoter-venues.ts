import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PromoterVenueLinkRow } from "@/lib/types/promoter";

export async function listPromoterVenueLinks(
  promoterId: string,
  supabase: SupabaseClient,
): Promise<PromoterVenueLinkRow[]> {
  const { data, error } = await supabase
    .from("promoter_venue_links")
    .select("*, venue:venues(id, name)")
    .eq("promoter_id", promoterId)
    .order("requested_at", { ascending: false });

  if (error) {
    const admin = createAdminClient();
    const { data: adminData, error: adminError } = await admin
      .from("promoter_venue_links")
      .select("*")
      .eq("promoter_id", promoterId)
      .order("requested_at", { ascending: false });
    if (adminError) throw adminError;
    return (adminData ?? []) as PromoterVenueLinkRow[];
  }

  return (data ?? []).map(normalizeLink);
}

export async function listApprovedVenueIds(
  promoterId: string,
  supabase: SupabaseClient,
): Promise<string[]> {
  const links = await listPromoterVenueLinks(promoterId, supabase);
  return links.filter((l) => l.status === "approved").map((l) => l.venue_id);
}

export async function requestVenueLinks(
  promoterId: string,
  venueIds: string[],
  supabase: SupabaseClient,
): Promise<string[]> {
  const unique = [...new Set(venueIds.filter(Boolean))];
  if (unique.length === 0) return [];

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("promoter_venue_links")
    .select("venue_id")
    .eq("promoter_id", promoterId)
    .in("venue_id", unique);
  const existingSet = new Set((existing ?? []).map((r) => r.venue_id as string));
  const newIds = unique.filter((id) => !existingSet.has(id));
  if (newIds.length === 0) return [];

  const rows = newIds.map((venue_id) => ({
    promoter_id: promoterId,
    venue_id,
    status: "pending" as const,
  }));

  const { error } = await supabase
    .from("promoter_venue_links")
    .insert(rows);

  if (error) {
    const { error: adminError } = await admin.from("promoter_venue_links").insert(rows);
    if (adminError) throw adminError;
  }

  return newIds;
}

export async function sendPromoterLinkRequestNotifications(
  promoterId: string,
  venueIds: string[],
) {
  if (venueIds.length === 0) return;

  const admin = createAdminClient();
  const { data: promoter } = await admin
    .from("users")
    .select("name, email")
    .eq("id", promoterId)
    .maybeSingle();
  if (!promoter?.email) return;

  const { data: venues } = await admin
    .from("venues")
    .select("id, name, owner_id")
    .in("id", venueIds);

  const { data: admins } = await admin
    .from("users")
    .select("email")
    .eq("role", "admin");

  const {
    notifyVenueOwnerPromoterLinkRequest,
    notifyAdminsPromoterLinkRequest,
  } = await import("@/lib/email/promoter-notifications");

  const venueNames = (venues ?? []).map((v) => v.name as string);
  notifyAdminsPromoterLinkRequest({
    adminEmails: (admins ?? []).map((a) => a.email as string).filter(Boolean),
    promoterName: promoter.name as string,
    promoterEmail: promoter.email as string,
    venueNames,
  });

  const ownerIds = [
    ...new Set(
      (venues ?? [])
        .map((v) => v.owner_id as string | null)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const { data: owners } =
    ownerIds.length > 0
      ? await admin.from("users").select("id, name, email").in("id", ownerIds)
      : { data: [] };
  const ownerMap = new Map((owners ?? []).map((o) => [o.id as string, o]));

  const byOwner = new Map<string, { name: string; email: string; venues: string[] }>();
  for (const venue of venues ?? []) {
    const ownerId = venue.owner_id as string | null;
    if (!ownerId) continue;
    const owner = ownerMap.get(ownerId);
    if (!owner?.email) continue;
    if (!byOwner.has(ownerId)) {
      byOwner.set(ownerId, {
        name: owner.name as string,
        email: owner.email as string,
        venues: [],
      });
    }
    byOwner.get(ownerId)!.venues.push(venue.name as string);
  }

  for (const owner of byOwner.values()) {
    notifyVenueOwnerPromoterLinkRequest({
      ownerEmail: owner.email,
      ownerName: owner.name,
      promoterName: promoter.name as string,
      promoterEmail: promoter.email as string,
      venueNames: owner.venues,
    });
  }
}

export async function listPublishedVenuesForPicker(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("venues")
    .select("id, name, neighborhood")
    .eq("published", true)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function listPendingLinksForVenueOwner(
  ownerId: string,
  supabase: SupabaseClient,
) {
  const { data: venues } = await supabase
    .from("venues")
    .select("id")
    .eq("owner_id", ownerId);
  const venueIds = (venues ?? []).map((v) => v.id as string);
  if (venueIds.length === 0) return [];

  const { data, error } = await supabase
    .from("promoter_venue_links")
    .select(
      "*, venue:venues(id, name), promoter:users!promoter_venue_links_promoter_id_fkey(id, name, email)",
    )
    .in("venue_id", venueIds)
    .eq("status", "pending")
    .order("requested_at", { ascending: false });

  if (error) {
    const admin = createAdminClient();
    const { data: adminData } = await admin
      .from("promoter_venue_links")
      .select("*")
      .in("venue_id", venueIds)
      .eq("status", "pending");
    return adminData ?? [];
  }
  return data ?? [];
}

export async function reviewVenueLink(
  linkId: string,
  status: "approved" | "rejected",
  reviewerId: string,
  reviewerRole: "venueOwner" | "admin",
  supabase: SupabaseClient,
  notes = "",
) {
  const patch = {
    status,
    reviewed_at: new Date().toISOString(),
    reviewed_by: reviewerId,
    reviewer_role: reviewerRole,
    notes,
  };
  const { error } = await supabase
    .from("promoter_venue_links")
    .update(patch)
    .eq("id", linkId);
  if (error) {
    const admin = createAdminClient();
    const { error: adminError } = await admin
      .from("promoter_venue_links")
      .update(patch)
      .eq("id", linkId);
    if (adminError) throw adminError;
  }
}

export async function listOwnerVenues(ownerId: string, supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("venues")
    .select("id, name")
    .eq("owner_id", ownerId)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

async function ownerVenueIds(ownerId: string, supabase: SupabaseClient) {
  const venues = await listOwnerVenues(ownerId, supabase);
  return venues.map((v) => v.id as string);
}

export async function listAllLinksForVenueOwner(
  ownerId: string,
  supabase: SupabaseClient,
) {
  const venueIds = await ownerVenueIds(ownerId, supabase);
  if (venueIds.length === 0) return [];

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("promoter_venue_links")
    .select(
      "*, venue:venues(id, name), promoter:users!promoter_venue_links_promoter_id_fkey(id, name, email)",
    )
    .in("venue_id", venueIds)
    .order("requested_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function invitePromoterToVenue(
  email: string,
  venueId: string,
  ownerId: string,
  supabase: SupabaseClient,
) {
  const venues = await listOwnerVenues(ownerId, supabase);
  if (!venues.some((v) => v.id === venueId)) {
    throw new Error("You can only add promoters to your own venues");
  }

  const normalized = email.trim().toLowerCase();
  const admin = createAdminClient();
  const { data: user, error: userError } = await admin
    .from("users")
    .select("id, name, email, role")
    .eq("email", normalized)
    .maybeSingle();
  if (userError) throw userError;

  if (!user) {
    throw new Error(
      "No account with that email. Ask them to register as a promoter at the business portal.",
    );
  }
  if (user.role !== "promoter") {
    throw new Error(
      "That account is not a promoter yet. Ask an admin to set their role, or have them register with a promoter account.",
    );
  }

  const now = new Date().toISOString();
  const { error } = await admin.from("promoter_venue_links").upsert(
    {
      promoter_id: user.id,
      venue_id: venueId,
      status: "approved",
      requested_at: now,
      reviewed_at: now,
      reviewed_by: ownerId,
      reviewer_role: "venueOwner",
    },
    { onConflict: "promoter_id,venue_id" },
  );
  if (error) throw error;
  return user;
}

export async function getPromoterVenueLinkById(linkId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("promoter_venue_links")
    .select(
      "id, status, venue:venues(name), promoter:users!promoter_venue_links_promoter_id_fkey(name, email)",
    )
    .eq("id", linkId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const venue = Array.isArray(data.venue) ? data.venue[0] : data.venue;
  const promoter = Array.isArray(data.promoter) ? data.promoter[0] : data.promoter;
  return {
    id: data.id as string,
    venueName: (venue as { name: string } | null)?.name ?? "",
    promoterName: (promoter as { name: string; email: string } | null)?.name ?? "",
    promoterEmail: (promoter as { name: string; email: string } | null)?.email ?? "",
  };
}

function normalizeLink(row: Record<string, unknown>): PromoterVenueLinkRow {
  const venue = Array.isArray(row.venue) ? row.venue[0] : row.venue;
  return {
    ...(row as unknown as PromoterVenueLinkRow),
    venue: venue as PromoterVenueLinkRow["venue"],
  };
}
