import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost:54321";

const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "public-anon-key";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  let role: "admin" | "driver" | "citizen" | null = null;

  if (user) {
    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();

    role = (profile?.role as typeof role | undefined) ?? null;
  }

  const isProtected =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/driver") ||
    pathname.startsWith("/citizen");

  const isAuthRoute = pathname.startsWith("/auth");

  if (isProtected && !user) {
    const redirectUrl = request.nextUrl.clone();

    redirectUrl.pathname = "/auth/login";
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isAuthRoute) {
    const redirectUrl = request.nextUrl.clone();

    redirectUrl.pathname =
      role === "admin" ? "/admin" : role === "driver" ? "/driver" : "/citizen";
    redirectUrl.searchParams.delete("redirectTo");
    return NextResponse.redirect(redirectUrl);
  }

  function guard(expected: "admin" | "driver" | "citizen") {
    if (!user || role === expected) return null;

    const url = request.nextUrl.clone();

    url.pathname = role === "admin" ? "/admin" : role === "driver" ? "/driver" : "/citizen";

    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin")) {
    const response = guard("admin");

    if (response) return response;
  }

  if (pathname.startsWith("/driver")) {
    const response = guard("driver");

    if (response) return response;
  }

  if (pathname.startsWith("/citizen")) {
    const response = guard("citizen");

    if (response) return response;
  }

  return supabaseResponse;
}
