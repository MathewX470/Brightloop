import * as React from "react";

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  description?: string;
  icon?: React.ReactNode;
  trend?: { value: string; direction: "up" | "down" | "neutral"; label?: string };
  footer?: React.ReactNode;
  accent?: "slate" | "blue" | "emerald" | "amber" | "rose" | "violet";
  className?: string;
}

const accents = {
  slate: "bg-slate-100 text-slate-700",
  blue: "bg-blue-50 text-blue-700",
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  rose: "bg-rose-50 text-rose-700",
  violet: "bg-violet-50 text-violet-700",
};

export function StatCard({ label, value, description, icon, trend, footer, accent = "slate", className = "" }: StatCardProps) {
  const trendColor = trend?.direction === "up" ? "text-emerald-700" : trend?.direction === "down" ? "text-rose-700" : "text-slate-500";
  return (
    <section className={`relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {icon && <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${accents[accent]} [&>svg]:size-5`}>{icon}</div>}
      </div>
      <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <div className="text-[28px] font-semibold leading-none tracking-tight text-slate-950 tabular-nums">{value}</div>
        {trend && <span className={`inline-flex items-center gap-1 text-xs font-semibold ${trendColor}`}><span aria-hidden="true">{trend.direction === "up" ? "↗" : trend.direction === "down" ? "↘" : "→"}</span>{trend.value}</span>}
      </div>
      {(description || trend?.label) && <p className="mt-2 text-xs leading-5 text-slate-500">{description ?? trend?.label}</p>}
      {footer && <div className="mt-4 border-t border-slate-100 pt-3">{footer}</div>}
    </section>
  );
}
