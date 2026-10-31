"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  adminOnly?: boolean;
  icon: (props: { className?: string }) => React.JSX.Element;
}

const operationsNav: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: ({ className }) => (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect fill="currentColor" fillOpacity="0.2" height="9" rx="1" width="7" x="3" y="3" />
        <rect height="5" rx="1" width="7" x="14" y="3" />
        <rect height="9" rx="1" width="7" x="14" y="12" />
        <rect height="5" rx="1" width="7" x="3" y="16" />
      </svg>
    ),
  },
  {
    label: "Customers",
    href: "/customers",
    icon: ({ className }) => (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Products",
    href: "/products",
    icon: ({ className }) => (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Plans",
    href: "/plans",
    icon: ({ className }) => (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect height="16" rx="2" width="18" x="3" y="4" />
        <line x1="7" x2="17" y1="8" y2="8" />
        <line x1="7" x2="13" y1="12" y2="12" />
      </svg>
    ),
  },
  {
    label: "Discounts",
    href: "/discounts",
    adminOnly: true,
    icon: ({ className }) => (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Taxes",
    href: "/taxes",
    adminOnly: true,
    icon: ({ className }) => (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      </svg>
    ),
  },
  {
    label: "Subscriptions",
    href: "/subscriptions",
    icon: ({ className }) => (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Invoices",
    href: "/invoices",
    icon: ({ className }) => (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Payments",
    href: "/payments",
    icon: ({ className }) => (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect height="14" rx="2" width="20" x="2" y="5" />
        <line x1="2" x2="22" y1="10" y2="10" />
      </svg>
    ),
  },
  {
    label: "Quotation Templates",
    href: "/templates",
    icon: ({ className }) => (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Worker Audits",
    href: "/billing-events",
    icon: ({ className }) => (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

const adminNav: NavItem[] = [
  {
    label: "Staff",
    href: "/staff",
    adminOnly: true,
    icon: ({ className }) => (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export function Sidebar({ currentRole = "ADMIN" }: { currentRole?: string }) {
  const pathname = usePathname();

  const renderLink = (item: NavItem) => {
    const isActive =
      pathname === item.href ||
      (item.href !== "/dashboard" && pathname.startsWith(item.href));
    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        href={item.href}
        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors group ${
          isActive
            ? "bg-[#eaf3ef] text-[#1d3c34] font-semibold"
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
        }`}
      >
        <div className="flex items-center space-x-3">
          <Icon
            className={`w-4 h-4 transition-colors ${
              isActive ? "text-[#1d3c34]" : "text-gray-400 group-hover:text-gray-600"
            }`}
          />
          <span>{item.label}</span>
        </div>
        {item.adminOnly && currentRole === "ADMIN" && (
          <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
            Admin
          </span>
        )}
      </Link>
    );
  };

  return (
    <aside
      className="w-64 flex-shrink-0 bg-white border-r border-[#eaefec] flex flex-col justify-between relative overflow-hidden select-none h-screen sticky top-0 z-40"
      data-purpose="sidebar-navigation"
    >
      {/* Background subtle organic curve flourish */}
      <div className="absolute -bottom-16 -left-16 w-80 h-80 bg-gradient-to-tr from-[#dbeee5]/40 via-[#eef6f2]/30 to-transparent rounded-full pointer-events-none blur-2xl" />
      <div className="absolute bottom-28 -right-16 w-48 h-48 bg-[#edf7f2]/50 rounded-full pointer-events-none blur-xl" />

      <div className="p-6 relative z-10 flex flex-col flex-1 overflow-hidden">
        {/* Logo Branding */}
        <div className="flex items-center space-x-3 mb-8 shrink-0" data-purpose="brand-logo">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#1d3c34] to-[#28584c] flex items-center justify-center p-[2px] shadow-sm">
            <div className="w-full h-full rounded-full border-2 border-dashed border-emerald-300 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-white" />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-gray-900 leading-none">Brightloop</h1>
            <p className="text-[11px] font-medium text-gray-400 mt-1 leading-none">Subscriptions, Simplified</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1 overflow-y-auto pr-1 flex-1 pb-4">
          {operationsNav.map(renderLink)}

          {/* Admin Subheading */}
          <div className="pt-5 pb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-3">Admin</span>
          </div>
          {adminNav.map(renderLink)}
        </nav>
      </div>
    </aside>
  );
}
