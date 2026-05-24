import { requirePromoter } from "@/lib/auth/require-promoter";
import { listPromoterInquiries, listPromoterProfileInquiries } from "@/lib/data/promoter-inquiries";
import { InboxPanel } from "@/components/promoter/inbox-panel";
import { ProfileInboxPanel } from "@/components/promoter/profile-inbox-panel";

export default async function PromoterInboxPage() {
  const auth = await requirePromoter();
  if (auth.error) return null;

  const [inquiries, profileInquiries] = await Promise.all([
    listPromoterInquiries(auth.user!.id, auth.supabase),
    listPromoterProfileInquiries(auth.user!.id, auth.supabase),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">Customer inbox</h1>
      <p className="mt-1 text-sm text-wtva-muted">
        Offer requests and messages from your public profile.
      </p>

      <section className="mt-8">
        <h2 className="text-lg font-bold">Profile messages</h2>
        <p className="text-sm text-wtva-muted">Customers who contact you from your share link.</p>
        <div className="mt-4">
          <ProfileInboxPanel initial={profileInquiries} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-bold">Offer inquiries</h2>
        <p className="text-sm text-wtva-muted">Grouped by event date. Reserved can mean deposit paid.</p>
        <div className="mt-4">
          <InboxPanel initial={inquiries} />
        </div>
      </section>
    </div>
  );
}

