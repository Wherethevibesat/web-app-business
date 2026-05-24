import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  invitePromoterToVenue,
  listPendingLinksForVenueOwner,
  reviewVenueLink,
  getPromoterVenueLinkById,
} from "@/lib/data/promoter-venues";
import {
  notifyPromoterVenueLink,
  notifyPromoterEventReview,
} from "@/lib/email/promoter-notifications";
import { getPromoterEventForEmail } from "@/lib/data/promoter-events";

async function requireVenueOwner(request?: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "auth" as const, user: null, supabase };

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "venueOwner" && profile?.role !== "admin") {
    return { error: "role" as const, user, supabase };
  }
  return { error: null, user, supabase, role: profile.role as string };
}

export async function GET() {
  const auth = await requireVenueOwner();
  if (auth.error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const links = await listPendingLinksForVenueOwner(auth.user!.id, auth.supabase);
  return NextResponse.json({ links });
}

export async function POST(request: Request) {
  const auth = await requireVenueOwner();
  if (auth.error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email, venueId } = await request.json();
  if (!email || !venueId) {
    return NextResponse.json({ error: "email and venueId are required" }, { status: 400 });
  }

  try {
    const user = await invitePromoterToVenue(
      email,
      venueId,
      auth.user!.id,
      auth.supabase,
    );
    const { data: venue } = await auth.supabase
      .from("venues")
      .select("name")
      .eq("id", venueId)
      .maybeSingle();
    notifyPromoterVenueLink({
      promoterEmail: user.email,
      promoterName: user.name,
      venueName: (venue?.name as string) ?? "your venue",
      approved: true,
    });
    return NextResponse.json({ ok: true, promoter: { id: user.id, name: user.name, email: user.email } });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to add promoter" },
      { status: 400 },
    );
  }
}

export async function PATCH(request: Request) {
  const auth = await requireVenueOwner();
  if (auth.error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { linkId, status, notes } = await request.json();
  if (!linkId || (status !== "approved" && status !== "rejected")) {
    return NextResponse.json({ error: "linkId and status required" }, { status: 400 });
  }

  try {
    const link = await getPromoterVenueLinkById(linkId);
    await reviewVenueLink(
      linkId,
      status,
      auth.user!.id,
      auth.role === "admin" ? "admin" : "venueOwner",
      auth.supabase,
      typeof notes === "string" ? notes : "",
    );
    if (link?.promoterEmail) {
      notifyPromoterVenueLink({
        promoterEmail: link.promoterEmail,
        promoterName: link.promoterName,
        venueName: link.venueName,
        approved: status === "approved",
      });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 },
    );
  }
}
