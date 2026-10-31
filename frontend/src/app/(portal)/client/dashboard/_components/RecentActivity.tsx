import * as React from "react";
import Link from "next/link";

type ActivityKind = "payment" | "subscription" | "invoice" | "profile";

type Activity = {
  id: string;
  kind: ActivityKind;
  title: string;
  description: string;
  time: string;
  dateGroup: "Today" | "Yesterday" | "Earlier";
  reference?: string;
};

const activities: Activity[] = [
  {
    id: "a1",
    kind: "payment",
    title: "Payment received",
    description: "Your payment for INV-2026-071 was successful.",
    time: "10:42 AM",
    dateGroup: "Today",
    reference: "₹8,900",
  },
  {
    id: "a2",
    kind: "subscription",
    title: "Subscription renewed",
    description: "Your Analytics Add-on plan was renewed.",
    time: "Yesterday",
    dateGroup: "Yesterday",
    reference: "SUB-1876",
  },
  {
    id: "a3",
    kind: "invoice",
    title: "New invoice generated",
    description: "Invoice INV-2026-084 is ready for review.",
    time: "28 Oct",
    dateGroup: "Earlier",
    reference: "INV-2026-084",
  },
  {
    id: "a4",
    kind: "profile",
    title: "Billing details updated",
    description: "Your billing contact information was changed.",
    time: "24 Oct",
    dateGroup: "Earlier",
  },
];

const kindConfig: Record<
  ActivityKind,
  { bg: string; text: string; ring: string; icon: React.ReactNode }
> = {
  payment: {
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    ring: "ring-emerald-100",
    icon: (
      <>
        <path d="M5 12.5 9.2 16.5 19 7" />
      </>
    ),
  },
  subscription: {
    bg: "bg-indigo-50",
    text: "text-indigo-600",
    ring: "ring-indigo-100",
    icon: (
      <>
        <path d="m12 3.5 8 4.5v8l-8 4.5-8-4.5V8l8-4.5Z" />
        <path d="m4.5 8.2 7.5 4.3 7.5-4.3" />
      </>
    ),
  },
  invoice: {
    bg: "bg-amber-50",
    text: "text-amber-600",
    ring: "ring-amber-100",
    icon: (
      <>
        <path d="M6 3.5h12v17l-3-1.8-3 1.8-3-1.8-3 1.8z" />
        <path d="M9 8h6M9 11.5h6" />
      </>
    ),
  },
  profile: {
    bg: "bg-slate-100",
    text: "text-slate-500",
    ring: "ring-slate-200",
    icon: (
      <>
        <circle cx="12" cy="8" r="3" />
        <path d="M5 20c.5-3.1 3.1-5.1 7-5.1s6.5 2 7 5.1" />
      </>
    ),
  },
};

const referenceStyle: Record<ActivityKind, string> = {
  payment: "rounded-md bg-emerald-50 px-1.5 py-0.5 text-emerald-700 ring-1 ring-emerald-100",
  subscription: "rounded-md bg-indigo-50 px-1.5 py-0.5 text-indigo-700 ring-1 ring-indigo-100",
  invoice: "rounded-md bg-amber-50 px-1.5 py-0.5 text-amber-700 ring-1 ring-amber-100",
  profile: "rounded-md bg-slate-100 px-1.5 py-0.5 text-slate-600",
};

function ActivityIcon({ kind }: { kind: ActivityKind }) {
  const cfg = kindConfig[kind];
  return (
    <span
      className={`relative z-10 flex size-9 shrink-0 items-center justify-center rounded-xl shadow-sm ring-1 ${cfg.bg} ${cfg.text} ${cfg.ring}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-[17px]"
        aria-hidden="true"
      >
        {cfg.icon}
      </svg>
    </span>
  );
}

// Group consecutive activities by dateGroup
function groupActivities(items: Activity[]) {
  const groups: { label: string; items: Activity[] }[] = [];
  let current: { label: string; items: Activity[] } | null = null;
  for (const item of items) {
    if (!current || current.label !== item.dateGroup) {
      current = { label: item.dateGroup, items: [] };
      groups.push(current);
    }
    current.items.push(item);
  }
  return groups;
}

export function RecentActivity() {
  const groups = groupActivities(activities);

  return (
    <div className="h-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-3 px-5 pb-4 pt-5 sm:px-6">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight text-slate-900">Recent activity</h2>
          <p className="mt-0.5 text-xs text-slate-500">The latest updates across your account.</p>
        </div>
        <Link
          href="/my-payments"
          className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
        >
          Payment history
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-3" aria-hidden="true">
            <path d="M7 17 17 7M7 7h10v10" />
          </svg>
        </Link>
      </div>

      <div className="px-5 pb-5 sm:px-6">
        <div className="space-y-5">
          {groups.map((group) => (
            <div key={group.label}>
              {/* Date group label */}
              <div className="mb-3 flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  {group.label}
                </span>
                <div className="h-px flex-1 bg-slate-100" />
              </div>

              {/* Timeline items */}
              <div className="relative space-y-4">
                {/* Vertical line */}
                <span
                  className="absolute bottom-4 left-[17px] top-4 w-px bg-slate-100"
                  aria-hidden="true"
                />

                {group.items.map((activity) => (
                  <div key={activity.id} className="relative flex gap-3.5">
                    <ActivityIcon kind={activity.kind} />
                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                        <p className="text-[13px] font-semibold text-slate-800">{activity.title}</p>
                        <span className="shrink-0 text-[10px] text-slate-400">{activity.time}</span>
                      </div>
                      <p className="mt-1 text-[11px] leading-5 text-slate-500">{activity.description}</p>
                      {activity.reference && (
                        <span className={`mt-1.5 inline-block text-[10px] font-medium ${referenceStyle[activity.kind]}`}>
                          {activity.reference}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3.5 sm:px-6">
        <Link
          href="/my-payments"
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-950"
        >
          See all account activity
          <span aria-hidden="true" className="ml-0.5">→</span>
        </Link>
      </div>
    </div>
  );
}
