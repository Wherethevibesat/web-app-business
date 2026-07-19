import { requireVenueOwner } from "@/lib/auth/require-venue-owner";
import { RedeemValidator } from "@/components/redeem-validator";

export default async function RedeemPage() {
  const auth = await requireVenueOwner();
  if (auth.error) return null;

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="text-2xl font-bold">Redeem a reward</h1>
      <p className="mt-2 text-sm text-wtva-muted">
        Ask the guest for their reward code and enter it below to mark it as used.
        Each code can only be redeemed once.
      </p>
      <div className="mt-6 rounded-2xl border border-wtva-dark-300 bg-wtva-card p-6">
        <RedeemValidator />
      </div>
    </div>
  );
}
