import React from "react";
import Link from "next/link";
import prisma from "@/lib/db";
import { Topbar } from "@/components/layout/topbar";
import { formatCurrency, formatDate } from "@/lib/format";
import { getSession } from "@/modules/auth/session";

export const dynamic = "force-dynamic";

interface StatusCount {
  status: string;
  count: number;
  percentage: number;
  color: string;
  label: string;
}

async function getDashboardData() {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [
      activeSubscriptionsCount,
      totalSubscriptionsCount,
      totalCustomersCount,
      newCustomersThisMonth,
      invoicesAggregate,
      overdueInvoices,
      recentSubscriptions,
      recentInvoices,
      statusBreakdownRaw,
      invoicesLast6Months,
      recentCustomers,
      recentPayments,
    ] = await Promise.all([
      prisma.subscription.count({ where: { status: "ACTIVE" } }),
      prisma.subscription.count(),
      prisma.customer.count(),
      prisma.customer.count({ where: { createdAt: { gte: startOfMonth } } }),
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
        include: { customer: true, subscription: true },
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
      prisma.invoice.findMany({
        include: { customer: true, subscription: true },
        orderBy: { issueDate: "desc" },
        take: 5,
      }),
      prisma.subscription.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
      prisma.invoice.findMany({
        where: {
          issueDate: { gte: sixMonthsAgo },
          status: { not: "CANCELLED" },
        },
        select: {
          issueDate: true,
          total: true,
          paidAmount: true,
        },
      }),
      prisma.customer.findMany({
        orderBy: { createdAt: "desc" },
        take: 4,
      }),
      prisma.payment.findMany({
        where: { status: "SUCCESS" },
        include: { invoice: { include: { customer: true } } },
        orderBy: { paymentDate: "desc" },
        take: 4,
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

    // Build real status breakdown map
    const statusMap: Record<string, number> = {};
    for (const item of statusBreakdownRaw) {
      statusMap[item.status] = item._count.status;
    }

    const totalSubs = totalSubscriptionsCount;
    const activeVal = statusMap["ACTIVE"] || 0;
    const trialVal = (statusMap["QUOTATION"] || 0) + (statusMap["CONFIRMED"] || 0);
    const pausedVal = statusMap["PAUSED"] || 0;
    const pendingVal = statusMap["DRAFT"] || 0;
    const closedVal = statusMap["CLOSED"] || 0;

    const statusBreakdown: StatusCount[] = [
      {
        status: "ACTIVE",
        label: "Active",
        count: activeVal,
        percentage: totalSubs > 0 ? Math.round((activeVal / totalSubs) * 100) : 0,
        color: "#25594a",
      },
      {
        status: "TRIAL",
        label: "Trial",
        count: trialVal,
        percentage: totalSubs > 0 ? Math.round((trialVal / totalSubs) * 100) : 0,
        color: "#c0e2d3",
      },
      {
        status: "PAUSED",
        label: "Paused",
        count: pausedVal,
        percentage: totalSubs > 0 ? Math.round((pausedVal / totalSubs) * 100) : 0,
        color: "#fbd38d",
      },
      {
        status: "PENDING",
        label: "Pending",
        count: pendingVal,
        percentage: totalSubs > 0 ? Math.round((pendingVal / totalSubs) * 100) : 0,
        color: "#f6a287",
      },
      {
        status: "CLOSED",
        label: "Closed",
        count: closedVal,
        percentage: totalSubs > 0 ? Math.round((closedVal / totalSubs) * 100) : 0,
        color: "#9ca3af",
      },
    ];

    // Compute month names for last 6 months
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      last6Months.push(monthNames[d.getMonth()]);
    }

    // Aggregate monthly revenue from actual invoices
    const monthlyRevenues = [0, 0, 0, 0, 0, 0];
    for (const inv of invoicesLast6Months) {
      const d = new Date(inv.issueDate);
      const diffMonths = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
      if (diffMonths >= 0 && diffMonths < 6) {
        const idx = 5 - diffMonths;
        monthlyRevenues[idx] += Number(inv.paidAmount || inv.total || 0);
      }
    }

    // Build real activity feed
    const activityItems = [];
    for (const p of recentPayments) {
      activityItems.push({
        id: `pay-${p.id}`,
        title: `Payment received – ${p.invoice?.invoiceNumber || "INV"} (${formatCurrency(Number(p.amount))})`,
        time: "Recent",
        dotColor: "bg-emerald-700",
      });
    }
    for (const s of recentSubscriptions.slice(0, 2)) {
      activityItems.push({
        id: `sub-${s.id}`,
        title: `New subscription created for ${s.customer?.companyName || "Customer"}`,
        time: "Today",
        dotColor: "bg-emerald-500",
      });
    }
    for (const c of recentCustomers.slice(0, 2)) {
      activityItems.push({
        id: `cust-${c.id}`,
        title: `New customer registered – ${c.companyName || c.email}`,
        time: "Earlier",
        dotColor: "bg-sky-500",
      });
    }

    return {
      activeSubscriptionsCount,
      totalSubscriptionsCount,
      totalCustomersCount,
      newCustomersThisMonth,
      totalCollected,
      totalOwed,
      overdueCount,
      overdueAmount,
      overdueInvoices,
      recentSubscriptions,
      recentInvoices,
      statusBreakdown,
      last6Months,
      monthlyRevenues,
      activityItems: activityItems.slice(0, 4),
    };
  } catch (err) {
    console.error("Dashboard query error:", err);
    return {
      activeSubscriptionsCount: 0,
      totalSubscriptionsCount: 0,
      totalCustomersCount: 0,
      newCustomersThisMonth: 0,
      totalCollected: 0,
      totalOwed: 0,
      overdueCount: 0,
      overdueAmount: 0,
      overdueInvoices: [],
      recentSubscriptions: [],
      recentInvoices: [],
      statusBreakdown: [
        { status: "ACTIVE", label: "Active", count: 0, percentage: 0, color: "#25594a" },
        { status: "TRIAL", label: "Trial", count: 0, percentage: 0, color: "#c0e2d3" },
        { status: "PAUSED", label: "Paused", count: 0, percentage: 0, color: "#fbd38d" },
        { status: "PENDING", label: "Pending", count: 0, percentage: 0, color: "#f6a287" },
        { status: "CLOSED", label: "Closed", count: 0, percentage: 0, color: "#9ca3af" },
      ],
      last6Months: ["May", "Jun", "Jul", "Aug", "Sep", "Oct"],
      monthlyRevenues: [0, 0, 0, 0, 0, 0],
      activityItems: [],
    };
  }
}

export default async function DashboardPage() {
  const [data, session] = await Promise.all([getDashboardData(), getSession()]);

  const now = new Date();
  const hours = now.getHours();
  const timeGreeting = hours < 12 ? "Good morning" : hours < 18 ? "Good afternoon" : "Good evening";
  const userName = session?.name ? session.name.split(" ")[0] : "Admin";

  const formattedDate = now.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // Donut chart stroke math (radius = 38, circumference = 2 * PI * 38 ≈ 238.8)
  const circ = 238.8;
  let accumulatedOffset = 0;
  const donutSegments = data.statusBreakdown.map((item) => {
    const proportion = data.totalSubscriptionsCount > 0 ? item.count / data.totalSubscriptionsCount : 0;
    const strokeLength = proportion * circ;
    const offset = accumulatedOffset;
    accumulatedOffset += strokeLength;
    return {
      ...item,
      strokeDasharray: `${strokeLength.toFixed(1)} ${circ}`,
      strokeDashoffset: `-${offset.toFixed(1)}`,
    };
  });

  // Chart curve points calculation based on real monthly revenue
  const maxRevenue = Math.max(...data.monthlyRevenues, 100);
  const xPositions = [90, 190, 290, 400, 510, 620];
  const points = data.monthlyRevenues.map((rev, i) => {
    const y = 200 - Math.round((rev / maxRevenue) * 140);
    return { x: xPositions[i], y: Math.max(50, Math.min(200, y)), val: rev };
  });

  // Construct smooth bezier spline
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cp1x = p0.x + (p1.x - p0.x) / 2;
    const cp1y = p0.y;
    const cp2x = p0.x + (p1.x - p0.x) / 2;
    const cp2y = p1.y;
    pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
  }
  const areaD = `${pathD} L ${points[points.length - 1].x} 200 L ${points[0].x} 200 Z`;

  // Highlight on latest month point
  const lastPoint = points[points.length - 1];

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar
        title="Finance & Operations Dashboard"
        subtitle="Real-time subscriptions, revenue, and collection overview"
        actionHref="/subscriptions"
        actionLabel="Create New"
        userName={session?.name || "Brightloop Admin"}
        userRole={session?.role ? (session.role.charAt(0) + session.role.slice(1).toLowerCase()) : "Admin"}
      />

      <div className="p-8 space-y-7 max-w-[1400px] w-full mx-auto">
        {/* BEGIN: DashboardHeader */}
        <section
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          data-purpose="page-title-banner"
        >
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center">
              {timeGreeting}, {userName} <span className="ml-2 inline-block animate-pulse">👋</span>
            </h2>
            <p className="text-xs text-gray-500 mt-1 font-medium">
              Here&apos;s what&apos;s happening with your subscriptions today.
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Date Display */}
            <div className="flex items-center space-x-3 text-right">
              <div className="p-2 rounded-xl bg-white border border-gray-200/80 shadow-xs text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect height="18" rx="2" ry="2" width="18" x="3" y="4" />
                  <line x1="16" x2="16" y1="2" y2="6" />
                  <line x1="8" x2="8" y1="2" y2="6" />
                  <line x1="3" x2="21" y1="10" y2="10" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-bold text-gray-800 leading-tight">{formattedDate}</div>
                <div className="text-[11px] text-gray-400 font-medium">Let&apos;s make it a productive day.</div>
              </div>
            </div>

            {/* Create New CTA */}
            <Link
              href="/subscriptions"
              className="flex items-center space-x-2 bg-[#1d3c34] hover:bg-[#142d26] text-white px-4 py-2.5 rounded-xl font-medium text-xs shadow-sm transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Create New</span>
              <svg className="w-3.5 h-3.5 ml-0.5 opacity-80" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </section>

        {/* BEGIN: StatCardsGrid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" data-purpose="kpi-metrics-cards">
          {/* Card 1: Total Customers */}
          <div className="bg-white rounded-2xl p-5 border border-[#ebf0ed] shadow-xs relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#ecf7f2] flex items-center justify-center text-[#245849]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="inline-flex items-center text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M5 10l7-7m0 0l7 7m-7-7v18" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {data.newCustomersThisMonth > 0 ? `+${data.newCustomersThisMonth}` : "Active"}
              </span>
            </div>
            <div className="mt-4">
              <h4 className="text-xs font-semibold text-gray-500">Total Customers</h4>
              <div className="text-2xl font-bold text-gray-900 mt-0.5 tracking-tight">
                {data.totalCustomersCount.toLocaleString()}
              </div>
              <p className="text-[11px] text-gray-400 font-medium mt-1">
                +{data.newCustomersThisMonth} this month
              </p>
            </div>
          </div>

          {/* Card 2: Active Subscriptions */}
          <div className="bg-white rounded-2xl p-5 border border-[#ebf0ed] shadow-xs relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#fdf5e8] flex items-center justify-center text-[#c28422]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="inline-flex items-center text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M5 10l7-7m0 0l7 7m-7-7v18" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {data.totalSubscriptionsCount > 0
                  ? `${Math.round((data.activeSubscriptionsCount / data.totalSubscriptionsCount) * 100)}%`
                  : "0%"}
              </span>
            </div>
            <div className="mt-4">
              <h4 className="text-xs font-semibold text-gray-500">Active Subscriptions</h4>
              <div className="text-2xl font-bold text-gray-900 mt-0.5 tracking-tight">
                {data.activeSubscriptionsCount.toLocaleString()}
              </div>
              <p className="text-[11px] text-gray-400 font-medium mt-1">
                of {data.totalSubscriptionsCount.toLocaleString()} total
              </p>
            </div>
          </div>

          {/* Card 3: Monthly Recurring Revenue / Revenue Collected */}
          <div className="bg-white rounded-2xl p-5 border border-[#ebf0ed] shadow-xs relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#fcedea] flex items-center justify-center text-[#d94a38]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="inline-flex items-center text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M5 10l7-7m0 0l7 7m-7-7v18" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Revenue
              </span>
            </div>
            <div className="mt-4">
              <h4 className="text-xs font-semibold text-gray-500">Revenue Collected</h4>
              <div className="text-2xl font-bold text-gray-900 mt-0.5 tracking-tight">
                {formatCurrency(data.totalCollected)}
              </div>
              <p className="text-[11px] text-gray-400 font-medium mt-1">Total matched payments</p>
            </div>
          </div>

          {/* Card 4: Outstanding Amount */}
          <div className="bg-white rounded-2xl p-5 border border-[#ebf0ed] shadow-xs relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#eaf4f2] flex items-center justify-center text-[#2d7d6f]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect height="14" rx="2" width="20" x="2" y="5" />
                  <line x1="2" x2="22" y1="10" y2="10" />
                </svg>
              </div>
              <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                data.overdueCount > 0 ? "text-rose-600 bg-rose-50" : "text-emerald-700 bg-emerald-50"
              }`}>
                {data.overdueCount > 0 ? `${data.overdueCount} overdue` : "Clean"}
              </span>
            </div>
            <div className="mt-4">
              <h4 className="text-xs font-semibold text-gray-500">Outstanding Amount</h4>
              <div className="text-2xl font-bold text-gray-900 mt-0.5 tracking-tight">
                {formatCurrency(data.totalOwed)}
              </div>
              <p className="text-[11px] text-gray-400 font-medium mt-1">
                Across {data.overdueCount} overdue invoice{data.overdueCount === 1 ? "" : "s"}
              </p>
            </div>
          </div>
        </section>
        {/* END: StatCardsGrid */}

        {/* BEGIN: MidChartsSection */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6" data-purpose="charts-row">
          {/* Revenue Overview Chart Card (Span 2) */}
          <div
            className="lg:col-span-2 bg-white rounded-2xl p-6 border border-[#ebf0ed] shadow-xs flex flex-col justify-between"
            data-purpose="revenue-chart-card"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-4">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <h3 className="font-bold text-gray-900 text-sm">Revenue Overview</h3>
              </div>
              {/* Filters */}
              <div className="flex items-center space-x-3">
                <div className="bg-gray-100/80 p-1 rounded-xl flex items-center text-xs">
                  <span className="bg-[#1d3c34] text-white px-3 py-1 rounded-lg font-semibold shadow-xs">Revenue</span>
                  <span className="text-gray-500 px-3 py-1 font-medium">Invoices</span>
                  <span className="text-gray-500 px-3 py-1 font-medium">Payments</span>
                </div>
                <div className="relative">
                  <button className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50">
                    <span>Last 6 months</span>
                    <svg className="w-3 h-3 text-gray-400 stroke-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Chart Graphic (SVG Area & Columns) */}
            <div className="relative w-full h-64 mt-2">
              <svg className="w-full h-full" fill="none" viewBox="0 0 700 240" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#245849" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#245849" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Y-Axis Grid Lines & Dynamic Labels */}
                <line className="chart-grid-line" x1="40" x2="680" y1="20" y2="20" />
                <text className="text-[10px] fill-gray-400 font-medium" textAnchor="end" x="30" y="24">
                  {formatCurrency(maxRevenue)}
                </text>

                <line className="chart-grid-line" x1="40" x2="680" y1="65" y2="65" />
                <text className="text-[10px] fill-gray-400 font-medium" textAnchor="end" x="30" y="69">
                  {formatCurrency(maxRevenue * 0.75)}
                </text>

                <line className="chart-grid-line" x1="40" x2="680" y1="110" y2="110" />
                <text className="text-[10px] fill-gray-400 font-medium" textAnchor="end" x="30" y="114">
                  {formatCurrency(maxRevenue * 0.5)}
                </text>

                <line className="chart-grid-line" x1="40" x2="680" y1="155" y2="155" />
                <text className="text-[10px] fill-gray-400 font-medium" textAnchor="end" x="30" y="159">
                  {formatCurrency(maxRevenue * 0.25)}
                </text>

                <line stroke="#eaefec" strokeWidth="1.2" x1="40" x2="680" y1="200" y2="200" />
                <text className="text-[10px] fill-gray-400 font-medium" textAnchor="end" x="30" y="204">0</text>

                {/* Real Monthly Bar Columns behind the spline */}
                {points.map((pt, i) => {
                  const barH = maxRevenue > 0 && pt.val > 0 ? Math.max(6, Math.round((pt.val / maxRevenue) * 110)) : 4;
                  const barY = 200 - barH;
                  return (
                    <rect
                      key={i}
                      fill="#d2e7de"
                      fillOpacity="0.6"
                      height={barH}
                      rx="3"
                      width="24"
                      x={pt.x - 12}
                      y={barY}
                    />
                  );
                })}

                {/* Area Fill under curve */}
                <path d={areaD} fill="url(#areaGradient)" />

                {/* Revenue Line (Smooth Bezier) */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="#235446"
                  strokeLinecap="round"
                  strokeWidth="2.5"
                />

                {/* Highlight Marker Point on Current Month */}
                <circle cx={lastPoint.x} cy={lastPoint.y} fill="#235446" r="5" stroke="#ffffff" strokeWidth="2.5" />

                {/* Tooltip Marker */}
                <g transform={`translate(${Math.max(40, lastPoint.x - 45)}, ${Math.max(10, lastPoint.y - 50)})`}>
                  <rect fill="#1b3930" height="38" rx="7" width="95" x="0" y="0" />
                  <path d="M 47.5 38 L 47.5 44" stroke="#1b3930" strokeWidth="2" />
                  <text fill="#ffffff" fontSize="10" fontWeight="700" textAnchor="middle" x="47.5" y="16">
                    {formatCurrency(lastPoint.val)}
                  </text>
                  <text fill="#9cbdb2" fontSize="9" fontWeight="500" textAnchor="middle" x="47.5" y="29">
                    {data.last6Months[5]} {now.getFullYear()}
                  </text>
                </g>

                {/* X-Axis Labels */}
                {data.last6Months.map((m, idx) => (
                  <text
                    key={m + idx}
                    className="text-[11px] fill-gray-400 font-semibold"
                    textAnchor="middle"
                    x={xPositions[idx]}
                    y="222"
                  >
                    {m}
                  </text>
                ))}
              </svg>
            </div>
          </div>

          {/* Subscription Status Donut Chart Card */}
          <div
            className="bg-white rounded-2xl p-6 border border-[#ebf0ed] shadow-xs flex flex-col justify-between"
            data-purpose="status-donut-card"
          >
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <h3 className="font-bold text-gray-900 text-sm">Subscription Status</h3>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-7 py-3 px-2 sm:px-4">
                <div className="relative w-32 h-32 flex-shrink-0 flex items-center justify-center mx-auto sm:mx-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {data.totalSubscriptionsCount > 0 ? (
                      donutSegments.map((seg) => (
                        <circle
                          key={seg.status}
                          cx="50"
                          cy="50"
                          fill="transparent"
                          r="38"
                          stroke={seg.color}
                          strokeDasharray={seg.strokeDasharray}
                          strokeDashoffset={seg.strokeDashoffset}
                          strokeWidth="14"
                        />
                      ))
                    ) : (
                      <circle
                        cx="50"
                        cy="50"
                        fill="transparent"
                        r="38"
                        stroke="#edf1f0"
                        strokeWidth="14"
                      />
                    )}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xl font-bold text-gray-900 leading-none">
                      {data.activeSubscriptionsCount}
                    </span>
                    <span className="text-[11px] font-medium text-gray-500 mt-1 leading-none">Active</span>
                  </div>
                </div>

                <div className="space-y-3 flex-1 w-full">
                  {data.statusBreakdown.map((item) => (
                    <div key={item.status} className="flex items-center justify-between text-xs py-0.5">
                      <div className="flex items-center space-x-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="font-medium text-gray-600 truncate">{item.label}</span>
                      </div>
                      <div className="flex items-center space-x-3 flex-shrink-0">
                        <span className="font-bold text-gray-900">{item.count}</span>
                        <span className="text-gray-400 text-[11px] w-7 text-right font-medium">
                          {item.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* END: MidChartsSection */}

        {/* BEGIN: TablesAndActivitySection */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6" data-purpose="invoices-and-renewals">
          {/* Recent Invoices Table (Span 2) */}
          <div
            className="lg:col-span-2 bg-white rounded-2xl p-6 border border-[#ebf0ed] shadow-xs flex flex-col justify-between"
            data-purpose="recent-invoices"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <h3 className="font-bold text-gray-900 text-sm">Recent Invoices</h3>
                </div>
                <Link
                  className="inline-flex items-center text-xs font-semibold text-gray-700 hover:text-[#1d3c34] transition-colors"
                  href="/invoices"
                >
                  <span>View all</span>
                  <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </div>

              {/* Invoices Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-500 font-semibold">
                      <th className="pb-3 font-semibold">Invoice #</th>
                      <th className="pb-3 font-semibold">Customer</th>
                      <th className="pb-3 font-semibold">Subscription</th>
                      <th className="pb-3 font-semibold">Amount</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold">Due Date</th>
                      <th className="pb-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.recentInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-gray-400">
                          No invoices generated yet. Create an invoice to see it here.
                        </td>
                      </tr>
                    ) : (
                      data.recentInvoices.map((inv) => {
                        const isOverdue = inv.status !== "PAID" && inv.status !== "CANCELLED" && new Date(inv.dueDate) < now;
                        const statusBadge =
                          inv.status === "PAID" ? (
                            <span className="inline-block px-2.5 py-0.5 font-semibold text-[11px] rounded-full bg-emerald-50 text-emerald-700">
                              Paid
                            </span>
                          ) : isOverdue ? (
                            <span className="inline-block px-2.5 py-0.5 font-semibold text-[11px] rounded-full bg-rose-50 text-rose-600">
                              Overdue
                            </span>
                          ) : inv.status === "CONFIRMED" || inv.status === "PARTIALLY_PAID" ? (
                            <span className="inline-block px-2.5 py-0.5 font-semibold text-[11px] rounded-full bg-amber-50 text-amber-700">
                              Pending
                            </span>
                          ) : (
                            <span className="inline-block px-2.5 py-0.5 font-semibold text-[11px] rounded-full bg-blue-50 text-blue-600">
                              {inv.status}
                            </span>
                          );

                        return (
                          <tr key={inv.id} className="hover:bg-gray-50/60 transition-colors">
                            <td className="py-3 font-semibold text-gray-800 font-mono">
                              {inv.invoiceNumber}
                            </td>
                            <td className="py-3 text-gray-700 font-medium">
                              {inv.customer?.companyName || inv.customer?.email || "Customer"}
                            </td>
                            <td className="py-3 text-gray-500 font-mono">
                              {inv.subscription?.subscriptionNumber || "—"}
                            </td>
                            <td className="py-3 font-semibold text-gray-900">
                              {formatCurrency(Number(inv.total))}
                            </td>
                            <td className="py-3">{statusBadge}</td>
                            <td className="py-3 text-gray-500">{formatDate(inv.dueDate)}</td>
                            <td className="py-3 text-right">
                              <Link
                                href="/invoices"
                                className="text-gray-400 hover:text-gray-600 p-1 inline-block"
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <circle cx="10" cy="4" r="1.5" />
                                  <circle cx="10" cy="10" r="1.5" />
                                  <circle cx="10" cy="16" r="1.5" />
                                </svg>
                              </Link>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Upcoming Renewals Card */}
          <div
            className="bg-white rounded-2xl p-6 border border-[#ebf0ed] shadow-xs flex flex-col justify-between"
            data-purpose="upcoming-renewals"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect height="18" rx="2" ry="2" width="18" x="3" y="4" />
                    <line x1="16" x2="16" y1="2" y2="6" />
                    <line x1="8" x2="8" y1="2" y2="6" />
                    <line x1="3" x2="21" y1="10" y2="10" />
                  </svg>
                  <h3 className="font-bold text-gray-900 text-sm">Upcoming Renewals</h3>
                </div>
                <Link
                  className="inline-flex items-center text-xs font-semibold text-gray-700 hover:text-[#1d3c34] transition-colors"
                  href="/subscriptions"
                >
                  <span>View all</span>
                  <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </div>

              {/* Renewal Items List */}
              <div className="space-y-4">
                {data.recentSubscriptions.length === 0 ? (
                  <div className="py-12 text-center text-xs text-gray-400">
                    No subscriptions created yet.
                  </div>
                ) : (
                  data.recentSubscriptions.map((sub, idx) => {
                    const iconColors = [
                      "bg-emerald-50 text-emerald-600",
                      "bg-teal-50 text-teal-600",
                      "bg-amber-50 text-amber-600",
                      "bg-purple-50 text-purple-600",
                    ];
                    const chosenColor = iconColors[idx % iconColors.length];

                    const totalLinePrice =
                      sub.lines && sub.lines.length > 0
                        ? (sub.lines as Array<{ unitPrice: unknown; quantity: number }>).reduce(
                            (acc: number, line) => acc + Number(line.unitPrice) * line.quantity,
                            0
                          )
                        : 0;

                    let renewalLabel: string = String(sub.billingCycle || "Active");
                    if (sub.nextBillingDate) {
                      const diffDays = Math.ceil(
                        (new Date(sub.nextBillingDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                      );
                      if (diffDays > 0) {
                        renewalLabel = `In ${diffDays} day${diffDays === 1 ? "" : "s"}`;
                      } else if (diffDays === 0) {
                        renewalLabel = "Due today";
                      } else {
                        renewalLabel = "Overdue";
                      }
                    }

                    return (
                      <div key={sub.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-9 h-9 rounded-xl ${chosenColor} flex items-center justify-center`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path
                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-gray-900 leading-tight">
                              {sub.customer?.companyName || "Customer"}
                            </h5>
                            <span className="text-[11px] text-gray-400 font-medium font-mono">
                              {sub.subscriptionNumber}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-gray-900">
                            {formatCurrency(totalLinePrice)}
                          </div>
                          <span className="inline-block mt-0.5 px-2 py-0.5 text-[10px] font-semibold bg-amber-50 text-amber-700 rounded-md">
                            {renewalLabel}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </section>
        {/* END: TablesAndActivitySection */}

        {/* BEGIN: BottomWidgetsSection */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6" data-purpose="recent-activity-and-actions">
          {/* Recent Activity Card */}
          <div
            className="bg-white rounded-2xl p-6 border border-[#ebf0ed] shadow-xs flex flex-col justify-between"
            data-purpose="recent-activity-timeline"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <h3 className="font-bold text-gray-900 text-sm">Recent Activity</h3>
                </div>
                <Link
                  className="inline-flex items-center text-xs font-semibold text-gray-700 hover:text-[#1d3c34] transition-colors"
                  href="/subscriptions"
                >
                  <span>View all</span>
                  <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </div>

              {/* Activity List */}
              <div className="space-y-3 pt-1">
                {data.activityItems.length === 0 ? (
                  <div className="text-xs text-gray-400 py-8 text-center">
                    No recent activity recorded yet.
                  </div>
                ) : (
                  data.activityItems.map((act) => (
                    <div key={act.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-3 min-w-0">
                        <span className={`w-2 h-2 rounded-full ${act.dotColor} flex-shrink-0`} />
                        <span className="text-gray-700 font-medium truncate">{act.title}</span>
                      </div>
                      <span className="text-gray-400 font-medium text-[11px] whitespace-nowrap pl-2">
                        {act.time}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div
            className="bg-white rounded-2xl p-6 border border-[#ebf0ed] shadow-xs flex flex-col justify-between"
            data-purpose="quick-actions-bar"
          >
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" x2="12" y1="8" y2="16" />
                  <line x1="8" x2="16" y1="12" y2="12" />
                </svg>
                <h3 className="font-bold text-gray-900 text-sm">Quick Actions</h3>
              </div>

              {/* 4 Action Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                {/* Tile 1: Add Customer */}
                <Link
                  href="/customers"
                  className="bg-[#eef6f2] hover:bg-[#e3f0e9] border border-[#e1eee7] rounded-xl p-3.5 flex flex-col items-center justify-center text-center transition-all group"
                >
                  <div className="w-7 h-7 mb-2 flex items-center justify-center text-[#245849]">
                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-gray-800 leading-tight">Add Customer</span>
                </Link>

                {/* Tile 2: Create Product */}
                <Link
                  href="/products"
                  className="bg-[#fef7eb] hover:bg-[#fcf0dc] border border-[#faeeda] rounded-xl p-3.5 flex flex-col items-center justify-center text-center transition-all group"
                >
                  <div className="w-7 h-7 mb-2 flex items-center justify-center text-[#c28422]">
                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-gray-800 leading-tight">Create Product</span>
                </Link>

                {/* Tile 3: New Subscription */}
                <Link
                  href="/subscriptions"
                  className="bg-[#eef8f4] hover:bg-[#e1f3ec] border border-[#dff0e7] rounded-xl p-3.5 flex flex-col items-center justify-center text-center transition-all group"
                >
                  <div className="w-7 h-7 mb-2 flex items-center justify-center text-[#2d7d6f]">
                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-gray-800 leading-tight">New Subscription</span>
                </Link>

                {/* Tile 4: Generate Invoice */}
                <Link
                  href="/invoices"
                  className="bg-[#fdedeb] hover:bg-[#fae1dd] border border-[#f7dbd7] rounded-xl p-3.5 flex flex-col items-center justify-center text-center transition-all group"
                >
                  <div className="w-7 h-7 mb-2 flex items-center justify-center text-[#d94a38]">
                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-gray-800 leading-tight">Generate Invoice</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
        {/* END: BottomWidgetsSection */}
      </div>
    </div>
  );
}
