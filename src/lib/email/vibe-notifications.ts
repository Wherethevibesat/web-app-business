import { customerPortalUrl, sendEmailSafe } from "@/lib/email/send";

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

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function notifyGuestVibeAwaitingPayment(params: {
  toEmail: string;
  guestName: string;
  packageTitle: string;
  totalCents: number;
  payUrl: string;
}) {
  const amount = formatPrice(params.totalCents);
  const title = escapeHtml(params.packageTitle);
  const body = `<p>Great news — every place confirmed <strong>${title}</strong>.</p>
<p>Pay <strong>${amount}</strong> to lock in your vibe.</p>
<p><a href="${params.payUrl}" style="display:inline-block;margin-top:12px;padding:12px 18px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:999px;font-weight:700">Pay now</a></p>`;

  sendEmailSafe({
    to: params.toEmail,
    subject: `Venues confirmed — pay for ${params.packageTitle}`,
    html: layout(`Hi ${escapeHtml(params.guestName || "there")},`, body),
    text: `Every place confirmed ${params.packageTitle}. Pay ${amount}: ${params.payUrl}`,
  });
}

export function notifyGuestVibeRequestDeclined(params: {
  toEmail: string;
  guestName: string;
  packageTitle: string;
  venueName: string;
}) {
  const body = `<p><strong>${escapeHtml(params.venueName)}</strong> couldn't confirm a stop on <strong>${escapeHtml(params.packageTitle)}</strong>.</p>
<p>Your booking request was cancelled. You can build a new vibe anytime.</p>
<p><a href="${customerPortalUrl("/packages")}" style="display:inline-block;margin-top:12px;padding:10px 16px;background:#111;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">Browse vibes</a></p>`;

  sendEmailSafe({
    to: params.toEmail,
    subject: `Vibe request cancelled: ${params.packageTitle}`,
    html: layout(`Hi ${escapeHtml(params.guestName || "there")},`, body),
    text: `${params.venueName} declined a stop on ${params.packageTitle}. Your request was cancelled.`,
  });
}
