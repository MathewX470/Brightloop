"use client";

import React, { useState, useEffect } from "react";
import { Topbar } from "@/components/layout/topbar";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { InvoicesIcon } from "@/components/ui/icons";

interface Customer {
  id: string;
  companyName: string;
  email: string;
}

interface InvoiceLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number | string;
  taxAmount: number | string;
  total: number | string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  issueDate: string;
  dueDate: string;
  subtotal: number | string;
  taxAmount: number | string;
  discountAmount: number | string;
  total: number | string;
  paidAmount: number | string;
  customer: Customer;
  lines: InvoiceLine[];
}

const statusTabs = ["ALL", "DRAFT", "CONFIRMED", "PAID", "CANCELLED"];

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [activeTab, setActiveTab] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const url = activeTab === "ALL" ? "/api/invoices" : `/api/invoices?status=${activeTab}`;
      const res = await fetch(url);
      const json = await res.json();
      if (res.ok) setInvoices(json.invoices || []);
    } catch {
      setError("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [activeTab]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/invoices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) await loadInvoices();
    } catch {
      alert("Failed to update invoice status");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Topbar
        title="Billing & Invoices"
        subtitle="Move invoices from Draft to Confirmed to Paid with auto-calculated taxes & discounts"
      />

      <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Invoices Register</h2>
            <p className="text-xs text-slate-500 mt-1">
              Invoices are generated automatically from subscriptions. No invoice is billed twice or skipped.
            </p>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200">
          {statusTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === tab
                  ? "bg-[#eaf3ef] text-[#1d3c34] border border-[#cce5d9] font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Invoices Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-6 py-3.5">Invoice #</th>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Issue & Due Date</th>
                  <th className="px-6 py-3.5">Breakdown (Subtotal / Tax)</th>
                  <th className="px-6 py-3.5">Total & Balance</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Workflow</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      Loading invoices...
                    </td>
                  </tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      No invoices found in this status category.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => {
                    const balance = Number(inv.total) - Number(inv.paidAmount);
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-slate-900 flex items-center gap-2">
                          <InvoicesIcon className="w-4 h-4 text-[#1d3c34]" />
                          <span>{inv.invoiceNumber}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">
                            {inv.customer?.companyName || "Brightloop Client"}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {inv.customer?.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-[11px] text-slate-600 space-y-0.5">
                          <div>Issued: {formatDate(inv.issueDate)}</div>
                          <div className="text-slate-400">Due: {formatDate(inv.dueDate)}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-700 font-mono text-[11px]">
                          <div>Subtotal: {formatCurrency(inv.subtotal)}</div>
                          <div className="text-slate-400">
                            Tax: +{formatCurrency(inv.taxAmount)} | Disc: -{formatCurrency(inv.discountAmount)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-slate-900 font-mono">
                            {formatCurrency(inv.total)}
                          </div>
                          {balance > 0 ? (
                            <div className="text-[10px] text-rose-600 font-mono font-medium">
                              Owed: {formatCurrency(balance)}
                            </div>
                          ) : (
                            <div className="text-[10px] text-emerald-600 font-mono font-medium">
                              Fully Settled
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={inv.status} />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-[10px]">
                            {inv.status === "DRAFT" && (
                              <button
                                onClick={() => handleStatusChange(inv.id, "CONFIRMED")}
                                className="px-2.5 py-1 rounded-md bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 font-medium"
                              >
                                Confirm
                              </button>
                            )}
                            {inv.status === "CONFIRMED" && (
                              <button
                                onClick={() => handleStatusChange(inv.id, "PAID")}
                                className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-medium"
                              >
                                Mark Paid
                              </button>
                            )}
                            {inv.status !== "CANCELLED" && inv.status !== "PAID" && (
                              <button
                                onClick={() => handleStatusChange(inv.id, "CANCELLED")}
                                className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 hover:text-rose-600 border border-slate-200"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
