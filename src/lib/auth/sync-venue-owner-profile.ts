import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

export type UserProfileRow = {
  role: string;
  name: string;
  email: string;
};

function displayName(user: User): string {
  const meta = user.user_metadata?.name;
  if (typeof meta === "string" && meta.trim()) return meta.trim();
  return user.email?.split("@")[0] ?? "User";
}

export function isEligibleVenueOwner(user: User, dbRole?: string | null): boolean {
  if (dbRole === "venueOwner") return true;
  return user.user_metadata?.role === "venueOwner";
}

async function ownsVenue(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("venues")
    .select("id")
    .eq("owner_id", userId)
    .limit(1)
    .maybeSingle();
  return Boolean(data);
}

async function writeVenueOwnerRow(client: SupabaseClient, user: User): Promise<boolean> {
  const now = new Date().toISOString();
  const payload = {
    id: user.id,
    email: user.email ?? "",
    name: displayName(user),
    role: "venueOwner" as const,
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

async function readProfileAdmin(userId: string): Promise<UserProfileRow | null> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("users")
      .select("role, name, email")
      .eq("id", userId)
      .maybeSingle();
    return data as UserProfileRow | null;
  } catch {
    return null;
  }
}

/** Read profile via session; fall back to service role if session/RLS returns nothing. */
export async function resolveUserProfile(
  user: User,
  supabase: SupabaseClient,
): Promise<UserProfileRow | null> {
  const { data } = await supabase
    .from("users")
    .select("role, name, email")
    .eq("id", user.id)
    .maybeSingle();

  if (data) return data as UserProfileRow;

  return readProfileAdmin(user.id);
}

export async function syncVenueOwnerProfile(
  user: User,
  supabase?: SupabaseClient,
): Promise<boolean> {
  const metaRole = user.user_metadata?.role;

  if (supabase) {
    const profile = await resolveUserProfile(user, supabase);
    if (profile?.role === "venueOwner") return true;

    const eligible =
      metaRole === "venueOwner" || (await ownsVenue(supabase, user.id));

    if (eligible) {
      const { error: rpcError } = await supabase.rpc("claim_venue_owner_role");
      if (!rpcError) {
        const afterRpc = await resolveUserProfile(user, supabase);
        if (afterRpc?.role === "venueOwner") return true;
      }

      if (await writeVenueOwnerRow(supabase, user)) return true;
    }
  }

  try {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role === "venueOwner") return true;

    const { data: venue } = await admin
      .from("venues")
      .select("id")
      .eq("owner_id", user.id)
      .limit(1)
      .maybeSingle();

    if (metaRole !== "venueOwner" && !venue) return false;

    return writeVenueOwnerRow(admin, user);
  } catch {
    return false;
  }
}

export function profileFromAuthUser(user: User): UserProfileRow {
  return {
    role: "venueOwner",
    name: displayName(user),
    email: user.email ?? "",
  };
}
