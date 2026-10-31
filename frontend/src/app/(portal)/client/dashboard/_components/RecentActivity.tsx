
import Link from "next/link";
import {
  formatINR,
  formatDashboardDateTime,
} from "../dashboard-utils";
import type {
  DashboardPayment,
  DashboardRecentInvoice,
} from "../dashboard-types";

type Props = {
  payments: DashboardPayment[];
  invoices: DashboardRecentInvoice[];
};

export function RecentActivity({ payments, invoices }: Props) {
  const activities = [
    ...payments.map((payment) => ({
      id: payment.id,
      kind: "payment" as const,
      title:
        payment.status === "SUCCESS"
          ? "Payment received"
          : "Payment " + payment.status.toLowerCase(),
      description: `Payment for ${payment.invoice.invoiceNumber}`,
      reference: formatINR(payment.amount),
      date: new Date(payment.paymentDate),
    })),

    ...invoices.map((invoice) => ({
      id: invoice.id,
      kind: "invoice" as const,
      title: "Invoice " + invoice.status.toLowerCase(),
      description: `Invoice ${invoice.invoiceNumber}`,
      reference: formatINR(invoice.total),
      date: new Date(invoice.createdAt),
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  function getGroup(date: Date) {
    const value = new Date(date);
    value.setHours(0, 0, 0, 0);

    if (value.getTime() === today.getTime()) return "Today";
    if (value.getTime() === yesterday.getTime()) return "Yesterday";
    return "Earlier";
  }

  const groups = ["Today", "Yesterday", "Earlier"].map((label) => ({
    label,
    items: activities.filter((activity) => getGroup(activity.date) === label),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="h-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-3 px-5 pb-4 pt-5 sm:px-6">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight text-slate-900">
            Recent activity
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            The latest updates across your account.
          </p>
        </div>

        <Link
          href="/my-payments"
          className="shrink-0 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
        >
          Payment history →
        </Link>
      </div>

      <div className="px-5 pb-5 sm:px-6">
        {groups.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm font-medium text-slate-700">
              No recent activity
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Your account activity will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {groups.map((group) => (
              <div key={group.label}>
                <div className="mb-3 flex items-center gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    {group.label}
                  </span>
                  <div className="h-px flex-1 bg-slate-100" />
                </div>

                <div className="space-y-4">
                  {group.items.map((activity) => (
                    <div key={activity.id} className="flex gap-3.5">
                      <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${activity.kind === "payment" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                        {activity.kind === "payment" ? "✓" : "▤"}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <p className="text-[13px] font-semibold text-slate-800">
                            {activity.title}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            {formatDashboardDateTime(activity.date)}
                          </span>
                        </div>

                        <p className="mt-1 text-[11px] text-slate-500">
                          {activity.description}
                        </p>

                        <span className="mt-1.5 inline-block rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                          {activity.reference}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3.5 sm:px-6">
        <Link
          href="/my-payments"
          className="text-[11px] font-semibold text-slate-600 hover:text-slate-950"
        >
          See all account activity →
        </Link>
      </div>
    </div>
  );
}
