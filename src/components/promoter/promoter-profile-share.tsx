"use client";

import { useState } from "react";
import { promoterPublicUrl } from "@/lib/promoter-public-url";

type ShareProfile = {
  user_id: string;
  slug: string | null;
};

export function PromoterProfileShare({ profile }: { profile: ShareProfile }) {
  const url = promoterPublicUrl(profile);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="rounded-xl border border-wtva-dark-300 bg-wtva-card p-4">
      <p className="text-sm font-medium">Shareable profile link</p>
      <p className="mt-1 break-all text-sm text-wtva-muted">{url}</p>
      <button
        type="button"
        onClick={copy}
        className="mt-3 rounded-lg border border-wtva-dark-300 px-4 py-2 text-sm font-semibold"
      >
        {copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  );
}
