"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type IconName =
  | "grid" | "file-text" | "layers" | "receipt" | "credit-card"
  | "user" | "help" | "chevron-left" | "chevron-right" | "x" | "log-out";

function Icon({ name, className = "size-[18px]" }: { name: IconName; className?: string }) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  const paths: Record<IconName, React.ReactNode> = {
    grid: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></>,
    "file-text": <><path d="M13.5 3.5H6.75A1.75 1.75 0 0 0 5 5.25v13.5c0 .97.78 1.75 1.75 1.75h10.5A1.75 1.75 0 0 0 19 18.75V9z" /><path d="M13 3.75V9h5.25M8.5 13h7M8.5 16.5h7" /></>,
    layers: <><path d="m12 3.5 8.5 4.75L12 13 3.5 8.25 12 3.5Z" /><path d="m3.5 12 8.5 4.75 8.5-4.75M3.5 15.75 12 20.5l8.5-4.75" /></>,
    receipt: <><path d="M6 3.5h12v17l-3-1.8-3 1.8-3-1.8-3 1.8z" /><path d="M9 8h6M9 11.5h6M9 15h3" /></>,
    "credit-card": <><rect x="3" y="5.5" width="18" height="13" rx="2" /><path d="M3.5 9.5h17M7 14.5h3" /></>,
    user: <><circle cx="12" cy="8" r="3.25" /><path d="M5 20c.55-3.2 3.2-5.25 7-5.25s6.45 2.05 7 5.25" /></>,
    help: <><circle cx="12" cy="12" r="9" /><path d="M9.7 9a2.4 2.4 0 1 1 4.1 1.7c-1.1 1.1-1.8 1.4-1.8 3M12 17.25h.01" /></>,
    "chevron-left": <path d="m14.5 5-7 7 7 7" />,
    "chevron-right": <path d="m9.5 5 7 7-7 7" />,
    x: <><path d="m6 6 12 12M18 6 6 18" /></>,
    "log-out": <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></>,
  };

  return <svg {...common}>{paths[name]}</svg>;
}

export interface PortalSidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  brandName?: string;
  brandMark?: React.ReactNode;
  onLogout?: () => void;
}

const navigation = [
  {
    label: "MAIN",
    items: [
      { label: "Dashboard", href: "/client/dashboard", icon: "grid" as const, exact: true },
      { label: "Quotations", href: "/my-quotations", icon: "file-text" as const },
      { label: "Subscriptions", href: "/my-subscriptions", icon: "layers" as const },
    ],
  },
  {
    label: "BILLING",
    items: [
      { label: "Invoices", href: "/my-invoices", icon: "receipt" as const },
      { label: "Payments", href: "/my-payments", icon: "credit-card" as const },
    ],
  },
  {
    label: "ACCOUNT",
    items: [
      { label: "Profile", href: "/profile", icon: "user" as const },
    ],
  },
];

export function PortalSidebar({
  mobileOpen = false,
  onMobileClose,
  brandName = "Brightloop",
  brandMark,
  onLogout,
}: PortalSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onMobileClose}
          className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[2px] lg:hidden"
        />
      )}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-[276px] flex-col border-r border-slate-200/80 bg-white",
          "transition-transform duration-300 ease-out lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        {/* Brand header */}
        <div className="flex h-[76px] items-center justify-between border-b border-slate-100 px-6">
          <Link href="/client/dashboard" onClick={onMobileClose} className="group flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-[13px] bg-slate-950 text-white shadow-sm shadow-slate-900/15">
              {brandMark ?? (
                <svg viewBox="0 0 24 24" className="size-[21px]" fill="none" aria-hidden="true">
                  <path d="M12 3.5 19.5 8v8L12 20.5 4.5 16V8L12 3.5Z" stroke="currentColor" strokeWidth="1.6" />
                  <path d="m8.5 12 2.2 2.2 4.8-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[15px] font-bold tracking-tight text-slate-950">{brandName}</span>
              <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Customer portal</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={onMobileClose}
            aria-label="Close navigation"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
          >
            <Icon name="x" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {navigation.map((group) => (
            <div key={group.label} className="mb-7 last:mb-0">
              <p className="mb-2.5 px-3 text-[10px] font-bold tracking-[0.15em] text-slate-400">{group.label}</p>
              <nav aria-label={group.label.toLowerCase()} className="space-y-1">
                {group.items.map((item) => {
                  const active = isActive(item.href, "exact" in item ? item.exact : false);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onMobileClose}
                      aria-current={active ? "page" : undefined}
                      className={[
                        "group relative flex h-11 items-center gap-3 rounded-xl px-3 text-[13px] font-medium transition-all duration-150",
                        active
                          ? "bg-slate-950 text-white shadow-sm shadow-slate-900/10"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                      ].join(" ")}
                    >
                      <Icon
                        name={item.icon}
                        className={active ? "size-[18px] text-white" : "size-[18px] text-slate-400 transition-colors group-hover:text-slate-700"}
                      />
                      <span>{item.label}</span>
                      {active && <span className="ml-auto size-1.5 rounded-full bg-white/80" />}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Footer: support card + logout */}
        <div className="border-t border-slate-100 p-4 space-y-3">
          {/* Support nudge */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm ring-1 ring-slate-200">
                <Icon name="help" className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-800">Need a hand?</p>
                <p className="mt-0.5 text-[11px] text-slate-500">We&apos;re here to help.</p>
              </div>
            </div>
            <a
              href="mailto:support@brightloop.com"
              className="mt-3 flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-[11px] font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Contact support
            </a>
          </div>

          {/* Logout button */}
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-slate-500 transition hover:bg-rose-50 hover:text-rose-700 group"
          >
            <Icon
              name="log-out"
              className="size-[18px] text-slate-400 transition-colors group-hover:text-rose-600"
            />
            Log out
          </button>

          <p className="px-1 text-[10px] text-slate-400">
            © {new Date().getFullYear()} {brandName}. All rights reserved.
          </p>
        </div>
      </aside>
    </>
  );
}
