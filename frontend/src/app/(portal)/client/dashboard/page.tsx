import Link from "next/link";
import { OverviewStats } from "./_components/OverviewStats";
import { SubscriptionSummary } from "./_components/SubscriptionSummary";
import { PendingPayments } from "./_components/PendingPayments";
import { RecentActivity } from "./_components/RecentActivity";
import { UpcomingRenewals } from "./_components/UpcomingRenewals";

function ArrowUpRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4" aria-hidden="true">
      <path d="M7 17 17 7M7 7h10v10" />
    </svg>
  );
}

function ShieldCheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-[18px]" aria-hidden="true">
      <path d="M12 3.5 20 7v5.5c0 4.5-3.3 7.1-8 8.5-4.7-1.4-8-4-8-8.5V7l8-3.5Z" />
      <path d="m8.5 12 2.2 2.2 4.8-4.8" />
    </svg>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* === HERO HEADER === */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-7 shadow-xl sm:px-8">
        {/* Decorative orbs */}
        <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 right-32 size-48 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
              CUSTOMER WORKSPACE &nbsp;/&nbsp; OVERVIEW
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[28px] font-semibold tracking-tight text-white sm:text-3xl">
                Good morning, Alex 👋
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                Good standing
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Here&apos;s what&apos;s happening with your plans, invoices and account.
            </p>
            <p className="mt-3 text-[11px] text-slate-500">Your account overview · Last updated just now</p>
          </div>

          <div className="flex shrink-0 gap-2.5">
            <Link
              href="/my-subscriptions"
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-white/20 hover:bg-white/10"
            >
              Manage subscriptions <ArrowUpRight />
            </Link>
          </div>
        </div>
      </div>

      {/* === OVERVIEW STATS === */}
      <section aria-label="Account overview statistics">
        <OverviewStats />
      </section>

      {/* === MAIN CONTENT GRID === */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <SubscriptionSummary />
        </div>
        <div className="xl:col-span-5">
          <PendingPayments />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <RecentActivity />
        </div>
        <div className="xl:col-span-5">
          <UpcomingRenewals />
        </div>
      </section>

      {/* === ACCOUNT SETTINGS NUDGE === */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-gradient-to-r from-slate-50 to-white px-6 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 ring-1 ring-slate-200">
            <ShieldCheckIcon />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">Your account, all in one place</p>
            <p className="mt-0.5 text-xs leading-5 text-slate-500">
              Need to update your billing details or contact information? Keep your account up to date.
            </p>
          </div>
        </div>
        <Link
          href="/profile"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 sm:ml-4"
        >
          Review account settings <ArrowUpRight />
        </Link>
      </div>
    </div>
  );
}
