import { NextResponse } from "next/server";
import { requireDriver } from "@/lib/auth/require-driver";
import { createDriverStripeDashboardLink } from "@/lib/stripe/connect";

function redirectToCompany(request: Request, error?: string) {
  const url = new URL("/driver/company", request.url);
  if (error) url.searchParams.set("stripe_error", error);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const auth = await requireDriver(request);
  if (auth.error) return redirectToCompany(request, "Sign in as a driver first.");

  try {
    const url = await createDriverStripeDashboardLink(auth.user!.id);
    return NextResponse.redirect(url);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not open Stripe dashboard.";
    return redirectToCompany(request, message);
  }
}
