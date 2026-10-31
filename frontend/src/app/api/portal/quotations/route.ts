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

    const quotations = await prisma.subscription.findMany({
      where: {
        customerId: customer.id,
        status: { in: ["QUOTATION", "DRAFT"] },
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
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      customer: {
        id: customer.id,
        name: customer.companyName,
        email: customer.email,
      },
      quotations,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load quotations";
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
    const { quotationId, action } = body;

    if (!quotationId || !action) {
      return NextResponse.json(
        { error: "quotationId and action are required." },
        { status: 400 }
      );
    }

    const quotation = await prisma.subscription.findFirst({
      where: {
        id: quotationId,
        customerId: customer.id,
        status: { in: ["QUOTATION", "DRAFT"] },
      },
    });

    if (!quotation) {
      return NextResponse.json(
        { error: "Quotation not found or already processed." },
        { status: 404 }
      );
    }

    if (action === "ACCEPT") {
      const confirmed = await prisma.subscription.update({
        where: { id: quotationId },
        data: {
          status: "CONFIRMED",
          startDate: quotation.startDate || new Date(),
          nextBillingDate: quotation.nextBillingDate || new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: `Quotation ${quotation.subscriptionNumber} accepted and confirmed successfully!`,
        subscription: confirmed,
      });
    } else if (action === "DECLINE") {
      const declined = await prisma.subscription.update({
        where: { id: quotationId },
        data: {
          status: "CLOSED",
        },
      });

      return NextResponse.json({
        success: true,
        message: `Quotation ${quotation.subscriptionNumber} declined.`,
        subscription: declined,
      });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to process quotation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

