import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedPortalCustomer } from "@/lib/portal-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { customer, error, statusCode } = await getAuthenticatedPortalCustomer();
    if (!customer) {
      return NextResponse.json({ error }, { status: statusCode || 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter");

    const whereClause: Record<string, unknown> = {
      customerId: customer.id,
    };

    const now = new Date();
    if (filter === "unpaid") {
      whereClause.status = { in: ["CONFIRMED", "PARTIALLY_PAID"] };
    } else if (filter === "paid") {
      whereClause.status = "PAID";
    } else if (filter === "overdue") {
      whereClause.status = { in: ["CONFIRMED", "PARTIALLY_PAID"] };
      whereClause.dueDate = { lt: now };
    }

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        lines: {
          include: {
            product: true,
          },
        },
        payments: {
          orderBy: { paymentDate: "desc" },
        },
        subscription: {
          select: {
            id: true,
            subscriptionNumber: true,
            billingCycle: true,
          },
        },
      },
      orderBy: { issueDate: "desc" },
    });

    // Summary calculations
    let totalInvoiced = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;
    let overdueCount = 0;

    for (const inv of invoices) {
      const tot = Number(inv.total);
      const paid = Number(inv.paidAmount);
      totalInvoiced += tot;
      totalPaid += paid;
      if (inv.status !== "PAID" && inv.status !== "CANCELLED") {
        totalOutstanding += Math.max(0, tot - paid);
        if (new Date(inv.dueDate) < now) {
          overdueCount++;
        }
      }
    }

    return NextResponse.json({
      customer: {
        id: customer.id,
        name: customer.companyName,
        email: customer.email,
        taxId: customer.taxId,
        billingAddress: customer.billingAddress,
      },
      stats: {
        totalInvoiced,
        totalPaid,
        totalOutstanding,
        overdueCount,
        invoiceCount: invoices.length,
      },
      invoices,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load customer invoices";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

