import React from "react";
import Link from "next/link";
import prisma from "@/lib/db";
import { Topbar } from "@/components/layout/topbar";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  try {
    const now = new Date();

    const [
      activeSubscriptionsCount,
      totalSubscriptionsCount,
      totalCustomersCount,
      invoicesAggregate,
      overdueInvoices,
      recentSubscriptions,
    ] = await Promise.all([
      prisma.subscription.count({ where: { status: "ACTIVE" } }),
      prisma.subscription.count(),
      prisma.customer.count(),
      prisma.invoice.aggregate({
        _sum: {
          total: true,
          paidAmount: true,
        },
      }),
      prisma.invoice.findMany({
        where: {
          status: { in: ["CONFIRMED", "PARTIALLY_PAID"] },
          dueDate: { lt: now },
        },
        include: { customer: true },
        orderBy: { dueDate: "asc" },
        take: 5,
      }),
      prisma.subscription.findMany({
        include: {
          customer: true,
          lines: { include: { plan: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    const totalBilled = Number(invoicesAggregate._sum.total || 0);
    const totalCollected = Number(invoicesAggregate._sum.paidAmount || 0);
    const totalOwed = Math.max(0, totalBilled - totalCollected);
    const overdueCount = overdueInvoices.length;
    const overdueAmount = overdueInvoices.reduce(
      (sum, inv) => sum + (Number(inv.total) - Number(inv.paidAmount)),
      0
    );

    return {
      activeSubscriptionsCount,
      totalSubscriptionsCount,
      totalCustomersCount,
      totalCollected,
      totalOwed,
      overdueCount,
      overdueAmount,
      overdueInvoices,
      recentSubscriptions,
    };
  } catch (err) {
    console.error("Dashboard query error:", err);
    return {
      activeSubscriptionsCount: 0,
      totalSubscriptionsCount: 0,
      totalCustomersCount: 0,
      totalCollected: 0,
      totalOwed: 0,
      overdueCount: 0,
      overdueAmount: 0,
      overdueInvoices: [],
      recentSubscriptions: [],
    };
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Topbar
        title="Finance & Operations Dashboard"
        subtitle="Real-time subscriptions, revenue, and collection overview"
        actionHref="/subscriptions"
        actionLabel="View Subscriptions"
      />

      <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Active Subscriptions */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Subscriptions
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-bold text-slate-900 tracking-tight">
                {data.activeSubscriptionsCount}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                of {data.totalSubscriptionsCount} total
              </span>
            </div>
            <p className="mt-2 text-xs text-indigo-600 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
              {data.totalCustomersCount} registered accounts
            </p>
          </div>

          {/* Total Revenue Collected */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Revenue Collected
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-bold text-emerald-600 tracking-tight">
                {formatCurrency(data.totalCollected)}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500">Total matched payments</p>
          </div>

          {/* Outstanding / Still Owed */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Outstanding Balance
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-bold text-amber-600 tracking-tight">
                {formatCurrency(data.totalOwed)}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500">Unpaid / pending invoices</p>
          </div>

          {/* Overdue Alert */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Overdue Invoices
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-bold text-rose-600 tracking-tight">
                {formatCurrency(data.overdueAmount)}
              </span>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                {data.overdueCount} overdue
              </span>
            </div>
            <p className="mt-2 text-xs text-rose-600 font-medium">Requires chasing & follow-up</p>
          </div>
        </div>

        {/* Quick Operations Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="text-xs text-slate-600">
            <span className="font-semibold text-slate-900">Brightloop Operations:</span> Manage products, plans, taxes, discounts, and dispatch monthly billing.
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/products"
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors"
            >
              + Add Product
            </Link>
            <Link
              href="/plans"
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors"
            >
              + Create Plan
            </Link>
            <Link
              href="/staff"
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
            >
              + Manage Staff
            </Link>
          </div>
        </div>

        {/* Two-Column Grid: Overdue & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Overdue Invoices Alert */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Chasing Overdue Invoices</h2>
                <p className="text-xs text-slate-500">Invoices past their payment due date</p>
              </div>
              <Link href="/invoices" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                View all &rarr;
              </Link>
            </div>

            {data.overdueInvoices.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                🎉 No overdue invoices! All payments are up to date.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 mt-2">
                {data.overdueInvoices.map((inv) => (
                  <div key={inv.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-800">
                          {inv.invoiceNumber}
                        </span>
                        <StatusBadge status={inv.status} />
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5 font-medium">
                        {inv.customer?.companyName || "Unknown Customer"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-rose-600 font-mono">
                        {formatCurrency(Number(inv.total) - Number(inv.paidAmount))}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Due: {formatDate(inv.dueDate)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Subscriptions */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Recent Subscriptions</h2>
                <p className="text-xs text-slate-500">Latest subscriptions created or activated</p>
              </div>
              <Link href="/subscriptions" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                View all &rarr;
              </Link>
            </div>

            {data.recentSubscriptions.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No subscriptions created yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 mt-2">
                {data.recentSubscriptions.map((sub) => (
                  <div key={sub.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-800">
                          {sub.subscriptionNumber}
                        </span>
                        <StatusBadge status={sub.status} />
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5 font-medium">
                        {sub.customer?.companyName || "Customer"} • {sub.billingCycle}
                      </div>
                    </div>
                    <div className="text-right text-xs text-slate-500 font-mono">
                      {formatDate(sub.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
