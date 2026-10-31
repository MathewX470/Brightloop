"use client";

import * as React from "react";
import { PortalSidebar } from "./PortalSidebar";
import { PortalTopbar } from "./PortalTopbar";

export interface PortalLayoutProps {
  children: React.ReactNode;
  brandName?: string;
  brandMark?: React.ReactNode;
  customerName?: string;
  customerEmail?: string;
  avatarUrl?: string;
  onSignOut?: () => void;
  /** Optional content rendered above the page body, below the topbar. */
  announcement?: React.ReactNode;
  /** Set false when embedding the portal shell inside another layout. */
  showSidebar?: boolean;
}

export function PortalLayout({
  children,
  brandName = "Orbit",
  brandMark,
  customerName,
  customerEmail,
  avatarUrl,
  onSignOut,
  announcement,
  showSidebar = true,
}: PortalLayoutProps) {
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-slate-900">
      {showSidebar && (
        <PortalSidebar
          mobileOpen={mobileNavOpen}
          onMobileClose={() => setMobileNavOpen(false)}
          brandName={brandName}
          brandMark={brandMark}
          onLogout={onSignOut}
        />
      )}

      <div className={showSidebar ? "min-h-screen lg:pl-[276px]" : "min-h-screen"}>
        <PortalTopbar
          onMenuClick={() => setMobileNavOpen(true)}
          customerName={customerName}
          customerEmail={customerEmail}
          avatarUrl={avatarUrl}
          onSignOut={onSignOut}
        />

        {announcement && (
          <div className="px-4 pt-5 sm:px-6 lg:px-9">
            {announcement}
          </div>
        )}

        <main className="mx-auto w-full max-w-[1600px] px-4 py-7 sm:px-6 sm:py-8 lg:px-9 lg:py-9">
          {children}
        </main>

        <footer className="mx-auto flex w-full max-w-[1600px] flex-col gap-1 border-t border-slate-200/70 px-4 py-5 text-[11px] text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-9">
          <span>© {new Date().getFullYear()} {brandName}. All rights reserved.</span>
          <span className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            All systems operational
          </span>
        </footer>
      </div>
    </div>
  );
}
