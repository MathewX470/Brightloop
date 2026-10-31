import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helper to parse arguments
function parseArgs() {
  const args = process.argv.slice(2);
  let dryRun = false;
  let daemon = false;
  let intervalMinutes = 60;
  let targetDate = new Date();

  for (const arg of args) {
    if (arg === "--dry-run") {
      dryRun = true;
    } else if (arg === "--daemon" || arg === "--watch") {
      daemon = true;
    } else if (arg.startsWith("--date=")) {
      const dateStr = arg.split("=")[1];
      targetDate = new Date(dateStr);
    } else if (arg.startsWith("--interval=")) {
      intervalMinutes = parseInt(arg.split("=")[1], 10) || 60;
    }
  }

  return { dryRun, daemon, intervalMinutes, targetDate };
}

function calculateNextBillingDate(currentDate, cycle) {
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

function calculateBilling(lines, discounts, targetDate) {
  let subtotal = 0;
  const computedLines = [];

  for (const item of lines) {
    const qty = Math.max(1, item.quantity);
    const unitPrice = Number(item.unitPrice);
    const lineSubtotal = Number((qty * unitPrice).toFixed(2));
    subtotal += lineSubtotal;
    computedLines.push({ ...item, lineSubtotal, unitPrice });
  }

  const appliedDiscounts = [];
  let totalDiscount = 0;

  for (const discount of discounts) {
    const start = new Date(discount.startDate);
    if (targetDate < start) continue;
    if (discount.endDate && targetDate > new Date(discount.endDate)) continue;
    if (discount.usageLimit !== null && discount.usageLimit !== undefined && discount.usedCount >= discount.usageLimit) {
      continue;
    }

    const minQty = discount.minimumQuantity || 1;
    const minPurchase = discount.minimumPurchase ? Number(discount.minimumPurchase) : 0;
    const discValue = Number(discount.value);

    const productScope = discount.products && discount.products.length > 0
      ? discount.products.map((p) => p.productId)
      : null;

    let eligibleSubtotal = 0;
    let eligibleQty = 0;

    for (const item of computedLines) {
      if (!productScope || (item.productId && productScope.includes(item.productId))) {
        eligibleSubtotal += item.lineSubtotal;
        eligibleQty += item.quantity;
      }
    }

    if (eligibleQty >= minQty && eligibleSubtotal >= minPurchase) {
      let amount = 0;
      if (discount.type === "PERCENTAGE") {
        amount = Number(((eligibleSubtotal * discValue) / 100).toFixed(2));
      } else {
        amount = Number(Math.min(discValue, eligibleSubtotal).toFixed(2));
      }

      if (amount > 0) {
        appliedDiscounts.push({ discountId: discount.id, amount, name: discount.name });
        totalDiscount += amount;
      }
    }
  }

  totalDiscount = Number(Math.min(totalDiscount, subtotal).toFixed(2));

  let totalTax = 0;
  const finalLines = [];

  for (const item of computedLines) {
    const lineDiscount = subtotal > 0
      ? Number(((item.lineSubtotal / subtotal) * totalDiscount).toFixed(2))
      : 0;

    const lineAfterDiscount = Math.max(0, item.lineSubtotal - lineDiscount);
    let lineTax = 0;
    const taxRate = item.taxRate ? Number(item.taxRate) : 0;

    if (taxRate > 0) {
      if (item.taxType === "FIXED") {
        lineTax = Number(taxRate.toFixed(2));
      } else {
        lineTax = Number(((lineAfterDiscount * taxRate) / 100).toFixed(2));
      }
    }

    totalTax += lineTax;
    finalLines.push({
      productId: item.productId,
      variantId: item.variantId,
      taxId: item.taxId,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.lineSubtotal,
      discountAmount: lineDiscount,
      taxAmount: lineTax,
      total: Number((lineAfterDiscount + lineTax).toFixed(2)),
    });
  }

  return {
    subtotal: Number(subtotal.toFixed(2)),
    discountAmount: Number(totalDiscount.toFixed(2)),
    taxAmount: Number(totalTax.toFixed(2)),
    total: Math.max(0, Number((subtotal - totalDiscount + totalTax).toFixed(2))),
    lines: finalLines,
    appliedDiscounts,
  };
}

async function runBillingJob(targetDate, dryRun) {
  const dateKey = targetDate.toISOString().slice(0, 10);
  console.log(`\n======================================================`);
  console.log(`⚡ Brightloop Automated Billing Engine`);
  console.log(`📅 Target Date: ${dateKey}`);
  console.log(`🔍 Mode: ${dryRun ? "DRY RUN (Preview Only)" : "LIVE PRODUCTION"}`);
  console.log(`======================================================\n`);

  // 1. Find active subscriptions due
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

  const discounts = await prisma.discount.findMany({
    where: { isActive: true },
    include: { products: true },
  });

  let invoicesGenerated = 0;
  let skippedCount = 0;
  let failedCount = 0;
  let totalRevenue = 0;

  for (const sub of dueSubscriptions) {
    const idempotencyKey = `BILLING_${sub.id}_${dateKey}`;

    // 2. Idempotency Check
    const existing = await prisma.billingEvent.findUnique({
      where: { idempotencyKey },
    });

    if (existing && existing.status === "SUCCESS") {
      skippedCount++;
      console.log(`⏭️ [SKIPPED] ${sub.subscriptionNumber} (${sub.customer.companyName}) -> Already billed for ${dateKey}`);
      continue;
    }

    try {
      const lineInputs = sub.lines.map((l) => ({
        productId: l.productId,
        variantId: l.variantId,
        taxId: l.taxId,
        description: `${l.product.name}${l.variant ? ` (${l.variant.name})` : ""} - ${l.plan.name}`,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        taxRate: l.tax ? l.tax.rate : 0,
        taxType: l.tax ? l.tax.type : "PERCENTAGE",
      }));

      const calc = calculateBilling(lineInputs, discounts, targetDate);

      if (dryRun) {
        invoicesGenerated++;
        totalRevenue += calc.total;
        console.log(`🔎 [DRY-RUN] ${sub.subscriptionNumber} (${sub.customer.companyName}) -> Projected: $${calc.total} (Subtotal: $${calc.subtotal}, Tax: $${calc.taxAmount}, Disc: -$${calc.discountAmount})`);
        continue;
      }

      // Generate invoice in database
      const year = targetDate.getFullYear();
      const count = await prisma.invoice.count();
      const seq = String(count + 1).padStart(4, "0");
      const invoiceNumber = `INV-${year}-${seq}`;

      const issueDate = new Date(targetDate);
      const dueDate = new Date(issueDate);
      dueDate.setDate(dueDate.getDate() + (sub.paymentTermsDays || 0));

      const nextBillingDate = calculateNextBillingDate(sub.nextBillingDate || targetDate, sub.billingCycle);

      await prisma.$transaction(async (tx) => {
        const inv = await tx.invoice.create({
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

        // Advance subscription
        let newStatus = sub.status;
        const hasExpired = sub.expiryDate && nextBillingDate > new Date(sub.expiryDate);
        if (hasExpired && sub.lines.some((l) => l.plan.autoClose)) {
          newStatus = "CLOSED";
        }

        await tx.subscription.update({
          where: { id: sub.id },
          data: {
            nextBillingDate,
            currentPeriodStart: issueDate,
            currentPeriodEnd: nextBillingDate,
            status: newStatus,
            closedAt: newStatus === "CLOSED" ? new Date() : undefined,
          },
        });

        // Record BillingEvent
        await tx.billingEvent.upsert({
          where: { idempotencyKey },
          update: {
            status: "SUCCESS",
            invoiceId: inv.id,
            processedAt: new Date(),
            attempts: { increment: 1 },
          },
          create: {
            subscriptionId: sub.id,
            invoiceId: inv.id,
            eventType: "INVOICE_GENERATED",
            status: "SUCCESS",
            idempotencyKey,
            processedAt: new Date(),
            attempts: 1,
          },
        });
      });

      invoicesGenerated++;
      totalRevenue += calc.total;
      console.log(`✅ [PROCESSED] ${sub.subscriptionNumber} (${sub.customer.companyName}) -> ${invoiceNumber} ($${calc.total})`);
    } catch (err) {
      failedCount++;
      console.error(`❌ [FAILED] ${sub.subscriptionNumber} (${sub.customer.companyName}):`, err.message);
    }
  }

  // 3. Overdue invoices check
  const overdue = await prisma.invoice.findMany({
    where: {
      status: "CONFIRMED",
      dueDate: { lt: targetDate },
    },
    include: { customer: true },
  });

  console.log(`\n--- Batch Summary ---`);
  console.log(`Subscriptions Scanned: ${dueSubscriptions.length}`);
  console.log(`Invoices Generated:    ${invoicesGenerated}`);
  console.log(`Skipped (Idempotent):  ${skippedCount}`);
  console.log(`Failed:                ${failedCount}`);
  console.log(`Total Billed:          $${totalRevenue.toFixed(2)}`);
  console.log(`Overdue Invoices:      ${overdue.length}`);

  if (overdue.length > 0) {
    console.log(`\n⚠️ --- Overdue Invoices Requiring Chasing ---`);
    for (const ov of overdue) {
      const balance = Number(ov.total) - Number(ov.paidAmount);
      console.log(`🔴 ${ov.invoiceNumber} (${ov.customer.companyName}): $${balance.toFixed(2)} (Due: ${ov.dueDate.toISOString().slice(0, 10)})`);
    }
  }

  console.log(`\nCompleted at ${new Date().toLocaleTimeString()}.\n`);
}

async function main() {
  const { dryRun, daemon, intervalMinutes, targetDate } = parseArgs();

  if (!daemon) {
    await runBillingJob(targetDate, dryRun);
    await prisma.$disconnect();
    process.exit(0);
  } else {
    console.log(`🔄 Billing Worker running in Daemon Mode (interval: ${intervalMinutes} minutes)...`);
    await runBillingJob(targetDate, dryRun);

    setInterval(async () => {
      try {
        await runBillingJob(new Date(), dryRun);
      } catch (err) {
        console.error("Scheduled cycle error:", err);
      }
    }, intervalMinutes * 60 * 1000);
  }
}

main().catch(async (e) => {
  console.error("Worker fatal error:", e);
  await prisma.$disconnect();
  process.exit(1);
});

