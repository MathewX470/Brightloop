"use client";

import React, { useState, useEffect } from "react";
import { Topbar } from "@/components/layout/topbar";
import { formatCurrency, formatDate } from "@/lib/format";
import { PlusIcon, PlansIcon } from "@/components/ui/icons";

interface Product {
  id: string;
  name: string;
}

interface Plan {
  id: string;
  name: string;
  billingCycle: string;
  price: number | string;
  minimumQuantity: number;
  availableFrom?: string;
  availableUntil?: string;
  allowEarlyClosure: boolean;
  allowPause: boolean;
  allowRenewal: boolean;
  autoClose: boolean;
  product: Product;
  createdAt: string;
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    productId: "",
    name: "",
    billingCycle: "MONTHLY",
    price: "",
    minimumQuantity: 1,
    availableFrom: "",
    availableUntil: "",
    allowEarlyClosure: true,
    allowPause: true,
    allowRenewal: true,
    autoClose: false,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansRes, prodsRes] = await Promise.all([
        fetch("/api/catalog/plans"),
        fetch("/api/catalog/products"),
      ]);

      const plansJson = await plansRes.json();
      const prodsJson = await prodsRes.json();

      if (plansRes.ok) setPlans(plansJson.plans || []);
      if (prodsRes.ok) {
        setProducts(prodsJson.products || []);
        if (prodsJson.products?.length > 0 && !formData.productId) {
          setFormData((prev) => ({ ...prev, productId: prodsJson.products[0].id }));
        }
      }
    } catch {
      setError("Failed to load plans data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        productId: formData.productId,
        name: formData.name,
        billingCycle: formData.billingCycle,
        price: parseFloat(formData.price) || 0,
        minimumQuantity: Number(formData.minimumQuantity) || 1,
        availableFrom: formData.availableFrom || null,
        availableUntil: formData.availableUntil || null,
        allowEarlyClosure: formData.allowEarlyClosure,
        allowPause: formData.allowPause,
        allowRenewal: formData.allowRenewal,
        autoClose: formData.autoClose,
      };

      const res = await fetch("/api/catalog/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to create plan");
      }

      setFormData((prev) => ({
        ...prev,
        name: "",
        price: "",
        minimumQuantity: 1,
      }));
      setIsModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error creating plan");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Topbar
        title="Subscription Plans"
        subtitle="Manage billing cycles (Daily, Weekly, Monthly, Yearly) and renewal rules"
      />

      <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Active Plans</h2>
            <p className="text-xs text-slate-500 mt-1">
              Admin controls whether plans auto-close when they end, and if customers can pause or renew.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Create New Plan</span>
          </button>
        </div>

        {/* Plans Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-6 py-3.5">Plan Name</th>
                  <th className="px-6 py-3.5">Associated Product</th>
                  <th className="px-6 py-3.5">Billing Frequency</th>
                  <th className="px-6 py-3.5">Price & Min Qty</th>
                  <th className="px-6 py-3.5">Rules & Policies</th>
                  <th className="px-6 py-3.5">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      Loading plans...
                    </td>
                  </tr>
                ) : plans.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      No plans created yet. Click &quot;Create New Plan&quot; to configure your first plan.
                    </td>
                  </tr>
                ) : (
                  plans.map((plan) => (
                    <tr key={plan.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900 flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                          <PlansIcon className="w-4 h-4" />
                        </div>
                        <span>{plan.name}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-700 font-medium">
                        {plan.product?.name || "Unassigned"}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200 uppercase text-[10px] font-semibold">
                          {plan.billingCycle}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 font-mono text-sm">
                          {formatCurrency(plan.price)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Min: {plan.minimumQuantity} unit(s)
                        </div>
                      </td>
                      <td className="px-6 py-4 space-y-1">
                        <div className="flex flex-wrap gap-1 text-[10px]">
                          {plan.autoClose && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                              Auto-close on end
                            </span>
                          )}
                          {plan.allowPause && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                              Can Pause
                            </span>
                          )}
                          {plan.allowRenewal && (
                            <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
                              Can Renew
                            </span>
                          )}
                          {plan.allowEarlyClosure && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                              Early Close
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-400 font-mono">
                        {formatDate(plan.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Plan Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-1">Create Subscription Plan</h3>
            <p className="text-xs text-slate-500 mb-6">
              Configure billing cycle, minimum quantity, and lifecycle policies.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-slate-700 font-medium mb-1">Select Product</label>
                  <select
                    value={formData.productId}
                    onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    required
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-700 font-medium mb-1">Plan Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Enterprise Monthly Plan"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
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
                  <label className="block text-slate-700 font-medium mb-1">Plan Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="149.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Minimum Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.minimumQuantity}
                    onChange={(e) => setFormData({ ...formData, minimumQuantity: parseInt(e.target.value) || 1 })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              </div>

              {/* Policy Toggles */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
                <span className="text-xs font-semibold text-slate-700 block">
                  Plan Lifecycle Controls (Admin Decision)
                </span>
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.autoClose}
                    onChange={(e) => setFormData({ ...formData, autoClose: e.target.checked })}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Auto-close on expiration date</span>
                </label>
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.allowPause}
                    onChange={(e) => setFormData({ ...formData, allowPause: e.target.checked })}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Allow subscription to be paused</span>
                </label>
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.allowRenewal}
                    onChange={(e) => setFormData({ ...formData, allowRenewal: e.target.checked })}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Allow subscription to be renewed</span>
                </label>
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.allowEarlyClosure}
                    onChange={(e) => setFormData({ ...formData, allowEarlyClosure: e.target.checked })}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Allow subscription to be closed early</span>
                </label>
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
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                >
                  {submitting ? "Saving..." : "Create Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
