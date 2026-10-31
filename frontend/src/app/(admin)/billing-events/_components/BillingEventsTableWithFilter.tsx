"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/format";

export interface BillingEventItem {
  id: string;
  eventType: string;
  status: string;
  idempotencyKey?: string | null;
  createdAt: string | Date;
  subscription?: {
    subscriptionNumber: string;
    customer?: {
      companyName: string;
    } | null;
  } | null;
  invoice?: {
    id: string;
    invoiceNumber: string;
  } | null;
}

export function BillingEventsTableWithFilter({
  events,
}: {
  events: BillingEventItem[];
}) {
  const [filter, setFilter] = useState<"ALL" | "INVOICE" | "EMAIL">("ALL");

  const filteredEvents = events.filter((ev) => {
    if (filter === "INVOICE") {
      return (
        ev.eventType.includes("BATCH") ||
        ev.eventType.includes("INVOICE") ||
        ev.eventType.includes("BILLING")
      );
    }
    if (filter === "EMAIL") {
      return ev.eventType.includes("EMAIL");
    }
    return true;
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
      {/* Header and Filter Tabs */}
      <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="font-bold text-gray-900 text-sm">
            Batch &amp; Worker Execution Audit Trail
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Showing {filteredEvents.length} of {events.length} logged events
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-gray-100/80 p-1 rounded-xl">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === "ALL"
                ? "bg-white text-gray-900 shadow-xs"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            All Jobs ({events.length})
          </button>
          <button
            onClick={() => setFilter("INVOICE")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === "INVOICE"
                ? "bg-white text-emerald-800 shadow-xs"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            🧾 Invoices &amp; Batches (
            {
              events.filter(
                (e) =>
                  e.eventType.includes("BATCH") ||
                  e.eventType.includes("INVOICE") ||
                  e.eventType.includes("BILLING")
              ).length
            }
            )
          </button>
          <button
            onClick={() => setFilter("EMAIL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === "EMAIL"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            📧 Email Reminders (
            {events.filter((e) => e.eventType.includes("EMAIL")).length})
          </button>
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
          </div>
          <h4 className="text-sm font-semibold text-gray-900">
            No events match the selected filter
          </h4>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Try switching filters or run a batch cycle above.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/60 text-gray-500 border-b border-gray-100 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-3 font-semibold">Timestamp</th>
                <th className="px-6 py-3 font-semibold">Event Type</th>
                <th className="px-6 py-3 font-semibold">
                  Customer / Subscription
                </th>
                <th className="px-6 py-3 font-semibold">Generated Invoice</th>
                <th className="px-6 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {filteredEvents.map((ev) => {
                const isEmail = ev.eventType.includes("EMAIL");
                return (
                  <tr
                    key={ev.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-3.5 whitespace-nowrap text-gray-500">
                      {formatDate(ev.createdAt)}
                    </td>
                    <td className="px-6 py-3.5 font-medium">
                      <span
                        className={`font-mono text-[11px] px-2.5 py-1 rounded-md inline-flex items-center gap-1.5 ${
                          isEmail
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                            : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        }`}
                      >
                        {isEmail ? "📧" : "⚡"} {ev.eventType}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      {ev.subscription?.customer?.companyName ? (
                        <div>
                          <div className="font-semibold text-gray-900">
                            {ev.subscription.customer.companyName}
                          </div>
                          <div className="text-[11px] text-gray-400 font-mono">
                            {ev.subscription.subscriptionNumber}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 font-mono text-[11px]">
                          {ev.idempotencyKey || "System Batch Run"}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      {ev.invoice ? (
                        <Link
                          href="/invoices"
                          className="font-medium text-[#1d3c34] hover:underline font-mono"
                        >
                          {ev.invoice.invoiceNumber}
                        </Link>
                      ) : (
                        <span className="text-gray-400">&mdash;</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ev.status === "SUCCESS"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : ev.status === "FAILED"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-gray-100 text-gray-700 border border-gray-200"
                        }`}
                      >
                        {ev.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

