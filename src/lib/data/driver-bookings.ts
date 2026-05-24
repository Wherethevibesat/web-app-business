import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type { DriverBookingRow } from "@/lib/types/driver";

export async function listCompanyBookings(
  companyId: string,
  supabase: SupabaseClient,
): Promise<DriverBookingRow[]> {
  const { data, error } = await supabase
    .from("driver_bookings")
    .select(
      "*, customer:users!driver_bookings_customer_id_fkey(name, email), vehicle:driver_vehicles(name)",
    )
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (error) {
    const admin = createAdminClient();
    const { data: adminData, error: adminError } = await admin
      .from("driver_bookings")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });
    if (adminError) throw adminError;
    return (adminData ?? []) as DriverBookingRow[];
  }

  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    const customer = Array.isArray(r.customer) ? r.customer[0] : r.customer;
    const vehicle = Array.isArray(r.vehicle) ? r.vehicle[0] : r.vehicle;
    return {
      ...(r as object),
      customer: customer as DriverBookingRow["customer"],
      vehicle: vehicle as DriverBookingRow["vehicle"],
    } as DriverBookingRow;
  });
}

export async function respondToBooking(
  bookingId: string,
  companyId: string,
  action: "accept" | "decline",
  driverNotes: string,
  supabase: SupabaseClient,
): Promise<void> {
  const { data: booking } = await supabase
    .from("driver_bookings")
    .select("id, status")
    .eq("id", bookingId)
    .eq("company_id", companyId)
    .maybeSingle();

  if (!booking) throw new Error("Booking not found");
  if (booking.status !== "pending_driver") {
    throw new Error("This booking can no longer be updated.");
  }

  const now = new Date().toISOString();
  const patch =
    action === "accept"
      ? { status: "accepted", accepted_at: now, driver_notes: driverNotes.trim() }
      : { status: "declined", declined_at: now, driver_notes: driverNotes.trim() };

  const { error } = await supabase
    .from("driver_bookings")
    .update({ ...patch, updated_at: now })
    .eq("id", bookingId)
    .eq("company_id", companyId);

  if (error) {
    const admin = createAdminClient();
    const { error: adminError } = await admin
      .from("driver_bookings")
      .update({ ...patch, updated_at: now })
      .eq("id", bookingId)
      .eq("company_id", companyId);
    if (adminError) throw adminError;
  }
}
