import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { InvoiceStatus } from "@prisma/client";
import { z } from "zod";

const updateInvoiceStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.nativeEnum(InvoiceStatus),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");

    const invoices = await prisma.invoice.findMany({
      where: statusParam ? { status: statusParam as InvoiceStatus } : {},
      include: {
        customer: true,
        lines: true,
        payments: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ invoices });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch invoices";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status } = updateInvoiceStatusSchema.parse(body);

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        status,
        ...(status === InvoiceStatus.PAID ? { paidAt: new Date() } : {}),
        ...(status === InvoiceStatus.CANCELLED ? { cancelledAt: new Date() } : {}),
      },
    });

    return NextResponse.json({ invoice });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 422 });
    }
    const message = error instanceof Error ? error.message : "Failed to update invoice";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
