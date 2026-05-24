import { NextResponse } from "next/server";
import { requireVenueOwner } from "@/lib/auth/require-venue-owner";
import { getOwnerVenueById, updateOwnerVenue } from "@/lib/data/venues";
import { parseOpeningHours } from "@/lib/types/opening-hours";
import type { BusinessVenueFormData } from "@/lib/types/venue";
import { serializeSupabaseError } from "@/lib/supabase/errors";

function parseForm(body: Record<string, unknown>): BusinessVenueFormData {
  return {
    name: typeof body.name === "string" ? body.name : "",
    venue_type: typeof body.venue_type === "string" ? body.venue_type : "",
    address: typeof body.address === "string" ? body.address : "",
    neighborhood: typeof body.neighborhood === "string" ? body.neighborhood : "",
    description: typeof body.description === "string" ? body.description : "",
    image_url: typeof body.image_url === "string" ? body.image_url : "",
    phone: typeof body.phone === "string" ? body.phone : "",
    hours_label: typeof body.hours_label === "string" ? body.hours_label : "",
    opening_hours: parseOpeningHours(body.opening_hours),
    website_url: typeof body.website_url === "string" ? body.website_url : "",
    instagram_url: typeof body.instagram_url === "string" ? body.instagram_url : "",
    facebook_url: typeof body.facebook_url === "string" ? body.facebook_url : "",
    tiktok_url: typeof body.tiktok_url === "string" ? body.tiktok_url : "",
    twitter_url: typeof body.twitter_url === "string" ? body.twitter_url : "",
  };
}

function validateForm(form: BusinessVenueFormData): string | null {
  if (!form.name.trim()) return "Venue name is required";
  if (!form.venue_type.trim()) return "Venue type is required";
  if (!form.neighborhood.trim()) return "Neighborhood is required";
  return null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireVenueOwner(request);
  if (auth.error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const venue = await getOwnerVenueById(auth.user!.id, id, auth.supabase);
    if (!venue) return NextResponse.json({ error: "Venue not found" }, { status: 404 });
    return NextResponse.json({ venue });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load venue" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireVenueOwner(request);
  if (auth.error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const form = parseForm(body);
  const validationError = validateForm(form);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  try {
    const existing = await getOwnerVenueById(auth.user!.id, id, auth.supabase);
    if (!existing) return NextResponse.json({ error: "Venue not found" }, { status: 404 });

    await updateOwnerVenue(auth.user!.id, id, form, auth.supabase);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PATCH /api/venues]", err);
    return NextResponse.json(
      { error: serializeSupabaseError(err, "Failed to update venue") },
      { status: 500 },
    );
  }
}
