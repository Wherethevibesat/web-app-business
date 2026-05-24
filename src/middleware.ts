import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

const CONFIG_PATH = "/configuration-error";

const PUBLIC_PREFIXES = ["/auth", "/onboarding", "/configuration-error"];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path === CONFIG_PATH) {
    return NextResponse.next({ request });
  }

  const env = getSupabasePublicEnv();
  if (!env) {
    if (PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) {
      return NextResponse.next({ request });
    }
    const url = request.nextUrl.clone();
    url.pathname = CONFIG_PATH;
    return NextResponse.redirect(url);
  }

  let response = NextResponse.next({ request });

  try {
    const supabase = createServerClient(env.url, env.anonKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Refresh session cookies on every request (required for Server Components).
    await supabase.auth.getSession();

    const isPublic = PUBLIC_PREFIXES.some(
      (p) => path === p || path.startsWith(`${p}/`),
    );

    if (!user && !isPublic) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      return NextResponse.redirect(url);
    }

    if (
      user &&
      (path.startsWith("/auth/login") || path.startsWith("/auth/register"))
    ) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return response;
  } catch (err) {
    console.error("[business middleware]", err);
    if (PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) {
      return NextResponse.next({ request });
    }
    const url = request.nextUrl.clone();
    url.pathname = CONFIG_PATH;
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
