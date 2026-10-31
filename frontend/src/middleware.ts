import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "brightloop_session";
const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  "brightloop-default-hackathon-secret-key-change-in-production";

interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "STAFF" | "CUSTOMER";
  exp: number;
}

// Edge-compatible HMAC-SHA256 signature verification using Web Crypto API
async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [payloadBase64, signatureBase64] = parts;

    // Convert secret to crypto key
    const encoder = new TextEncoder();
    const keyData = encoder.encode(SESSION_SECRET);
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    // Compute signature for incoming payload
    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(payloadBase64)
    );

    // Convert computed buffer to base64url
    const computedSignature = btoa(
      String.fromCharCode(...new Uint8Array(signatureBuffer))
    )
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    if (computedSignature !== signatureBase64) {
      return null;
    }

    // Decode payload
    const jsonStr = atob(
      payloadBase64.replace(/-/g, "+").replace(/_/g, "/")
    );
    const user: SessionUser = JSON.parse(jsonStr);

    if (Date.now() > user.exp) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip static assets, internal Next.js paths, and images
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 2. Identify route categories
  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password");

  const isCustomerPortalRoute =
    pathname.startsWith("/my-subscriptions") ||
    pathname.startsWith("/my-invoices");

  const isAdminOnlyRoute = pathname.startsWith("/staff");

  const isManagementRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/customers") ||
    pathname.startsWith("/subscriptions") ||
    pathname.startsWith("/plans") ||
    pathname.startsWith("/products") ||
    pathname.startsWith("/invoices") ||
    pathname.startsWith("/payments") ||
    pathname.startsWith("/discounts") ||
    pathname.startsWith("/taxes") ||
    pathname.startsWith("/templates") ||
    isAdminOnlyRoute;

  // 3. Extract and verify session
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = sessionCookie ? await verifySessionToken(sessionCookie) : null;

  // 4. Redirect logged-in users away from auth pages
  if (user && isAuthRoute) {
    const destination =
      user.role === "CUSTOMER" ? "/my-subscriptions" : "/dashboard";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  // 5. Protect management routes (Admin/Staff only)
  if (isManagementRoute) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Block CUSTOMER from accessing management / admin screens
    if (user.role === "CUSTOMER") {
      return NextResponse.redirect(new URL("/my-subscriptions", request.url));
    }

    // Only ADMIN can access /staff management
    if (isAdminOnlyRoute && user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // 6. Protect customer portal routes
  if (isCustomerPortalRoute) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 7. Root path redirect
  if (pathname === "/") {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const destination =
      user.role === "CUSTOMER" ? "/my-subscriptions" : "/dashboard";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (handled independently)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
