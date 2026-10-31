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
    const { invoiceId } = body;

    if (!invoiceId) {
      return NextResponse.json({ error: "invoiceId is required." }, { status: 400 });
    }

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        customerId: customer.id,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    }

    if (invoice.status === "PAID") {
      return NextResponse.json({ error: "This invoice is already fully paid." }, { status: 400 });
    }

    const outstanding = Math.max(0, Number(invoice.total) - Number(invoice.paidAmount));
    if (outstanding <= 0) {
      return NextResponse.json({ error: "No outstanding balance on this invoice." }, { status: 400 });
    }

    const amountInPaise = Math.round(outstanding * 100);

    const rzp = getRazorpayClient();
    const order = await rzp.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `INV-${invoice.invoiceNumber.substring(0, 30)}`,
      notes: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
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
      invoiceNumber: invoice.invoiceNumber,
      outstandingAmount: outstanding,
      customer: {
        name: customer.companyName,
        email: customer.email,
        phone: customer.phone,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create Razorpay invoice order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

