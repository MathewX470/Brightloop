import { prisma } from "@/lib/db";
import { calculateBilling, DiscountRule, LineInput } from "./calculate";

export interface GenerateInvoiceOptions {
  subscriptionId: string;
  targetDate?: Date;
  dryRun?: boolean;
}

export interface GeneratedInvoiceResult {
  success: boolean;
  invoiceNumber?: string;
  invoiceId?: string;
  total?: number;
  subtotal?: number;
  taxAmount?: number;
  discountAmount?: number;
  nextBillingDate?: Date;
  status?: string;
  error?: string;
}

/**
 * Calculates next billing date based on the plan's billing frequency.
 */
export function calculateNextBillingDate(currentDate: Date, cycle: string): Date {
  const next = new Date(currentDate);
  switch (cycle) {
    case "DAILY":
      next.setDate(next.getDate() + 1);
      break;
    case "WEEKLY":
      next.setDate(next.getDate() + 7);
      break;
    case "YEARLY":
      next.setFullYear(next.getFullYear() + 1);
      break;
    case "MONTHLY":
    default:
      next.setMonth(next.getMonth() + 1);
      break;
  }
  return next;
}

/**
 * Generates an invoice for an active subscription.
 * Handles calculation, discounts, taxes, database transaction, and cycle advancement.
 */
export async function generateInvoiceForSubscription({
  subscriptionId,
  targetDate = new Date(),
  dryRun = false,
}: GenerateInvoiceOptions): Promise<GeneratedInvoiceResult> {
  // 1. Fetch full subscription details
  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: {
      customer: true,
      lines: {
        include: {
          product: true,
          plan: true,
          tax: true,
          variant: true,
        },
      },
    },
  });

  if (!sub) {
    return { success: false, error: `Subscription ${subscriptionId} not found` };
  }

  if (sub.status !== "ACTIVE") {
    return { success: false, error: `Subscription ${sub.subscriptionNumber} is not active (status: ${sub.status})` };
  }

  // 2. Fetch active discounts
  const rawDiscounts = await prisma.discount.findMany({
    where: { isActive: true },
    include: { products: true },
  });

  const availableDiscounts: DiscountRule[] = rawDiscounts.map((d) => ({
    id: d.id,
    name: d.name,
    type: d.type as "PERCENTAGE" | "FIXED",
    value: Number(d.value),
    minimumPurchase: d.minimumPurchase ? Number(d.minimumPurchase) : null,
    minimumQuantity: d.minimumQuantity,
    startDate: d.startDate,
    endDate: d.endDate,
    usageLimit: d.usageLimit,
    usedCount: d.usedCount,
    products: d.products.map((p) => ({ productId: p.productId })),
  }));

  // 3. Prepare line items for calculation
  const lineInputs: LineInput[] = sub.lines.map((l) => ({
    productId: l.productId,
    variantId: l.variantId,
    taxId: l.taxId,
    description: `${l.product.name}${l.variant ? ` (${l.variant.name})` : ""} - ${l.plan.name}`,
    quantity: l.quantity,
    unitPrice: Number(l.unitPrice),
    taxRate: l.tax ? Number(l.tax.rate) : 0,
    taxType: l.tax ? (l.tax.type as "PERCENTAGE" | "FIXED") : "PERCENTAGE",
  }));

  // 4. Calculate pure numbers
  const calc = calculateBilling(lineInputs, availableDiscounts, targetDate);

  // If dry-run, return preview without modifying database
  if (dryRun) {
    const nextDate = calculateNextBillingDate(sub.nextBillingDate || targetDate, sub.billingCycle);
    return {
      success: true,
      invoiceNumber: `PREVIEW-${sub.subscriptionNumber}`,
      subtotal: calc.subtotal,
      discountAmount: calc.discountAmount,
      taxAmount: calc.taxAmount,
      total: calc.total,
      nextBillingDate: nextDate,
      status: "DRAFT",
    };
  }

  // 5. Generate sequential invoice number (INV-YYYY-XXXX)
  const year = targetDate.getFullYear();
  const invoiceCount = await prisma.invoice.count();
  const seq = String(invoiceCount + 1).padStart(4, "0");
  const invoiceNumber = `INV-${year}-${seq}`;

  // Calculate Due Date based on payment terms
  const issueDate = new Date(targetDate);
  const dueDate = new Date(issueDate);
  dueDate.setDate(dueDate.getDate() + (sub.paymentTermsDays || 0));

  // Determine next billing cycle dates
  const nextBillingDate = calculateNextBillingDate(sub.nextBillingDate || targetDate, sub.billingCycle);

  // 6. Execute atomic database transaction
  const result = await prisma.$transaction(async (tx) => {
    // A. Create the invoice
    const invoice = await tx.invoice.create({
      data: {
        invoiceNumber,
        customerId: sub.customerId,
        subscriptionId: sub.id,
        status: "CONFIRMED",
        issueDate,
        dueDate,
        subtotal: calc.subtotal,
        discountAmount: calc.discountAmount,
        taxAmount: calc.taxAmount,
        total: calc.total,
        paidAmount: 0,
        lines: {
          create: calc.lines.map((l) => ({
            productId: l.productId,
            variantId: l.variantId,
            taxId: l.taxId,
            description: l.description,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            subtotal: l.subtotal,
            discountAmount: l.discountAmount,
            taxAmount: l.taxAmount,
            total: l.total,
          })),
        },
      },
    });

    // B. Record discount applications and increment usage counter
    for (const applied of calc.appliedDiscounts) {
      await tx.invoiceDiscount.create({
        data: {
          invoiceId: invoice.id,
          discountId: applied.discountId,
          discountAmount: applied.amount,
        },
      });

      await tx.discountUsage.create({
        data: {
          discountId: applied.discountId,
          customerId: sub.customerId,
          invoiceId: invoice.id,
          discountAmount: applied.amount,
        },
      });

      await tx.discount.update({
        where: { id: applied.discountId },
        data: { usedCount: { increment: 1 } },
      });
    }

    // C. Advance subscription billing schedule
    let newStatus = sub.status;
    // Check if autoClose policy applies and contract has expired
    const hasExpired = sub.expiryDate && nextBillingDate > new Date(sub.expiryDate);
    const shouldClose = hasExpired && sub.lines.some((l) => l.plan.autoClose);
    if (shouldClose) {
      newStatus = "CLOSED";
    }

    await tx.subscription.update({
      where: { id: sub.id },
      data: {
        nextBillingDate,
        currentPeriodStart: issueDate,
        currentPeriodEnd: nextBillingDate,
        status: newStatus,
        closedAt: shouldClose ? new Date() : undefined,
      },
    });

    // D. Log BillingEvent for idempotency and audit
    const idempotencyKey = `BILLING_${sub.id}_${issueDate.toISOString().slice(0, 10)}`;
    await tx.billingEvent.upsert({
      where: { idempotencyKey },
      update: {
        status: "SUCCESS",
        invoiceId: invoice.id,
        processedAt: new Date(),
        attempts: { increment: 1 },
      },
      create: {
        subscriptionId: sub.id,
        invoiceId: invoice.id,
        eventType: "INVOICE_GENERATED",
        status: "SUCCESS",
        idempotencyKey,
        processedAt: new Date(),
        attempts: 1,
      },
    });

    return invoice;
  });

  return {
    success: true,
    invoiceNumber: result.invoiceNumber,
    invoiceId: result.id,
    subtotal: Number(result.subtotal),
    discountAmount: Number(result.discountAmount),
    taxAmount: Number(result.taxAmount),
    total: Number(result.total),
    nextBillingDate,
    status: result.status,
  };
}
