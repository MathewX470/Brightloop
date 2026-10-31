"use client";

import React, { useState, useEffect } from "react";
import { Topbar } from "@/components/layout/topbar";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { PlusIcon, PaymentsIcon } from "@/components/ui/icons";

interface Invoice {
  id: string;
  invoiceNumber: string;
  total: number | string;
  paidAmount: number | string;
  customer?: { companyName: string };
}

interface Payment {
  id: string;
  paymentNumber: string;
  amount: number | string;
  method: string;
  status: string;
  transactionReference?: string;
  notes?: string;
  paymentDate: string;
  invoice: {
    invoiceNumber: string;
    customer?: { companyName: string };
  };
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    invoiceId: "",
    amount: "",
    method: "BANK_TRANSFER",
    notes: "",
    transactionReference: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [payRes, invRes] = await Promise.all([
        fetch("/api/payments"),
        fetch("/api/invoices"),
      ]);

      const payJson = await payRes.json();
      const invJson = await invRes.json();

      if (payRes.ok) setPayments(payJson.payments || []);
      if (invRes.ok) {
        setInvoices(invJson.invoices || []);
        if (invJson.invoices?.length > 0 && !formData.invoiceId) {
          const unpaid = invJson.invoices.find((i: Invoice) => Number(i.total) > Number(i.paidAmount));
          if (unpaid) {
            setFormData((prev) => ({
              ...prev,
              invoiceId: unpaid.id,
              amount: String(Number(unpaid.total) - Number(unpaid.paidAmount)),
            }));
          }
        }
      }
    } catch {
      setError("Failed to load payments data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        invoiceId: formData.invoiceId,
        amount: parseFloat(formData.amount) || 0,
        method: formData.method,
        notes: formData.notes,
        transactionReference: formData.transactionReference || null,
      };

      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to record payment");

      setIsModalOpen(false);
      setFormData({
        invoiceId: "",
        amount: "",
        method: "BANK_TRANSFER",
        notes: "",
        transactionReference: "",
      });
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error recording payment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Topbar
        title="Payment Reconciliation"
        subtitle="Match bank deposits, cards, and UPI against outstanding invoices"
      />

      <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Received Payments</h2>
            <p className="text-xs text-slate-500 mt-1">
              Payments automatically settle customer balances and update invoice status to Paid.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
        </div>

        {/* Payments Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-6 py-3.5">Payment #</th>
                  <th className="px-6 py-3.5">Matched Invoice</th>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Method</th>
                  <th className="px-6 py-3.5">Amount Paid</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Date & Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      Loading payments...
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      No payments recorded yet. Click &quot;Record Payment&quot; to log incoming money.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-slate-900 flex items-center gap-2">
                        <PaymentsIcon className="w-4 h-4 text-indigo-600" />
                        <span>{p.paymentNumber}</span>
                      </td>
                      <td className="px-6 py-4 font-mono font-semibold text-slate-900">
                        {p.invoice?.invoiceNumber || "-"}
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {p.invoice?.customer?.companyName || "Brightloop Client"}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 uppercase font-medium">
                          {p.method}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-emerald-600 text-sm">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-mono text-[11px] space-y-0.5">
                        <div>{formatDate(p.paymentDate)}</div>
                        {p.transactionReference && (
                          <div className="text-slate-400">Ref: {p.transactionReference}</div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Record Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-1">Record Inward Payment</h3>
            <p className="text-xs text-slate-500 mb-6">
              Match collected funds against an invoice.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Select Invoice</label>
                <select
                  value={formData.invoiceId}
                  onChange={(e) => {
                    const inv = invoices.find((i) => i.id === e.target.value);
                    const remaining = inv ? Number(inv.total) - Number(inv.paidAmount) : 0;
                    setFormData({
                      ...formData,
                      invoiceId: e.target.value,
                      amount: remaining > 0 ? String(remaining) : "",
                    });
                  }}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  required
                >
                  <option value="">Choose an invoice...</option>
                  {invoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} • {inv.customer?.companyName || "Client"} (Due:{" "}
                      {formatCurrency(Number(inv.total) - Number(inv.paidAmount))})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Payment Method</label>
                  <select
                    value={formData.method}
                    onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  >
                    <option value="BANK_TRANSFER">BANK_TRANSFER</option>
                    <option value="UPI">UPI</option>
                    <option value="CREDIT_CARD">CREDIT_CARD</option>
                    <option value="DEBIT_CARD">DEBIT_CARD</option>
                    <option value="RAZORPAY">RAZORPAY</option>
                    <option value="CASH">CASH</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Reference / UTR Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. TXN9876543210"
                  value={formData.transactionReference}
                  onChange={(e) =>
                    setFormData({ ...formData, transactionReference: e.target.value })
                  }
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="Bank statement remark or note"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:text-slate-900 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                >
                  {submitting ? "Recording..." : "Record Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
