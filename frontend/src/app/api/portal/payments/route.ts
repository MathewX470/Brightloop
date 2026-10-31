import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedPortalCustomer } from "@/lib/portal-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { customer, error, statusCode } = await getAuthenticatedPortalCustomer();
    if (!customer) {
      return NextResponse.json({ error }, { status: statusCode || 401 });
    }

    const payments = await prisma.payment.findMany({
      where: {
        invoice: {
          customerId: customer.id,
        },
      },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            total: true,
            status: true,
          },
        },
      },
      orderBy: { paymentDate: "desc" },
    });

    const totalPaid = payments
      .filter((p) => p.status === "SUCCESS")
      .reduce((sum, p) => sum + Number(p.amount), 0);

    return NextResponse.json({
      customer: {
        id: customer.id,
        name: customer.companyName,
        email: customer.email,
      },
      stats: {
        totalPaid,
        transactionCount: payments.length,
      },
      payments,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load payment history";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { customer, error, statusCode } = await getAuthenticatedPortalCustomer();
    if (!customer) {
      return NextResponse.json({ error }, { status: statusCode || 401 });
    }

    const body = await request.json();
    const { invoiceId, method = "CREDIT_CARD", amount } = body;

    if (!invoiceId) {
      return NextResponse.json({ error: "invoiceId is required." }, { status: 400 });
    }

    // Verify invoice belongs to this customer
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, customerId: customer.id },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    }

    if (invoice.status === "PAID") {
      return NextResponse.json({ error: "Invoice is already fully paid." }, { status: 400 });
    }

    const outstanding = Math.max(0, Number(invoice.total) - Number(invoice.paidAmount));
    const payAmount = amount ? Math.min(Number(amount), outstanding) : outstanding;

    if (payAmount <= 0) {
      return NextResponse.json({ error: "No outstanding amount to pay." }, { status: 400 });
    }

    // Generate Payment Number: PAY-YYYY-XXXX
    const currentYear = new Date().getFullYear();
    const count = await prisma.payment.count();
    const paymentNumber = `PAY-${currentYear}-${String(count + 1).padStart(4, "0")}`;
    const txRef = `TXN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Execute atomic payment + invoice update
    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          paymentNumber,
          invoiceId: invoice.id,
          amount: payAmount,
          method,
          status: "SUCCESS",
          transactionReference: txRef,
          notes: `Customer online settlement via Portal (${method})`,
        },
      });

      const newPaidAmount = Number(invoice.paidAmount) + payAmount;
      const isFull = newPaidAmount >= Number(invoice.total) - 0.01;

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount: newPaidAmount,
          status: isFull ? "PAID" : "PARTIALLY_PAID",
        },
      });

      return { payment, invoice: updatedInvoice };
    });

    return NextResponse.json({
      success: true,
      message: `Payment of ₹${payAmount.toFixed(2)} processed successfully!`,
      payment: result.payment,
      invoice: result.invoice,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Payment processing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

