"use client";

import { useState } from "react";
import { PromoterImageUpload } from "@/components/promoter/promoter-image-upload";
import { slugifyPromoterName } from "@/lib/promoter-slug";

export function PromoterProfileForm({
  promoterId,
  initial,
  customerSiteHint,
}: {
  promoterId: string;
  initial: {
    display_name: string;
    bio: string;
    contact_phone: string;
    contact_email: string;
    profile_image_url: string;
    slug: string;
  };
  customerSiteHint: string;
}) {
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);

    const res = await fetch("/api/promoter/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const body = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(body.error ?? "Save failed");
      return;
    }

    if (body.profile) {
      setForm({
        display_name: body.profile.display_name ?? "",
        bio: body.profile.bio ?? "",
        contact_phone: body.profile.contact_phone ?? "",
        contact_email: body.profile.contact_email ?? "",
        profile_image_url: body.profile.profile_image_url ?? "",
        slug: body.profile.slug ?? "",
      });
    }
    setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-5">
      <PromoterImageUpload
        promoterId={promoterId}
        value={form.profile_image_url}
        onChange={(url) => setForm((f) => ({ ...f, profile_image_url: url }))}
      />

      <div>
        <label className="text-sm font-medium">Display name *</label>
        <input
          required
          value={form.display_name}
          onChange={(e) => {
            const name = e.target.value;
            setForm((f) => ({
              ...f,
              display_name: name,
              slug: f.slug || slugifyPromoterName(name),
            }));
          }}
          className="mt-1 w-full rounded-lg border border-wtva-dark-300 bg-wtva-card px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Profile URL *</label>
        <p className="text-xs text-wtva-muted">
          Share link: {customerSiteHint}/promoters/
          <span className="text-foreground">{form.slug || "your-name"}</span>
        </p>
        <input
          required
          value={form.slug}
          onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase() }))}
          placeholder="your-name"
          className="mt-1 w-full rounded-lg border border-wtva-dark-300 bg-wtva-card px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Bio *</label>
        <textarea
          required
          rows={4}
          value={form.bio}
          onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
          placeholder="Tell customers about your style, venues, and what you offer?"
          className="mt-1 w-full rounded-lg border border-wtva-dark-300 bg-wtva-card px-3 py-2 text-sm"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Contact email</label>
          <input
            type="email"
            value={form.contact_email}
            onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-wtva-dark-300 bg-wtva-card px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Contact phone</label>
          <input
            value={form.contact_phone}
            onChange={(e) => setForm((f) => ({ ...f, contact_phone: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-wtva-dark-300 bg-wtva-card px-3 py-2 text-sm"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {saved && (
        <p className="text-sm text-emerald-400">Profile saved. Share your public link with customers.</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-accent-gradient shadow-accent py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save profile"}
      </button>
    </form>
  );
}
