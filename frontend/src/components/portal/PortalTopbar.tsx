"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "../ui/button";
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
  DropdownTrigger,
} from "../ui/dropdown";

type IconName = "menu" | "bell" | "chevron-down" | "user" | "settings" | "log-out" | "help" | "external";

function Icon({ name, className = "size-[18px]" }: { name: IconName; className?: string }) {
  const paths: Record<IconName, React.ReactNode> = {
    menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
    bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    "chevron-down": <path d="m7 10 5 5 5-5" />,
    user: <><circle cx="12" cy="8" r="3.2" /><path d="M5 20c.5-3.1 3.1-5.1 7-5.1s6.5 2 7 5.1" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.1 1.9-1.8 1.8-1.9-1.1-.2.1-2.1.9-.5 2.1h-2.6l-.5-2.1-2.1-.9-.2-.1-1.9 1.1-1.8-1.8 1.1-1.9-.1-.2-.9-2.1L3 12.3V9.7l2.1-.5.9-2.1.1-.2L5 5l1.8-1.8 1.9 1.1.2-.1 2.1-.9.5-2.1h2.6l.5 2.1 2.1.9.2.1 1.9-1.1L20.6 5l-1.1 1.9.1.2.9 2.1 2.1.5v2.6l-2.1.5-.9 2.1Z" transform="translate(-1.5 1.5) scale(.88)" /></>,
    "log-out": <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></>,
    help: <><circle cx="12" cy="12" r="9" /><path d="M9.7 9a2.4 2.4 0 1 1 4.1 1.7c-1.1 1.1-1.8 1.4-1.8 3M12 17.25h.01" /></>,
    external: <><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" /></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">{paths[name]}</svg>;
}

const routeLabels: Record<string, string> = {
  dashboard: "Overview",
  dashboardd: "Dashboard",
  "my-quotations": "Quotations",
  "my-subscriptions": "Subscriptions",
  "my-invoices": "Invoices",
  "my-payments": "Payments",
  profile: "Profile",
};

export interface PortalTopbarProps {
  onMenuClick?: () => void;
  customerName?: string;
  customerEmail?: string;
  avatarUrl?: string;
  onSignOut?: () => void;
  notificationCount?: number;
}

export function PortalTopbar({
  onMenuClick,
  customerName = "Alex Morgan",
  customerEmail = "alex@company.com",
  avatarUrl,
  onSignOut,
  notificationCount = 2,
}: PortalTopbarProps) {
  const pathname = usePathname();
  const segment = pathname.split("/").filter(Boolean)[0] ?? "dashboard";
  const currentLabel = routeLabels[segment] ?? "Customer portal";
  const initials = customerName.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "AM";

  return (
    <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:px-9">
      <div className="flex min-w-0 items-center gap-3">
        <Button variant="ghost" size="icon" aria-label="Open navigation" onClick={onMenuClick} className="size-9 text-slate-600 lg:hidden">
          <Icon name="menu" />
        </Button>
        <div className="min-w-0">
          <div className="hidden items-center gap-2 text-[11px] text-slate-400 sm:flex">
            <span>Workspace</span>
            <span className="text-slate-300">/</span>
            <span className="font-medium text-slate-600">{currentLabel}</span>
          </div>
          <p className="truncate text-sm font-semibold text-slate-900 sm:mt-1">{currentLabel}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative size-10 text-slate-500 hover:text-slate-900">
          <Icon name="bell" />
          {notificationCount > 0 && (
            <span className="absolute right-[7px] top-[7px] size-2 rounded-full border-2 border-white bg-rose-500" />
          )}
        </Button>
        <span className="hidden h-8 w-px bg-slate-200 sm:block" />
        <Dropdown>
          <DropdownTrigger className="flex items-center gap-2 rounded-xl p-1.5 pr-2 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="size-9 rounded-full object-cover ring-1 ring-slate-200" />
            ) : (
              <span className="flex size-9 items-center justify-center rounded-full bg-[#e8edf4] text-[11px] font-bold tracking-wide text-slate-700 ring-1 ring-slate-200">{initials}</span>
            )}
            <span className="hidden min-w-0 text-left sm:block">
              <span className="block max-w-[130px] truncate text-xs font-semibold text-slate-800">{customerName}</span>
              <span className="mt-0.5 block max-w-[130px] truncate text-[10px] text-slate-400">Customer account</span>
            </span>
            <Icon name="chevron-down" className="hidden size-4 text-slate-400 sm:block" />
          </DropdownTrigger>
          <DropdownContent className="w-60">
            <DropdownLabel>
              <span className="block normal-case tracking-normal text-slate-700">{customerName}</span>
              <span className="mt-0.5 block normal-case font-normal tracking-normal text-slate-400">{customerEmail}</span>
            </DropdownLabel>
            <DropdownSeparator />
            <DropdownItem icon={<Icon name="user" />} onSelect={() => { window.location.href = "/profile"; }}>Profile settings</DropdownItem>
            <DropdownItem icon={<Icon name="help" />} onSelect={() => { window.location.href = "mailto:support@example.com"; }}>Contact support</DropdownItem>
            <DropdownSeparator />
            <DropdownItem destructive icon={<Icon name="log-out" />} onSelect={onSignOut}>Sign out</DropdownItem>
          </DropdownContent>
        </Dropdown>
      </div>
    </header>
  );
}
