import Link from "next/link";

type Renewal = {
  id: string;
  name: string;
  plan: string;
  date: string;
  day: string;
  month: string;
  amount: string;
  daysLabel: string;
  daysCount: number;
  urgency: "soon" | "normal";
};

const renewals: Renewal[] = [
  {
    id: "SUB-2048",
    name: "Growth Suite",
    plan: "Professional · Annual",
    date: "05 Nov 2026",
    day: "05",
    month: "NOV",
    amount: "₹12,500",
    daysLabel: "Due in 5 days",
    daysCount: 5,
    urgency: "soon",
  },
  {
    id: "SUB-1982",
    name: "Cloud Workspace",
    plan: "Team · Monthly",
    date: "14 Nov 2026",
    day: "14",
    month: "NOV",
    amount: "₹3,950",
    daysLabel: "In 14 days",
    daysCount: 14,
    urgency: "normal",
  },
  {
    id: "SUB-1876",
    name: "Analytics Add-on",
    plan: "Advanced · Monthly",
    date: "22 Nov 2026",
    day: "22",
    month: "NOV",
    amount: "₹2,000",
    daysLabel: "In 22 days",
    daysCount: 22,
    urgency: "normal",
  },
];

// Total = 30 days max for the bar
const MAX_DAYS = 30;

export function UpcomingRenewals() {
  return (
    <div className="h-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-5 pb-4 pt-5 sm:px-6">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight text-slate-900">Upcoming renewals</h2>
          <p className="mt-0.5 text-xs text-slate-500">Plan ahead for your next billing dates.</p>
        </div>
        <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[10px] font-semibold tracking-wide text-slate-500">
          NEXT 30 DAYS
        </span>
      </div>

      {/* Total upcoming cost banner */}
      <div className="mx-5 rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200 sm:mx-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Total due in 30 days</p>
        <p className="mt-1 text-[22px] font-semibold leading-none tracking-tight tabular-nums text-slate-900">
          ₹18,450
        </p>
      </div>

      {/* Renewal items */}
      <div className="mt-3 px-5 pb-2 sm:px-6">
        <div className="space-y-2">
          {renewals.map((renewal) => {
            const pct = Math.round(((MAX_DAYS - renewal.daysCount) / MAX_DAYS) * 100);
            return (
              <article
                key={renewal.id}
                className={`group rounded-xl px-3 py-3.5 transition-colors ${renewal.urgency === "soon"
                    ? "bg-amber-50/70 ring-1 ring-amber-200"
                    : "bg-slate-50/60 hover:bg-slate-100/60"
                  }`}
              >
                <div className="flex items-center gap-3">
                  {/* Calendar chip */}
                  <div
                    className={`flex h-[52px] w-[46px] shrink-0 flex-col items-center justify-center rounded-xl border ${renewal.urgency === "soon"
                        ? "border-amber-300 bg-white shadow-sm"
                        : "border-slate-200 bg-white"
                      }`}
                  >
                    <span
                      className={`text-[18px] font-bold leading-none tabular-nums ${renewal.urgency === "soon" ? "text-amber-700" : "text-slate-800"
                        }`}
                    >
                      {renewal.day}
                    </span>
                    <span
                      className={`mt-1 text-[9px] font-bold tracking-[0.12em] ${renewal.urgency === "soon" ? "text-amber-600" : "text-slate-400"
                        }`}
                    >
                      {renewal.month}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[13px] font-semibold text-slate-800">{renewal.name}</p>
                      <p className="shrink-0 text-[13px] font-bold tabular-nums text-slate-900">{renewal.amount}</p>
                    </div>
                    <p className="mt-0.5 truncate text-[10px] text-slate-500">{renewal.plan}</p>

                    {/* Days-until progress bar */}
                    <div className="mt-2">
                      <div className="h-1 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${renewal.urgency === "soon"
                              ? "bg-gradient-to-r from-amber-400 to-amber-500"
                              : "bg-gradient-to-r from-slate-300 to-slate-400"
                            }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p
                        className={`mt-1 text-[10px] font-medium ${renewal.urgency === "soon" ? "text-amber-600" : "text-slate-400"
                          }`}
                      >
                        {renewal.daysLabel}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 border-t border-slate-100 bg-slate-50/60 px-5 py-3.5 sm:px-6">
        <Link
          href="/my-subscriptions"
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 transition hover:text-slate-950"
        >
          View renewal schedule
          <span aria-hidden="true" className="ml-0.5">→</span>
        </Link>
      </div>
    </div>
  );
}
