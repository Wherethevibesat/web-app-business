import { NextResponse } from "next/server";
import { requirePromoter } from "@/lib/auth/require-promoter";
import {
  listPromoterVenueLinks,
  listPublishedVenuesForPicker,
  requestVenueLinks,
  sendPromoterLinkRequestNotifications,
} from "@/lib/data/promoter-venues";

export async function GET(request: Request) {
  const auth = await requirePromoter(request);
  if (auth.error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const links = await listPromoterVenueLinks(auth.user!.id, auth.supabase);
  const venues = await listPublishedVenuesForPicker(auth.supabase).catch(() => []);
  return NextResponse.json({ links, venues });
}

export async function POST(request: Request) {
  const auth = await requirePromoter(request);
  if (auth.error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { venueIds } = await request.json();
  if (!Array.isArray(venueIds) || venueIds.length === 0) {
    return NextResponse.json({ error: "venueIds required" }, { status: 400 });
  }

  try {
    const newVenueIds = await requestVenueLinks(auth.user!.id, venueIds, auth.supabase);
    if (newVenueIds.length > 0) {
      await sendPromoterLinkRequestNotifications(auth.user!.id, newVenueIds);
    }
    return NextResponse.json({ ok: true, requested: newVenueIds.length });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 },
    );
  }
}
