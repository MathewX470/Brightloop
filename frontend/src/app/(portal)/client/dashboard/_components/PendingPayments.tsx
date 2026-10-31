import Link from "next/link";
import { StatusBadge } from "@/components/shared/status-badge";

type PendingInvoice = {
  id: string;
  number: string;
  title: string;
  issued: string;
  due: string;
  amount: string;
  status: "Pending" | "Overdue";
};

const pendingInvoices: PendingInvoice[] = [
  {
    id: "INV-2026-084",
    number: "INV-2026-084",
    title: "Growth Suite · November",
    issued: "25 Oct 2026",
    due: "05 Nov 2026",
    amount: "₹12,500",
    status: "Pending",
  },
  {
    id: "INV-2026-079",
    number: "INV-2026-079",
    title: "Cloud Workspace · October",
    issued: "14 Oct 2026",
    due: "28 Oct 2026",
    amount: "₹5,950",
    status: "Overdue",
  },
];

function InvoiceIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="size-4" aria-hidden="true">
      <path d="M6 3.5h12v17l-3-1.8-3 1.8-3-1.8-3 1.8z" />
      <path d="M9 8h6M9 11.5h4" />
    </svg>
  );
}

export function PendingPayments() {
  return (
    <div className="h-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      {/* Card header */}
      <div className="flex items-start justify-between gap-3 px-5 pb-4 pt-5 sm:px-6">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight text-slate-900">Pending payments</h2>
          <p className="mt-0.5 text-xs text-slate-500">Invoices that need your attention.</p>
        </div>
        <span className="inline-flex size-8 items-center justify-center rounded-lg bg-amber-50 text-xs font-bold text-amber-700 ring-1 ring-amber-200">
          02
        </span>
      </div>

      {/* Outstanding total — dark hero block */}
      <div className="mx-5 overflow-hidden rounded-xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-5 py-4 sm:mx-6">
        <div className="pointer-events-none absolute inset-0 rounded-xl" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Total outstanding</p>
        <div className="mt-2 flex items-end justify-between gap-3">
          <p className="text-[28px] font-semibold leading-none tracking-tight tabular-nums text-white">₹18,450</p>
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-medium text-slate-300">
            2 invoices
          </span>
        </div>
        <div className="mt-3 h-px bg-white/10" />
        <p className="mt-2.5 text-[10px] text-slate-500">
          Pay now to avoid late fees on overdue invoices.
        </p>
      </div>

      {/* Invoice list */}
      <div className="mt-3 divide-y divide-slate-100/80">
        {pendingInvoices.map((invoice) => (
          <article key={invoice.id} className="px-5 py-4 sm:px-6">
            <div className="flex items-start gap-3">
              {/* Icon chip */}
              <span
                className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ring-1 ${invoice.status === "Overdue"
                    ? "bg-rose-50 text-rose-600 ring-rose-100"
                    : "bg-amber-50 text-amber-600 ring-amber-100"
                  }`}
              >
                <InvoiceIcon />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="truncate text-xs font-semibold text-slate-800">{invoice.title}</p>
                  <StatusBadge status={invoice.status} size="sm" />
                </div>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  {invoice.number}
                  <span className="mx-1">·</span>
                  Issued {invoice.issued}
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-end justify-between gap-3 pl-11">
              <div>
                <p className="text-[10px] text-slate-400">Due {invoice.due}</p>
                <p className="mt-0.5 text-sm font-bold tabular-nums text-slate-900">{invoice.amount}</p>
              </div>
              <Link
                href={`/my-invoices/${encodeURIComponent(invoice.id)}`}
                className={`inline-flex h-8 items-center rounded-lg px-3 text-[11px] font-semibold transition ${invoice.status === "Overdue"
                    ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                    : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
              >
                {invoice.status === "Overdue" ? "Pay now" : "Review invoice"}
              </Link>
            </div>
          </article>
        ))}
      </div>

      <div className="border-t border-slate-100 px-5 py-3.5 sm:px-6">
        <Link
          href="/my-invoices"
          className="flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-600 transition hover:text-slate-950"
        >
          Go to invoices
          <span aria-hidden="true" className="ml-0.5">→</span>
        </Link>
      </div>
    </div>
  );
}
