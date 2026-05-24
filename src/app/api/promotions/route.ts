import { NextResponse } from "next/server";
import { requireVenueOwner, getOwnerVenue } from "@/lib/auth/require-venue-owner";
import { upsertPromotion } from "@/lib/data/business";

export async function POST(request: Request) {
  const auth = await requireVenueOwner();
  if (auth.error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const venue = await getOwnerVenue(auth.user!.id);
  if (!venue) return NextResponse.json({ error: "No venue" }, { status: 400 });

  const body = await request.json();
  try {
    const id = await upsertPromotion({
      id: body.id,
      ownerId: auth.user!.id,
      venueId: venue.id as string,
      title: body.title,
      description: body.description,
      status: body.status,
      detail: body.detail,
    });
    return NextResponse.json({ id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 },
    );
  }
}
