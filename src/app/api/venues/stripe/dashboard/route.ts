import { NextResponse } from "next/server";
import { requireVenueOwner } from "@/lib/auth/require-venue-owner";
import { createVenueOwnerStripeDashboardLink } from "@/lib/stripe/connect";

function redirectToVenue(request: Request, venueId?: string, error?: string) {
  const path = venueId ? `/venues/${venueId}/edit` : "/venues";
  const url = new URL(path, request.url);
  if (error) url.searchParams.set("stripe_error", error);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const auth = await requireVenueOwner(request);
  const url = new URL(request.url);
  const venueId = url.searchParams.get("venueId") ?? undefined;

  if (auth.error) return redirectToVenue(request, venueId, "Sign in as a venue owner first.");

  try {
    const dashboardUrl = await createVenueOwnerStripeDashboardLink(auth.user!.id);
    return NextResponse.redirect(dashboardUrl);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not open Stripe dashboard.";
    return redirectToVenue(request, venueId, message);
  }
}
