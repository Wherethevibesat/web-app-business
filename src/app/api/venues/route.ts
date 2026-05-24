import { NextResponse } from "next/server";
import { requireVenueOwner } from "@/lib/auth/require-venue-owner";
import { createOwnerVenue, listOwnerVenues } from "@/lib/data/venues";
import { parseOpeningHours } from "@/lib/types/opening-hours";
import type { BusinessVenueFormData } from "@/lib/types/venue";
import { serializeSupabaseError } from "@/lib/supabase/errors";

function parseForm(body: Record<string, unknown>): BusinessVenueFormData {
  return {
    id: typeof body.id === "string" ? body.id : undefined,
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

export async function GET(request: Request) {
  const auth = await requireVenueOwner(request);
  if (auth.error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const venues = await listOwnerVenues(auth.user!.id, auth.supabase);
    return NextResponse.json({ venues });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load venues" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireVenueOwner(request);
  if (auth.error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const form = parseForm(body);
  const validationError = validateForm(form);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  try {
    const id = await createOwnerVenue(auth.user!.id, form, auth.supabase);
    return NextResponse.json({ id });
  } catch (err) {
    console.error("[POST /api/venues]", err);
    return NextResponse.json(
      { error: serializeSupabaseError(err, "Failed to create venue") },
      { status: 500 },
    );
  }
}
