import { NextResponse } from "next/server";
import { getPlatformSettings } from "@/lib/data/platform-settings";
import { getOwnerVenue, requireVenueOwner } from "@/lib/auth/require-venue-owner";
import { getStripe } from "@/lib/stripe/server";

export async function POST(request: Request) {
  const auth = await requireVenueOwner(request);
  if (auth.error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const venue = await getOwnerVenue(auth.user!.id, auth.supabase);
  if (!venue) return NextResponse.json({ error: "No venue linked" }, { status: 400 });

  const settings = await getPlatformSettings();
  const fee = settings.event_submission_fee;
  if (fee <= 0) {
    return NextResponse.json({ error: "Event posting is currently free." }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(fee * 100),
      currency: "usd",
      metadata: {
        type: "event_submission",
        user_id: auth.user!.id,
        venue_id: venue.id as string,
      },
      automatic_payment_methods: { enabled: true },
    });

    return NextResponse.json({
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      fee,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not start payment" },
      { status: 500 },
    );
  }
}
