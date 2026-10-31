"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface BillingResult {
  invoicesGenerated: number;
  skippedCount: number;
  totalRevenueBilled: number;
}

interface DunningResult {
  remindersSent: number;
  lateFeesApplied: number;
  subscriptionsPaused: number;
}

export function AutomatedBillingTriggerCard() {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [lastReport, setLastReport] = useState<{
    billing: BillingResult;
    dunning: DunningResult;
    timestamp: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunBilling = async () => {
    setIsRunning(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/billing/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetDate: new Date() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to execute worker run.");
      }

      setLastReport({
        billing: data.billing,
        dunning: data.dunning,
        timestamp: new Date().toLocaleTimeString(),
      });

      // Refresh server-side dashboard metrics automatically
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error executing automated billing job.");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-[#142c26] to-[#1d3c34] text-white rounded-2xl p-6 shadow-md border border-[#2f695a]/40 relative overflow-hidden">
      {/* Background glow decorative */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Background Billing Worker
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            Automated Billing &amp; Dunning Engine
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Evaluates all active subscription renewals, generates recurring invoices, applies 5% late surcharges on overdue accounts, and pauses delinquent subscriptions.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={handleRunBilling}
            disabled={isRunning}
            className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
              lastReport
                ? "bg-emerald-600/30 hover:bg-emerald-500 hover:text-slate-950 text-emerald-300 border border-emerald-400/40"
                : "bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 shadow-emerald-500/20"
            }`}
          >
            {isRunning ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Processing Subscriptions...
              </>
            ) : lastReport ? (
              <>
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Completed at {lastReport.timestamp} (Run Again)
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                ⚡ Trigger Billing Run Now
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-2">
          <svg className="w-4 h-4 text-rose-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {lastReport && (
        <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs animate-in fade-in duration-300">
          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
            <span className="text-slate-400 block text-[11px]">Invoices Generated</span>
            <span className="text-emerald-400 font-bold text-base mt-0.5 block">
              +{lastReport.billing.invoicesGenerated}
            </span>
          </div>
          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
            <span className="text-slate-400 block text-[11px]">Revenue Billed</span>
            <span className="text-white font-bold text-base mt-0.5 block">
              ${lastReport.billing.totalRevenueBilled.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
            <span className="text-slate-400 block text-[11px]">Late Surcharges (5%)</span>
            <span className="text-amber-300 font-bold text-base mt-0.5 block">
              {lastReport.dunning.lateFeesApplied} applied
            </span>
          </div>
          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
            <span className="text-slate-400 block text-[11px]">Subscriptions Paused</span>
            <span className="text-rose-400 font-bold text-base mt-0.5 block">
              {lastReport.dunning.subscriptionsPaused} paused
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

