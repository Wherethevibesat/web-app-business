import { NextResponse } from "next/server";
import { requireVenueOwner } from "@/lib/auth/require-venue-owner";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireVenueOwner(request);
  if (auth.error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const require = Boolean(body.require);

  const payload = { require_check_in_qr: require, updated_at: new Date().toISOString() };

  const { error } = await auth.supabase
    .from("venues")
    .update(payload)
    .eq("id", id)
    .eq("owner_id", auth.user!.id);

  if (error) {
    const admin = createAdminClient();
    const { error: adminError } = await admin
      .from("venues")
      .update(payload)
      .eq("id", id)
      .eq("owner_id", auth.user!.id);
    if (adminError) {
      return NextResponse.json(
        { error: adminError.message || "Failed to update" },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ ok: true, require });
}
