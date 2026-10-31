
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { DashboardData } from "./dashboard-types";
import { OverviewStats } from "./_components/OverviewStats";
import { SubscriptionSummary } from "./_components/SubscriptionSummary";
import { PendingPayments } from "./_components/PendingPayments";
import { RecentActivity } from "./_components/RecentActivity";
import { UpcomingRenewals } from "./_components/UpcomingRenewals";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchDashboard() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/portal/dashboard", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Dashboard request failed.");
      }

      setData(result);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto size-9 animate-spin rounded-full border-[3px] border-slate-200 border-t-slate-800" />
          <p className="mt-4 text-sm text-slate-500">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
        <h2 className="font-semibold text-rose-800">
          Unable to load dashboard
        </h2>
        <p className="mt-2 text-sm text-rose-600">{error}</p>
        <button
          onClick={fetchDashboard}
          className="mt-4 rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* Welcome */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-7 shadow-xl sm:px-8">
        <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
              CUSTOMER WORKSPACE / OVERVIEW
            </p>

            <h1 className="text-3xl font-semibold tracking-tight text-white">
              Welcome, {data.customer.name.split(" ")[0]} 👋
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Here's what's happening with your plans, invoices and account.
            </p>

            <p className="mt-3 text-[11px] text-slate-500">
              {data.customer.company}
            </p>
          </div>

          <Link
            href="/my-subscriptions"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Manage subscriptions →
          </Link>
        </div>
      </div>

      {/* Statistics */}
      <OverviewStats data={data.stats} />

      {/* Subscriptions and payments */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <SubscriptionSummary subscriptions={data.subscriptions} />
        </div>

        <div className="xl:col-span-5">
          <PendingPayments
            invoices={data.pendingInvoices}
            outstandingAmount={data.stats.outstandingAmount}
          />
        </div>
      </section>

      {/* Activity and renewals */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <RecentActivity
            payments={data.recentPayments}
            invoices={data.recentInvoices}
          />
        </div>

        <div className="xl:col-span-5">
          <UpcomingRenewals
            renewals={data.upcomingRenewals}
            renewalTotal={data.renewalTotal}
          />
        </div>
      </section>

    </div>
  );
}
