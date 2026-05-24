import { adminPortalUrl, businessPortalUrl, customerPortalUrl, sendEmailSafe } from "@/lib/email/send";

function layout(title: string, body: string) {
  return `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111;max-width:560px;margin:0 auto;padding:24px">
<h1 style="font-size:20px;margin:0 0 16px">${title}</h1>
${body}
<p style="margin-top:32px;font-size:12px;color:#666">Where The Vibes At · wherethevibesat.com</p>
</body></html>`;
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

export function notifyAdminsDriverListingSubmitted(params: {
  adminEmails: string[];
  companyName: string;
  ownerName: string;
  ownerEmail: string;
  city?: string | null;
}) {
  if (params.adminEmails.length === 0) return;

  const body = `<p><strong>${params.companyName}</strong> submitted a driver listing for review.</p>
<ul>
<li>Owner: ${params.ownerName} (${params.ownerEmail})</li>
${params.city ? `<li>City: ${params.city}</li>` : ""}
</ul>
<p><a href="${adminPortalUrl("/submissions?tab=drivers")}" style="display:inline-block;margin-top:12px;padding:10px 16px;background:#111;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">Review in admin</a></p>`;

  sendEmailSafe({
    to: params.adminEmails,
    subject: `Driver listing pending: ${params.companyName}`,
    html: layout("Admin notification", body),
    text: `${params.companyName} (${params.ownerEmail}) submitted a driver listing. Review: ${adminPortalUrl("/submissions?tab=drivers")}`,
  });
}

export function notifyDriverListingSubmitted(params: {
  ownerEmail: string;
  ownerName: string;
  companyName: string;
}) {
  const body = `<p>We received your listing for <strong>${params.companyName}</strong>.</p>
<p>Our team will review it and notify you when it goes live on WTVA.</p>
<p><a href="${businessPortalUrl("/driver")}" style="display:inline-block;margin-top:12px;padding:10px 16px;background:#111;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">Open driver portal</a></p>`;

  sendEmailSafe({
    to: params.ownerEmail,
    subject: `Listing submitted: ${params.companyName}`,
    html: layout(`Hi ${params.ownerName || "there"},`, body),
    text: `Your driver listing for ${params.companyName} was submitted for review. Portal: ${businessPortalUrl("/driver")}`,
  });
}

export function notifyDriverNewBooking(params: {
  driverEmail: string;
  driverName: string;
  companyName: string;
  customerName: string;
  customerEmail: string;
  packageLabel: string;
  vehicleName: string;
  pickupAddress: string;
  dropoffAddress?: string | null;
  scheduledAt: string;
  priceCents: number;
}) {
  const body = `<p>You have a new paid booking request for <strong>${params.companyName}</strong>.</p>
<ul>
<li>Customer: ${params.customerName} (<a href="mailto:${params.customerEmail}">${params.customerEmail}</a>)</li>
<li>Package: ${params.packageLabel} · ${params.vehicleName}</li>
<li>Pickup: ${params.pickupAddress}</li>
${params.dropoffAddress ? `<li>Drop-off: ${params.dropoffAddress}</li>` : ""}
<li>Scheduled: ${params.scheduledAt}</li>
<li>Total: ${formatPrice(params.priceCents)}</li>
</ul>
<p>Accept or decline in your driver portal.</p>
<p><a href="${businessPortalUrl("/driver/bookings")}" style="display:inline-block;margin-top:12px;padding:10px 16px;background:#111;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">View bookings</a></p>`;

  sendEmailSafe({
    to: params.driverEmail,
    subject: `New booking request: ${params.customerName}`,
    html: layout(`Hi ${params.driverName || "there"},`, body),
    text: `New booking from ${params.customerName} for ${params.packageLabel} on ${params.scheduledAt}. Accept/decline: ${businessPortalUrl("/driver/bookings")}`,
  });
}

export function notifyCustomerBookingResponse(params: {
  customerEmail: string;
  customerName: string;
  companyName: string;
  packageLabel: string;
  scheduledAt: string;
  accepted: boolean;
  driverNotes?: string | null;
}) {
  const statusLabel = params.accepted ? "Accepted" : "Declined";
  let body = `<p>Your ride request with <strong>${params.companyName}</strong> (${params.packageLabel}, ${params.scheduledAt}) was <strong>${statusLabel.toLowerCase()}</strong>.</p>`;
  if (params.driverNotes?.trim()) {
    body += `<p>Message from driver: ${params.driverNotes.trim()}</p>`;
  }
  if (params.accepted) {
    body += `<p>The driver will contact you with pickup details.</p>`;
  }
  body += `<p><a href="${customerPortalUrl("/account")}" style="display:inline-block;margin-top:12px;padding:10px 16px;background:#111;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">View account</a></p>`;

  sendEmailSafe({
    to: params.customerEmail,
    subject: `Booking ${statusLabel.toLowerCase()}: ${params.companyName}`,
    html: layout(`Hi ${params.customerName || "there"},`, body),
    text: `Your booking with ${params.companyName} was ${statusLabel.toLowerCase()}.${params.driverNotes ? ` Note: ${params.driverNotes}` : ""}`,
  });
}
