import { prisma } from "@/lib/db";
import { generateInvoiceForSubscription, GeneratedInvoiceResult } from "./generate-invoice";

export interface BillingRunOptions {
  targetDate?: Date;
  dryRun?: boolean;
}

export interface BillingRunReport {
  timestamp: string;
  targetDate: string;
  dryRun: boolean;
  totalSubscriptionsChecked: number;
  invoicesGenerated: number;
  skippedCount: number;
  failedCount: number;
  totalRevenueBilled: number;
  overdueInvoicesFound: number;
  results: Array<{
    subscriptionId: string;
    subscriptionNumber: string;
    customerName: string;
    status: "PROCESSED" | "SKIPPED" | "FAILED";
    details?: GeneratedInvoiceResult;
    reason?: string;
  }>;
  overdueInvoices: Array<{
    id: string;
    invoiceNumber: string;
    customerName: string;
    total: number;
    dueDate: string;
    daysOverdue: number;
  }>;
}

/**
 * Idempotent batch billing job.
 * Scans all due active subscriptions, prevents double-billing via idempotency keys,
 * issues invoices, and flags overdue accounts for chasing.
 */
export async function runBillingBatch({
  targetDate = new Date(),
  dryRun = false,
}: BillingRunOptions = {}): Promise<BillingRunReport> {
  const dateKey = targetDate.toISOString().slice(0, 10);

  // 1. Find all active subscriptions where nextBillingDate <= targetDate
  const dueSubscriptions = await prisma.subscription.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { nextBillingDate: { lte: targetDate } },
        { nextBillingDate: null },
      ],
    },
    include: {
      customer: true,
      lines: true,
    },
  });

  const reportResults: BillingRunReport["results"] = [];
  let invoicesGenerated = 0;
  let skippedCount = 0;
  let failedCount = 0;
  let totalRevenueBilled = 0;

  for (const sub of dueSubscriptions) {
    const idempotencyKey = `BILLING_${sub.id}_${dateKey}`;

    // 2. Check for duplicate billing event (Idempotency)
    const existingEvent = await prisma.billingEvent.findUnique({
      where: { idempotencyKey },
    });

    if (existingEvent && existingEvent.status === "SUCCESS") {
      skippedCount++;
      reportResults.push({
        subscriptionId: sub.id,
        subscriptionNumber: sub.subscriptionNumber,
        customerName: sub.customer.companyName,
        status: "SKIPPED",
        reason: `Already billed for period ${dateKey} (Invoice: ${existingEvent.invoiceId})`,
      });
      continue;
    }

    // 3. Process billing
    try {
      const invResult = await generateInvoiceForSubscription({
        subscriptionId: sub.id,
        targetDate,
        dryRun,
      });

      if (invResult.success) {
        invoicesGenerated++;
        totalRevenueBilled += invResult.total || 0;
        reportResults.push({
          subscriptionId: sub.id,
          subscriptionNumber: sub.subscriptionNumber,
          customerName: sub.customer.companyName,
          status: "PROCESSED",
          details: invResult,
        });
      } else {
        failedCount++;
        reportResults.push({
          subscriptionId: sub.id,
          subscriptionNumber: sub.subscriptionNumber,
          customerName: sub.customer.companyName,
          status: "FAILED",
          reason: invResult.error,
        });
      }
    } catch (err: unknown) {
      failedCount++;
      const errorMsg = err instanceof Error ? err.message : "Unknown billing error";
      reportResults.push({
        subscriptionId: sub.id,
        subscriptionNumber: sub.subscriptionNumber,
        customerName: sub.customer.companyName,
        status: "FAILED",
        reason: errorMsg,
      });
    }
  }

  // 4. Overdue invoice scan (chasing support)
  const overdueRaw = await prisma.invoice.findMany({
    where: {
      status: "CONFIRMED",
      dueDate: { lt: targetDate },
    },
    include: { customer: true },
  });

  const overdueInvoices = overdueRaw.map((inv) => {
    const dueTime = new Date(inv.dueDate).getTime();
    const currentTime = targetDate.getTime();
    const diffDays = Math.max(1, Math.floor((currentTime - dueTime) / (1000 * 60 * 60 * 24)));
    return {
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      customerName: inv.customer.companyName,
      total: Number(inv.total) - Number(inv.paidAmount),
      dueDate: inv.dueDate.toISOString().slice(0, 10),
      daysOverdue: diffDays,
    };
  });

  return {
    timestamp: new Date().toISOString(),
    targetDate: dateKey,
    dryRun,
    totalSubscriptionsChecked: dueSubscriptions.length,
    invoicesGenerated,
    skippedCount,
    failedCount,
    totalRevenueBilled: Number(totalRevenueBilled.toFixed(2)),
    overdueInvoicesFound: overdueInvoices.length,
    results: reportResults,
    overdueInvoices,
  };
}
