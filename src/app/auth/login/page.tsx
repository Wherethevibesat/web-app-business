"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function BusinessLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(err.message);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const role = user?.user_metadata?.role as string | undefined;
    if (user && role === "driver") {
      await supabase.rpc("claim_driver_role");
      await supabase.from("users").upsert(
        {
          id: user.id,
          email: user.email ?? email,
          name: (user.user_metadata?.name as string | undefined)?.trim() || email.split("@")[0],
          role: "driver",
        },
        { onConflict: "id" },
      );
    } else if (user && role === "promoter") {
      await supabase.rpc("claim_promoter_role");
      await supabase.from("users").upsert(
        {
          id: user.id,
          email: user.email ?? email,
          name: (user.user_metadata?.name as string | undefined)?.trim() || email.split("@")[0],
          role: "promoter",
        },
        { onConflict: "id" },
      );
    } else if (user && role === "venueOwner") {
      await supabase.rpc("claim_venue_owner_role");
      await supabase.from("users").upsert(
        {
          id: user.id,
          email: user.email ?? email,
          name: (user.user_metadata?.name as string | undefined)?.trim() || email.split("@")[0],
          role: "venueOwner",
        },
        { onConflict: "id" },
      );
    }

    await fetch("/api/auth/sync-profile", {
      method: "POST",
      body: JSON.stringify({ role }),
    });
    router.push(
      role === "driver" ? "/driver" : role === "promoter" ? "/promoter" : "/",
    );
    router.refresh();
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12">
      <form onSubmit={handleSubmit} className="mx-auto max-w-sm space-y-4 px-4">
        <h1 className="text-2xl font-bold text-center">WTVA Business</h1>
        <p className="text-center text-sm text-wtva-muted">Venue, promoter, or driver sign in</p>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-wtva-dark-300 bg-wtva-card px-4 py-3 text-sm"
        />
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-wtva-dark-300 bg-wtva-card px-4 py-3 text-sm"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" className="w-full rounded-full bg-accent-gradient shadow-accent py-3 font-semibold text-white">
          Sign in
        </button>
        <p className="text-center text-sm">
          <Link href="/auth/register" className="underline text-wtva-muted">
            Register business
          </Link>
          <span className="mx-1">|</span>
          <Link href="/auth/register?role=driver" className="underline text-wtva-muted">
            Driver
          </Link>
          <span className="mx-1">|</span>
          <Link href="/auth/register?role=promoter" className="underline text-wtva-muted">
            Promoter
          </Link>
        </p>
      </form>
    </div>
  );
}
