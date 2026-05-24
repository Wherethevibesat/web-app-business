import { NextResponse } from "next/server";
import { getPlatformSettings } from "@/lib/data/platform-settings";
import { requireVenueOwner } from "@/lib/auth/require-venue-owner";
import { getOwnerVenueById } from "@/lib/data/venues";
import { getStripe } from "@/lib/stripe/server";

export async function POST(request: Request) {
  const auth = await requireVenueOwner(request);
  if (auth.error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { venueId } = await request.json().catch(() => ({}));
  if (!venueId || typeof venueId !== "string") {
    return NextResponse.json({ error: "venueId required" }, { status: 400 });
  }

  const venue = await getOwnerVenueById(auth.user!.id, venueId, auth.supabase);
  if (!venue) {
    return NextResponse.json({ error: "Venue not found" }, { status: 404 });
  }

  const settings = await getPlatformSettings();
  const fee = settings.venue_submission_fee;
  if (fee <= 0) {
    return NextResponse.json({ error: "Listing is currently free - submit without payment." }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(fee * 100),
      currency: "usd",
      metadata: {
        type: "venue_listing",
        user_id: auth.user!.id,
        venue_id: venueId,
      },
      automatic_payment_methods: { enabled: true },
    });

    return NextResponse.json({
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      fee,
      months: settings.venue_listing_months,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not start payment" },
      { status: 500 },
    );
  }
}
