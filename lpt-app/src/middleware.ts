import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Use edge-compatible config (no Prisma/bcrypt)
// The `authorized` callback in auth.config.ts handles route protection
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, etc.)
     * - api routes (they handle their own auth)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
