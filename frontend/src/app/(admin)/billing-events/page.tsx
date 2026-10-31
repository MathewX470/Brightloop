import React from "react";
import prisma from "@/lib/db";
import { Topbar } from "@/components/layout/topbar";
import { getSession } from "@/modules/auth/session";
import { AutomatedBillingTriggerCard } from "../dashboard/_components/AutomatedBillingTriggerCard";
import { BillingEventsTableWithFilter } from "./_components/BillingEventsTableWithFilter";

export const dynamic = "force-dynamic";

export default async function BillingEventsPage() {
  const session = await getSession();

  // Fetch recent billing events from the database (up to 250 recent events)
  const events = await prisma.billingEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 250,
    include: {
      subscription: {
        include: { customer: true },
      },
      invoice: true,
    },
  });

  const totalCount = await prisma.billingEvent.count();

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar
        title="Background Worker Operations & Audits"
        subtitle="Manage and monitor background billing and dunning batch executions"
        userName={session?.name || "Admin"}
        userRole={session?.role ? (session.role.charAt(0) + session.role.slice(1).toLowerCase()) : "Admin"}
      />

      <div className="p-8 space-y-6 max-w-[1400px] w-full mx-auto">
        {/* Trigger Worker Card */}
        <AutomatedBillingTriggerCard />

        {/* Header Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
            <span className="text-xs text-gray-500 font-medium">Total Logged Executions</span>
            <div className="text-2xl font-bold text-gray-900 mt-1">{totalCount}</div>
            <span className="text-[11px] text-gray-400 mt-1 block">Full execution history</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
            <span className="text-xs text-gray-500 font-medium">🧾 Billing Batch Cycles</span>
            <div className="text-2xl font-bold text-emerald-600 mt-1">
              {events.filter((e) => e.eventType === "BATCH_BILLING_CYCLE").length}
            </div>
            <span className="text-[11px] text-emerald-600 font-medium mt-1 block">Evaluated renewals</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
            <span className="text-xs text-gray-500 font-medium">📧 Emails Dispatched</span>
            <div className="text-2xl font-bold text-indigo-600 mt-1">
              {events.filter((e) => e.eventType.includes("EMAIL")).length}
            </div>
            <span className="text-[11px] text-indigo-600 font-medium mt-1 block">Dunning &amp; Reminders</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
            <span className="text-xs text-gray-500 font-medium">Successful Status</span>
            <div className="text-2xl font-bold text-emerald-700 mt-1">
              {events.filter((e) => e.status === "SUCCESS").length}
            </div>
            <span className="text-[11px] text-gray-400 mt-1 block">100% verified</span>
          </div>
        </div>

        {/* Interactive Filter Table */}
        <BillingEventsTableWithFilter
          events={events.map((e) => ({
            id: e.id,
            eventType: e.eventType,
            status: e.status,
            idempotencyKey: e.idempotencyKey,
            createdAt: e.createdAt,
            subscription: e.subscription
              ? {
                  subscriptionNumber: e.subscription.subscriptionNumber,
                  customer: e.subscription.customer
                    ? { companyName: e.subscription.customer.companyName }
                    : null,
                }
              : null,
            invoice: e.invoice
              ? {
                  id: e.invoice.id,
                  invoiceNumber: e.invoice.invoiceNumber,
                }
              : null,
          }))}
        />
      </div>
    </div>
  );
}
