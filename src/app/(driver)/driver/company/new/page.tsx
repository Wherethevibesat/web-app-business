import { requireDriver } from "@/lib/auth/require-driver";
import { getOwnerCompany } from "@/lib/data/driver-companies";
import { CompanyForm } from "@/components/driver/company-form";

export default async function DriverCompanyNewPage() {
  const auth = await requireDriver();
  if (auth.error) return null;

  const company = await getOwnerCompany(auth.user!.id, auth.supabase);

  return (
    <div className="px-4 py-8">
      <h1 className="mx-auto mb-6 max-w-lg text-2xl font-bold">
        {company ? "Edit company" : "Create driver company"}
      </h1>
      <CompanyForm initial={company} mode={company ? "edit" : "create"} />
    </div>
  );
}
