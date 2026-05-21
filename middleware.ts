export { updateSession as middleware } from "@/lib/supabase/middleware";

export const config = {
  matcher: ["/", "/admin/:path*", "/driver/:path*", "/citizen/:path*", "/auth/:path*"],
};
