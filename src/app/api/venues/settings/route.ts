import { NextResponse } from "next/server";
import { getPlatformSettings } from "@/lib/data/platform-settings";
import { getPublishableKey } from "@/lib/stripe/server";

export async function GET() {
  const settings = await getPlatformSettings();
  const publishableKey = await getPublishableKey();
  return NextResponse.json({ settings, publishableKey });
}
