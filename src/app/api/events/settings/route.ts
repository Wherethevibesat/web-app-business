import { NextResponse } from "next/server";
import { getPlatformSettings } from "@/lib/data/platform-settings";
import { getPublishableKey } from "@/lib/stripe/server";
import { requireVenueOwner } from "@/lib/auth/require-venue-owner";

export async function GET(request: Request) {
  const auth = await requireVenueOwner(request);
  if (auth.error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [settings, publishableKey] = await Promise.all([
    getPlatformSettings(),
    getPublishableKey(),
  ]);

  return NextResponse.json({ settings, publishableKey });
}
