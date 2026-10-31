/**
 * Pure aggregation functions for preparing compact, structured data summaries
 * to be analyzed by the Groq API.
 */

// Helper to format currency values cleanly
function toCurrency(val: number): string {
  return `$${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function toPercent(val: number): string {
  return `${val.toFixed(1)}%`;
}

/**
 * Aggregations for /churn
 */
export function aggregateChurn(data: {
  period: string;
  activeSubscriptions: number;
  pausedSubscriptions: number;
  newSubscriptionsInPeriod: number;
  closedSubscriptionsInPeriod: number;
  allTimeClosedSubscriptions: number;
  closedSubscriptionsSample: Array<{
    subscriptionNumber: string;
    customer: string;
    billingCycle: string;
    closedAt: string;
    plan: string;
    monthlyValue: number;
  }>;
  activePlanDistribution: Array<{ plan: string; activeSubscribers: number }>;
}) {
  const {
    activeSubscriptions,
    closedSubscriptionsInPeriod,
    newSubscriptionsInPeriod,
    pausedSubscriptions,
  } = data;

  const totalBase = activeSubscriptions + closedSubscriptionsInPeriod;
  const churnRate = totalBase > 0 ? (closedSubscriptionsInPeriod / totalBase) * 100 : 0;

  // Plan cancellation counts
  const planChurnCounts: Record<string, number> = {};
  for (const s of data.closedSubscriptionsSample) {
    planChurnCounts[s.plan] = (planChurnCounts[s.plan] || 0) + 1;
  }

  return {
    reportType: "Subscription Churn Analysis",
    period: data.period,
    summaryMetrics: {
      activeSubscriptions,
      pausedSubscriptions,
      newSubscriptionsInPeriod,
      closedSubscriptionsInPeriod,
      allTimeClosedSubscriptions: data.allTimeClosedSubscriptions,
      churnRate: toPercent(churnRate),
      churnFormulaUsed: `Closed in Period (${closedSubscriptionsInPeriod}) / [Active (${activeSubscriptions}) + Closed (${closedSubscriptionsInPeriod})]`,
    },
    planDistribution: data.activePlanDistribution,
    planCancellations: Object.entries(planChurnCounts).map(([plan, count]) => ({
      plan,
      cancellations: count,
    })),
    recentCancellations: data.closedSubscriptionsSample.slice(0, 10),
    dataLimitations: [
      "Exact opening subscription count snapshot is derived from currently active plus period closures because historical point-in-time snapshot tables are not stored in database.",
      "Cancellations reflect subscriptions with status CLOSED or having closedAt/cancelledAt timestamps.",
    ],
  };
}

/**
 * Aggregations for /revenue
 */
export function aggregateRevenue(data: {
  period: string;
  paymentsInPeriod: Array<{ amount: number; date: string; month: string; method: string }>;
  invoicesInPeriod: Array<{
    total: number;
    paidAmount: number;
    status: string;
    date: string;
    month: string;
  }>;
  allTimeCollected: number;
  allTimePaymentCount: number;
  overdueInvoices: Array<{
    invoiceNumber: string;
    customer: string;
    total: number;
    paidAmount: number;
    balanceDue: number;
    dueDate: string;
  }>;
  activeSubsWithLines: Array<{
    billingCycle: string;
    lines: Array<{ planName: string; productName: string; unitPrice: number; quantity: number }>;
  }>;
}) {
  const totalCollected = data.paymentsInPeriod.reduce((sum, p) => sum + p.amount, 0);
  const totalInvoiced = data.invoicesInPeriod.reduce((sum, i) => sum + i.total, 0);
  const collectionEfficiency = totalInvoiced > 0 ? (totalCollected / totalInvoiced) * 100 : 0;

  // Monthly breakdown
  const monthlyPayments: Record<string, number> = {};
  for (const p of data.paymentsInPeriod) {
    monthlyPayments[p.month] = (monthlyPayments[p.month] || 0) + p.amount;
  }

  const monthlyInvoices: Record<string, number> = {};
  for (const i of data.invoicesInPeriod) {
    monthlyInvoices[i.month] = (monthlyInvoices[i.month] || 0) + i.total;
  }

  const allMonths = Array.from(
    new Set([...Object.keys(monthlyPayments), ...Object.keys(monthlyInvoices)])
  ).sort();

  const monthlyTrend = allMonths.map((m, idx) => {
    const collected = monthlyPayments[m] || 0;
    const billed = monthlyInvoices[m] || 0;
    const prevMonthCollected = idx > 0 ? monthlyPayments[allMonths[idx - 1]] || 0 : null;
    const momChange =
      prevMonthCollected !== null && prevMonthCollected > 0
        ? ((collected - prevMonthCollected) / prevMonthCollected) * 100
        : null;

    return {
      month: m,
      collected: toCurrency(collected),
      collectedRaw: collected,
      billed: toCurrency(billed),
      momGrowth: momChange !== null ? toPercent(momChange) : "N/A (Base)",
    };
  });

  // Top revenue-generating plans from active subscriptions
  const planRevenue: Record<string, number> = {};
  for (const s of data.activeSubsWithLines) {
    for (const l of s.lines) {
      const lineMonthly =
        s.billingCycle === "YEARLY"
          ? (l.unitPrice * l.quantity) / 12
          : s.billingCycle === "WEEKLY"
          ? l.unitPrice * l.quantity * 4.33
          : l.unitPrice * l.quantity;
      planRevenue[l.planName] = (planRevenue[l.planName] || 0) + lineMonthly;
    }
  }

  const topPlans = Object.entries(planRevenue)
    .sort((a, b) => b[1] - a[1])
    .map(([plan, mrr]) => ({ plan, estimatedMonthlyValue: toCurrency(mrr) }));

  const totalOverdue = data.overdueInvoices.reduce((sum, inv) => sum + inv.balanceDue, 0);

  return {
    reportType: "Revenue & Financial Analysis",
    period: data.period,
    summaryMetrics: {
      totalCollectedInPeriod: toCurrency(totalCollected),
      totalInvoicedInPeriod: toCurrency(totalInvoiced),
      collectionEfficiency: toPercent(collectionEfficiency),
      outstandingOverdueAmount: toCurrency(totalOverdue),
      overdueInvoicesCount: data.overdueInvoices.length,
      allTimeCollected: toCurrency(data.allTimeCollected),
      allTimePaymentCount: data.allTimePaymentCount,
    },
    monthlyTrend,
    topPlansByRecurringValue: topPlans,
    overdueInvoicesSample: data.overdueInvoices.slice(0, 8),
    businessRuleNote:
      "Actual payments collected represent settled cash in bank. Invoiced amounts represent receivables. Unpaid invoices are not treated as collected revenue.",
  };
}

/**
 * Aggregations for /subscriptions
 */
export function aggregateSubscriptions(data: {
  period: string;
  totalSubscriptions: number;
  statusBreakdown: Array<{ status: string; count: number }>;
  billingCycleBreakdown: Array<{ cycle: string; count: number }>;
  newSubscriptionsInPeriod: number;
  renewalsNext7Days: number;
  renewalsNext30Days: number;
  expiringNext30Days: number;
  upcomingRenewalsSample: Array<{
    subscriptionNumber: string;
    customer: string;
    nextBillingDate: string;
    billingCycle: string;
    plan: string;
    estimatedAmount: number;
  }>;
  planLines: Array<{ plan: string; billingCycle: string; price: number }>;
}) {
  const activeCount = data.statusBreakdown.find((s) => s.status === "ACTIVE")?.count || 0;
  const activeRate = data.totalSubscriptions > 0 ? (activeCount / data.totalSubscriptions) * 100 : 0;

  // Plan popularity
  const planSubCount: Record<string, number> = {};
  for (const l of data.planLines) {
    planSubCount[l.plan] = (planSubCount[l.plan] || 0) + 1;
  }

  const popularPlans = Object.entries(planSubCount)
    .sort((a, b) => b[1] - a[1])
    .map(([plan, count]) => ({ plan, activeSubscriptions: count }));

  return {
    reportType: "Subscription Performance & Health",
    period: data.period,
    summaryMetrics: {
      totalSubscriptions: data.totalSubscriptions,
      activeSubscriptions: activeCount,
      activeRate: toPercent(activeRate),
      newSubscriptionsInPeriod: data.newSubscriptionsInPeriod,
      upcomingRenewalsNext7Days: data.renewalsNext7Days,
      upcomingRenewalsNext30Days: data.renewalsNext30Days,
      contractsExpiringNext30Days: data.expiringNext30Days,
    },
    statusBreakdown: data.statusBreakdown.map((s) => ({
      status: s.status,
      count: s.count,
      percentage:
        data.totalSubscriptions > 0 ? toPercent((s.count / data.totalSubscriptions) * 100) : "0%",
    })),
    billingCycleDistribution: data.billingCycleBreakdown,
    popularPlans,
    upcomingRenewalsPipeline: data.upcomingRenewalsSample,
  };
}

/**
 * Aggregations for /payments
 */
export function aggregatePayments(data: {
  period: string;
  paymentsByStatus: Array<{ status: string; count: number; totalAmount: number }>;
  paymentsByMethod: Array<{ method: string; count: number; totalAmount: number }>;
  invoicesSummary: Array<{
    status: string;
    count: number;
    totalBilled: number;
    totalPaid: number;
  }>;
  overdueInvoices: Array<{
    invoiceNumber: string;
    customer: string;
    total: number;
    paidAmount: number;
    outstanding: number;
    dueDate: string;
  }>;
  recentPayments: Array<{
    paymentNumber: string;
    amount: number;
    method: string;
    date: string;
    customer: string;
    invoiceNumber: string;
  }>;
}) {
  const successRecord = data.paymentsByStatus.find((p) => p.status === "SUCCESS");
  const successTotal = successRecord?.totalAmount || 0;
  const successCount = successRecord?.count || 0;

  const totalAttempts = data.paymentsByStatus.reduce((sum, p) => sum + p.count, 0);
  const successRate = totalAttempts > 0 ? (successCount / totalAttempts) * 100 : 0;

  const totalOverdue = data.overdueInvoices.reduce((sum, i) => sum + i.outstanding, 0);

  return {
    reportType: "Payment Collections & Gateway Analysis",
    period: data.period,
    summaryMetrics: {
      successfulPaymentsAmount: toCurrency(successTotal),
      successfulPaymentsCount: successCount,
      totalPaymentAttempts: totalAttempts,
      paymentSuccessRate: toPercent(successRate),
      overdueInvoicesCount: data.overdueInvoices.length,
      totalOverdueOutstanding: toCurrency(totalOverdue),
    },
    paymentsByStatus: data.paymentsByStatus.map((p) => ({
      status: p.status,
      count: p.count,
      amount: toCurrency(p.totalAmount),
    })),
    methodDistribution: data.paymentsByMethod.map((m) => ({
      method: m.method,
      count: m.count,
      amount: toCurrency(m.totalAmount),
      shareOfSuccess: successTotal > 0 ? toPercent((m.totalAmount / successTotal) * 100) : "0%",
    })),
    invoicesSummary: data.invoicesSummary.map((i) => ({
      invoiceStatus: i.status,
      count: i.count,
      totalBilled: toCurrency(i.totalBilled),
      totalPaid: toCurrency(i.totalPaid),
      unpaidBalance: toCurrency(Math.max(0, i.totalBilled - i.totalPaid)),
    })),
    overdueInvoicesRequiringAction: data.overdueInvoices,
    recentPayments: data.recentPayments,
  };
}

/**
 * Aggregations for /customers
 */
export function aggregateCustomers(data: {
  period: string;
  totalCustomers: number;
  activeCustomerFlagCount: number;
  inactiveCustomerFlagCount: number;
  newCustomersInPeriod: number;
  customersWithActiveSubs: number;
  customersWithAnySubs: number;
  customersWithoutActiveSubs: number;
  topPayingCustomers: Array<{ customer: string; totalSpent: number; paidInvoicesCount: number }>;
  subscriptionDistributionSample: {
    zeroSubs: number;
    singleSub: number;
    multiSubs: number;
  };
}) {
  const activeSubAdoptionRate =
    data.totalCustomers > 0 ? (data.customersWithActiveSubs / data.totalCustomers) * 100 : 0;

  return {
    reportType: "Customer Base & Growth Analysis",
    period: data.period,
    summaryMetrics: {
      totalRegisteredCustomers: data.totalCustomers,
      newCustomersInPeriod: data.newCustomersInPeriod,
      customersWithActiveSubscriptions: data.customersWithActiveSubs,
      customersWithoutActiveSubscriptions: data.customersWithoutActiveSubs,
      subscriptionAdoptionRate: toPercent(activeSubAdoptionRate),
      activeCustomerAccounts: data.activeCustomerFlagCount,
    },
    segmentation: {
      activeSubscribers: data.customersWithActiveSubs,
      churnedOrInactiveSubscribers:
        data.customersWithAnySubs - data.customersWithActiveSubs,
      neverSubscribedOrLead: data.totalCustomers - data.customersWithAnySubs,
      singleSubscriptionAccounts: data.subscriptionDistributionSample.singleSub,
      multiSubscriptionAccounts: data.subscriptionDistributionSample.multiSubs,
    },
    topPayingCustomers: data.topPayingCustomers.map((c) => ({
      customer: c.customer,
      totalSpent: toCurrency(c.totalSpent),
      invoicesSettled: c.paidInvoicesCount,
    })),
  };
}

/**
 * Aggregations for /forecast
 */
export function aggregateForecast(data: {
  period: string;
  activeSubscriptions: Array<{
    subscriptionNumber: string;
    billingCycle: string;
    nextBillingDate: string | null;
    expiryDate: string | null;
    lines: Array<{ unitPrice: number; quantity: number; plan: string }>;
  }>;
  expiringSubscriptions: Array<{
    subscriptionNumber: string;
    customer: string;
    expiryDate: string;
    billingCycle: string;
    value: number;
  }>;
  historicalPayments: Array<{ amount: number; month: string }>;
  historicalInvoices: Array<{ total: number; paidAmount: number; month: string }>;
}) {
  // 1. Calculate base Monthly Recurring Revenue (MRR)
  let baseMRR = 0;
  for (const s of data.activeSubscriptions) {
    for (const l of s.lines) {
      const lineValue = l.unitPrice * l.quantity;
      switch (s.billingCycle) {
        case "YEARLY":
          baseMRR += lineValue / 12;
          break;
        case "WEEKLY":
          baseMRR += lineValue * 4.33;
          break;
        case "DAILY":
          baseMRR += lineValue * 30;
          break;
        case "MONTHLY":
        default:
          baseMRR += lineValue;
          break;
      }
    }
  }

  const baseARR = baseMRR * 12;

  // 2. Value of contracts expiring in the 90 day window
  const expiringValue90d = data.expiringSubscriptions.reduce((sum, s) => sum + s.value, 0);

  // 3. Historical monthly average
  const paymentsByMonth: Record<string, number> = {};
  for (const p of data.historicalPayments) {
    paymentsByMonth[p.month] = (paymentsByMonth[p.month] || 0) + p.amount;
  }
  const monthlyVals = Object.values(paymentsByMonth);
  const avgHistoricalMonthlyPayment =
    monthlyVals.length > 0 ? monthlyVals.reduce((a, b) => a + b, 0) / monthlyVals.length : baseMRR;

  // 4. Three-month projection scenarios
  const expectedQuarterRevenue = baseMRR * 3;
  const conservativeQuarterRevenue = Math.max(0, expectedQuarterRevenue - expiringValue90d);
  const bestCaseQuarterRevenue = expectedQuarterRevenue * 1.08; // 8% expansion / new booking assumption

  return {
    reportType: "Business Revenue & Cashflow Forecast",
    period: data.period,
    summaryMetrics: {
      currentBaseMRR: toCurrency(baseMRR),
      currentBaseARR: toCurrency(baseARR),
      activeSubscriptionsCount: data.activeSubscriptions.length,
      expiringContractsNext90DaysCount: data.expiringSubscriptions.length,
      expiringContractValueAtRisk: toCurrency(expiringValue90d),
      historicalMonthlyAverageCollected: toCurrency(avgHistoricalMonthlyPayment),
    },
    threeMonthProjections: {
      conservativeScenario: {
        quarterRevenue: toCurrency(conservativeQuarterRevenue),
        monthlyEstimate: toCurrency(conservativeQuarterRevenue / 3),
        assumptions: "Assumes zero new customer additions and 100% churn of expiring contracts.",
      },
      baselineScenario: {
        quarterRevenue: toCurrency(expectedQuarterRevenue),
        monthlyEstimate: toCurrency(baseMRR),
        assumptions:
          "Assumes all existing active subscriptions renew according to their billing schedules without change.",
      },
      bestCaseScenario: {
        quarterRevenue: toCurrency(bestCaseQuarterRevenue),
        monthlyEstimate: toCurrency(bestCaseQuarterRevenue / 3),
        assumptions:
          "Assumes 100% renewal retention plus moderate expansion or new client bookings (~8% uplift).",
      },
    },
    expiringContractsList: data.expiringSubscriptions,
    forecastDisclaimer:
      "All figures are mathematical run-rate estimates based on current active contract schedules and historical collection rates. These are not guaranteed financial earnings.",
  };
}

