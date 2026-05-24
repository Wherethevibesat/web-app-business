import { NextResponse } from "next/server";
import { syncVenueOwnerProfile } from "@/lib/auth/sync-venue-owner-profile";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const synced = await syncVenueOwnerProfile(user, supabase);

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  return NextResponse.json({
    synced,
    role: profile?.role ?? null,
  });
}
