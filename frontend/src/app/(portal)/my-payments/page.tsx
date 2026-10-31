"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatINR, formatDashboardDate, formatDashboardDateTime } from "../client/dashboard/dashboard-utils";

interface Payment {
  id: string;
  paymentNumber: string;
  amount: number | string;
  method: string;
  status: string;
  transactionReference?: string;
  paymentDate: string;
  notes?: string;
  invoice: {
    id: string;
    invoiceNumber: string;
    total: number | string;
    status: string;
  };
}

export default function MyPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<{ totalPaid: number; transactionCount: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);

  async function fetchPayments() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/portal/payments");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load payment history.");
      setPayments(data.payments || []);
      setStats(data.stats || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading payments");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPayments();
  }, []);

  const filtered = payments.filter((p) => {
    return (
      p.paymentNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.invoice.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      (p.transactionReference && p.transactionReference.toLowerCase().includes(search.toLowerCase()))
    );
  });

  return (
    <div className="space-y-7">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-7 shadow-xl sm:px-8">
        <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
              CUSTOMER PORTAL / PAYMENTS
            </p>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
              Payment Receipts & Ledger
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-400">
              Track successful settlements, download transaction receipts, and view payment reconciliation.
            </p>
          </div>
          <Link
            href="/my-invoices"
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-semibold text-white transition hover:bg-white/10 w-fit"
          >
            Review open invoices →
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <p className="text-xs font-medium text-slate-500">Total Lifetime Payments</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-600">{formatINR(stats.totalPaid)}</p>
            <p className="mt-1 text-[11px] text-slate-400">Successfully settled across invoices</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <p className="text-xs font-medium text-slate-500">Settled Transactions</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{stats.transactionCount}</p>
            <p className="mt-1 text-[11px] text-slate-400">Payment receipts generated</p>
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="flex justify-end">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search receipt #, invoice #, or ref..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
          <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Payments Table */}
      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-200/80 bg-white">
          <div className="text-center">
            <div className="mx-auto size-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-800" />
            <p className="mt-3 text-xs text-slate-500">Loading payments...</p>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
          <p className="text-xs font-semibold text-rose-700">{error}</p>
          <button onClick={fetchPayments} className="mt-3 px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold">
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-xl">
            💳
          </div>
          <h3 className="mt-3 text-sm font-bold text-slate-900">No payment records found</h3>
          <p className="mt-1 text-xs text-slate-500">
            {search ? "No payments match your search criteria." : "You have not made any payments yet."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="border-b border-slate-200/80 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-3.5">Receipt #</th>
                  <th className="px-5 py-3.5">Invoice #</th>
                  <th className="px-5 py-3.5">Payment Date</th>
                  <th className="px-5 py-3.5">Method</th>
                  <th className="px-5 py-3.5">Reference</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-slate-900">{pay.paymentNumber}</td>
                    <td className="px-5 py-4 font-mono text-indigo-600 font-semibold">{pay.invoice.invoiceNumber}</td>
                    <td className="px-5 py-4 text-slate-600">{formatDashboardDateTime(pay.paymentDate)}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-medium text-slate-700 capitalize">
                        {pay.method.replace("_", " ").toLowerCase()}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono text-[11px] text-slate-400">
                      {pay.transactionReference || "—"}
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-900">{formatINR(pay.amount)}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={pay.status} size="sm" />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setSelectedReceipt(pay)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Official Payment Receipt</h3>
                <p className="text-xs text-slate-500">{selectedReceipt.paymentNumber}</p>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            <div className="my-5 rounded-2xl bg-slate-50 p-5 border border-slate-100 space-y-3 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Payment Reference:</span>
                <span className="font-mono font-semibold text-slate-900">{selectedReceipt.transactionReference || "—"}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Invoice Cleared:</span>
                <span className="font-mono font-semibold text-indigo-600">{selectedReceipt.invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Date & Time:</span>
                <span className="font-semibold text-slate-900">{formatDashboardDateTime(selectedReceipt.paymentDate)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Payment Method:</span>
                <span className="font-semibold text-slate-900 capitalize">{selectedReceipt.method.replace("_", " ").toLowerCase()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Status:</span>
                <StatusBadge status={selectedReceipt.status} size="sm" />
              </div>
              <div className="flex justify-between text-base font-bold pt-3 border-t border-slate-200 text-slate-900">
                <span>Amount Paid:</span>
                <span className="text-emerald-600">{formatINR(selectedReceipt.amount)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
              >
                Print Receipt
              </button>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

