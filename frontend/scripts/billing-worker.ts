import { runBillingBatch } from "../src/modules/billing/run-billing";
import { prisma } from "../src/lib/db";

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

async function executeBillingJob(targetDate: Date, dryRun: boolean) {
  console.log(`\n======================================================`);
  console.log(`⚡ Brightloop Automated Billing Engine`);
  console.log(`📅 Target Date: ${targetDate.toISOString().slice(0, 10)}`);
  console.log(`🔍 Mode: ${dryRun ? "DRY RUN (Preview Only)" : "LIVE PRODUCTION"}`);
  console.log(`======================================================\n`);

  const report = await runBillingBatch({ targetDate, dryRun });

  console.log(`Checked Subscriptions: ${report.totalSubscriptionsChecked}`);
  console.log(`Invoices Generated:   ${report.invoicesGenerated}`);
  console.log(`Skipped (Idempotent): ${report.skippedCount}`);
  console.log(`Failed Subscriptions: ${report.failedCount}`);
  console.log(`Total Revenue Billed: $${report.totalRevenueBilled.toLocaleString("en-US", { minimumFractionDigits: 2 })}`);
  console.log(`Overdue Invoices:     ${report.overdueInvoicesFound}`);

  if (report.results.length > 0) {
    console.log(`\n--- Execution Details ---`);
    for (const res of report.results) {
      if (res.status === "PROCESSED") {
        console.log(`✅ [PROCESSED] ${res.subscriptionNumber} (${res.customerName}) -> Invoice ${res.details?.invoiceNumber} ($${res.details?.total})`);
      } else if (res.status === "SKIPPED") {
        console.log(`⏭️ [SKIPPED]   ${res.subscriptionNumber} (${res.customerName}) -> ${res.reason}`);
      } else {
        console.log(`❌ [FAILED]    ${res.subscriptionNumber} (${res.customerName}) -> ${res.reason}`);
      }
    }
  }

  if (report.overdueInvoices.length > 0) {
    console.log(`\n⚠️ --- Overdue Invoices Requiring Chasing ---`);
    for (const ov of report.overdueInvoices) {
      console.log(`🔴 ${ov.invoiceNumber} (${ov.customerName}): $${ov.total} (${ov.daysOverdue} days overdue, due: ${ov.dueDate})`);
    }
  }

  console.log(`\nFinished billing run at ${new Date().toLocaleTimeString()}.\n`);
}

async function main() {
  const { dryRun, daemon, intervalMinutes, targetDate } = parseArgs();

  if (!daemon) {
    // Single execution
    await executeBillingJob(targetDate, dryRun);
    await prisma.$disconnect();
    process.exit(0);
  } else {
    // Daemon / Periodic execution for Docker container
    console.log(`🔄 Starting Billing Worker in Daemon Mode (interval: ${intervalMinutes} minutes)...`);
    await executeBillingJob(targetDate, dryRun);

    setInterval(async () => {
      try {
        await executeBillingJob(new Date(), dryRun);
      } catch (err) {
        console.error("Error during scheduled billing cycle:", err);
      }
    }, intervalMinutes * 60 * 1000);
  }
}

main().catch(async (e) => {
  console.error("Fatal error in billing worker:", e);
  await prisma.$disconnect();
  process.exit(1);
});
