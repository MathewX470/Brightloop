import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth/session";

export async function POST() {
  try {
    await destroySession();
    return NextResponse.json({
      success: true,
      message: "Signed out successfully",
      redirectUrl: "/login",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Failed to sign out. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Allow GET request for simple <a href="/api/auth/logout"> or form fallbacks
  await destroySession();
  return NextResponse.redirect(new URL("/login", process.env.NEXTAUTH_URL || "http://localhost:3000"));
}

