import { NextResponse } from "next/server";
import { requirePromoter } from "@/lib/auth/require-promoter";
import { listApprovedVenueIds } from "@/lib/data/promoter-venues";
import {
  createPromoterEvent,
  listEventsForPromoter,
  sendPromoterEventRequestNotifications,
} from "@/lib/data/promoter-events";

export async function GET(request: Request) {
  const auth = await requirePromoter(request);
  if (auth.error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const venueIds = await listApprovedVenueIds(auth.user!.id, auth.supabase);
  const events = await listEventsForPromoter(auth.user!.id, venueIds, auth.supabase);
  return NextResponse.json({ events, approvedVenueIds: venueIds });
}

export async function POST(request: Request) {
  const auth = await requirePromoter(request);
  if (auth.error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const venueIds = await listApprovedVenueIds(auth.user!.id, auth.supabase);
  if (!venueIds.includes(body.venue_id)) {
    return NextResponse.json({ error: "Venue not approved for your account" }, { status: 403 });
  }

  try {
    const id = await createPromoterEvent(auth.user!.id, body, auth.supabase);
    void sendPromoterEventRequestNotifications(id, auth.user!.id).catch((err) =>
      console.error("[email] promoter event request notifications failed:", err),
    );
    return NextResponse.json({ id });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 },
    );
  }
}
