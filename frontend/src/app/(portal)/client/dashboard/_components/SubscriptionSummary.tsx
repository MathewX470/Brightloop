import Link from "next/link";
import { StatusBadge } from "@/components/shared/status-badge";

type Subscription = {
  id: string;
  name: string;
  reference: string;
  category: string;
  status: string;
  plan: string;
  renewalDate: string;
  usageLabel: string;
  usage: number;
  usageDetail: string;
  mark: string;
  markBg: string;
  markText: string;
  barColor: string;
};

const subscriptions: Subscription[] = [
  {
    id: "SUB-2048",
    name: "Growth Suite",
    reference: "SUB-2048",
    category: "Business essentials",
    status: "Active",
    plan: "Professional · Annual",
    renewalDate: "05 Nov 2026",
    usageLabel: "Monthly usage",
    usage: 72,
    usageDetail: "72% of included allowance",
    mark: "G",
    markBg: "bg-indigo-600",
    markText: "text-white",
    barColor: "from-indigo-400 to-indigo-600",
  },
  {
    id: "SUB-1982",
    name: "Cloud Workspace",
    reference: "SUB-1982",
    category: "Infrastructure",
    status: "Active",
    plan: "Team · Monthly",
    renewalDate: "14 Nov 2026",
    usageLabel: "Storage used",
    usage: 48,
    usageDetail: "48 GB of 100 GB",
    mark: "C",
    markBg: "bg-cyan-500",
    markText: "text-white",
    barColor: "from-cyan-400 to-cyan-600",
  },
  {
    id: "SUB-1876",
    name: "Analytics Add-on",
    reference: "SUB-1876",
    category: "Additional service",
    status: "Active",
    plan: "Advanced · Monthly",
    renewalDate: "22 Nov 2026",
    usageLabel: "Monthly usage",
    usage: 36,
    usageDetail: "36% of included allowance",
    mark: "A",
    markBg: "bg-amber-500",
    markText: "text-white",
    barColor: "from-amber-400 to-amber-500",
  },
];

function SectionHeading({
  title,
  subtitle,
  href,
  linkLabel,
}: {
  title: string;
  subtitle: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 className="text-[15px] font-semibold tracking-tight text-slate-900">{title}</h2>
        <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
      </div>
      <Link
        href={href}
        className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
      >
        {linkLabel}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-3" aria-hidden="true">
          <path d="M7 17 17 7M7 7h10v10" />
        </svg>
      </Link>
    </div>
  );
}

export function SubscriptionSummary() {
  return (
    <div className="h-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="px-5 pb-4 pt-5 sm:px-6">
        <SectionHeading
          title="Your subscriptions"
          subtitle="A quick look at the services you're currently using."
          href="/my-subscriptions"
          linkLabel="View all"
        />
      </div>

      <div className="divide-y divide-slate-100/80">
        {subscriptions.map((sub) => (
          <article key={sub.id} className="group px-5 py-4 transition-colors hover:bg-slate-50/80 sm:px-6">
            <div className="flex items-start gap-3.5">
              {/* Mark avatar */}
              <span
                className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold shadow-sm ${sub.markBg} ${sub.markText}`}
              >
                {sub.mark}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">{sub.name}</h3>
                  <StatusBadge status={sub.status} size="sm" />
                </div>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {sub.plan}
                  <span className="mx-1.5 text-slate-300">·</span>
                  {sub.reference}
                </p>

                {/* Usage bar */}
                <div className="mt-3">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[10px] font-medium text-slate-500">{sub.usageLabel}</span>
                    <span className="text-[10px] font-bold tabular-nums text-slate-700">{sub.usage}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${sub.barColor}`}
                      style={{ width: `${sub.usage}%` }}
                    />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">{sub.usageDetail}</span>
                    <span className="text-[10px] text-slate-400">
                      Renews{" "}
                      <strong className="font-semibold text-slate-600">{sub.renewalDate}</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-5 py-3.5 sm:px-6">
        <span className="text-[11px] text-slate-400">Showing 3 active services</span>
        <Link
          href="/my-subscriptions"
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-950"
        >
          Manage services
          <span aria-hidden="true" className="ml-0.5">→</span>
        </Link>
      </div>
    </div>
  );
}
