import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "A valid email address is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Always respond with success to prevent user enumeration attacks
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If an account exists with that email, instructions have been sent.",
      });
    }

    // Generate random reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    const appUrl =
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const resetUrl = `${appUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(
      user.email
    )}`;

    // Send email using Nodemailer
    await sendPasswordResetEmail({
      to: user.email,
      name: user.name || "User",
      resetUrl,
    });

    return NextResponse.json({
      success: true,
      message: "If an account exists with that email, instructions have been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}
