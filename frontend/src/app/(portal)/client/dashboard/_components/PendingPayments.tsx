
import Link from "next/link";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatINR, formatDashboardDate } from "../dashboard-utils";
import type { DashboardInvoice } from "../dashboard-types";

export function PendingPayments({
  invoices,
  outstandingAmount,
}: {
  invoices: DashboardInvoice[];
  outstandingAmount: number;
}) {
  return (
    <div className="h-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-3 px-5 pb-4 pt-5 sm:px-6">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight text-slate-900">
            Pending payments
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Invoices that need your attention.
          </p>
        </div>

        <span className="inline-flex size-8 items-center justify-center rounded-lg bg-amber-50 text-xs font-bold text-amber-700 ring-1 ring-amber-200">
          {String(invoices.length).padStart(2, "0")}
        </span>
      </div>

      <div className="mx-5 overflow-hidden rounded-xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-5 py-4 sm:mx-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          Total outstanding
        </p>

        <div className="mt-2 flex items-end justify-between gap-3">
          <p className="text-[26px] font-semibold leading-none tracking-tight text-white">
            {formatINR(outstandingAmount)}
          </p>

          <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] text-slate-300">
            {invoices.length} invoices
          </span>
        </div>

        <div className="mt-3 h-px bg-white/10" />

        <p className="mt-2.5 text-[10px] text-slate-500">
          Review your outstanding invoices and due dates.
        </p>
      </div>

      <div className="mt-3 divide-y divide-slate-100">
        {invoices.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm font-medium text-slate-700">
              You're all caught up!
            </p>
            <p className="mt-1 text-xs text-slate-400">
              No outstanding invoices.
            </p>
          </div>
        ) : (
          invoices.map((invoice) => {
            const remaining =
              Number(invoice.total) - Number(invoice.paidAmount);

            const overdue = new Date(invoice.dueDate) < new Date();

            return (
              <article key={invoice.id} className="px-5 py-4 sm:px-6">
                <div className="flex items-start gap-3">
                  <span className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ring-1 ${overdue ? "bg-rose-50 text-rose-600 ring-rose-100" : "bg-amber-50 text-amber-600 ring-amber-100"}`}>
                    <span className="text-sm font-bold">▤</span>
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="truncate text-xs font-semibold text-slate-800">
                        {invoice.lines[0]?.description || "Invoice"}
                      </p>

                      <StatusBadge
                        status={overdue ? "OVERDUE" : invoice.status}
                        label={overdue ? "Overdue" : "Pending"}
                        size="sm"
                      />
                    </div>

                    <p className="mt-1 text-[10px] text-slate-400">
                      {invoice.invoiceNumber}
                      <span className="mx-1">·</span>
                      Issued {formatDashboardDate(invoice.issueDate)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-end justify-between gap-3 pl-11">
                  <div>
                    <p className="text-[10px] text-slate-400">
                      Due {formatDashboardDate(invoice.dueDate)}
                    </p>

                    <p className="mt-0.5 text-sm font-bold text-slate-900">
                      {formatINR(remaining)}
                    </p>
                  </div>

                  <Link
                    href={`/my-invoices/${encodeURIComponent(invoice.id)}`}
                    className="inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Review invoice
                  </Link>
                </div>
              </article>
            );
          })
        )}
      </div>

      <div className="border-t border-slate-100 px-5 py-3.5 sm:px-6">
        <Link
          href="/my-invoices"
          className="flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-950"
        >
          Go to invoices →
        </Link>
      </div>
    </div>
  );
}
