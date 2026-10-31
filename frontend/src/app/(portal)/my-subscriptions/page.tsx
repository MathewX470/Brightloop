"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatINR, formatDashboardDate } from "../client/dashboard/dashboard-utils";

interface SubscriptionLine {
  id: string;
  quantity: number;
  unitPrice: number | string;
  product: { id: string; name: string };
  plan: { id: string; name: string; billingCycle: string; price: number | string };
}

interface Subscription {
  id: string;
  subscriptionNumber: string;
  status: string;
  billingCycle: string;
  startDate?: string;
  endDate?: string;
  nextBillingDate?: string;
  totalSeats?: number;
  lines: SubscriptionLine[];
  invoices?: Array<{ id: string; invoiceNumber: string; total: number; status: string }>;
}

export default function MySubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  async function fetchSubscriptions() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/portal/subscriptions");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load subscriptions.");
      setSubscriptions(data.subscriptions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading subscriptions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  async function handleStatusChange(subscriptionId: string, action: "PAUSE" | "RESUME" | "CANCEL") {
    try {
      setActionLoading(true);
      setFeedback(null);
      const res = await fetch("/api/portal/subscriptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed.");

      setFeedback({ type: "success", message: data.message });
      setSelectedSub(null);
      await fetchSubscriptions();
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to update subscription.",
      });
    } finally {
      setActionLoading(false);
    }
  }

  const filtered = subscriptions.filter((sub) => {
    const matchesFilter = filter === "ALL" ? true : sub.status === filter;
    const matchesSearch =
      sub.subscriptionNumber.toLowerCase().includes(search.toLowerCase()) ||
      sub.lines.some((l) => l.product.name.toLowerCase().includes(search.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const activeCount = subscriptions.filter((s) => s.status === "ACTIVE").length;
  const totalMonthlySpend = subscriptions
    .filter((s) => s.status === "ACTIVE")
    .reduce((acc, sub) => {
      const subTotal = sub.lines.reduce((lAcc, line) => lAcc + Number(line.unitPrice) * line.quantity, 0);
      return acc + (sub.billingCycle === "YEARLY" ? subTotal / 12 : subTotal);
    }, 0);

  const nextRenewalSub = [...subscriptions]
    .filter((s) => s.status === "ACTIVE" && s.nextBillingDate)
    .sort((a, b) => new Date(a.nextBillingDate!).getTime() - new Date(b.nextBillingDate!).getTime())[0];

  return (
    <div className="space-y-7">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-7 shadow-xl sm:px-8">
        <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
              CUSTOMER PORTAL / SERVICES
            </p>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
              My Subscriptions
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-400">
              View license tiers, billing frequency, and manage service renewals.
            </p>
          </div>
          <Link
            href="/my-invoices"
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-semibold text-white transition hover:bg-white/10 w-fit"
          >
            View billing history →
          </Link>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Active Subscriptions</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{activeCount}</p>
          <p className="mt-1 text-[11px] text-slate-400">Currently receiving recurring updates</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Estimated Monthly Run Rate</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-indigo-600">{formatINR(totalMonthlySpend)}</p>
          <p className="mt-1 text-[11px] text-slate-400">Normalized across all active plans</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Next Upcoming Renewal</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            {nextRenewalSub?.nextBillingDate ? formatDashboardDate(nextRenewalSub.nextBillingDate) : "None scheduled"}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            {nextRenewalSub ? nextRenewalSub.subscriptionNumber : "All services up to date"}
          </p>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`rounded-xl p-4 text-xs font-semibold flex items-center justify-between border ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="underline hover:opacity-80">
            Dismiss
          </button>
        </div>
      )}

      {/* Controls: Search & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-fit">
          {["ALL", "ACTIVE", "CONFIRMED", "PAUSED", "CLOSED"].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === st
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {st === "ALL" ? "All Plans" : st === "CLOSED" ? "Cancelled" : st.charAt(0) + st.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search subscriptions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
          <svg
            className="w-4 h-4 text-slate-400 absolute left-3 top-2.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Subscriptions List */}
      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-200/80 bg-white">
          <div className="text-center">
            <div className="mx-auto size-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-800" />
            <p className="mt-3 text-xs text-slate-500">Loading subscriptions...</p>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
          <p className="text-xs font-semibold text-rose-700">{error}</p>
          <button
            onClick={fetchSubscriptions}
            className="mt-3 px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-xl">
            ◈
          </div>
          <h3 className="mt-3 text-sm font-bold text-slate-900">No subscriptions found</h3>
          <p className="mt-1 text-xs text-slate-500">
            {search ? "No subscriptions match your search filter." : "You do not have any subscriptions in this status."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((sub) => {
            const primaryLine = sub.lines[0];
            const subtotal = sub.lines.reduce(
              (acc, line) => acc + Number(line.unitPrice) * line.quantity,
              0
            );

            return (
              <div
                key={sub.id}
                className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                        {primaryLine?.product.name.charAt(0) || "S"}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          {primaryLine?.product.name || "Enterprise Subscription"}
                        </h3>
                        <p className="text-[11px] font-mono text-slate-400">{sub.subscriptionNumber}</p>
                      </div>
                    </div>
                    <StatusBadge status={sub.status} size="sm" />
                  </div>

                  {/* Plan Details & Badges */}
                  <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                      Plan: {primaryLine?.plan.name || "Custom Tier"}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium capitalize">
                      Cycle: {sub.billingCycle.toLowerCase()}
                    </span>
                    {sub.totalSeats && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                        {sub.totalSeats} seats
                      </span>
                    )}
                  </div>

                  {/* Pricing and Dates */}
                  <div className="mt-5 grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 text-xs">
                    <div>
                      <p className="text-[11px] text-slate-400">Recurring Price</p>
                      <p className="mt-0.5 text-base font-bold text-slate-900">{formatINR(subtotal)}</p>
                      <p className="text-[10px] text-slate-400">per {sub.billingCycle.toLowerCase()}</p>
                    </div>

                    <div>
                      <p className="text-[11px] text-slate-400">Next Billing Date</p>
                      <p className="mt-0.5 text-xs font-semibold text-slate-800">
                        {sub.nextBillingDate ? formatDashboardDate(sub.nextBillingDate) : "—"}
                      </p>
                      <p className="text-[10px] text-slate-400">Auto-renews</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <button
                    onClick={() => setSelectedSub(sub)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    View Breakdown →
                  </button>

                  <div className="flex items-center gap-2">
                    {sub.status === "ACTIVE" && (
                      <button
                        onClick={() => handleStatusChange(sub.id, "PAUSE")}
                        disabled={actionLoading}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        Pause
                      </button>
                    )}
                    {sub.status === "PAUSED" && (
                      <button
                        onClick={() => handleStatusChange(sub.id, "RESUME")}
                        disabled={actionLoading}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 text-[11px] font-semibold text-white hover:bg-emerald-700 transition-colors"
                      >
                        Resume
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Subscription Breakdown Drawer / Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedSub.subscriptionNumber}</h3>
                <p className="text-xs text-slate-500">Service Breakdown & Line Items</p>
              </div>
              <button
                onClick={() => setSelectedSub(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Status:</span>
                  <StatusBadge status={selectedSub.status} size="sm" />
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Billing Frequency:</span>
                  <span className="font-semibold text-slate-900 capitalize">{selectedSub.billingCycle.toLowerCase()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Next Renewal:</span>
                  <span className="font-semibold text-slate-900">
                    {selectedSub.nextBillingDate ? formatDashboardDate(selectedSub.nextBillingDate) : "Not scheduled"}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Included Items</h4>
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 overflow-hidden">
                  {selectedSub.lines.map((line) => (
                    <div key={line.id} className="p-3 bg-white flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-slate-800">{line.product.name}</p>
                        <p className="text-[11px] text-slate-400">
                          Qty: {line.quantity} × {formatINR(line.unitPrice)}
                        </p>
                      </div>
                      <span className="font-bold text-slate-900">
                        {formatINR(Number(line.unitPrice) * line.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              {selectedSub.status === "ACTIVE" && (
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to cancel this subscription?")) {
                      handleStatusChange(selectedSub.id, "CANCEL");
                    }
                  }}
                  disabled={actionLoading}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                >
                  Cancel Subscription
                </button>
              )}
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => setSelectedSub(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
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

