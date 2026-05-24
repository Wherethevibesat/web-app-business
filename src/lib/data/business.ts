import { createClient } from "@/lib/supabase/server";

export async function browseTalent() {
  const supabase = await createClient();
  const { data: customers, error } = await supabase
    .from("users")
    .select("id, name, email, profile_image_url")
    .eq("role", "customer")
    .order("name");
  if (error) throw error;

  const ids = (customers ?? []).map((c) => c.id);
  const { data: rankings } = await supabase
    .from("user_rankings")
    .select("user_id, total_points")
    .in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);

  const map = new Map((rankings ?? []).map((r) => [r.user_id, r.total_points]));

  return (customers ?? [])
    .map((c) => ({
      ...c,
      total_points: map.get(c.id) ?? 0,
    }))
    .sort((a, b) => b.total_points - a.total_points);
}

export async function getTalentProfile(userId: string) {
  const supabase = await createClient();
  const { data: user } = await supabase
    .from("users")
    .select("id, name, email, profile_image_url")
    .eq("id", userId)
    .maybeSingle();
  const { data: rank } = await supabase
    .from("user_rankings")
    .select("total_points")
    .eq("user_id", userId)
    .maybeSingle();
  return { user, points: rank?.total_points ?? 0 };
}

export async function listBookings(ownerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("talent_bookings")
    .select("*, talent:users!talent_bookings_talent_user_id_fkey(name, email)")
    .eq("owner_id", ownerId)
    .order("event_at", { ascending: false });
  if (error) {
    const fallback = await supabase
      .from("talent_bookings")
      .select("*")
      .eq("owner_id", ownerId)
      .order("event_at", { ascending: false });
    return fallback.data ?? [];
  }
  return data ?? [];
}

export async function createBooking(params: {
  ownerId: string;
  venueId: string;
  talentUserId: string;
  amount: number;
  eventAt: string;
  note?: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("talent_bookings")
    .insert({
      owner_id: params.ownerId,
      venue_id: params.venueId,
      talent_user_id: params.talentUserId,
      amount: params.amount,
      event_at: params.eventAt,
      note: params.note ?? "",
      status: "pending",
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function listPromotions(ownerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("venue_promotions")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function upsertPromotion(params: {
  id?: string;
  ownerId: string;
  venueId: string;
  title: string;
  description: string;
  status: string;
  detail?: string;
}) {
  const supabase = await createClient();
  const payload = {
    owner_id: params.ownerId,
    venue_id: params.venueId,
    title: params.title,
    description: params.description,
    status: params.status,
    detail: params.detail ?? "",
    updated_at: new Date().toISOString(),
  };
  if (params.id) {
    const { error } = await supabase.from("venue_promotions").update(payload).eq("id", params.id);
    if (error) throw error;
    return params.id;
  }
  const { data, error } = await supabase.from("venue_promotions").insert(payload).select("id").single();
  if (error) throw error;
  return data.id as string;
}

export async function getHomeStats(ownerId: string, venueId: string | null) {
  const supabase = await createClient();
  const [bookings, promotions, checkIns, events] = await Promise.all([
    supabase.from("talent_bookings").select("id", { count: "exact", head: true }).eq("owner_id", ownerId),
    supabase.from("venue_promotions").select("id", { count: "exact", head: true }).eq("owner_id", ownerId),
    venueId
      ? supabase.from("check_ins").select("id", { count: "exact", head: true }).eq("venue_id", venueId)
      : Promise.resolve({ count: 0 }),
    venueId
      ? supabase.from("events").select("id", { count: "exact", head: true }).eq("venue_id", venueId)
      : Promise.resolve({ count: 0 }),
  ]);
  return {
    bookings: bookings.count ?? 0,
    promotions: promotions.count ?? 0,
    checkIns: checkIns.count ?? 0,
    events: events.count ?? 0,
  };
}
