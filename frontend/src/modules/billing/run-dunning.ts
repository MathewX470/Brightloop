import { prisma } from "@/lib/db";
import { getEmailTransporter } from "@/lib/email";

export interface DunningReport {
  timestamp: string;
  totalOverdueChecked: number;
  remindersSent: number;
  lateFeesApplied: number;
  subscriptionsPaused: number;
  details: Array<{
    invoiceNumber: string;
    customerName: string;
    daysOverdue: number;
    actionTaken: "REMINDER_SENT" | "LATE_FEE_APPLIED" | "SUBSCRIPTION_PAUSED" | "NO_ACTION";
    lateFeeAmount?: number;
    newTotal?: number;
    subscriptionStatus?: string;
  }>;
}

/**
 * Smart Dunning Engine:
 * - Day 1-6 Overdue: Friendly reminder email
 * - Day 7-9 Overdue: 5% late fee surcharge applied + urgent reminder email
 * - Day 10+ Overdue: Subscription paused + suspension notification email
 */
export async function runDunningEngine(
  targetDate: Date = new Date(),
  forceDispatch: boolean = false
): Promise<DunningReport> {
  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      status: { in: ["CONFIRMED", "PARTIALLY_PAID"] },
      dueDate: { lt: targetDate },
    },
    include: {
      customer: true,
      subscription: true,
    },
  });

  const transporter = getEmailTransporter();
  const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER || '"Brightloop Billing" <billing@brightloop.local>';
  const appUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  let remindersSent = 0;
  let lateFeesApplied = 0;
  let subscriptionsPaused = 0;
  const details: DunningReport["details"] = [];

  for (const inv of overdueInvoices) {
    const dueTime = new Date(inv.dueDate).getTime();
    const currentTime = targetDate.getTime();
    const daysOverdue = Math.max(1, Math.floor((currentTime - dueTime) / (1000 * 60 * 60 * 24)));

    // Prevent duplicate emails: Check if an email was ALREADY sent for this invoice today (unless forceDispatch is enabled for demo intervals)
    const dateKey = targetDate.toISOString().slice(0, 10);
    const idempotencyKey = forceDispatch
      ? `DUNNING_${inv.id}_DEMO_${Date.now()}`
      : `DUNNING_${inv.id}_STAGE_${daysOverdue >= 10 ? 'SUSPEND' : daysOverdue >= 7 ? 'LATEFEE' : 'REMIND'}_${dateKey}`;

    if (!forceDispatch) {
      const alreadySentToday = await prisma.billingEvent.findUnique({
        where: { idempotencyKey },
      });

      if (alreadySentToday) {
        details.push({
          invoiceNumber: inv.invoiceNumber,
          customerName: inv.customer.companyName,
          daysOverdue,
          actionTaken: "NO_ACTION",
        });
        continue;
      }
    }

    const remainingBalance = Number(inv.total) - Number(inv.paidAmount);
    const invoicePayUrl = `${appUrl}/client/my-invoices`;

    if (daysOverdue >= 10) {
      // Stage 3: Account / Subscription Suspension
      let subStatus = "ALREADY_PAUSED";
      if (inv.subscription && inv.subscription.status !== "PAUSED") {
        await prisma.subscription.update({
          where: { id: inv.subscription.id },
          data: { status: "PAUSED" },
        });
        subStatus = "PAUSED";
        subscriptionsPaused++;
      }

      // Send Suspension Notice Email
      try {
        await transporter.sendMail({
          from: fromEmail,
          to: inv.customer.email,
          subject: `🚨 Action Required: Subscription Paused for Invoice #${inv.invoiceNumber}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #fee2e2; border-radius: 8px;">
              <h2 style="color: #dc2626;">Brightloop Subscription Suspended</h2>
              <p>Dear ${inv.customer.companyName},</p>
              <p>Your subscription has been <strong>temporarily paused</strong> because invoice <strong>#${inv.invoiceNumber}</strong> is <strong>${daysOverdue} days overdue</strong>.</p>
              <p><strong>Outstanding Balance:</strong> $${remainingBalance.toFixed(2)}</p>
              <p style="margin: 20px 0;">
                <a href="${invoicePayUrl}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                  Pay Outstanding Invoice & Reactivate
                </a>
              </p>
              <p style="color: #64748b; font-size: 13px;">Once payment is received, your subscription will be immediately reactivated.</p>
            </div>
          `,
        });

        // Record email dispatch in BillingEvent
        await prisma.billingEvent.create({
          data: {
            eventType: "DUNNING_SUSPENSION_EMAIL_SENT",
            status: "SUCCESS",
            subscriptionId: inv.subscriptionId,
            invoiceId: inv.id,
            idempotencyKey,
            processedAt: new Date(),
          },
        });
      } catch (err) {
        console.error(`Failed to send suspension email to ${inv.customer.email}:`, err);
      }

      details.push({
        invoiceNumber: inv.invoiceNumber,
        customerName: inv.customer.companyName,
        daysOverdue,
        actionTaken: "SUBSCRIPTION_PAUSED",
        subscriptionStatus: subStatus,
      });
    } else if (daysOverdue >= 7) {
      // Stage 2: 5% Late Surcharge Penalty
      const lateFeeRate = 0.05; // 5%
      const lateFee = Number((Number(inv.subtotal) * lateFeeRate).toFixed(2));
      const newTotal = Number(inv.total) + lateFee;

      // Update invoice total with late fee
      await prisma.invoice.update({
        where: { id: inv.id },
        data: {
          total: newTotal,
        },
      });

      lateFeesApplied++;

      // Send Late Fee Warning Email
      try {
        await transporter.sendMail({
          from: fromEmail,
          to: inv.customer.email,
          subject: `⚠️ Overdue Notice: 5% Late Surcharge Applied to #${inv.invoiceNumber}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #fed7aa; border-radius: 8px;">
              <h2 style="color: #ea580c;">Brightloop Overdue Notice</h2>
              <p>Dear ${inv.customer.companyName},</p>
              <p>Invoice <strong>#${inv.invoiceNumber}</strong> is now <strong>${daysOverdue} days overdue</strong>.</p>
              <p>A <strong>5% late surcharge ($${lateFee.toFixed(2)})</strong> has been added to your balance.</p>
              <p><strong>New Total Due:</strong> $${newTotal.toFixed(2)}</p>
              <p style="color: #dc2626; font-weight: bold;">Important: Service will be paused in ${10 - daysOverdue} days if unpaid.</p>
              <p style="margin: 20px 0;">
                <a href="${invoicePayUrl}" style="background-color: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                  Pay Invoice Now
                </a>
              </p>
            </div>
          `,
        });

        // Record late fee and email dispatch in BillingEvent
        await prisma.billingEvent.create({
          data: {
            eventType: "DUNNING_LATE_FEE_EMAIL_SENT",
            status: "SUCCESS",
            subscriptionId: inv.subscriptionId,
            invoiceId: inv.id,
            idempotencyKey,
            processedAt: new Date(),
          },
        });
      } catch (err) {
        console.error(`Failed to send late fee email to ${inv.customer.email}:`, err);
      }

      details.push({
        invoiceNumber: inv.invoiceNumber,
        customerName: inv.customer.companyName,
        daysOverdue,
        actionTaken: "LATE_FEE_APPLIED",
        lateFeeAmount: lateFee,
        newTotal,
      });
    } else {
      // Stage 1: Day 1-6 Friendly Reminder
      remindersSent++;

      try {
        await transporter.sendMail({
          from: fromEmail,
          to: inv.customer.email,
          subject: `Reminder: Invoice #${inv.invoiceNumber} is Due`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
              <h2 style="color: #4f46e5;">Brightloop Billing Reminder</h2>
              <p>Hello ${inv.customer.companyName},</p>
              <p>This is a friendly reminder that invoice <strong>#${inv.invoiceNumber}</strong> for <strong>$${remainingBalance.toFixed(2)}</strong> was due on ${inv.dueDate.toISOString().slice(0, 10)}.</p>
              <p style="margin: 20px 0;">
                <a href="${invoicePayUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                  View & Pay Invoice
                </a>
              </p>
              <p style="color: #64748b; font-size: 13px;">If you have already submitted payment, please disregard this notice.</p>
            </div>
          `,
        });
        // Record reminder email dispatch in BillingEvent
        await prisma.billingEvent.create({
          data: {
            eventType: "DUNNING_REMINDER_EMAIL_SENT",
            status: "SUCCESS",
            subscriptionId: inv.subscriptionId,
            invoiceId: inv.id,
            idempotencyKey,
            processedAt: new Date(),
          },
        });
      } catch (err) {
        console.error(`Failed to send friendly reminder to ${inv.customer.email}:`, err);
      }

      details.push({
        invoiceNumber: inv.invoiceNumber,
        customerName: inv.customer.companyName,
        daysOverdue,
        actionTaken: "REMINDER_SENT",
      });
    }
  }

  return {
    timestamp: new Date().toISOString(),
    totalOverdueChecked: overdueInvoices.length,
    remindersSent,
    lateFeesApplied,
    subscriptionsPaused,
    details,
  };
}

