import { NextResponse } from "next/server";
import { requireVenueOwner } from "@/lib/auth/require-venue-owner";
import { createBooking } from "@/lib/data/business";

export async function POST(request: Request) {
  const auth = await requireVenueOwner();
  if (auth.error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  try {
    const id = await createBooking({
      ownerId: auth.user!.id,
      venueId: body.venueId,
      talentUserId: body.talentUserId,
      amount: body.amount,
      eventAt: body.eventAt,
      note: body.note,
    });
    return NextResponse.json({ id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 },
    );
  }
}
