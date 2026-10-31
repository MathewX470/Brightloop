import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { runDunningEngine } from "@/modules/billing/run-dunning";
import { runBillingBatch } from "@/modules/billing/run-billing";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    // Only Staff and Admins can trigger dunning & billing engine
    if (!session || (session.role !== "ADMIN" && session.role !== "STAFF")) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const targetDate = body.targetDate ? new Date(body.targetDate) : new Date();

    // 1. Run recurring billing batch (generate new invoices)
    const billingReport = await runBillingBatch({ targetDate });

    // 2. Run dunning chaser (reminders, late fees, pause delinquent subs)
    const dunningReport = await runDunningEngine(targetDate);

    // 3. Record batch execution audit in BillingEvent table
    try {
      await prisma.billingEvent.create({
        data: {
          eventType: "BATCH_BILLING_CYCLE",
          status: "SUCCESS",
          attempts: 1,
          processedAt: new Date(),
          idempotencyKey: `BATCH_CYCLE_${Date.now()}`,
        },
      });
    } catch (e) {
      console.warn("Failed to record batch billing event:", e);
    }

    return NextResponse.json({
      success: true,
      message: "Automated Billing & Dunning Cycle Executed Successfully",
      billing: billingReport,
      dunning: dunningReport,
    });
  } catch (error) {
    console.error("Billing & Dunning trigger error:", error);
    return NextResponse.json(
      { error: "Failed to execute billing & dunning job." },
      { status: 500 }
    );
  }
}

