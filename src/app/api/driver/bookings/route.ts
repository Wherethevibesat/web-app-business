import { NextResponse } from "next/server";
import { requireDriver, getOwnerDriverCompany } from "@/lib/auth/require-driver";
import { listCompanyBookings, respondToBooking } from "@/lib/data/driver-bookings";

export async function GET(request: Request) {
  const auth = await requireDriver(request);
  if (auth.error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const company = await getOwnerDriverCompany(auth.user!.id, auth.supabase);
  if (!company) return NextResponse.json({ bookings: [] });

  const bookings = await listCompanyBookings(company.id as string, auth.supabase);
  return NextResponse.json({ bookings });
}

export async function PATCH(request: Request) {
  const auth = await requireDriver(request);
  if (auth.error) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const company = await getOwnerDriverCompany(auth.user!.id, auth.supabase);
  if (!company) return NextResponse.json({ error: "No company" }, { status: 404 });

  const { bookingId, action, driverNotes } = await request.json();
  if (!bookingId || (action !== "accept" && action !== "decline")) {
    return NextResponse.json({ error: "bookingId and action required" }, { status: 400 });
  }

  try {
    await respondToBooking(
      bookingId,
      company.id as string,
      action,
      typeof driverNotes === "string" ? driverNotes : "",
      auth.supabase,
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update booking" },
      { status: 500 },
    );
  }
}
