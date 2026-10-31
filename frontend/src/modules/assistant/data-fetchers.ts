import prisma from "@/lib/db";

export interface DateRange {
  start: Date;
  end: Date;
  label: string;
}

/**
 * Data fetcher for /churn command
 */
export async function fetchChurnData(range: DateRange) {
  const { start, end } = range;

  const [
    activeSubsCount,
    pausedSubsCount,
    newSubsInPeriod,
    closedSubsInPeriod,
    allClosedSubs,
    plansWithActiveCount,
  ] = await Promise.all([
    // Active subscriptions
    prisma.subscription.count({ where: { status: "ACTIVE" } }),

    // Paused subscriptions
    prisma.subscription.count({ where: { status: "PAUSED" } }),

    // New subscriptions started/created in this period
    prisma.subscription.count({
      where: {
        createdAt: { gte: start, lte: end },
      },
    }),

    // Subscriptions closed during this period
    prisma.subscription.findMany({
      where: {
        status: "CLOSED",
        OR: [
          { closedAt: { gte: start, lte: end } },
          { cancelledAt: { gte: start, lte: end } },
          {
            AND: [
              { closedAt: null },
              { cancelledAt: null },
              { updatedAt: { gte: start, lte: end } },
            ],
          },
        ],
      },
      select: {
        id: true,
        subscriptionNumber: true,
        billingCycle: true,
        closedAt: true,
        cancelledAt: true,
        createdAt: true,
        customerId: true,
        customer: { select: { companyName: true, email: true } },
        lines: {
          select: {
            plan: { select: { name: true, billingCycle: true, price: true } },
            product: { select: { name: true } },
            unitPrice: true,
            quantity: true,
          },
        },
      },
      take: 50,
    }),

    // Total closed subscriptions all-time
    prisma.subscription.count({ where: { status: "CLOSED" } }),

    // Plan breakdown for active subscriptions
    prisma.subscriptionLine.groupBy({
      by: ["planId"],
      where: { subscription: { status: "ACTIVE" } },
      _count: { id: true },
    }),
  ]);

  // Fetch plan names for active breakdown
  const planIds = plansWithActiveCount.map((p) => p.planId);
  const plans = await prisma.plan.findMany({
    where: { id: { in: planIds } },
    select: { id: true, name: true, billingCycle: true },
  });
  const planNameMap = new Map(plans.map((p) => [p.id, `${p.name} (${p.billingCycle})`]));

  const activePlanDistribution = plansWithActiveCount.map((p) => ({
    plan: planNameMap.get(p.planId) || p.planId,
    activeSubscribers: p._count.id,
  }));

  return {
    period: range.label,
    activeSubscriptions: activeSubsCount,
    pausedSubscriptions: pausedSubsCount,
    newSubscriptionsInPeriod: newSubsInPeriod,
    closedSubscriptionsInPeriod: closedSubsInPeriod.length,
    allTimeClosedSubscriptions: allClosedSubs,
    closedSubscriptionsSample: closedSubsInPeriod.map((s) => ({
      subscriptionNumber: s.subscriptionNumber,
      customer: s.customer.companyName || s.customer.email,
      billingCycle: s.billingCycle,
      closedAt: (s.closedAt || s.cancelledAt || s.createdAt).toISOString().slice(0, 10),
      plan: s.lines[0]?.plan?.name || "Standard",
      monthlyValue: Number(s.lines[0]?.unitPrice || 0) * (s.lines[0]?.quantity || 1),
    })),
    activePlanDistribution,
  };
}

/**
 * Data fetcher for /revenue command
 */
export async function fetchRevenueData(range: DateRange) {
  const { start, end } = range;
  const now = new Date();

  const [
    paymentsInPeriod,
    invoicesInPeriod,
    allTimePayments,
    overdueInvoices,
    activeSubsWithLines,
  ] = await Promise.all([
    // Payments received (status: SUCCESS)
    prisma.payment.findMany({
      where: {
        status: "SUCCESS",
        paymentDate: { gte: start, lte: end },
      },
      select: {
        amount: true,
        paymentDate: true,
        method: true,
      },
      orderBy: { paymentDate: "asc" },
    }),

    // Invoices issued in period
    prisma.invoice.findMany({
      where: {
        issueDate: { gte: start, lte: end },
        status: { not: "CANCELLED" },
      },
      select: {
        total: true,
        paidAmount: true,
        status: true,
        issueDate: true,
      },
      orderBy: { issueDate: "asc" },
    }),

    // All time payments aggregate
    prisma.payment.aggregate({
      where: { status: "SUCCESS" },
      _sum: { amount: true },
      _count: { id: true },
    }),

    // Currently overdue invoices
    prisma.invoice.findMany({
      where: {
        status: { in: ["CONFIRMED", "PARTIALLY_PAID"] },
        dueDate: { lt: now },
      },
      select: {
        invoiceNumber: true,
        total: true,
        paidAmount: true,
        dueDate: true,
        customer: { select: { companyName: true, email: true } },
      },
      orderBy: { dueDate: "asc" },
      take: 20,
    }),

    // Active subscriptions for plan revenue breakdown
    prisma.subscription.findMany({
      where: { status: "ACTIVE" },
      select: {
        billingCycle: true,
        lines: {
          select: {
            unitPrice: true,
            quantity: true,
            plan: { select: { name: true } },
            product: { select: { name: true } },
          },
        },
      },
    }),
  ]);

  return {
    period: range.label,
    paymentsInPeriod: paymentsInPeriod.map((p) => ({
      amount: Number(p.amount),
      date: p.paymentDate.toISOString().slice(0, 10),
      month: p.paymentDate.toISOString().slice(0, 7),
      method: p.method,
    })),
    invoicesInPeriod: invoicesInPeriod.map((i) => ({
      total: Number(i.total),
      paidAmount: Number(i.paidAmount),
      status: i.status,
      date: i.issueDate.toISOString().slice(0, 10),
      month: i.issueDate.toISOString().slice(0, 7),
    })),
    allTimeCollected: Number(allTimePayments._sum.amount || 0),
    allTimePaymentCount: allTimePayments._count.id,
    overdueInvoices: overdueInvoices.map((i) => ({
      invoiceNumber: i.invoiceNumber,
      customer: i.customer.companyName || i.customer.email,
      total: Number(i.total),
      paidAmount: Number(i.paidAmount),
      balanceDue: Number(i.total) - Number(i.paidAmount),
      dueDate: i.dueDate.toISOString().slice(0, 10),
    })),
    activeSubsWithLines: activeSubsWithLines.map((s) => ({
      billingCycle: s.billingCycle,
      lines: s.lines.map((l) => ({
        planName: l.plan?.name || "Standard",
        productName: l.product?.name || "Service",
        unitPrice: Number(l.unitPrice),
        quantity: l.quantity,
      })),
    })),
  };
}

/**
 * Data fetcher for /subscriptions command
 */
export async function fetchSubscriptionData(range: DateRange) {
  const { start, end } = range;
  const now = new Date();
  const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    totalCount,
    statusGroup,
    billingCycleGroup,
    newSubsInPeriod,
    upcomingRenewals30d,
    upcomingRenewals7d,
    expiringSubs30d,
    sampleUpcoming,
    planLines,
  ] = await Promise.all([
    prisma.subscription.count(),
    prisma.subscription.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    prisma.subscription.groupBy({
      by: ["billingCycle"],
      _count: { id: true },
    }),
    prisma.subscription.count({
      where: { createdAt: { gte: start, lte: end } },
    }),
    prisma.subscription.count({
      where: {
        status: "ACTIVE",
        nextBillingDate: { gte: now, lte: next30Days },
      },
    }),
    prisma.subscription.count({
      where: {
        status: "ACTIVE",
        nextBillingDate: { gte: now, lte: next7Days },
      },
    }),
    prisma.subscription.count({
      where: {
        status: "ACTIVE",
        expiryDate: { gte: now, lte: next30Days },
      },
    }),
    prisma.subscription.findMany({
      where: {
        status: "ACTIVE",
        nextBillingDate: { gte: now },
      },
      select: {
        subscriptionNumber: true,
        nextBillingDate: true,
        billingCycle: true,
        customer: { select: { companyName: true, email: true } },
        lines: { select: { unitPrice: true, quantity: true, plan: { select: { name: true } } } },
      },
      orderBy: { nextBillingDate: "asc" },
      take: 6,
    }),
    prisma.subscriptionLine.findMany({
      where: { subscription: { status: "ACTIVE" } },
      select: {
        plan: { select: { name: true, billingCycle: true } },
        unitPrice: true,
        quantity: true,
      },
    }),
  ]);

  return {
    period: range.label,
    totalSubscriptions: totalCount,
    statusBreakdown: statusGroup.map((s) => ({ status: s.status, count: s._count.id })),
    billingCycleBreakdown: billingCycleGroup.map((b) => ({
      cycle: b.billingCycle,
      count: b._count.id,
    })),
    newSubscriptionsInPeriod: newSubsInPeriod,
    renewalsNext7Days: upcomingRenewals7d,
    renewalsNext30Days: upcomingRenewals30d,
    expiringNext30Days: expiringSubs30d,
    upcomingRenewalsSample: sampleUpcoming.map((s) => ({
      subscriptionNumber: s.subscriptionNumber,
      customer: s.customer.companyName || s.customer.email,
      nextBillingDate: s.nextBillingDate?.toISOString().slice(0, 10) || "N/A",
      billingCycle: s.billingCycle,
      plan: s.lines[0]?.plan?.name || "Standard",
      estimatedAmount: Number(s.lines[0]?.unitPrice || 0) * (s.lines[0]?.quantity || 1),
    })),
    planLines: planLines.map((l) => ({
      plan: l.plan?.name || "Unknown",
      billingCycle: l.plan?.billingCycle || "MONTHLY",
      price: Number(l.unitPrice) * l.quantity,
    })),
  };
}

/**
 * Data fetcher for /payments command
 */
export async function fetchPaymentData(range: DateRange) {
  const { start, end } = range;
  const now = new Date();

  const [
    paymentsByStatus,
    paymentsByMethod,
    invoicesSummary,
    overdueInvoices,
    recentPayments,
  ] = await Promise.all([
    // Payment count and sums by status in period
    prisma.payment.groupBy({
      by: ["status"],
      where: { paymentDate: { gte: start, lte: end } },
      _count: { id: true },
      _sum: { amount: true },
    }),

    // Successful payments grouped by method
    prisma.payment.groupBy({
      by: ["method"],
      where: {
        status: "SUCCESS",
        paymentDate: { gte: start, lte: end },
      },
      _count: { id: true },
      _sum: { amount: true },
    }),

    // Invoice status summary
    prisma.invoice.groupBy({
      by: ["status"],
      _count: { id: true },
      _sum: { total: true, paidAmount: true },
    }),

    // Overdue invoices details
    prisma.invoice.findMany({
      where: {
        status: { in: ["CONFIRMED", "PARTIALLY_PAID"] },
        dueDate: { lt: now },
      },
      select: {
        invoiceNumber: true,
        total: true,
        paidAmount: true,
        dueDate: true,
        customer: { select: { companyName: true, email: true } },
      },
      orderBy: { dueDate: "asc" },
      take: 10,
    }),

    // Recent payments
    prisma.payment.findMany({
      where: { status: "SUCCESS" },
      select: {
        paymentNumber: true,
        amount: true,
        method: true,
        paymentDate: true,
        invoice: {
          select: {
            invoiceNumber: true,
            customer: { select: { companyName: true, email: true } },
          },
        },
      },
      orderBy: { paymentDate: "desc" },
      take: 8,
    }),
  ]);

  return {
    period: range.label,
    paymentsByStatus: paymentsByStatus.map((p) => ({
      status: p.status,
      count: p._count.id,
      totalAmount: Number(p._sum.amount || 0),
    })),
    paymentsByMethod: paymentsByMethod.map((p) => ({
      method: p.method,
      count: p._count.id,
      totalAmount: Number(p._sum.amount || 0),
    })),
    invoicesSummary: invoicesSummary.map((i) => ({
      status: i.status,
      count: i._count.id,
      totalBilled: Number(i._sum.total || 0),
      totalPaid: Number(i._sum.paidAmount || 0),
    })),
    overdueInvoices: overdueInvoices.map((i) => ({
      invoiceNumber: i.invoiceNumber,
      customer: i.customer.companyName || i.customer.email,
      total: Number(i.total),
      paidAmount: Number(i.paidAmount),
      outstanding: Number(i.total) - Number(i.paidAmount),
      dueDate: i.dueDate.toISOString().slice(0, 10),
    })),
    recentPayments: recentPayments.map((p) => ({
      paymentNumber: p.paymentNumber,
      amount: Number(p.amount),
      method: p.method,
      date: p.paymentDate.toISOString().slice(0, 10),
      customer: p.invoice?.customer?.companyName || p.invoice?.customer?.email || "Customer",
      invoiceNumber: p.invoice?.invoiceNumber || "INV",
    })),
  };
}

/**
 * Data fetcher for /customers command
 */
export async function fetchCustomerData(range: DateRange) {
  const { start, end } = range;

  const [
    totalCustomers,
    activeStatusGroup,
    newCustomersInPeriod,
    customersWithActiveSubs,
    customersWithAnySubs,
    topPayingCustomers,
    allCustomersSubsCount,
  ] = await Promise.all([
    // Total customers
    prisma.customer.count(),

    // Customers grouped by isActive flag
    prisma.customer.groupBy({
      by: ["isActive"],
      _count: { id: true },
    }),

    // New customers in period
    prisma.customer.count({
      where: { createdAt: { gte: start, lte: end } },
    }),

    // Customers with at least 1 ACTIVE subscription
    prisma.customer.count({
      where: { subscriptions: { some: { status: "ACTIVE" } } },
    }),

    // Customers with at least 1 subscription of any status
    prisma.customer.count({
      where: { subscriptions: { some: {} } },
    }),

    // Top paying customers
    prisma.invoice.groupBy({
      by: ["customerId"],
      where: { status: "PAID" },
      _sum: { paidAmount: true },
      _count: { id: true },
      orderBy: { _sum: { paidAmount: "desc" } },
      take: 6,
    }),

    // Customer subscription count distribution
    prisma.customer.findMany({
      select: {
        id: true,
        companyName: true,
        email: true,
        createdAt: true,
        _count: {
          select: {
            subscriptions: true,
            invoices: true,
          },
        },
      },
      take: 50,
    }),
  ]);

  // Fetch names for top paying customers
  const topCustIds = topPayingCustomers.map((c) => c.customerId);
  const custRecords = await prisma.customer.findMany({
    where: { id: { in: topCustIds } },
    select: { id: true, companyName: true, email: true },
  });
  const custMap = new Map(custRecords.map((c) => [c.id, c.companyName || c.email]));

  return {
    period: range.label,
    totalCustomers,
    activeCustomerFlagCount:
      activeStatusGroup.find((s) => s.isActive)?._count.id || totalCustomers,
    inactiveCustomerFlagCount:
      activeStatusGroup.find((s) => !s.isActive)?._count.id || 0,
    newCustomersInPeriod,
    customersWithActiveSubs,
    customersWithAnySubs,
    customersWithoutActiveSubs: totalCustomers - customersWithActiveSubs,
    topPayingCustomers: topPayingCustomers.map((c) => ({
      customer: custMap.get(c.customerId) || c.customerId,
      totalSpent: Number(c._sum.paidAmount || 0),
      paidInvoicesCount: c._count.id,
    })),
    subscriptionDistributionSample: {
      zeroSubs: allCustomersSubsCount.filter((c) => c._count.subscriptions === 0).length,
      singleSub: allCustomersSubsCount.filter((c) => c._count.subscriptions === 1).length,
      multiSubs: allCustomersSubsCount.filter((c) => c._count.subscriptions > 1).length,
    },
  };
}

/**
 * Data fetcher for /forecast command
 */
export async function fetchForecastData(range: DateRange) {
  const now = new Date();
  const next90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const past6Months = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    activeSubs,
    expiringSubs,
    pastPayments,
    pastInvoices,
  ] = await Promise.all([
    // All active subscriptions with pricing details
    prisma.subscription.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        subscriptionNumber: true,
        billingCycle: true,
        nextBillingDate: true,
        expiryDate: true,
        lines: {
          select: {
            unitPrice: true,
            quantity: true,
            plan: { select: { name: true, billingCycle: true } },
          },
        },
      },
    }),

    // Subscriptions expiring within next 90 days
    prisma.subscription.findMany({
      where: {
        status: "ACTIVE",
        expiryDate: { gte: now, lte: next90Days },
      },
      select: {
        subscriptionNumber: true,
        expiryDate: true,
        billingCycle: true,
        customer: { select: { companyName: true, email: true } },
        lines: { select: { unitPrice: true, quantity: true } },
      },
    }),

    // Past 6 months payments for run-rate trend
    prisma.payment.findMany({
      where: {
        status: "SUCCESS",
        paymentDate: { gte: past6Months, lte: now },
      },
      select: {
        amount: true,
        paymentDate: true,
      },
      orderBy: { paymentDate: "asc" },
    }),

    // Past 6 months invoices for invoicing run-rate
    prisma.invoice.findMany({
      where: {
        status: { not: "CANCELLED" },
        issueDate: { gte: past6Months, lte: now },
      },
      select: {
        total: true,
        paidAmount: true,
        issueDate: true,
      },
      orderBy: { issueDate: "asc" },
    }),
  ]);

  return {
    period: range.label,
    activeSubscriptions: activeSubs.map((s) => ({
      subscriptionNumber: s.subscriptionNumber,
      billingCycle: s.billingCycle,
      nextBillingDate: s.nextBillingDate?.toISOString().slice(0, 10) || null,
      expiryDate: s.expiryDate?.toISOString().slice(0, 10) || null,
      lines: s.lines.map((l) => ({
        unitPrice: Number(l.unitPrice),
        quantity: l.quantity,
        plan: l.plan?.name || "Standard",
      })),
    })),
    expiringSubscriptions: expiringSubs.map((s) => ({
      subscriptionNumber: s.subscriptionNumber,
      customer: s.customer.companyName || s.customer.email,
      expiryDate: s.expiryDate?.toISOString().slice(0, 10) || "N/A",
      billingCycle: s.billingCycle,
      value: Number(s.lines[0]?.unitPrice || 0) * (s.lines[0]?.quantity || 1),
    })),
    historicalPayments: pastPayments.map((p) => ({
      amount: Number(p.amount),
      month: p.paymentDate.toISOString().slice(0, 7),
    })),
    historicalInvoices: pastInvoices.map((i) => ({
      total: Number(i.total),
      paidAmount: Number(i.paidAmount),
      month: i.issueDate.toISOString().slice(0, 7),
    })),
  };
}

