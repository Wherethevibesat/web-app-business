import { NextResponse } from "next/server";
import { requireVenueOwner } from "@/lib/auth/require-venue-owner";

export async function POST(request: Request) {
  const auth = await requireVenueOwner();
  if (auth.error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code } = await request.json();
  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Enter a code" }, { status: 400 });
  }

  const { data, error } = await auth.supabase.rpc("validate_redemption", {
    p_code: code.trim(),
  });
  if (error) {
    return NextResponse.json({ error: error.message || "Invalid code" }, { status: 400 });
  }
  return NextResponse.json(data);
}
