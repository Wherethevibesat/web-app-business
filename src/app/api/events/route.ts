import { NextResponse } from "next/server";
import { listOwnerEvents, submitOwnerEvents } from "@/lib/data/events";
import { getPlatformSettings } from "@/lib/data/platform-settings";
import {
  assertSubmissionAllowed,
  recordEventSubmissionPayment,
  resolveEventStatus,
  verifyEventSubmissionPayment,
  type EventSubmissionMode,
} from "@/lib/event-submission";
import { getPublishableKey } from "@/lib/stripe/server";
import { getOwnerVenue, requireVenueOwner } from "@/lib/auth/require-venue-owner";
import { serializeSupabaseError } from "@/lib/supabase/errors";

export async function GET(request: Request) {
  const auth = await requireVenueOwner(request);
  if (auth.error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const venue = await getOwnerVenue(auth.user!.id, auth.supabase);
  if (!venue) return NextResponse.json({ error: "No venue linked" }, { status: 400 });

  try {
    const [events, settings] = await Promise.all([
      listOwnerEvents(auth.user!.id, venue.id as string, auth.supabase),
      getPlatformSettings(),
    ]);
    return NextResponse.json({ events, settings });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load events" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireVenueOwner(request);
  if (auth.error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const venue = await getOwnerVenue(auth.user!.id, auth.supabase);
  if (!venue) return NextResponse.json({ error: "No venue linked" }, { status: 400 });

  const body = await request.json();
  const mode = (body.mode === "paid" ? "paid" : "review") as EventSubmissionMode;
  const paymentIntentId = body.paymentIntentId as string | undefined;

  try {
    const settings = await getPlatformSettings();
    const paid = Boolean(paymentIntentId);

    if (paid) {
      await verifyEventSubmissionPayment({
        paymentIntentId: paymentIntentId!,
        userId: auth.user!.id,
        venueId: venue.id as string,
        expectedFee: settings.event_submission_fee,
      });
    }

    assertSubmissionAllowed(settings, mode, paid, {
      stripeConfigured: Boolean(await getPublishableKey()),
    });

    const status = resolveEventStatus(settings, mode, paid);
    const form = {
      id: body.id,
      title: body.title ?? "",
      description: body.description ?? "",
      event_type: body.event_type ?? "Night Party",
      neighborhood: body.neighborhood ?? "",
      starts_at: body.starts_at ?? "",
      ends_at: body.ends_at ?? "",
      image_url: body.image_url ?? "",
      additional_dates: Array.isArray(body.additional_dates) ? body.additional_dates : [],
      recurrence: body.recurrence ?? null,
      ticket_tiers: Array.isArray(body.ticket_tiers) ? body.ticket_tiers : [],
    };

    const ids = await submitOwnerEvents({
      ownerId: auth.user!.id,
      venueId: venue.id as string,
      form,
      status,
      supabase: auth.supabase,
    });

    if (paid && paymentIntentId) {
      await recordEventSubmissionPayment({
        userId: auth.user!.id,
        amount: settings.event_submission_fee,
        paymentIntentId,
        eventIds: ids,
        venueId: venue.id as string,
      });
    }

    return NextResponse.json({ ids, status });
  } catch (err) {
    return NextResponse.json(
      { error: serializeSupabaseError(err, "Failed to save event") },
      { status: 500 },
    );
  }
}
