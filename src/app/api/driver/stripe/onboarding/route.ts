import { NextResponse } from "next/server";
import { requireDriver } from "@/lib/auth/require-driver";
import { getOwnerCompany } from "@/lib/data/driver-companies";
import { createDriverStripeOnboardingLink } from "@/lib/stripe/connect";

function redirectToCompany(request: Request, error?: string) {
  const url = new URL("/driver/company", request.url);
  if (error) url.searchParams.set("stripe_error", error);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const auth = await requireDriver(request);
  if (auth.error) return redirectToCompany(request, "Sign in as a driver first.");

  const company = await getOwnerCompany(auth.user!.id, auth.supabase);
  if (!company) return redirectToCompany(request, "Create your company profile first.");

  try {
    const url = await createDriverStripeOnboardingLink({
      userId: auth.user!.id,
      email: auth.user!.email,
      accountName: company.company_name,
    });
    return NextResponse.redirect(url);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not start Stripe onboarding.";
    return redirectToCompany(request, message);
  }
}
