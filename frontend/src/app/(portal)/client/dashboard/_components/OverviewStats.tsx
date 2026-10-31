import * as React from "react";

type StatItem = {
  label: string;
  value: string;
  description: string;
  accent: "blue" | "emerald" | "amber" | "violet";
  icon: React.ReactNode;
  trend?: { value: string; direction: "up" | "down" | "neutral"; label?: string };
};

const accentConfig = {
  blue: {
    iconBg: "bg-blue-50 text-blue-600",
    bar: "from-blue-400 to-blue-600",
    valueCap: "text-blue-700",
    border: "border-blue-100",
    glow: "shadow-blue-100",
  },
  emerald: {
    iconBg: "bg-emerald-50 text-emerald-600",
    bar: "from-emerald-400 to-emerald-600",
    valueCap: "text-emerald-700",
    border: "border-emerald-100",
    glow: "shadow-emerald-100",
  },
  amber: {
    iconBg: "bg-amber-50 text-amber-600",
    bar: "from-amber-400 to-amber-500",
    valueCap: "text-amber-700",
    border: "border-amber-100",
    glow: "shadow-amber-100",
  },
  violet: {
    iconBg: "bg-violet-50 text-violet-600",
    bar: "from-violet-400 to-violet-600",
    valueCap: "text-violet-700",
    border: "border-violet-100",
    glow: "shadow-violet-100",
  },
};

const defaultStats: StatItem[] = [
  {
    label: "Active subscriptions",
    value: "03",
    description: "Across 2 service categories",
    accent: "blue",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3.5 8 4.5v8l-8 4.5-8-4.5V8l8-4.5Z" />
        <path d="m4.5 8.2 7.5 4.3 7.5-4.3M12 12.5v8" />
      </svg>
    ),
  },
  {
    label: "Pending payments",
    value: "02",
    description: "One payment due this week",
    accent: "amber",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5.5" width="18" height="13" rx="2" />
        <path d="M3.5 9.5h17M7 14.5h3" />
      </svg>
    ),
  },
  {
    label: "Outstanding amount",
    value: "₹18,450",
    description: "Including applicable taxes",
    accent: "violet",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v18M16.5 7.5c0-1.7-1.8-3-4.5-3s-4.5 1.3-4.5 3 1.6 2.7 4.5 3.5 4.5 1.8 4.5 3.5-1.8 3-4.5 3-4.5-1.3-4.5-3" />
      </svg>
    ),
  },
  {
    label: "Next renewal",
    value: "05 Nov",
    description: "Growth Suite · in 5 days",
    accent: "emerald",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
        <path d="M7.5 3.5v3M16.5 3.5v3M3.5 9.5h17M8 13h3M8 16.5h5" />
      </svg>
    ),
  },
];

export interface OverviewStatsProps {
  stats?: StatItem[];
}

export function OverviewStats({ stats = defaultStats }: OverviewStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 2xl:grid-cols-4">
      {stats.map((stat) => {
        const cfg = accentConfig[stat.accent];
        return (
          <div
            key={stat.label}
            className={`group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${cfg.glow}`}
          >
            {/* Colored top-accent bar */}
            <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${cfg.bar}`} />

            <div className="flex items-start justify-between gap-3">
              <p className="text-[13px] font-medium text-slate-500">{stat.label}</p>
              <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl [&>svg]:size-5 ${cfg.iconBg}`}>
                {stat.icon}
              </div>
            </div>

            <div className="mt-4">
              <div className="text-[30px] font-semibold leading-none tracking-tight text-slate-950 tabular-nums">
                {stat.value}
              </div>
              {stat.trend && (
                <span
                  className={`mt-1 inline-flex items-center gap-1 text-xs font-semibold ${stat.trend.direction === "up"
                      ? "text-emerald-600"
                      : stat.trend.direction === "down"
                        ? "text-rose-600"
                        : "text-slate-500"
                    }`}
                >
                  <span aria-hidden="true">
                    {stat.trend.direction === "up" ? "↗" : stat.trend.direction === "down" ? "↘" : "→"}
                  </span>
                  {stat.trend.value}
                </span>
              )}
            </div>

            <p className="mt-2 text-[11px] leading-5 text-slate-400">{stat.description}</p>
          </div>
        );
      })}
    </div>
  );
}
