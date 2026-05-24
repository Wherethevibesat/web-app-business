import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  listPendingPromoterEventsForVenueOwner,
  reviewPromoterEventForVenueOwner,
  getPromoterEventForEmail,
} from "@/lib/data/promoter-events";
import { notifyPromoterEventReview } from "@/lib/email/promoter-notifications";

async function requireVenueOwner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "auth" as const, user: null, supabase };

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "venueOwner" && profile?.role !== "admin") {
    return { error: "role" as const, user, supabase };
  }
  return { error: null, user, supabase };
}

export async function GET() {
  const auth = await requireVenueOwner();
  if (auth.error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const events = await listPendingPromoterEventsForVenueOwner(
    auth.user!.id,
    auth.supabase,
  ).catch(() => []);
  return NextResponse.json({ events });
}

export async function PATCH(request: Request) {
  const auth = await requireVenueOwner();
  if (auth.error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { eventId, approval, publish } = await request.json();
  if (!eventId || (approval !== "approved" && approval !== "rejected")) {
    return NextResponse.json(
      { error: "eventId and approval (approved|rejected) are required" },
      { status: 400 },
    );
  }

  try {
    const eventInfo = await getPromoterEventForEmail(eventId);
    await reviewPromoterEventForVenueOwner(
      eventId,
      auth.user!.id,
      approval,
      publish !== false,
      auth.supabase,
    );
    if (eventInfo?.promoterEmail) {
      notifyPromoterEventReview({
        promoterEmail: eventInfo.promoterEmail,
        promoterName: eventInfo.promoterName,
        eventTitle: eventInfo.eventTitle,
        venueName: eventInfo.venueName,
        approved: approval === "approved",
      });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to review event" },
      { status: 400 },
    );
  }
}
