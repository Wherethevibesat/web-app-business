"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function PromotionForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("draft");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/promotions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, status }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/promotions");
      router.refresh();
    } else alert("Failed to save");
  }

  return (
    <form onSubmit={submit} className="max-w-lg space-y-4">
      <input
        required
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="w-full rounded-lg border border-wtva-dark-300 bg-wtva-dark-400 px-3 py-2 text-sm"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
        rows={3}
        className="w-full rounded-lg border border-wtva-dark-300 bg-wtva-dark-400 px-3 py-2 text-sm"
      />
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="w-full rounded-lg border border-wtva-dark-300 bg-wtva-dark-400 px-3 py-2 text-sm"
      >
        <option value="draft">Draft</option>
        <option value="scheduled">Scheduled</option>
        <option value="live">Live</option>
        <option value="ended">Ended</option>
      </select>
      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-accent-gradient shadow-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {loading ? "Saving…" : "Save promotion"}
      </button>
    </form>
  );
}
