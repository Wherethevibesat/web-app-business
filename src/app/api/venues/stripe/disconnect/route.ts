import { NextResponse } from "next/server";
import { requireVenueOwner } from "@/lib/auth/require-venue-owner";
import { disconnectStripeAccount } from "@/lib/stripe/connect";

export async function POST(request: Request) {
  const auth = await requireVenueOwner(request);
  if (auth.error === "auth") {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  if (auth.error === "role") {
    return NextResponse.json({ error: "Venue owner required" }, { status: 403 });
  }

  try {
    const result = await disconnectStripeAccount(auth.user!.id);
    return NextResponse.json({
      ok: true,
      disconnected: result.disconnected,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not disconnect Stripe.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
