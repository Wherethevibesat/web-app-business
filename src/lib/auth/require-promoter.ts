import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient as createCookieClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSupabasePublicEnv } from "@/lib/supabase/env";
import { resolveUserProfile } from "@/lib/auth/sync-venue-owner-profile";
import { syncPromoterProfile } from "@/lib/auth/sync-promoter-profile";

function bearerToken(request?: Request): string | null {
  const header = request?.headers.get("authorization");
  if (!header?.toLowerCase().startsWith("bearer ")) return null;
  return header.slice(7).trim();
}

export async function requirePromoter(request?: Request) {
  const token = bearerToken(request);
  const { url, anonKey } = requireSupabasePublicEnv();

  const supabase: SupabaseClient = token
    ? createSupabaseClient(url, anonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      })
    : await createCookieClient();

  const { data: { user } } = token
    ? await supabase.auth.getUser(token)
    : await supabase.auth.getUser();

  if (!user) return { error: "auth" as const, user: null, supabase, profile: null };

  let profile = await resolveUserProfile(user, supabase);

  if (profile?.role !== "promoter") {
    await syncPromoterProfile(user, supabase);
    profile = await resolveUserProfile(user, supabase);
  }

  if (profile?.role !== "promoter" && user.user_metadata?.role === "promoter") {
    profile = {
      role: "promoter",
      name: user.user_metadata?.name ?? user.email?.split("@")[0] ?? "User",
      email: user.email ?? "",
    };
  }

  if (profile?.role !== "promoter") {
    return { error: "role" as const, user, supabase, profile: profile ?? null };
  }

  return { error: null, user, profile, supabase };
}

export async function hasApprovedVenueLink(
  promoterId: string,
  venueId: string,
  _supabase: SupabaseClient,
) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("promoter_venue_links")
    .select("id")
    .eq("promoter_id", promoterId)
    .eq("venue_id", venueId)
    .eq("status", "approved")
    .maybeSingle();
  return !!data;
}
