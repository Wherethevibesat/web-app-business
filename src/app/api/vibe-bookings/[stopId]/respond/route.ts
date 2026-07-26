import { NextResponse } from "next/server";
import { requireVenueOwner } from "@/lib/auth/require-venue-owner";
import { respondToVibeStopRequest } from "@/lib/data/vibe-request-respond";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ stopId: string }> },
) {
  const auth = await requireVenueOwner();
  if (auth.error || !auth.user) {
    return NextResponse.json({ error: auth.error ?? "Unauthorized" }, { status: 401 });
  }

  const { stopId } = await params;
  const body = await request.json().catch(() => ({}));
  const decision = body.decision === "decline" ? "decline" : body.decision === "confirm" ? "confirm" : null;
  if (!decision) {
    return NextResponse.json({ error: "decision must be confirm or decline" }, { status: 400 });
  }

  try {
    const result = await respondToVibeStopRequest({
      stopId,
      venueOwnerId: auth.user.id,
      decision,
    });
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not update request";
    const status =
      msg.includes("authorized") || msg.includes("not found")
        ? 403
        : msg.includes("already") || msg.includes("no longer")
          ? 409
          : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
