import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

export async function syncPromoterProfile(user: User, supabase: SupabaseClient) {
  const role = user.user_metadata?.role as string | undefined;
  if (role !== "promoter") return;

  const name = (user.user_metadata?.name as string) || user.email?.split("@")[0] || "Promoter";
  const email = user.email ?? "";

  const { error: rpcError } = await supabase.rpc("claim_promoter_role");
  if (!rpcError) return;

  const admin = createAdminClient();
  await admin.from("users").upsert(
    {
      id: user.id,
      email,
      name,
      role: "promoter",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  await admin.from("promoter_profiles").upsert(
    {
      user_id: user.id,
      display_name: name,
      contact_email: email,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
}
