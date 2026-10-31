import React from "react";

type BadgeStatus =
  | "DRAFT"
  | "QUOTATION"
  | "CONFIRMED"
  | "ACTIVE"
  | "PAUSED"
  | "CLOSED"
  | "PARTIALLY_PAID"
  | "PAID"
  | "CANCELLED"
  | "PENDING"
  | "SUCCESS"
  | "FAILED"
  | "REFUNDED"
  | "ADMIN"
  | "STAFF"
  | "CUSTOMER"
  | string;

const statusColors: Record<string, string> = {
  // Active / Paid / Success
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
  SUCCESS: "bg-emerald-50 text-emerald-700 border-emerald-200",

  // In-progress / Quotation / Confirmed
  QUOTATION: "bg-sky-50 text-sky-700 border-sky-200",
  CONFIRMED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  PARTIALLY_PAID: "bg-amber-50 text-amber-700 border-amber-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  PAUSED: "bg-amber-50 text-amber-700 border-amber-200",

  // Draft / Inactive
  DRAFT: "bg-slate-100 text-slate-700 border-slate-200",

  // Terminated / Closed / Cancelled
  CLOSED: "bg-rose-50 text-rose-700 border-rose-200",
  CANCELLED: "bg-rose-50 text-rose-700 border-rose-200",
  FAILED: "bg-rose-50 text-rose-700 border-rose-200",
  REFUNDED: "bg-purple-50 text-purple-700 border-purple-200",

  // Roles
  ADMIN: "bg-purple-50 text-purple-700 border-purple-200",
  STAFF: "bg-blue-50 text-blue-700 border-blue-200",
  CUSTOMER: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export function StatusBadge({ status }: { status: BadgeStatus }) {
  const colorClass = statusColors[status] || "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border font-mono tracking-wide ${colorClass}`}
    >
      {status}
    </span>
  );
}
