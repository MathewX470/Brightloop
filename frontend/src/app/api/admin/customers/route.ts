import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { z } from "zod";

const createCustomerSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  billingAddress: z.string().optional(),
  shippingAddress: z.string().optional(),
  taxId: z.string().optional(),
});

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        subscriptions: {
          select: { id: true, subscriptionNumber: true, status: true },
        },
        invoices: {
          select: { id: true, invoiceNumber: true, status: true, total: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ customers });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch customers";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createCustomerSchema.parse(body);

    const customer = await prisma.customer.create({
      data: {
        companyName: parsed.companyName,
        email: parsed.email,
        phone: parsed.phone,
        billingAddress: parsed.billingAddress,
        shippingAddress: parsed.shippingAddress,
        taxId: parsed.taxId,
      },
    });

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 422 });
    }
    const message = error instanceof Error ? error.message : "Failed to create customer";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

