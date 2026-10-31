"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DashboardIcon,
  UsersIcon,
  ProductsIcon,
  PlansIcon,
  TemplatesIcon,
  SubscriptionsIcon,
  InvoicesIcon,
  PaymentsIcon,
  TaxesIcon,
  DiscountsIcon,
  StaffIcon,
} from "@/components/ui/icons";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: DashboardIcon },
  { label: "Subscriptions", href: "/subscriptions", icon: SubscriptionsIcon },
  { label: "Invoices", href: "/invoices", icon: InvoicesIcon },
  { label: "Payments", href: "/payments", icon: PaymentsIcon },
  { label: "Customers", href: "/customers", icon: UsersIcon },
  { label: "Quotation Templates", href: "/templates", icon: TemplatesIcon },
  { label: "Products & Variants", href: "/products", icon: ProductsIcon },
  { label: "Plans", href: "/plans", icon: PlansIcon },
  { label: "Discount Rules", href: "/discounts", icon: DiscountsIcon, adminOnly: true },
  { label: "Tax Rules", href: "/taxes", icon: TaxesIcon, adminOnly: true },
  { label: "Staff Members", href: "/staff", icon: StaffIcon, adminOnly: true },
];

export function Sidebar({ currentRole = "ADMIN" }: { currentRole?: string }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200 gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-xs">
          B
        </div>
        <div>
          <span className="font-bold text-slate-900 tracking-tight text-sm">Brightloop</span>
          <span className="block text-[11px] text-slate-400 font-medium">Subscription ERP</span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
          Operations
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? "bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </div>
              {item.adminOnly && (
                <span className="text-[9px] uppercase font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                  Admin
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Profile Info */}
      <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-xs font-bold text-indigo-700">
            {currentRole === "ADMIN" ? "AD" : "ST"}
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-800">
              {currentRole === "ADMIN" ? "Admin User" : "Staff User"}
            </div>
            <div className="text-[10px] text-slate-500 capitalize">
              Role: {currentRole.toLowerCase()}
            </div>
          </div>
        </div>
        <Link
          href="/login"
          className="text-xs text-slate-400 hover:text-slate-700 font-medium transition-colors"
          title="Sign out"
        >
          Exit
        </Link>
      </div>
    </aside>
  );
}
