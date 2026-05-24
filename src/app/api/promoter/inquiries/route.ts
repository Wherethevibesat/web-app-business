import { NextResponse } from "next/server";
import { requirePromoter } from "@/lib/auth/require-promoter";
import { listPromoterInquiries, updateInquiryStatus, getInquiryForEmail } from "@/lib/data/promoter-inquiries";
import { notifyCustomerInquiryStatus } from "@/lib/email/promoter-notifications";
import type { PromoterInquiryStatus } from "@/lib/types/promoter";

export async function GET(request: Request) {
  const auth = await requirePromoter(request);
  if (auth.error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const inquiries = await listPromoterInquiries(auth.user!.id, auth.supabase);
  return NextResponse.json({ inquiries });
}

export async function PATCH(request: Request) {
  const auth = await requirePromoter(request);
  if (auth.error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { inquiryId, status, promoterNotes } = await request.json();
  const allowed: PromoterInquiryStatus[] = [
    "pending",
    "reserved",
    "booked",
    "declined",
    "cancelled",
  ];
  if (!inquiryId || !allowed.includes(status)) {
    return NextResponse.json({ error: "inquiryId and status required" }, { status: 400 });
  }

  try {
    await updateInquiryStatus(
      inquiryId,
      auth.user!.id,
      status,
      typeof promoterNotes === "string" ? promoterNotes : "",
      auth.supabase,
    );

    const notifyStatuses = ["reserved", "booked", "declined", "cancelled"];
    if (notifyStatuses.includes(status)) {
      const inquiry = await getInquiryForEmail(inquiryId);
      if (inquiry) {
        notifyCustomerInquiryStatus({
          guestEmail: inquiry.guestEmail,
          guestName: inquiry.guestName,
          status,
          offerName: inquiry.offerName,
          eventTitle: inquiry.eventTitle,
          promoterNotes:
            typeof promoterNotes === "string" ? promoterNotes : inquiry.promoterNotes,
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 },
    );
  }
}
