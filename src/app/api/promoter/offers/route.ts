import { NextResponse } from "next/server";
import { requirePromoter } from "@/lib/auth/require-promoter";
import { listApprovedVenueIds } from "@/lib/data/promoter-venues";
import { createPromoterOffer, listPromoterOffers } from "@/lib/data/promoter-offers";

export async function GET(request: Request) {
  const auth = await requirePromoter(request);
  if (auth.error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const offers = await listPromoterOffers(auth.user!.id, auth.supabase);
  const venueIds = await listApprovedVenueIds(auth.user!.id, auth.supabase);
  return NextResponse.json({ offers, approvedVenueIds: venueIds });
}

export async function POST(request: Request) {
  const auth = await requirePromoter(request);
  if (auth.error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const venueIds = await listApprovedVenueIds(auth.user!.id, auth.supabase);
  if (!venueIds.includes(body.venue_id)) {
    return NextResponse.json({ error: "Venue not approved" }, { status: 403 });
  }

  try {
    const id = await createPromoterOffer(auth.user!.id, body, auth.supabase);
    return NextResponse.json({ id });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 },
    );
  }
}
