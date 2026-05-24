import { customerPortalUrl } from "@/lib/email/send";

export function promoterPublicPath(profile: { user_id: string; slug: string | null }) {
  const segment = profile.slug?.trim() || profile.user_id;
  return `/promoters/${segment}`;
}

export function promoterPublicUrl(profile: { user_id: string; slug: string | null }) {
  return customerPortalUrl(promoterPublicPath(profile));
}
