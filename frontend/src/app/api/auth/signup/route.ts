import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { signupSchema } from "@/lib/validations/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = signupSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, email, password } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // Hash the password securely
    const passwordHash = await hashPassword(password);

    // Create Customer profile first (or link) then create the User with CUSTOMER role
    const newUser = await prisma.$transaction(async (tx) => {
      // 1. Create a Customer record for recurring billing/subscriptions
      const customer = await tx.customer.create({
        data: {
          companyName: name, // defaults to individual or company name
          email: normalizedEmail,
          isActive: true,
        },
      });

      // 2. Create the User with CUSTOMER role explicitly
      return tx.user.create({
        data: {
          name,
          email: normalizedEmail,
          passwordHash,
          role: "CUSTOMER", // Staff can only be created by Admin
          customerId: customer.id,
          isActive: true,
        },
      });
    });

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully. Please sign in.",
        redirectUrl: "/login?registered=true",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Failed to create account. Please try again later." },
      { status: 500 }
    );
  }
}

