"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DriverCompanyFormData, DriverCompanyRow } from "@/lib/types/driver";

const empty: DriverCompanyFormData = {
  company_name: "",
  description: "",
  contact_phone: "",
  contact_email: "",
  city: "",
  image_url: "",
};

export function CompanyForm({
  initial,
  mode,
}: {
  initial?: DriverCompanyRow | null;
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const [form, setForm] = useState<DriverCompanyFormData>(
    initial
      ? {
          company_name: initial.company_name,
          description: initial.description ?? "",
          contact_phone: initial.contact_phone ?? "",
          contact_email: initial.contact_email ?? "",
          city: initial.city ?? "",
          image_url: initial.image_url ?? "",
        }
      : empty,
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/driver/company", {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const body = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(body.error ?? "Save failed");
      return;
    }
    router.push("/driver/company");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-4">
      <div>
        <label className="text-sm font-medium">Company name *</label>
        <input
          required
          value={form.company_name}
          onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
          className="mt-1 w-full rounded-lg border border-wtva-dark-300 bg-wtva-card px-4 py-3 text-sm"
        />
      </div>
      <div>
        <label className="text-sm font-medium">City</label>
        <input
          value={form.city}
          onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
          className="mt-1 w-full rounded-lg border border-wtva-dark-300 bg-wtva-card px-4 py-3 text-sm"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Description</label>
        <textarea
          rows={4}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          className="mt-1 w-full rounded-lg border border-wtva-dark-300 bg-wtva-card px-4 py-3 text-sm"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Phone</label>
          <input
            value={form.contact_phone}
            onChange={(e) => setForm((f) => ({ ...f, contact_phone: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-wtva-dark-300 bg-wtva-card px-4 py-3 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Email</label>
          <input
            type="email"
            value={form.contact_email}
            onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-wtva-dark-300 bg-wtva-card px-4 py-3 text-sm"
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">Logo / image URL</label>
        <input
          value={form.image_url}
          onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
          className="mt-1 w-full rounded-lg border border-wtva-dark-300 bg-wtva-card px-4 py-3 text-sm"
        />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-accent-gradient shadow-accent px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {loading ? "Saving…" : mode === "create" ? "Create profile" : "Save changes"}
      </button>
    </form>
  );
}
