import { NextResponse } from "next/server";
import { getPlatformSettings } from "@/lib/data/platform-settings";
import { requireVenueOwner, getOwnerVenue } from "@/lib/auth/require-venue-owner";
import { applyVenueListingPayment, verifyVenueListingPayment } from "@/lib/venue-listing";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const auth = await requireVenueOwner(request);
  if (auth.error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const venue = await getOwnerVenue(auth.user!.id, auth.supabase);
  if (!venue) return NextResponse.json({ error: "No venue linked" }, { status: 404 });

  const { paymentIntentId, mode } = await request.json();
  const settings = await getPlatformSettings();
  const fee = settings.venue_submission_fee;

  try {
    if (fee > 0) {
      if (!paymentIntentId) {
        return NextResponse.json({ error: "Payment required for listing" }, { status: 400 });
      }
      await verifyVenueListingPayment({
        paymentIntentId,
        userId: auth.user!.id,
        venueId: venue.id as string,
        expectedFee: fee,
      });
      await applyVenueListingPayment({
        venueId: venue.id as string,
        userId: auth.user!.id,
        paymentIntentId,
        amount: fee,
        settings,
        autoPublish: settings.auto_approve_venues,
      });
    } else if (mode === "review") {
      const admin = createAdminClient();
      await admin
        .from("venues")
        .update({
          published: settings.auto_approve_venues,
          updated_at: new Date().toISOString(),
        })
        .eq("id", venue.id);
    }

    return NextResponse.json({
      ok: true,
      published: settings.auto_approve_venues && fee <= 0,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Submission failed" },
      { status: 500 },
    );
  }
}
