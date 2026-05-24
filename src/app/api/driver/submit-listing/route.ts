import { NextResponse } from "next/server";
import { getPlatformSettings } from "@/lib/data/platform-settings";
import { requireDriver, getOwnerDriverCompany } from "@/lib/auth/require-driver";
import {
  applyDriverListingPayment,
  verifyDriverListingPayment,
} from "@/lib/driver-listing";
export async function POST(request: Request) {
  const auth = await requireDriver(request);
  if (auth.error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const company = await getOwnerDriverCompany(auth.user!.id, auth.supabase);
  if (!company) return NextResponse.json({ error: "No company profile" }, { status: 400 });

  const { paymentIntentId, mode } = await request.json();
  const settings = await getPlatformSettings();
  const fee = settings.driver_listing_fee;

  try {
    if (fee > 0) {
      if (!paymentIntentId) {
        return NextResponse.json({ error: "Payment required for listing" }, { status: 400 });
      }
      await verifyDriverListingPayment({
        paymentIntentId,
        userId: auth.user!.id,
        companyId: company.id as string,
        expectedFee: fee,
      });
      await applyDriverListingPayment({
        companyId: company.id as string,
        userId: auth.user!.id,
        paymentIntentId,
        amount: fee,
        settings,
      });
    } else if (mode === "review") {
      const { createAdminClient } = await import("@/lib/supabase/admin");
      const admin = createAdminClient();
      await admin
        .from("driver_companies")
        .update({
          status: "pending_review",
          published: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", company.id);
    }

    return NextResponse.json({ ok: true, status: "pending_review" });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Submission failed" },
      { status: 500 },
    );
  }
}
