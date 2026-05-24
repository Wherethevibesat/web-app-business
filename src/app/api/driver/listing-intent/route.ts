import { NextResponse } from "next/server";
import { getPlatformSettings } from "@/lib/data/platform-settings";
import { requireDriver, getOwnerDriverCompany } from "@/lib/auth/require-driver";
import { getStripe } from "@/lib/stripe/server";

export async function POST(request: Request) {
  const auth = await requireDriver(request);
  if (auth.error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const company = await getOwnerDriverCompany(auth.user!.id, auth.supabase);
  if (!company) return NextResponse.json({ error: "Create your company profile first" }, { status: 400 });

  const settings = await getPlatformSettings();
  const fee = settings.driver_listing_fee;
  if (fee <= 0) {
    return NextResponse.json({ error: "Listing is currently free — submit without payment." }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(fee * 100),
      currency: "usd",
      metadata: {
        type: "driver_listing",
        user_id: auth.user!.id,
        company_id: company.id as string,
      },
      automatic_payment_methods: { enabled: true },
    });

    return NextResponse.json({
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      fee,
      months: settings.driver_listing_months,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not start payment" },
      { status: 500 },
    );
  }
}
