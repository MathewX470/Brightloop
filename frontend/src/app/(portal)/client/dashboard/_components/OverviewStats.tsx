
import {
  formatINR,
  formatDashboardDate,
} from "../dashboard-utils";
import type { DashboardStats } from "../dashboard-types";

export function OverviewStats({ data }: { data: DashboardStats }) {
  const stats = [
    {
      label: "Active subscriptions",
      value: String(data.activeSubscriptionCount).padStart(2, "0"),
      description: "Currently active services",
      icon: "◈",
      color: "bg-indigo-50 text-indigo-600",
    },
    {
      label: "Pending invoices",
      value: String(data.pendingInvoiceCount).padStart(2, "0"),
      description: "Invoices awaiting payment",
      icon: "▤",
      color: "bg-amber-50 text-amber-600",
    },
    {
      label: "Outstanding amount",
      value: formatINR(data.outstandingAmount),
      description: "Across unpaid invoices",
      icon: "₹",
      color: "bg-rose-50 text-rose-600",
    },
    {
      label: "Next renewal",
      value: data.nextRenewalDate
        ? formatDashboardDate(data.nextRenewalDate)
        : "None",
      description: "Next scheduled renewal",
      icon: "◷",
      color: "bg-emerald-50 text-emerald-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 2xl:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-[13px] font-medium text-slate-500">
              {stat.label}
            </p>

            <div className={`flex size-10 items-center justify-center rounded-xl text-lg font-bold ${stat.color}`}>
              {stat.icon}
            </div>
          </div>

          <div className="mt-4 text-[25px] font-semibold tracking-tight text-slate-950 tabular-nums">
            {stat.value}
          </div>

          <p className="mt-2 text-[11px] text-slate-400">
            {stat.description}
          </p>
        </div>
      ))}
    </div>
  );
}
