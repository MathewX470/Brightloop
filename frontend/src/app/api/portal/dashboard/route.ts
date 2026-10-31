
import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import {
  UserRole,
  SubscriptionStatus,
  InvoiceStatus,
} from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    
    // 1. Authenticate the user
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Please log in to continue." },
        { status: 401 }
      );
    }

    // 2. Only CUSTOMER accounts can access this dashboard
    if (session.role !== UserRole.CUSTOMER) {
      return NextResponse.json(
        { error: "Customer access only." },
        { status: 403 }
      );
    }

    // 3. Find the logged-in user
    const user = await prisma.user.findUnique({
      where: {
        id: session.id,
      },
      select: {
        customerId: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive || !user.customerId) {
      return NextResponse.json(
        { error: "Customer account not found or inactive." },
        { status: 403 }
      );
    }

    // 4. Resolve the actual customer
    const customerId = user.customerId;

    const customer = await prisma.customer.findUnique({
      where: {
        id: customerId,
      },
    });

    if (!customer || !customer.isActive) {
      return NextResponse.json(
        { error: "Customer record is unavailable." },
        { status: 404 }
      );
    }
    
    // Continue with existing dashboard queries

    const now = new Date();
    const next30Days = new Date(now);
    next30Days.setDate(next30Days.getDate() + 30);

    // Subscriptions
    const subscriptions = await prisma.subscription.findMany({
      where: {
        customerId,
        status: {
          in: [
            SubscriptionStatus.ACTIVE,
            SubscriptionStatus.CONFIRMED,
          ],
        },
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
      orderBy: {
        nextBillingDate: "asc",
      },
    });

    // Unpaid and partially paid invoices
    const invoiceFilter = {
      customerId,
      status: {
        in: [
          InvoiceStatus.CONFIRMED,
          InvoiceStatus.PARTIALLY_PAID,
        ],
      },
    };

    const pendingInvoices = await prisma.invoice.findMany({
      where: invoiceFilter,
      include: {
        lines: true,
      },
      orderBy: {
        dueDate: "asc",
      },
      take: 10,
    });

    // Total outstanding
    const outstandingResult = await prisma.invoice.aggregate({
      where: invoiceFilter,
      _sum: {
        total: true,
        paidAmount: true,
      },
    });

    const outstandingAmount = Math.max(
      0,
      Number(outstandingResult._sum.total ?? 0) -
      Number(outstandingResult._sum.paidAmount ?? 0)
    );

    // Recent payments
    const recentPayments = await prisma.payment.findMany({
      where: {
        invoice: {
          customerId,
        },
      },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
          },
        },
      },
      orderBy: {
        paymentDate: "desc",
      },
      take: 8,
    });

    // Recent invoices
    const recentInvoices = await prisma.invoice.findMany({
      where: { customerId },
      select: {
        id: true,
        invoiceNumber: true,
        status: true,
        total: true,
        issueDate: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 8,
    });

    // Upcoming renewals
    const upcomingRenewals = subscriptions.filter((sub) => {
      return (
        sub.status === SubscriptionStatus.ACTIVE &&
        sub.nextBillingDate !== null &&
        sub.nextBillingDate >= now &&
        sub.nextBillingDate <= next30Days
      );
    });

    // Calculate renewal amount
    const renewalTotal = upcomingRenewals.reduce((sum, sub) => {
      const subscriptionAmount = sub.lines.reduce(
        (lineSum, line) =>
          lineSum +
          Number(line.unitPrice) * line.quantity,
        0
      );

      return sum + subscriptionAmount;
    }, 0);

    const pendingInvoiceCount = await prisma.invoice.count({
        where: invoiceFilter,
    });

    // Next renewal date
    const nextRenewalDate =
      subscriptions.find(
        (sub) =>
          sub.status === SubscriptionStatus.ACTIVE &&
          sub.nextBillingDate !== null &&
          sub.nextBillingDate >= now
      )?.nextBillingDate ?? null;

    return NextResponse.json({
      customer: {
        id: customer.id,
  name: customer.companyName,
  company: customer.companyName,
  email: customer.email,
      },

      stats: {
        activeSubscriptionCount: subscriptions.filter(
          (sub) => sub.status === SubscriptionStatus.ACTIVE
        ).length,

        pendingInvoiceCount,

        outstandingAmount,

        nextRenewalDate,
      },

      subscriptions,
      pendingInvoices,
      recentPayments,
      recentInvoices,
      upcomingRenewals,
      renewalTotal,
    });

  } catch (error) {
    console.error("[CLIENT DASHBOARD API]", error);

    return NextResponse.json(
      { error: "Unable to fetch dashboard information." },
      { status: 500 }
    );
  }
}
