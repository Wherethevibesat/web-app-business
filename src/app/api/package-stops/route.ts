import { NextResponse } from "next/server";
import { requireVenueOwner, getOwnerVenue } from "@/lib/auth/require-venue-owner";
import { upsertVenuePackageStop } from "@/lib/data/package-stops";

export async function POST(request: Request) {
  const auth = await requireVenueOwner();
  if (auth.error || !auth.user) {
    return NextResponse.json({ error: auth.error ?? "Unauthorized" }, { status: 401 });
  }
  const venue = await getOwnerVenue(auth.user.id, auth.supabase);
  if (!venue) {
    return NextResponse.json({ error: "Link a venue first" }, { status: 400 });
  }

  const body = await request.json();
  try {
    const id = await upsertVenuePackageStop(auth.supabase, auth.user.id, {
      id: body.id,
      venueId: venue.id as string,
      title: body.title,
      description: body.description,
      slotType: body.slotType,
      priceCents: Number(body.priceCents),
      inclusions: Array.isArray(body.inclusions) ? body.inclusions : String(body.inclusions ?? "")
        .split("\n")
        .map((s: string) => s.trim())
        .filter(Boolean),
      capacity: body.capacity ? Number(body.capacity) : null,
      arrivalWindow: body.arrivalWindow,
      imageUrl: body.imageUrl,
      contractAccepted: Boolean(body.contractAccepted),
      submitForReview: Boolean(body.submitForReview),
    });
    return NextResponse.json({ id });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Save failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
