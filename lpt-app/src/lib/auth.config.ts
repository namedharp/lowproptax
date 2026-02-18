import type { NextAuthConfig } from "next-auth";

// Edge-compatible auth config (no Prisma, no bcrypt, no Node.js APIs)
// Used by middleware for JWT-based route protection
export const authConfig: NextAuthConfig = {
  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
  },

  providers: [], // Providers added in full auth.ts

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role?: string }).role ?? "homeowner";
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },

    authorized({ auth, request: { nextUrl } }) {
      const session = auth;
      const pathname = nextUrl.pathname;

      const protectedRoutes = ["/dashboard", "/portfolio", "/ai-assistant"];
      const adminRoutes = [
        "/overview",
        "/clients",
        "/appeals",
        "/properties",
        "/portfolios",
        "/settings",
      ];

      const isProtectedRoute = protectedRoutes.some(
        (route) => pathname === route || pathname.startsWith(route + "/")
      );

      const isAdminRoute = adminRoutes.some(
        (route) => pathname === route || pathname.startsWith(route + "/")
      );

      // API routes — allow through (they handle their own auth)
      if (pathname.startsWith("/api")) {
        return true;
      }

      // If the user is not authenticated and the route requires auth
      if (!session && (isProtectedRoute || isAdminRoute)) {
        return false; // NextAuth will redirect to signIn page
      }

      // If the user is authenticated but not an admin for admin routes
      if (session && isAdminRoute && session.user?.role !== "admin") {
        return Response.redirect(new URL("/dashboard", nextUrl.origin));
      }

      return true;
    },
  },
};
