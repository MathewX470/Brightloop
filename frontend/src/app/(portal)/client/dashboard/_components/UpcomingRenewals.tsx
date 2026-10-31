
import Link from "next/link";
import {
  formatINR,
  formatDashboardDate,
} from "../dashboard-utils";
import type { DashboardSubscription } from "../dashboard-types";

type RenewalProps = {
  renewals: DashboardSubscription[];
  renewalTotal: number;
};

export function UpcomingRenewals({
  renewals,
  renewalTotal,
}: RenewalProps) {
  const now = new Date();

  return (
    <div className="h-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-3 px-5 pb-4 pt-5 sm:px-6">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight text-slate-900">
            Upcoming renewals
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Plan ahead for your next billing dates.
          </p>
        </div>

        <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[10px] font-semibold tracking-wide text-slate-500">
          NEXT 30 DAYS
        </span>
      </div>

      <div className="mx-5 rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200 sm:mx-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
          Total due in 30 days
        </p>
        <p className="mt-1 text-[22px] font-semibold leading-none tracking-tight text-slate-900">
          {formatINR(renewalTotal)}
        </p>
      </div>

      <div className="mt-3 space-y-2 px-5 pb-3 sm:px-6">
        {renewals.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm font-medium text-slate-700">
              No upcoming renewals
            </p>
            <p className="mt-1 text-xs text-slate-400">
              No renewals scheduled in the next 30 days.
            </p>
          </div>
        ) : (
          renewals.map((sub) => {
            const date = new Date(sub.nextBillingDate!);

            const daysCount = Math.max(
              0,
              Math.ceil(
                (date.getTime() - now.getTime()) /
                (1000 * 60 * 60 * 24)
              )
            );

            const amount = sub.lines.reduce(
              (sum, line) =>
                sum + Number(line.unitPrice) * line.quantity,
              0
            );

            const productName =
              sub.lines[0]?.product.name || "Subscription";

            const planName =
              sub.lines[0]?.plan.name || "Standard plan";

            const percentage = Math.max(
              0,
              Math.min(100, ((30 - daysCount) / 30) * 100)
            );

            return (
              <article
                key={sub.id}
                className={`rounded-xl px-3 py-3.5 ${daysCount <= 7 ? "bg-amber-50/70 ring-1 ring-amber-200" : "bg-slate-50/60"}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-[52px] w-[46px] shrink-0 flex-col items-center justify-center rounded-xl border bg-white ${daysCount <= 7 ? "border-amber-300" : "border-slate-200"}`}>
                    <span className={`text-[18px] font-bold leading-none ${daysCount <= 7 ? "text-amber-700" : "text-slate-800"}`}>
                      {String(date.getDate()).padStart(2, "0")}
                    </span>
                    <span className="mt-1 text-[9px] font-bold tracking-[0.12em] text-slate-400">
                      {date.toLocaleString("en-IN", { month: "short" }).toUpperCase()}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[13px] font-semibold text-slate-800">
                        {productName}
                      </p>
                      <p className="shrink-0 text-[12px] font-bold text-slate-900">
                        {formatINR(amount)}
                      </p>
                    </div>

                    <p className="mt-0.5 truncate text-[10px] text-slate-500">
                      {planName} · {sub.subscriptionNumber}
                    </p>

                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={`h-full rounded-full ${daysCount <= 7 ? "bg-amber-500" : "bg-slate-400"}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <p className={`mt-1 text-[10px] font-medium ${daysCount <= 7 ? "text-amber-600" : "text-slate-400"}`}>
                      {daysCount === 0
                        ? "Due today"
                        : `Due in ${daysCount} days`}
                      {" · "}
                      {formatDashboardDate(sub.nextBillingDate)}
                    </p>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      <div className="mt-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3.5 sm:px-6">
        <Link
          href="/my-subscriptions"
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-950"
        >
          View renewal schedule →
        </Link>
      </div>
    </div>
  );
}
