import { NextResponse } from "next/server";
import { syncVenueOwnerProfile } from "@/lib/auth/sync-venue-owner-profile";
import { syncDriverProfile } from "@/lib/auth/sync-driver-profile";
import { syncPromoterProfile } from "@/lib/auth/sync-promoter-profile";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const preferredRole =
    typeof body.role === "string" ? body.role : (user.user_metadata?.role as string | undefined);

  const synced =
    preferredRole === "driver"
      ? await syncDriverProfile(user, supabase)
      : preferredRole === "promoter"
        ? await syncPromoterProfile(user, supabase)
        : await syncVenueOwnerProfile(user, supabase);

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
