import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveUserProfile } from "@/lib/auth/sync-venue-owner-profile";

function displayName(user: User): string {
  const meta = user.user_metadata?.name;
  if (typeof meta === "string" && meta.trim()) return meta.trim();
  return user.email?.split("@")[0] ?? "User";
}

async function ownsDriverCompany(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("driver_companies")
    .select("id")
    .eq("owner_id", userId)
    .limit(1)
    .maybeSingle();
  return Boolean(data);
}

async function writeDriverRow(client: SupabaseClient, user: User): Promise<boolean> {
  const now = new Date().toISOString();
  const payload = {
    id: user.id,
    email: user.email ?? "",
    name: displayName(user),
    role: "driver" as const,
    updated_at: now,
  };

  const { data: existing } = await client
    .from("users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await client.from("users").update(payload).eq("id", user.id);
    return !error;
  }

  const { error } = await client.from("users").insert({
    ...payload,
    created_at: now,
  });
  return !error;
}

export async function syncDriverProfile(
  user: User,
  supabase?: SupabaseClient,
): Promise<boolean> {
  const metaRole = user.user_metadata?.role;

  if (supabase) {
    const profile = await resolveUserProfile(user, supabase);
    if (profile?.role === "driver") return true;

    const eligible =
      metaRole === "driver" || (await ownsDriverCompany(supabase, user.id));

    if (eligible) {
      const { error: rpcError } = await supabase.rpc("claim_driver_role");
      if (!rpcError) {
        const afterRpc = await resolveUserProfile(user, supabase);
        if (afterRpc?.role === "driver") return true;
      }
      if (await writeDriverRow(supabase, user)) return true;
    }
  }

  try {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role === "driver") return true;

    const { data: company } = await admin
      .from("driver_companies")
      .select("id")
      .eq("owner_id", user.id)
      .limit(1)
      .maybeSingle();

    if (metaRole !== "driver" && !company) return false;

    return writeDriverRow(admin, user);
  } catch {
    return false;
  }
}
