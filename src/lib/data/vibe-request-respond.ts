import { createAdminClient } from "@/lib/supabase/admin";
import {
  notifyGuestVibeAwaitingPayment,
  notifyGuestVibeRequestDeclined,
} from "@/lib/email/vibe-notifications";
import { customerPortalUrl } from "@/lib/email/send";

export async function expireOverdueVibeRequests(): Promise<void> {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { data: expired } = await admin
    .from("night_package_orders")
    .select("id")
    .eq("status", "requested")
    .lt("expires_at", now);

  for (const order of expired ?? []) {
    await admin
      .from("night_package_orders")
      .update({ status: "expired", updated_at: now })
      .eq("id", order.id)
      .eq("status", "requested");
    await admin
      .from("night_package_order_stops")
      .update({ status: "cancelled" })
      .eq("order_id", order.id)
      .eq("status", "pending_venue");
  }
}

export async function respondToVibeStopRequest(params: {
  stopId: string;
  venueOwnerId: string;
  decision: "confirm" | "decline";
}): Promise<{ orderId: string; orderStatus: string }> {
  await expireOverdueVibeRequests();

  const admin = createAdminClient();
  const { data: stop, error: stopError } = await admin
    .from("night_package_order_stops")
    .select(
      `
      id, order_id, venue_id, status, title,
      venue:venues(id, owner_id, name)
    `,
    )
    .eq("id", params.stopId)
    .maybeSingle();

  if (stopError || !stop) throw new Error("Booking request not found");

  const venueRaw = stop.venue as
    | { id: string; owner_id: string; name: string }
    | { id: string; owner_id: string; name: string }[]
    | null;
  const venue = Array.isArray(venueRaw) ? venueRaw[0] : venueRaw;
  if (!venue || venue.owner_id !== params.venueOwnerId) {
    throw new Error("Not authorized for this venue");
  }

  if (stop.status !== "pending_venue") {
    throw new Error("This request was already answered");
  }

  const { data: order } = await admin
    .from("night_package_orders")
    .select(
      "id, status, user_id, guest_email, guest_name, package_id, party_size, starts_on, total_cents, confirmation_code, package:night_packages(title, slug)",
    )
    .eq("id", stop.order_id)
    .maybeSingle();

  if (!order || order.status !== "requested") {
    throw new Error("This booking request is no longer open");
  }

  const now = new Date().toISOString();

  if (params.decision === "decline") {
    await admin
      .from("night_package_order_stops")
      .update({ status: "declined", venue_responded_at: now })
      .eq("id", stop.id);

    await admin
      .from("night_package_order_stops")
      .update({ status: "cancelled" })
      .eq("order_id", order.id)
      .eq("status", "pending_venue");

    await admin
      .from("night_package_orders")
      .update({ status: "cancelled", updated_at: now })
      .eq("id", order.id);

    const pkgTitle =
      order.package && typeof order.package === "object" && !Array.isArray(order.package)
        ? ((order.package as { title?: string }).title ?? "your vibe")
        : "your vibe";

    if (order.guest_email) {
      notifyGuestVibeRequestDeclined({
        toEmail: order.guest_email as string,
        guestName: (order.guest_name as string) || "there",
        packageTitle: pkgTitle,
        venueName: venue.name,
      });
    }

    return { orderId: order.id as string, orderStatus: "cancelled" };
  }

  await admin
    .from("night_package_order_stops")
    .update({ status: "confirmed", venue_responded_at: now })
    .eq("id", stop.id);

  const { data: remaining } = await admin
    .from("night_package_order_stops")
    .select("id, status")
    .eq("order_id", order.id);

  const stillPending = (remaining ?? []).some((s) => s.status === "pending_venue");
  if (stillPending) {
    return { orderId: order.id as string, orderStatus: "requested" };
  }

  const anyDeclined = (remaining ?? []).some((s) => s.status === "declined");
  if (anyDeclined) {
    await admin
      .from("night_package_orders")
      .update({ status: "cancelled", updated_at: now })
      .eq("id", order.id);
    return { orderId: order.id as string, orderStatus: "cancelled" };
  }

  await admin
    .from("night_package_orders")
    .update({ status: "awaiting_payment", updated_at: now, expires_at: null })
    .eq("id", order.id);

  const pkg = order.package as
    | { title?: string; slug?: string | null }
    | { title?: string; slug?: string | null }[]
    | null;
  const pkgRow = Array.isArray(pkg) ? pkg[0] : pkg;
  const packageTitle = pkgRow?.title ?? "your vibe";
  const payPath = `/packages/${pkgRow?.slug || order.package_id}/checkout?orderId=${order.id}`;

  if (order.guest_email) {
    notifyGuestVibeAwaitingPayment({
      toEmail: order.guest_email as string,
      guestName: (order.guest_name as string) || "there",
      packageTitle,
      totalCents: Number(order.total_cents) || 0,
      payUrl: customerPortalUrl(payPath),
    });
  }

  return { orderId: order.id as string, orderStatus: "awaiting_payment" };
}
