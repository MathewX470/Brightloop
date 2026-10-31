import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { PaymentMethod, PaymentStatus, InvoiceStatus } from "@prisma/client";
import { z } from "zod";

const recordPaymentSchema = z.object({
  invoiceId: z.string().uuid("Invoice required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  method: z.nativeEnum(PaymentMethod).default(PaymentMethod.BANK_TRANSFER),
  notes: z.string().optional(),
  transactionReference: z.string().optional().nullable(),
});

export async function GET() {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        invoice: {
          include: { customer: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ payments });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch payments";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = recordPaymentSchema.parse(body);

    const invoice = await prisma.invoice.findUnique({
      where: { id: parsed.invoiceId },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const count = await prisma.payment.count();
    const paymentNumber = `PAY-${String(count + 1001).padStart(5, "0")}`;

    // Record the payment
    const payment = await prisma.payment.create({
      data: {
        paymentNumber,
        invoiceId: parsed.invoiceId,
        amount: parsed.amount,
        method: parsed.method,
        status: PaymentStatus.SUCCESS,
        notes: parsed.notes,
        transactionReference: parsed.transactionReference || undefined,
      },
      include: {
        invoice: { include: { customer: true } },
      },
    });

    // Update invoice paidAmount and status
    const newPaidAmount = Number(invoice.paidAmount) + parsed.amount;
    const isFullyPaid = newPaidAmount >= Number(invoice.total);

    await prisma.invoice.update({
      where: { id: parsed.invoiceId },
      data: {
        paidAmount: newPaidAmount,
        status: isFullyPaid
          ? InvoiceStatus.PAID
          : InvoiceStatus.PARTIALLY_PAID,
        ...(isFullyPaid ? { paidAt: new Date() } : {}),
      },
    });

    return NextResponse.json({ payment }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 422 });
    }
    const message = error instanceof Error ? error.message : "Failed to record payment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
