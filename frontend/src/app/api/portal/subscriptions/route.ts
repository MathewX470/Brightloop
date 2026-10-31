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

    const subscriptions = await prisma.subscription.findMany({
      where: {
        customerId: customer.id,
      },
      include: {
        lines: {
          include: {
            product: true,
            plan: true,
            variant: true,
          },
        },
        invoices: {
          orderBy: { issueDate: "desc" },
          take: 3,
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
      subscriptions,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load subscriptions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { customer, error, statusCode } = await getAuthenticatedPortalCustomer();
    if (!customer) {
      return NextResponse.json({ error }, { status: statusCode || 401 });
    }

    const body = await request.json();
    const { subscriptionId, action } = body;

    if (!subscriptionId || !action) {
      return NextResponse.json(
        { error: "subscriptionId and action are required." },
        { status: 400 }
      );
    }

    // Verify ownership
    const subscription = await prisma.subscription.findFirst({
      where: { id: subscriptionId, customerId: customer.id },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found." },
        { status: 404 }
      );
    }

    let nextStatus = subscription.status;
    if (action === "PAUSE" && subscription.status === "ACTIVE") {
      nextStatus = "PAUSED";
    } else if (action === "RESUME" && subscription.status === "PAUSED") {
      nextStatus = "ACTIVE";
    } else if (action === "CANCEL") {
      nextStatus = "CLOSED";
    } else {
      return NextResponse.json(
        { error: `Cannot perform ${action} on subscription with status ${subscription.status}` },
        { status: 400 }
      );
    }

    const updated = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: nextStatus },
    });

    return NextResponse.json({
      success: true,
      subscription: updated,
      message: `Subscription ${updated.subscriptionNumber} status updated to ${nextStatus}.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update subscription";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

