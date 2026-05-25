import { NextResponse } from "next/server";
import { requireVenueOwner } from "@/lib/auth/require-venue-owner";
import { getOwnerVenueById } from "@/lib/data/venues";
import { createVenueOwnerStripeOnboardingLink } from "@/lib/stripe/connect";

function redirectToVenue(request: Request, venueId?: string, error?: string) {
  const path = venueId ? `/venues/${venueId}/edit` : "/venues";
  const url = new URL(path, request.url);
  if (error) url.searchParams.set("stripe_error", error);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const auth = await requireVenueOwner(request);
  if (auth.error) return redirectToVenue(request, undefined, "Sign in as a venue owner first.");

  const url = new URL(request.url);
  const venueId = url.searchParams.get("venueId");
  if (!venueId) return redirectToVenue(request, undefined, "venueId is required.");

  const venue = await getOwnerVenueById(auth.user!.id, venueId, auth.supabase);
  if (!venue) return redirectToVenue(request, undefined, "Venue not found.");

  try {
    const onboardingUrl = await createVenueOwnerStripeOnboardingLink({
      userId: auth.user!.id,
      email: auth.user!.email,
      accountName: venue.name,
      venueId,
    });
    return NextResponse.redirect(onboardingUrl);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not start Stripe onboarding.";
    return redirectToVenue(request, venueId, message);
  }
}
