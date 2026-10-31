import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "brightloop_session";
const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  "brightloop-default-hackathon-secret-key-change-in-production";

type UserRole = "ADMIN" | "STAFF" | "CUSTOMER";

interface SessionPayload {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  customerId?: string | null;
  exp: number;
}

/**
 * Edge-compatible Web Crypto HMAC-SHA256 verification.
 * Runs natively in Next.js Edge Runtime without Node.js 'crypto' module.
 */
async function verifyHmac(payload: string, signature: string, secret: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const base64 = signature.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return await crypto.subtle.verify(
      "HMAC",
      key,
      bytes,
      encoder.encode(payload)
    );
  } catch {
    return false;
  }
}

async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;

  const isValid = await verifyHmac(payload, signature, SESSION_SECRET);
  if (!isValid) return null;

  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const jsonStr = new TextDecoder().decode(
      Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
    );
    const data: SessionPayload = JSON.parse(jsonStr);

    if (Date.now() > data.exp) {
      return null;
    }

    return data;
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

  // 2. Public landing page at root path
  if (pathname === "/") {
    return NextResponse.next();
  }

  // 3. Identify route categories
  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password");

  const isCustomerPortalRoute =
    pathname.startsWith("/client") ||
    pathname.startsWith("/my-subscriptions") ||
    pathname.startsWith("/my-invoices") ||
    pathname.startsWith("/my-quotations") ||
    pathname.startsWith("/my-payments") ||
    pathname.startsWith("/profile");

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

  // 4. Extract and verify session
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = sessionCookie ? await verifySessionToken(sessionCookie) : null;

  // 5. Redirect logged-in users away from auth pages
  if (user && isAuthRoute) {
    const destination =
      user.role === "CUSTOMER" ? "/client/dashboard" : "/dashboard";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  // 6. Protect management routes (Admin/Staff only)
  if (isManagementRoute) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Block CUSTOMER from accessing management / admin screens
    if (user.role === "CUSTOMER") {
      return NextResponse.redirect(new URL("/client/dashboard", request.url));
    }

    // Only ADMIN can access /staff management
    if (isAdminOnlyRoute && user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // 7. Protect customer portal routes (CUSTOMER ONLY - Admin & Staff Forbidden)
  if (isCustomerPortalRoute) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Admin and Staff have NO access to customer portal pages
    if (user.role !== "CUSTOMER") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
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
