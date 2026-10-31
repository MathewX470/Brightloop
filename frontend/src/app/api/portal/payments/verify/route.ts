import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedPortalCustomer } from "@/lib/portal-auth";
import { verifyRazorpaySignature } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { customer, error, statusCode } = await getAuthenticatedPortalCustomer();
    if (!customer) {
      return NextResponse.json({ error }, { status: statusCode || 401 });
    }

    const body = await request.json();
    const { invoiceId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;

    if (!invoiceId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json(
        { error: "Missing required Razorpay verification fields." },
        { status: 400 }
      );
    }

    // 1. Verify cryptographic HMAC signature
    const isValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid Razorpay payment signature. Payment verification rejected." },
        { status: 400 }
      );
    }

    // 2. Fetch invoice
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
      return NextResponse.json({ error: "Invoice is already fully paid." }, { status: 400 });
    }

    const outstanding = Math.max(0, Number(invoice.total) - Number(invoice.paidAmount));
    const now = new Date();
    const currentYear = now.getFullYear();

    // 3. Atomic settlement
    const result = await prisma.$transaction(async (tx) => {
      const payCount = await tx.payment.count();
      const paymentNumber = `PAY-${currentYear}-${String(payCount + 1).padStart(4, "0")}`;

      const payment = await tx.payment.create({
        data: {
          paymentNumber,
          invoiceId: invoice.id,
          amount: outstanding,
          method: "RAZORPAY",
          status: "SUCCESS",
          transactionReference: razorpayPaymentId,
          paymentDate: now,
          notes: `Invoice ${invoice.invoiceNumber} paid via Razorpay Checkout. Order ID: ${razorpayOrderId}`,
        },
      });

      const newPaidAmount = Number(invoice.paidAmount) + outstanding;
      const updatedInvoice = await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount: newPaidAmount,
          status: "PAID",
          paidAt: now,
        },
      });

      return { payment, invoice: updatedInvoice };
    });

    return NextResponse.json({
      success: true,
      message: `Invoice ${invoice.invoiceNumber} paid successfully via Razorpay (Txn: ${razorpayPaymentId})!`,
      paymentNumber: result.payment.paymentNumber,
      invoiceNumber: invoice.invoiceNumber,
      transactionId: razorpayPaymentId,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Payment verification failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

