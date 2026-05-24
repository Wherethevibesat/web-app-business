import Link from "next/link";
import { requirePromoter } from "@/lib/auth/require-promoter";
import { getPromoterProfile, profileNeedsSetup } from "@/lib/data/promoter-profile";
import { listPromoterVenueLinks } from "@/lib/data/promoter-venues";
import { listPromoterInquiries, listPromoterProfileInquiries } from "@/lib/data/promoter-inquiries";
import { PromoterProfileShare } from "@/components/promoter/promoter-profile-share";

export default async function PromoterHomePage() {
  const auth = await requirePromoter();
  if (auth.error) return null;

  const [profile, links, inquiries, profileInquiries] = await Promise.all([
    getPromoterProfile(auth.user!.id, auth.supabase).catch(() => null),
    listPromoterVenueLinks(auth.user!.id, auth.supabase).catch(() => []),
    listPromoterInquiries(auth.user!.id, auth.supabase).catch(() => []),
    listPromoterProfileInquiries(auth.user!.id, auth.supabase).catch(() => []),
  ]);

  const approved = links.filter((l) => l.status === "approved").length;
  const pending = links.filter((l) => l.status === "pending").length;
  const pendingInquiries =
    inquiries.filter((i) => i.status === "pending").length +
    profileInquiries.filter((i) => i.status === "pending").length;
  const needsSetup = profileNeedsSetup(profile);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold">Promoter dashboard</h1>
      <p className="mt-1 text-sm text-wtva-muted">
        Sell tables and VIP sections for events at your linked venues.
      </p>

      {needsSetup && (
        <p className="mt-6 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          Set up your{" "}
          <Link href="/promoter/profile?setup=1" className="font-semibold underline">
            public profile
          </Link>{" "}
          (photo, bio, share link) so customers can find you.
        </p>
      )}

      {!needsSetup && profile && (
        <div className="mt-6">
          <PromoterProfileShare profile={profile} />
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-wtva-dark-300 bg-wtva-card p-5">
          <p className="text-sm text-wtva-muted">Approved venues</p>
          <p className="text-2xl font-bold">{approved}</p>
          {pending > 0 && (
            <p className="text-xs text-amber-400">{pending} pending approval</p>
          )}
        </div>
        <div className="rounded-xl border border-wtva-dark-300 bg-wtva-card p-5">
          <p className="text-sm text-wtva-muted">Pending inquiries</p>
          <p className="text-2xl font-bold">{pendingInquiries}</p>
        </div>
        <div className="rounded-xl border border-wtva-dark-300 bg-wtva-card p-5">
          <p className="text-sm text-wtva-muted">Total leads</p>
          <p className="text-2xl font-bold">{inquiries.length + profileInquiries.length}</p>
        </div>
      </div>

      {approved === 0 && (
        <p className="mt-6 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          Request venue access to start. A venue owner or admin must approve you first.
        </p>
      )}

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <Link
          href="/promoter/profile"
          className="rounded-xl border border-wtva-dark-300 bg-wtva-card p-5 hover:border-foreground"
        >
          Edit public profile
        </Link>
        <Link
          href="/promoter/venues"
          className="rounded-xl border border-wtva-dark-300 bg-wtva-card p-5 hover:border-foreground"
        >
          Manage venues
        </Link>
        <Link
          href="/promoter/offers/new"
          className="rounded-xl border border-wtva-dark-300 bg-wtva-card p-5 hover:border-foreground"
        >
          Create offer
        </Link>
        <Link
          href="/promoter/inbox"
          className="rounded-xl border border-wtva-dark-300 bg-wtva-card p-5 hover:border-foreground"
        >
          Customer inbox
        </Link>
      </div>
    </div>
  );
}
