import { PromotionForm } from "@/components/promotion-form";

export default function NewPromotionPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">New promotion</h1>
      <div className="mt-6">
        <PromotionForm />
      </div>
    </div>
  );
}
