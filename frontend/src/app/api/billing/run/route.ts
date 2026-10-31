import { NextResponse } from "next/server";
import { runBillingBatch } from "@/modules/billing/run-billing";

export async function POST(req: Request) {
  try {
    let body: { date?: string; dryRun?: boolean } = {};
    try {
      body = await req.json();
    } catch {
      // Empty body is acceptable
    }

    const targetDate = body.date ? new Date(body.date) : new Date();
    const dryRun = Boolean(body.dryRun);

    const report = await runBillingBatch({ targetDate, dryRun });
    return NextResponse.json({ success: true, report });
  } catch (err: unknown) {
    console.error("Billing run error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Billing batch failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST(new Request("http://localhost/api/billing/run"));
}

