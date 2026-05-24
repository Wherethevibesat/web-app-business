import Link from "next/link";
import { requirePromoter } from "@/lib/auth/require-promoter";
import { getPromoterProfile, profileNeedsSetup } from "@/lib/data/promoter-profile";
import { PromoterProfileForm } from "@/components/promoter/promoter-profile-form";
import { PromoterProfileShare } from "@/components/promoter/promoter-profile-share";
import { customerPortalUrl } from "@/lib/email/send";

export default async function PromoterProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ setup?: string }>;
}) {
  const auth = await requirePromoter();
  if (auth.error) return null;

  const profile = await getPromoterProfile(auth.user!.id, auth.supabase);
  const { setup } = await searchParams;
  const needsSetup = profileNeedsSetup(profile);
  const customerHint = customerPortalUrl("").replace(/\/$/, "");

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">Public profile</h1>
      <p className="mt-1 text-sm text-wtva-muted">
        This is what customers see when they open your share link.
      </p>

      {(needsSetup || setup === "1") && (
        <p className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          Complete your photo, bio, and profile URL so customers can find and contact you.
          {needsSetup && (
            <>
              {" "}
              <Link href="/promoter/venues" className="underline">
                Link venues
              </Link>{" "}
              when you are ready.
            </>
          )}
        </p>
      )}

      {!needsSetup && profile && (
        <div className="mt-6">
          <PromoterProfileShare profile={profile} />
        </div>
      )}

      <div className="mt-8">
        <PromoterProfileForm
          promoterId={auth.user!.id}
          customerSiteHint={customerHint}
          initial={{
            display_name: profile?.display_name ?? auth.profile?.name ?? "",
            bio: profile?.bio ?? "",
            contact_phone: profile?.contact_phone ?? "",
            contact_email: profile?.contact_email ?? auth.profile?.email ?? "",
            profile_image_url: profile?.profile_image_url ?? "",
            slug: profile?.slug ?? "",
          }}
        />
      </div>
    </div>
  );
}
