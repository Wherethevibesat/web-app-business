import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getImpersonationSecret,
  verifyImpersonationToken,
} from "@/lib/impersonation-token";

function homeForRole(role: string) {
  if (role === "driver") return "/driver";
  if (role === "promoter") return "/promoter";
  return "/";
}

/**
 * Admin "Login as owner" lands here with a short-lived signed token that wraps
 * a Supabase magic-link hash for the target business user.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token = searchParams.get("token")?.trim() ?? "";
  const secret = getImpersonationSecret();

  if (!token || !secret) {
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent("impersonation_unavailable")}`,
    );
  }

  const payload = verifyImpersonationToken(token, secret);
  if (!payload?.token_hash) {
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent("impersonation_expired")}`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: payload.token_hash,
    type: "magiclink",
  });

  if (error) {
    console.error("[impersonate]", error.message);
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent("impersonation_failed")}`,
    );
  }

  return NextResponse.redirect(`${origin}${homeForRole(payload.role)}`);
}
