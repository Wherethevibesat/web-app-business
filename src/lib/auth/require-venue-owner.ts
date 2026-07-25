import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient as createCookieClient } from "@/lib/supabase/server";
import { requireSupabasePublicEnv } from "@/lib/supabase/env";
import {
  profileFromAuthUser,
  resolveUserProfile,
  syncVenueOwnerProfile,
} from "@/lib/auth/sync-venue-owner-profile";
import type { SupabaseClient } from "@supabase/supabase-js";

function bearerToken(request?: Request): string | null {
  const header = request?.headers.get("authorization");
  if (!header?.toLowerCase().startsWith("bearer ")) return null;
  return header.slice(7).trim();
}

/** Venue owners and platform admins can use the business portal. */
export function canAccessBusinessPortal(role: string | null | undefined): boolean {
  return role === "venueOwner" || role === "admin";
}

export async function requireVenueOwner(request?: Request) {
  const token = bearerToken(request);
  const { url, anonKey } = requireSupabasePublicEnv();

  const supabase: SupabaseClient = token
    ? createSupabaseClient(url, anonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      })
    : await createCookieClient();

  const {
    data: { user },
  } = token ? await supabase.auth.getUser(token) : await supabase.auth.getUser();

  if (!user) return { error: "auth" as const, user: null, supabase, profile: null };

  let profile = await resolveUserProfile(user, supabase);

  // Admins keep their role — do not sync/overwrite them to venueOwner.
  if (canAccessBusinessPortal(profile?.role)) {
    return { error: null, user, profile, supabase };
  }

  await syncVenueOwnerProfile(user, supabase);
  profile = await resolveUserProfile(user, supabase);

  if (!canAccessBusinessPortal(profile?.role) && user.user_metadata?.role === "venueOwner") {
    profile = profileFromAuthUser(user);
  }

  if (!canAccessBusinessPortal(profile?.role)) {
    return { error: "role" as const, user, supabase, profile: profile ?? null };
  }

  return { error: null, user, profile, supabase };
}

export async function getOwnerVenue(userId: string, supabase?: SupabaseClient) {
  const client = supabase ?? (await createCookieClient());
  const { data } = await client
    .from("venues")
    .select("*")
    .eq("owner_id", userId)
    .limit(1)
    .maybeSingle();
  return data;
}
