"use client";

import React, { useEffect, useState } from "react";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatINR, formatDashboardDate } from "../client/dashboard/dashboard-utils";

interface InvoiceLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number | string;
  taxRate?: number;
  taxAmount?: number | string;
  total: number | string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  issueDate: string;
  dueDate: string;
  subtotal: number | string;
  taxAmount: number | string;
  total: number | string;
  paidAmount: number | string;
  lines: InvoiceLine[];
  subscription?: {
    subscriptionNumber: string;
    billingCycle: string;
  };
}

interface InvoiceStats {
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;
  overdueCount: number;
  invoiceCount: number;
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && (window as unknown as { Razorpay?: unknown }).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function MyInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  // Payment Modal state
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("CREDIT_CARD");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isOpeningRazorpay, setIsOpeningRazorpay] = useState(false);

  // Print/View Modal state
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  async function fetchInvoices() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/portal/invoices");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load invoices.");
      setInvoices(data.invoices || []);
      setStats(data.stats || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading invoices");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchInvoices();
    loadRazorpayScript();
  }, []);

  // 1. Razorpay Real Payment Gateway Checkout
  async function handleRazorpayPayment() {
    if (!payingInvoice) return;

    try {
      setIsOpeningRazorpay(true);
      setNotification(null);

      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error("Unable to load Razorpay checkout script. Please check your network connection.");
      }

      // Step A: Create Order on server
      const res = await fetch("/api/portal/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: payingInvoice.id }),
      });

      const orderData = await res.json();
      if (!res.ok) {
        throw new Error(orderData.error || "Failed to create Razorpay checkout order.");
      }

      // Step B: Open Razorpay Modal
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "Brightloop Software",
        description: `Settlement for Invoice ${orderData.invoiceNumber}`,
        order_id: orderData.orderId,
        prefill: {
          name: orderData.customer?.name || "",
          email: orderData.customer?.email || "",
          contact: orderData.customer?.phone || "",
        },
        theme: {
          color: "#0f172a", // slate-900
        },
        handler: async function (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) {
          try {
            // Step C: Verify payment signature on server
            const verifyRes = await fetch("/api/portal/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                invoiceId: payingInvoice.id,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) {
              throw new Error(verifyData.error || "Payment verification failed.");
            }

            setNotification({
              type: "success",
              message: verifyData.message || "Invoice settled successfully via Razorpay!",
            });
            setPayingInvoice(null);
            await fetchInvoices();
          } catch (verifyErr) {
            setNotification({
              type: "error",
              message: verifyErr instanceof Error ? verifyErr.message : "Error verifying payment signature.",
            });
          } finally {
            setIsOpeningRazorpay(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsOpeningRazorpay(false);
          },
        },
      };

      interface RazorpayInstance {
        open: () => void;
      }
      interface RazorpayConstructor {
        new (options: unknown): RazorpayInstance;
      }
      const razorpayWindow = window as unknown as { Razorpay: RazorpayConstructor };
      const rzpInstance = new razorpayWindow.Razorpay(options);
      rzpInstance.open();
    } catch (err) {
      setNotification({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to open Razorpay payment gateway.",
      });
      setIsOpeningRazorpay(false);
    }
  }

  // 2. Simulated Direct Payment Handler (Offline fallback)
  async function handleSimulatedPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!payingInvoice) return;

    try {
      setIsProcessingPayment(true);
      setNotification(null);

      const res = await fetch("/api/portal/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: payingInvoice.id,
          method: paymentMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payment failed.");

      setNotification({
        type: "success",
        message: data.message || "Simulated payment processed successfully!",
      });
      setPayingInvoice(null);
      await fetchInvoices();
    } catch (err) {
      setNotification({
        type: "error",
        message: err instanceof Error ? err.message : "Payment processing failed.",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  }

  const now = new Date();

  const filtered = invoices.filter((inv) => {
    const isOverdue = (inv.status === "CONFIRMED" || inv.status === "PARTIALLY_PAID") && new Date(inv.dueDate) < now;
    let matchesFilter = true;
    if (filter === "UNPAID") {
      matchesFilter = inv.status === "CONFIRMED" || inv.status === "PARTIALLY_PAID";
    } else if (filter === "PAID") {
      matchesFilter = inv.status === "PAID";
    } else if (filter === "OVERDUE") {
      matchesFilter = isOverdue;
    }

    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.lines.some((l) => l.description.toLowerCase().includes(search.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-7">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-7 shadow-xl sm:px-8">
        <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
              CUSTOMER PORTAL / BILLING
            </p>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
              Invoices & Statements
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-400">
              View your billing statements, download GST tax invoices, and settle balances online via Razorpay.
            </p>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`rounded-xl p-4 text-xs font-semibold flex items-center justify-between border ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="underline hover:opacity-80">
            Dismiss
          </button>
        </div>
      )}

      {/* Metric Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Invoiced</span>
            <p className="mt-2 text-xl font-bold text-slate-900">{formatINR(stats.totalInvoiced)}</p>
            <span className="text-[11px] text-slate-500 mt-0.5 block">{stats.invoiceCount} invoices issued</span>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Paid</span>
            <p className="mt-2 text-xl font-bold text-emerald-600">{formatINR(stats.totalPaid)}</p>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Cleared payments</span>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Outstanding Balance</span>
            <p className="mt-2 text-xl font-bold text-amber-600">{formatINR(stats.totalOutstanding)}</p>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Pending payment</span>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Overdue Invoices</span>
            <p className="mt-2 text-xl font-bold text-rose-600">{stats.overdueCount}</p>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Requires attention</span>
          </div>
        </div>
      )}

      {/* Filter Tabs and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {["ALL", "UNPAID", "PAID", "OVERDUE"].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                filter === t
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
              }`}
            >
              {t === "ALL" && "All Invoices"}
              {t === "UNPAID" && "Unpaid & Due"}
              {t === "PAID" && "Fully Paid"}
              {t === "OVERDUE" && "Overdue"}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice # or item..."
            className="w-full rounded-xl border border-slate-200/80 bg-white px-3.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
          />
          <svg
            className="pointer-events-none absolute right-3 top-2.5 h-3.5 w-3.5 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Invoices List / Table */}
      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-200/80 bg-white">
          <div className="text-center">
            <div className="mx-auto size-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-800" />
            <p className="mt-3 text-xs text-slate-500">Loading invoices...</p>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
          <p className="text-xs font-semibold text-rose-700">{error}</p>
          <button onClick={fetchInvoices} className="mt-3 px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold">
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-xl">
            ▤
          </div>
          <h3 className="mt-3 text-sm font-bold text-slate-900">No invoices found</h3>
          <p className="mt-1 text-xs text-slate-500">
            {search ? "No invoices match your search." : "You do not have any invoices under this filter."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="border-b border-slate-200/80 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-3.5">Invoice #</th>
                  <th className="px-5 py-3.5">Issue Date</th>
                  <th className="px-5 py-3.5">Due Date</th>
                  <th className="px-5 py-3.5">Total Amount</th>
                  <th className="px-5 py-3.5">Balance Due</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((inv) => {
                  const total = Number(inv.total);
                  const paid = Number(inv.paidAmount);
                  const balance = Math.max(0, total - paid);
                  const isOverdue =
                    (inv.status === "CONFIRMED" || inv.status === "PARTIALLY_PAID") &&
                    new Date(inv.dueDate) < now;

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-4">
                        <span className="font-mono font-bold text-slate-900">{inv.invoiceNumber}</span>
                        {inv.subscription && (
                          <span className="block text-[10px] text-slate-400">
                            Sub: {inv.subscription.subscriptionNumber}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-600">{formatDashboardDate(inv.issueDate)}</td>
                      <td className="px-5 py-4">
                        <span className={isOverdue ? "font-bold text-rose-600" : "text-slate-600"}>
                          {formatDashboardDate(inv.dueDate)}
                        </span>
                        {isOverdue && (
                          <span className="block text-[10px] text-rose-500 font-semibold">Overdue</span>
                        )}
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-900">{formatINR(total)}</td>
                      <td className="px-5 py-4 font-bold text-slate-900">
                        {balance > 0 ? (
                          <span className="text-amber-600">{formatINR(balance)}</span>
                        ) : (
                          <span className="text-emerald-600">₹0.00</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={isOverdue ? "FAILED" : inv.status} size="sm" />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setViewingInvoice(inv)}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            View / Print
                          </button>

                          {balance > 0 && inv.status !== "CANCELLED" && (
                            <button
                              onClick={() => setPayingInvoice(inv)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-[11px] font-bold text-white shadow-xs transition-colors"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                              <span>Pay Now</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pay Invoice Dialog with Razorpay Integration */}
      {payingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Settle Invoice Online</h3>
                <p className="text-xs text-slate-500">Invoice {payingInvoice.invoiceNumber}</p>
              </div>
              <button
                onClick={() => setPayingInvoice(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Invoice Breakdown */}
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Total Bill Amount:</span>
                  <span className="font-semibold text-slate-900">{formatINR(payingInvoice.total)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Already Paid:</span>
                  <span className="text-emerald-600 font-semibold">{formatINR(payingInvoice.paidAmount)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-200 text-slate-900">
                  <span>Outstanding Due:</span>
                  <span className="text-indigo-600">
                    {formatINR(Math.max(0, Number(payingInvoice.total) - Number(payingInvoice.paidAmount)))}
                  </span>
                </div>
              </div>

              {/* Primary Action: Official Razorpay Payment Gateway */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleRazorpayPayment}
                  disabled={isOpeningRazorpay}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                >
                  <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                  <span>
                    {isOpeningRazorpay
                      ? "Opening Razorpay..."
                      : `Pay ${formatINR(Math.max(0, Number(payingInvoice.total) - Number(payingInvoice.paidAmount)))} via Razorpay`}
                  </span>
                </button>
                <p className="text-center text-[10px] text-slate-400">
                  Supports UPI, Google Pay, Test Cards (Debit/Credit) & NetBanking
                </p>
              </div>

              {/* Divider for simulated offline fallback */}
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-[10px] text-slate-400 uppercase font-semibold">
                  Or test simulated payment
                </span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* Secondary Option: Direct Simulation */}
              <form onSubmit={handleSimulatedPayment} className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "CREDIT_CARD", label: "Card", icon: "💳" },
                    { id: "UPI", label: "UPI", icon: "📱" },
                    { id: "NET_BANKING", label: "NetBanking", icon: "🏦" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        paymentMethod === m.id
                          ? "border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-2 ring-indigo-500/20"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="text-sm block">{m.icon}</span>
                      <span className="text-[10px] font-semibold">{m.label}</span>
                    </button>
                  ))}
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setPayingInvoice(null)}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessingPayment}
                    className="px-4 py-1.5 rounded-xl bg-slate-100 border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-50 transition-colors"
                  >
                    {isProcessingPayment ? "Settling..." : "Instant Settle (Test)"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View / Print Tax Invoice Modal */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-2xl border border-slate-100 animate-in fade-in duration-150 my-8">
            <div className="flex items-start justify-between pb-6 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                    ✦
                  </span>
                  <span className="text-base font-bold text-slate-900">Brightloop Software ERP</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Tax Invoice & Billing Receipt</p>
              </div>

              <div className="text-right">
                <h3 className="text-lg font-mono font-bold text-slate-900">{viewingInvoice.invoiceNumber}</h3>
                <StatusBadge status={viewingInvoice.status} size="sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 my-6 text-xs">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Invoice Details</p>
                <p className="mt-1 font-semibold text-slate-800">Issue Date: {formatDashboardDate(viewingInvoice.issueDate)}</p>
                <p className="font-semibold text-slate-800">Due Date: {formatDashboardDate(viewingInvoice.dueDate)}</p>
                {viewingInvoice.subscription && (
                  <p className="text-slate-500">Subscription: {viewingInvoice.subscription.subscriptionNumber}</p>
                )}
              </div>

              <div className="text-right">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Payment Status</p>
                <p className="mt-1 font-semibold text-slate-800">Paid: {formatINR(viewingInvoice.paidAmount)}</p>
                <p className="font-bold text-indigo-600">
                  Balance: {formatINR(Math.max(0, Number(viewingInvoice.total) - Number(viewingInvoice.paidAmount)))}
                </p>
              </div>
            </div>

            {/* Line items table */}
            <div className="rounded-xl border border-slate-200 overflow-hidden mb-6">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5">Item Description</th>
                    <th className="px-4 py-2.5 text-center">Qty</th>
                    <th className="px-4 py-2.5 text-right">Unit Price</th>
                    <th className="px-4 py-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {viewingInvoice.lines.map((l) => (
                    <tr key={l.id}>
                      <td className="px-4 py-3 font-medium text-slate-800">{l.description}</td>
                      <td className="px-4 py-3 text-center text-slate-600">{l.quantity}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{formatINR(l.unitPrice)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatINR(l.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Summary */}
            <div className="flex justify-end border-t border-slate-200 pt-4 text-xs">
              <div className="w-64 space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>{formatINR(viewingInvoice.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Taxes:</span>
                  <span>{formatINR(viewingInvoice.taxAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-slate-900 border-t border-slate-200 pt-1.5">
                  <span>Total Amount:</span>
                  <span>{formatINR(viewingInvoice.total)}</span>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
              <p className="text-[10px] text-slate-400">
                Generated automatically by Brightloop Billing Engine. Valid without physical signature.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
                >
                  Print / Save PDF
                </button>
                <button
                  onClick={() => setViewingInvoice(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
