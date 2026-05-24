import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient as createCookieClient } from "@/lib/supabase/server";
import { requireSupabasePublicEnv } from "@/lib/supabase/env";
import { resolveUserProfile } from "@/lib/auth/sync-venue-owner-profile";
import { syncDriverProfile } from "@/lib/auth/sync-driver-profile";

function bearerToken(request?: Request): string | null {
  const header = request?.headers.get("authorization");
  if (!header?.toLowerCase().startsWith("bearer ")) return null;
  return header.slice(7).trim();
}

export async function requireDriver(request?: Request) {
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

  if (profile?.role !== "driver") {
    await syncDriverProfile(user, supabase);
    profile = await resolveUserProfile(user, supabase);
  }

  if (profile?.role !== "driver" && user.user_metadata?.role === "driver") {
    profile = {
      role: "driver",
      name: user.user_metadata?.name ?? user.email?.split("@")[0] ?? "User",
      email: user.email ?? "",
    };
  }

  if (profile?.role !== "driver") {
    return { error: "role" as const, user, supabase, profile: profile ?? null };
  }

  return { error: null, user, profile, supabase };
}

export async function getOwnerDriverCompany(
  userId: string,
  supabase?: SupabaseClient,
) {
  const client = supabase ?? (await createCookieClient());
  const { data } = await client
    .from("driver_companies")
    .select("*")
    .eq("owner_id", userId)
    .limit(1)
    .maybeSingle();
  return data;
}
