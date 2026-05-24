import { requireDriver } from "@/lib/auth/require-driver";
import { getOwnerCompany } from "@/lib/data/driver-companies";
import { listCompanyBookings } from "@/lib/data/driver-bookings";
import { BookingsPanel } from "@/components/driver/bookings-panel";

export default async function DriverBookingsPage() {
  const auth = await requireDriver();
  if (auth.error) return null;

  const company = await getOwnerCompany(auth.user!.id, auth.supabase);
  if (!company) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-sm text-wtva-muted">Create your company profile first.</p>
      </div>
    );
  }

  const bookings = await listCompanyBookings(company.id, auth.supabase).catch(() => []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold">Bookings</h1>
      <p className="mt-1 text-sm text-wtva-muted">Accept or decline incoming booking requests.</p>
      <div className="mt-6">
        <BookingsPanel initial={bookings} />
      </div>
    </div>
  );
}
