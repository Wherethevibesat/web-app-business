import Link from "next/link";
import { requireDriver } from "@/lib/auth/require-driver";
import { getOwnerCompany } from "@/lib/data/driver-companies";
import { getPlatformSettings } from "@/lib/data/platform-settings";
import { ListingSubmit } from "@/components/driver/listing-submit";

export default async function DriverCompanyPage() {
  const auth = await requireDriver();
  if (auth.error) return null;

  const [company, settings] = await Promise.all([
    getOwnerCompany(auth.user!.id, auth.supabase),
    getPlatformSettings(),
  ]);

  if (!company) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold">Driver company</h1>
        <p className="mt-3 text-sm text-wtva-muted">Create your company profile to continue.</p>
        <Link href="/driver/company/new" className="mt-5 inline-block rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background">
          Create company profile
        </Link>
      </div>
    );
  }

  const listingActive =
    !!company.listing_expires_at && new Date(company.listing_expires_at).getTime() > Date.now();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{company.company_name}</h1>
        <p className="text-sm text-wtva-muted">Status: {company.status.replace("_", " ")}</p>
      </div>

      <div className="rounded-xl border border-wtva-dark-300 bg-wtva-card p-5">
        <p className="text-sm text-wtva-muted">Listing status</p>
        {company.listing_expires_at ? (
          <p className="mt-1 text-sm">
            Expires {new Date(company.listing_expires_at).toLocaleDateString()}
          </p>
        ) : (
          <p className="mt-1 text-sm text-wtva-muted">No active listing yet.</p>
        )}
        <div className="mt-4">
          <ListingSubmit
            fee={settings.driver_listing_fee}
            months={settings.driver_listing_months}
            listingActive={listingActive}
            status={company.status}
          />
        </div>
      </div>

      <div className="rounded-xl border border-wtva-dark-300 bg-wtva-card p-5">
        <h2 className="font-semibold">Company details</h2>
        <p className="mt-2 text-sm text-wtva-muted">{company.description || "No description yet."}</p>
        <p className="mt-2 text-sm text-wtva-muted">City: {company.city ?? "-"}</p>
        <Link href="/driver/company/new" className="mt-4 inline-block text-sm underline">
          Edit details
        </Link>
      </div>
    </div>
  );
}
