import { cookies } from "next/headers";
import { Role } from "@prisma/client";
import crypto from "crypto";

const SESSION_COOKIE_NAME = "brightloop_session";
const SESSION_SECRET = process.env.SESSION_SECRET || "brightloop-default-hackathon-secret-key-change-in-production";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

interface SessionPayload extends SessionUser {
  exp: number;
}

function sign(payload: string): string {
  const hmac = crypto.createHmac("sha256", SESSION_SECRET);
  hmac.update(payload);
  return `${payload}.${hmac.digest("base64url")}`;
}

function verify(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;
  const hmac = crypto.createHmac("sha256", SESSION_SECRET);
  hmac.update(payload);
  const expectedSignature = hmac.digest("base64url");
  if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return payload;
  }
  return null;
}

export async function createSession(user: SessionUser, expiresInDays = 7) {
  const exp = Date.now() + expiresInDays * 24 * 60 * 60 * 1000;
  const payload: SessionPayload = { ...user, exp };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signedToken = sign(encodedPayload);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, signedToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(exp),
  });

  return signedToken;
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const validPayload = verify(token);
  if (!validPayload) return null;

  try {
    const jsonStr = Buffer.from(validPayload, "base64url").toString("utf-8");
    const payload: SessionPayload = JSON.parse(jsonStr);

    if (Date.now() > payload.exp) {
      return null;
    }

    return {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export function isRoleAllowed(userRole: Role, allowedRoles: Role[]): boolean {
  return allowedRoles.includes(userRole);
}
