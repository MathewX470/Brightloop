"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatINR, formatDashboardDate } from "../client/dashboard/dashboard-utils";

interface QuotationLine {
  id: string;
  quantity: number;
  unitPrice: number | string;
  product: { id: string; name: string };
  plan: { id: string; name: string; billingCycle: string };
}

interface Quotation {
  id: string;
  subscriptionNumber: string;
  status: string;
  billingCycle: string;
  createdAt: string;
  lines: QuotationLine[];
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

export default function MyQuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [payingQuotationId, setPayingQuotationId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  async function fetchQuotations() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/portal/quotations");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load quotations.");
      setQuotations(data.quotations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading quotations");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchQuotations();
    loadRazorpayScript();
  }, []);

  // 1. Standard Confirm or Decline without immediate payment
  async function handleQuotationAction(quotationId: string, action: "ACCEPT" | "DECLINE") {
    try {
      setActionLoading(true);
      setNotification(null);
      const res = await fetch("/api/portal/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quotationId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed.");

      setNotification({ type: "success", message: data.message });
      await fetchQuotations();
    } catch (err) {
      setNotification({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to process quotation.",
      });
    } finally {
      setActionLoading(false);
    }
  }

  // 2. Razorpay First-Time "Accept & Pay" Flow
  async function handleAcceptAndPay(quotation: Quotation) {
    try {
      setPayingQuotationId(quotation.id);
      setActionLoading(true);
      setNotification(null);

      // Ensure Razorpay SDK is loaded
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error("Unable to load Razorpay checkout script. Please check your internet connection.");
      }

      // Step A: Create Razorpay Order on server
      const orderRes = await fetch("/api/portal/quotations/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quotationId: quotation.id }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.error || "Failed to initialize Razorpay checkout order.");
      }

      // Step B: Launch official Razorpay Checkout Modal
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "Brightloop Software",
        description: `Subscription Activation (${quotation.subscriptionNumber})`,
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
            // Step C: Verify signature & activate subscription on server
            const verifyRes = await fetch("/api/portal/quotations/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                quotationId: quotation.id,
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
              message: verifyData.message || "Payment verified and subscription activated successfully!",
            });

            await fetchQuotations();
          } catch (verifyErr) {
            setNotification({
              type: "error",
              message: verifyErr instanceof Error ? verifyErr.message : "Error verifying payment signature.",
            });
          } finally {
            setActionLoading(false);
            setPayingQuotationId(null);
          }
        },
        modal: {
          ondismiss: function () {
            setActionLoading(false);
            setPayingQuotationId(null);
          },
        },
      };

      // Open Razorpay Popup
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
        message: err instanceof Error ? err.message : "Failed to open Razorpay payment modal.",
      });
      setActionLoading(false);
      setPayingQuotationId(null);
    }
  }

  return (
    <div className="space-y-7">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-7 shadow-xl sm:px-8">
        <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
              CUSTOMER PORTAL / ORDERS
            </p>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
              Quotations & Proposals
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-400">
              Review custom proposals and complete your first subscription payment via Razorpay.
            </p>
          </div>
          <Link
            href="/my-subscriptions"
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-semibold text-white transition hover:bg-white/10 w-fit"
          >
            Active subscriptions →
          </Link>
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

      {/* Quotations List */}
      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-200/80 bg-white">
          <div className="text-center">
            <div className="mx-auto size-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-800" />
            <p className="mt-3 text-xs text-slate-500">Loading quotations...</p>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
          <p className="text-xs font-semibold text-rose-700">{error}</p>
          <button onClick={fetchQuotations} className="mt-3 px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold">
            Retry
          </button>
        </div>
      ) : quotations.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-xl">
            📄
          </div>
          <h3 className="mt-3 text-sm font-bold text-slate-900">No pending quotations</h3>
          <p className="mt-1 text-xs text-slate-500">
            You do not have any pending quotes awaiting approval. New proposals from our sales team will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {quotations.map((quot) => {
            const total = quot.lines.reduce((acc, l) => acc + Number(l.unitPrice) * l.quantity, 0);
            const isPayingThis = payingQuotationId === quot.id;

            return (
              <div
                key={quot.id}
                className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm">
                      Q
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{quot.subscriptionNumber}</h3>
                      <p className="text-[11px] text-slate-400">Received on {formatDashboardDate(quot.createdAt)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge status={quot.status} size="sm" />
                    <span className="text-base font-bold text-slate-900">{formatINR(total)}</span>
                  </div>
                </div>

                {/* Line Items */}
                <div className="mt-4 divide-y divide-slate-100">
                  {quot.lines.map((l) => (
                    <div key={l.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-800">{l.product.name}</span>
                        <span className="text-slate-400 ml-2">({l.plan.name})</span>
                        <p className="text-[11px] text-slate-400">
                          Qty: {l.quantity} × {formatINR(l.unitPrice)} per {quot.billingCycle.toLowerCase()}
                        </p>
                      </div>
                      <span className="font-bold text-slate-900">{formatINR(Number(l.unitPrice) * l.quantity)}</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-end gap-3">
                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to decline this quote?")) {
                        handleQuotationAction(quot.id, "DECLINE");
                      }
                    }}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Decline
                  </button>

                  <button
                    onClick={() => handleQuotationAction(quot.id, "ACCEPT")}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl border border-emerald-300 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                  >
                    Accept without Payment
                  </button>

                  {/* Primary Razorpay First Payment Button */}
                  <button
                    onClick={() => handleAcceptAndPay(quot)}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all"
                  >
                    <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                    <span>
                      {isPayingThis ? "Opening Razorpay..." : `Accept & Pay ${formatINR(total)} (Razorpay)`}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
