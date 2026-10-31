import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedPortalCustomer } from "@/lib/portal-auth";
import { getRazorpayClient } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { customer, error, statusCode } = await getAuthenticatedPortalCustomer();
    if (!customer) {
      return NextResponse.json({ error }, { status: statusCode || 401 });
    }

    const body = await request.json();
    const { quotationId } = body;

    if (!quotationId) {
      return NextResponse.json({ error: "quotationId is required." }, { status: 400 });
    }

    const quotation = await prisma.subscription.findFirst({
      where: {
        id: quotationId,
        customerId: customer.id,
        status: { in: ["QUOTATION", "DRAFT"] },
      },
      include: {
        lines: {
          include: {
            product: true,
            plan: true,
          },
        },
      },
    });

    if (!quotation) {
      return NextResponse.json(
        { error: "Quotation not found or already processed." },
        { status: 404 }
      );
    }

    // Calculate total amount in INR
    const total = quotation.lines.reduce(
      (sum, line) => sum + Number(line.unitPrice) * line.quantity,
      0
    );

    if (total <= 0) {
      return NextResponse.json(
        { error: "Invalid quotation amount. Must be greater than 0." },
        { status: 400 }
      );
    }

    const amountInPaise = Math.round(total * 100);

    const rzp = getRazorpayClient();
    const order = await rzp.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `ORD-${quotation.subscriptionNumber.substring(0, 30)}`,
      notes: {
        quotationId: quotation.id,
        subscriptionNumber: quotation.subscriptionNumber,
        customerId: customer.id,
        companyName: customer.companyName,
      },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
      subscriptionNumber: quotation.subscriptionNumber,
      total,
      customer: {
        name: customer.companyName,
        email: customer.email,
        phone: customer.phone,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create Razorpay order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

