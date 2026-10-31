"use client";

import React, { useState, useEffect } from "react";
import { Topbar } from "@/components/layout/topbar";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { PlusIcon, SubscriptionsIcon } from "@/components/ui/icons";

interface Customer {
  id: string;
  companyName: string;
  email: string;
}

interface Plan {
  id: string;
  name: string;
  billingCycle: string;
  price: number | string;
  product: { id: string; name: string };
}

interface SubscriptionLine {
  id: string;
  quantity: number;
  unitPrice: number | string;
  product: { name: string };
  plan: { name: string; billingCycle: string };
}

interface Subscription {
  id: string;
  subscriptionNumber: string;
  status: string;
  billingCycle: string;
  paymentTermsDays: number;
  startDate?: string;
  nextBillingDate?: string;
  customer: Customer;
  lines: SubscriptionLine[];
  createdAt: string;
}

const statusTabs = ["ALL", "DRAFT", "QUOTATION", "CONFIRMED", "ACTIVE", "PAUSED", "CLOSED"];

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activeTab, setActiveTab] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form
  const [formData, setFormData] = useState({
    customerId: "",
    planId: "",
    quantity: 1,
    unitPrice: "",
    billingCycle: "MONTHLY",
    paymentTermsDays: 15,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const url = activeTab === "ALL" ? "/api/subscriptions" : `/api/subscriptions?status=${activeTab}`;
      const [subsRes, plansRes, custRes] = await Promise.all([
        fetch(url),
        fetch("/api/catalog/plans"),
        fetch("/api/admin/customers"),
      ]);

      const subsJson = await subsRes.json();
      const plansJson = await plansRes.json();
      const custJson = await custRes.json();

      if (subsRes.ok) setSubscriptions(subsJson.subscriptions || []);
      if (custRes.ok) {
        setCustomers(custJson.customers || []);
        if (custJson.customers?.length > 0 && !formData.customerId) {
          setFormData((prev) => ({ ...prev, customerId: custJson.customers[0].id }));
        }
      }
      if (plansRes.ok) {
        setPlans(plansJson.plans || []);
        if (plansJson.plans?.length > 0 && !formData.planId) {
          setFormData((prev) => ({
            ...prev,
            planId: plansJson.plans[0].id,
            unitPrice: String(plansJson.plans[0].price),
            billingCycle: plansJson.plans[0].billingCycle,
          }));
        }
      }
    } catch {
      setError("Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/subscriptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        await loadData();
      }
    } catch {
      alert("Failed to update status");
    }
  };

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const selectedPlan = plans.find((p) => p.id === formData.planId);
      const payload = {
        customerId: formData.customerId,
        planId: formData.planId,
        quantity: Number(formData.quantity) || 1,
        unitPrice: parseFloat(formData.unitPrice) || Number(selectedPlan?.price || 0),
        billingCycle: formData.billingCycle,
        paymentTermsDays: Number(formData.paymentTermsDays) || 15,
      };

      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create subscription");

      setIsModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error creating subscription");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Topbar
        title="Subscription Contracts"
        subtitle="Full lifecycle: Draft -> Quotation -> Confirmed -> Active -> Closed"
      />

      <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Subscriptions Register</h2>
            <p className="text-xs text-slate-500 mt-1">
              Track contract numbers, lines, terms, and current lifecycle stages.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#1d3c34] hover:bg-[#142d26] text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Create Subscription</span>
          </button>
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

        {/* Subscriptions Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-6 py-3.5">Subscription #</th>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Included Product & Plan</th>
                  <th className="px-6 py-3.5">Billing Interval</th>
                  <th className="px-6 py-3.5">Stage</th>
                  <th className="px-6 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      Loading subscriptions...
                    </td>
                  </tr>
                ) : subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      No subscriptions found in this status category.
                    </td>
                  </tr>
                ) : (
                  subscriptions.map((sub) => {
                    const firstLine = sub.lines[0];
                    return (
                      <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-slate-900 flex items-center gap-2">
                          <SubscriptionsIcon className="w-4 h-4 text-[#1d3c34]" />
                          <span>{sub.subscriptionNumber}</span>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {sub.customer?.companyName || "Brightloop Customer"}
                        </td>
                        <td className="px-6 py-4">
                          {firstLine ? (
                            <div>
                              <div className="font-semibold text-slate-900">
                                {firstLine.product?.name || "Product Item"}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                {firstLine.plan?.name} • {firstLine.quantity} unit(s) @{" "}
                                {formatCurrency(firstLine.unitPrice)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 uppercase font-medium">
                            {sub.billingCycle}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={sub.status} />
                        </td>
                        <td className="px-6 py-4">
                          {/* Lifecycle State Transitions */}
                          <div className="flex items-center gap-1.5 text-[10px]">
                            {sub.status === "DRAFT" && (
                              <button
                                onClick={() => handleStatusChange(sub.id, "QUOTATION")}
                                className="px-2.5 py-1 rounded-md bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 font-medium"
                              >
                                Send Quote
                              </button>
                            )}
                            {sub.status === "QUOTATION" && (
                              <button
                                onClick={() => handleStatusChange(sub.id, "CONFIRMED")}
                                className="px-2.5 py-1 rounded-md bg-[#eaf3ef] text-[#1d3c34] border border-[#cce5d9] hover:bg-indigo-100 font-medium"
                              >
                                Confirm
                              </button>
                            )}
                            {sub.status === "CONFIRMED" && (
                              <button
                                onClick={() => handleStatusChange(sub.id, "ACTIVE")}
                                className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-medium"
                              >
                                Activate
                              </button>
                            )}
                            {sub.status === "ACTIVE" && (
                              <>
                                <button
                                  onClick={() => handleStatusChange(sub.id, "PAUSED")}
                                  className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 font-medium"
                                >
                                  Pause
                                </button>
                                <button
                                  onClick={() => handleStatusChange(sub.id, "CLOSED")}
                                  className="px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-medium"
                                >
                                  Close
                                </button>
                              </>
                            )}
                            {sub.status === "PAUSED" && (
                              <button
                                onClick={() => handleStatusChange(sub.id, "ACTIVE")}
                                className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-medium"
                              >
                                Resume
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

      {/* Create Subscription Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-1">Create Subscription Contract</h3>
            <p className="text-xs text-slate-500 mb-6">
              Establish a recurring agreement for a customer.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateSubscription} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Customer Account</label>
                <select
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  required
                >
                  <option value="">Select customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-700 font-medium mb-1">Subscription Plan</label>
                  <select
                    value={formData.planId}
                    onChange={(e) => {
                      const p = plans.find((item) => item.id === e.target.value);
                      setFormData({
                        ...formData,
                        planId: e.target.value,
                        unitPrice: p ? String(p.price) : formData.unitPrice,
                        billingCycle: p ? p.billingCycle : formData.billingCycle,
                      });
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    required
                  >
                    <option value="">Select plan...</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.product?.name} - {p.name} ({formatCurrency(p.price)} / {p.billingCycle})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Quantity (Seats / Units)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Unit Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Billing Frequency</label>
                  <select
                    value={formData.billingCycle}
                    onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  >
                    <option value="DAILY">DAILY</option>
                    <option value="WEEKLY">WEEKLY</option>
                    <option value="MONTHLY">MONTHLY</option>
                    <option value="YEARLY">YEARLY</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Payment Terms (Days)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.paymentTermsDays}
                    onChange={(e) => setFormData({ ...formData, paymentTermsDays: parseInt(e.target.value) || 15 })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:text-slate-900 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#1d3c34] hover:bg-[#142d26] text-white font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                >
                  {submitting ? "Creating..." : "Create Subscription"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
