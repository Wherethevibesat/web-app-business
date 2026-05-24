import { createAdminClient } from "@/lib/supabase/admin";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

export async function sendDriverListingSubmittedNotifications(companyId: string) {
  const admin = createAdminClient();
  const { data: company } = await admin
    .from("driver_companies")
    .select("company_name, city, contact_email, owner:users!driver_companies_owner_id_fkey(name, email)")
    .eq("id", companyId)
    .maybeSingle();
  if (!company) return;

  const owner = Array.isArray(company.owner) ? company.owner[0] : company.owner;
  const ownerEmail = (owner as { email: string } | null)?.email ?? (company.contact_email as string | null);
  const ownerName = (owner as { name: string } | null)?.name ?? "";
  if (!ownerEmail) return;

  const { data: admins } = await admin.from("users").select("email").eq("role", "admin");

  const {
    notifyAdminsDriverListingSubmitted,
    notifyDriverListingSubmitted,
  } = await import("@/lib/email/driver-notifications");

  notifyAdminsDriverListingSubmitted({
    adminEmails: (admins ?? []).map((a) => a.email as string).filter(Boolean),
    companyName: company.company_name as string,
    ownerName,
    ownerEmail,
    city: company.city as string | null,
  });

  notifyDriverListingSubmitted({
    ownerEmail,
    ownerName,
    companyName: company.company_name as string,
  });
}

export async function sendDriverBookingResponseNotifications(
  bookingId: string,
  action: "accept" | "decline",
  driverNotes: string,
) {
  const admin = createAdminClient();
  const { data: booking } = await admin
    .from("driver_bookings")
    .select(
      "scheduled_starts_at, customer:users!driver_bookings_customer_id_fkey(name, email), company:driver_companies(company_name), package:driver_vehicle_packages(label)",
    )
    .eq("id", bookingId)
    .maybeSingle();
  if (!booking) return;

  const customer = Array.isArray(booking.customer) ? booking.customer[0] : booking.customer;
  const company = Array.isArray(booking.company) ? booking.company[0] : booking.company;
  const pkg = Array.isArray(booking.package) ? booking.package[0] : booking.package;
  const customerEmail = (customer as { email: string } | null)?.email;
  if (!customerEmail) return;

  const { notifyCustomerBookingResponse } = await import("@/lib/email/driver-notifications");

  notifyCustomerBookingResponse({
    customerEmail,
    customerName: (customer as { name: string } | null)?.name ?? "",
    companyName: (company as { company_name: string } | null)?.company_name ?? "Driver",
    packageLabel: (pkg as { label: string } | null)?.label ?? "Ride",
    scheduledAt: formatDateTime(booking.scheduled_starts_at as string),
    accepted: action === "accept",
    driverNotes,
  });
}
