"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function BusinessRegisterForm() {
  const router = useRouter();
  const search = useSearchParams();
  const requested = search.get("role");
  const role =
    requested === "driver"
      ? "driver"
      : requested === "promoter"
        ? "promoter"
        : "venueOwner";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role } },
    });
    if (err) {
      setError(err.message);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      if (role === "driver") {
        await supabase.rpc("claim_driver_role");
      } else if (role === "promoter") {
        await supabase.from("promoter_profiles").upsert({
          user_id: user.id,
          display_name: name.trim() || "Promoter",
          contact_email: user.email ?? email,
        });
        await supabase.rpc("claim_promoter_role");
      } else {
        await supabase.rpc("claim_venue_owner_role");
      }
      await supabase.from("users").upsert(
        {
          id: user.id,
          email: user.email ?? email,
          name: name.trim() || "User",
          role,
        },
        { onConflict: "id" },
      );
    }

    await fetch("/api/auth/sync-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });

    if (role === "driver") {
      router.push("/driver/company/new");
    } else if (role === "promoter") {
      router.push("/promoter/profile?setup=1");
    } else {
      router.push("/onboarding");
    }
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-sm space-y-4 px-4">
      <h1 className="text-2xl font-bold text-center">
        {role === "driver"
          ? "Register driver company"
          : role === "promoter"
            ? "Register as promoter"
            : "Register business"}
      </h1>
      <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="w-full rounded-lg border border-wtva-dark-300 bg-wtva-card px-4 py-3 text-sm" />
      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-lg border border-wtva-dark-300 bg-wtva-card px-4 py-3 text-sm" />
      <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full rounded-lg border border-wtva-dark-300 bg-wtva-card px-4 py-3 text-sm" />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button type="submit" className="w-full rounded-lg bg-foreground py-3 font-semibold text-background">Sign up</button>
      <p className="text-center text-sm"><Link href="/auth/login" className="underline">Sign in</Link></p>
    </form>
  );
}

export default function BusinessRegisterPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12">
      <Suspense fallback={<p className="text-center text-sm text-wtva-muted">Loading…</p>}>
        <BusinessRegisterForm />
      </Suspense>
    </div>
  );
}
