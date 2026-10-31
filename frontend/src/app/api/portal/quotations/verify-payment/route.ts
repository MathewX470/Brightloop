import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedPortalCustomer } from "@/lib/portal-auth";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { BillingCycle } from "@prisma/client";

export const dynamic = "force-dynamic";

function calculateNextBillingDate(cycle: BillingCycle, fromDate: Date = new Date()): Date {
  const next = new Date(fromDate);
  if (cycle === "DAILY") next.setDate(next.getDate() + 1);
  else if (cycle === "WEEKLY") next.setDate(next.getDate() + 7);
  else if (cycle === "YEARLY") next.setFullYear(next.getFullYear() + 1);
  else next.setMonth(next.getMonth() + 1);
  return next;
}

export async function POST(request: NextRequest) {
  try {
    const { customer, error, statusCode } = await getAuthenticatedPortalCustomer();
    if (!customer) {
      return NextResponse.json({ error }, { status: statusCode || 401 });
    }

    const body = await request.json();
    const { quotationId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;

    if (!quotationId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json(
        { error: "Missing required Razorpay payment verification fields." },
        { status: 400 }
      );
    }

    // 1. Cryptographically verify signature
    const isValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid Razorpay payment signature. Settlement verification failed." },
        { status: 400 }
      );
    }

    // 2. Fetch quotation
    const quotation = await prisma.subscription.findFirst({
      where: {
        id: quotationId,
        customerId: customer.id,
        status: { in: ["QUOTATION", "DRAFT", "CONFIRMED"] },
      },
      include: {
        lines: {
          include: {
            product: true,
            plan: true,
            variant: true,
          },
        },
      },
    });

    if (!quotation) {
      return NextResponse.json(
        { error: "Quotation record not found or already activated." },
        { status: 404 }
      );
    }

    const total = quotation.lines.reduce(
      (sum, line) => sum + Number(line.unitPrice) * line.quantity,
      0
    );

    const now = new Date();
    const currentYear = now.getFullYear();

    // 3. Atomic transaction: create Invoice, record Payment, activate Subscription
    const result = await prisma.$transaction(async (tx) => {
      // Generate Invoice Number
      const invCount = await tx.invoice.count();
      const invoiceNumber = `INV-${currentYear}-${String(invCount + 1001).padStart(4, "0")}`;

      // Create first Invoice
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          customerId: customer.id,
          subscriptionId: quotation.id,
          status: "PAID",
          issueDate: now,
          dueDate: now,
          subtotal: total,
          total: total,
          paidAmount: total,
          paidAt: now,
          notes: `Initial invoice for subscription ${quotation.subscriptionNumber} paid via Razorpay (Txn: ${razorpayPaymentId})`,
          lines: {
            create: quotation.lines.map((line) => ({
              productId: line.productId,
              variantId: line.variantId,
              description: `${line.product?.name || "Plan"} - ${line.plan?.name || "Standard"} (${quotation.billingCycle})`,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              subtotal: Number(line.unitPrice) * line.quantity,
              taxAmount: 0,
              total: Number(line.unitPrice) * line.quantity,
            })),
          },
        },
      });

      // Generate Payment Number
      const payCount = await tx.payment.count();
      const paymentNumber = `PAY-${currentYear}-${String(payCount + 1).padStart(4, "0")}`;

      // Create Payment Record
      const payment = await tx.payment.create({
        data: {
          paymentNumber,
          invoiceId: invoice.id,
          amount: total,
          method: "RAZORPAY",
          status: "SUCCESS",
          transactionReference: razorpayPaymentId,
          paymentDate: now,
          notes: `Initial quotation subscription payment via Razorpay. Order ID: ${razorpayOrderId}`,
        },
      });

      // Calculate next billing date
      const nextBillingDate = calculateNextBillingDate(quotation.billingCycle, now);

      // Transition Subscription to ACTIVE
      const activeSubscription = await tx.subscription.update({
        where: { id: quotation.id },
        data: {
          status: "ACTIVE",
          startDate: now,
          nextBillingDate,
        },
      });

      return { invoice, payment, subscription: activeSubscription };
    });

    return NextResponse.json({
      success: true,
      message: `Quotation accepted! Initial payment confirmed via Razorpay (Txn: ${razorpayPaymentId}) and subscription is now ACTIVE.`,
      subscriptionNumber: quotation.subscriptionNumber,
      invoiceNumber: result.invoice.invoiceNumber,
      paymentNumber: result.payment.paymentNumber,
      transactionId: razorpayPaymentId,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Payment verification failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

