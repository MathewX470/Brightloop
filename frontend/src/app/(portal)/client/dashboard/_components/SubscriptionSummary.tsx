
import Link from "next/link";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDashboardDate, formatINR } from "../dashboard-utils";
import type { DashboardSubscription } from "../dashboard-types";

export function SubscriptionSummary({
  subscriptions,
}: {
  subscriptions: DashboardSubscription[];
}) {
  return (
    <div className="h-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-3 px-5 pb-4 pt-5 sm:px-6">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight text-slate-900">
            Your subscriptions
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            A quick look at your current services.
          </p>
        </div>

        <Link
          href="/my-subscriptions"
          className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
        >
          View all →
        </Link>
      </div>

      <div className="divide-y divide-slate-100">
        {subscriptions.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-700">
              No subscriptions found
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Your subscriptions will appear here.
            </p>
          </div>
        ) : (
          subscriptions.map((sub) => (
            <article
              key={sub.id}
              className="px-5 py-4 transition-colors hover:bg-slate-50/80 sm:px-6"
            >
              <div className="flex items-start gap-3.5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white">
                  {sub.lines[0]?.product.name.charAt(0) || "S"}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-900">
                      {sub.lines[0]?.product.name || "Subscription"}
                    </h3>
                    <StatusBadge status={sub.status} size="sm" />
                  </div>

                  <p className="mt-1 text-[11px] text-slate-400">
                    {sub.lines[0]?.plan.name || "Standard plan"}
                    <span className="mx-1.5">·</span>
                    {sub.subscriptionNumber}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-[10px] text-slate-400">
                        Billing cycle
                      </p>
                      <p className="mt-0.5 text-xs font-medium text-slate-700">
                        {sub.billingCycle}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] text-slate-400">
                        Next renewal
                      </p>
                      <p className="mt-0.5 text-xs font-semibold text-slate-700">
                        {formatDashboardDate(sub.nextBillingDate)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      {sub.lines.reduce(
                        (total, line) => total + line.quantity,
                        0
                      )}{" "}
                      unit(s)
                    </span>

                    <span className="text-xs font-semibold text-slate-900">
                      {formatINR(
                        sub.lines.reduce(
                          (total, line) =>
                            total +
                            Number(line.unitPrice) * line.quantity,
                          0
                        )
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3.5 sm:px-6">
        <span className="text-[11px] text-slate-400">
          Showing {subscriptions.length} subscriptions
        </span>
      </div>
    </div>
  );
}
