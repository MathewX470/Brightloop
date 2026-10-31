"use client";

import React, { useState, useEffect } from "react";
import { Topbar } from "@/components/layout/topbar";
import { formatCurrency, formatDate } from "@/lib/format";
import { PlusIcon, DiscountsIcon } from "@/components/ui/icons";

interface Product {
  id: string;
  name: string;
}

interface DiscountProduct {
  product: Product;
}

interface Discount {
  id: string;
  name: string;
  type: string;
  value: number | string;
  minimumPurchase?: number | string | null;
  minimumQuantity: number;
  startDate: string;
  endDate?: string | null;
  usageLimit?: number | null;
  usedCount: number;
  products: DiscountProduct[];
  createdAt: string;
}

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    type: "PERCENTAGE",
    value: "",
    minimumPurchase: "",
    minimumQuantity: 1,
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    usageLimit: "",
    productId: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [discRes, prodsRes] = await Promise.all([
        fetch("/api/catalog/discounts"),
        fetch("/api/catalog/products"),
      ]);

      const discJson = await discRes.json();
      const prodsJson = await prodsRes.json();

      if (discRes.ok) setDiscounts(discJson.discounts || []);
      if (prodsRes.ok) setProducts(prodsJson.products || []);
    } catch {
      setError("Failed to load discount rules");
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
        name: formData.name,
        type: formData.type,
        value: parseFloat(formData.value) || 0,
        minimumPurchase: formData.minimumPurchase ? parseFloat(formData.minimumPurchase) : null,
        minimumQuantity: parseInt(String(formData.minimumQuantity)) || 1,
        startDate: formData.startDate,
        endDate: formData.endDate || null,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
        productId: formData.productId || null,
      };

      const res = await fetch("/api/catalog/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create discount rule");

      setFormData({
        name: "",
        type: "PERCENTAGE",
        value: "",
        minimumPurchase: "",
        minimumQuantity: 1,
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
        usageLimit: "",
        productId: "",
      });
      setIsModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error creating discount");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Topbar
        title="Promotional & Volume Discounts"
        subtitle="Automatic discount rules based on minimum quantity, purchase amount, or limited runs"
      />

      <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Active Discount Rules</h2>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
                Admin Set
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Discounts automatically apply to qualifying invoices without staff needing to remember.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#1d3c34] hover:bg-[#142d26] text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Create Discount Rule</span>
          </button>
        </div>

        {/* Discounts Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-6 py-3.5">Rule Name</th>
                <th className="px-6 py-3.5">Discount Value</th>
                <th className="px-6 py-3.5">Eligibility Criteria</th>
                <th className="px-6 py-3.5">Scope</th>
                <th className="px-6 py-3.5">Usage & Expiry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    Loading discount rules...
                  </td>
                </tr>
              ) : discounts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No discount rules found. Click &quot;Create Discount Rule&quot; to configure one.
                  </td>
                </tr>
              ) : (
                discounts.map((disc) => (
                  <tr key={disc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#eaf3ef] flex items-center justify-center text-[#1d3c34]">
                        <DiscountsIcon className="w-4 h-4" />
                      </div>
                      <span>{disc.name}</span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-emerald-600 text-sm">
                      {disc.type === "PERCENTAGE" ? `${disc.value}% OFF` : `-${formatCurrency(disc.value)}`}
                    </td>
                    <td className="px-6 py-4 text-slate-700 space-y-0.5 font-mono text-[11px]">
                      {disc.minimumQuantity > 1 && (
                        <div>Min Qty: {disc.minimumQuantity} seats/units</div>
                      )}
                      {disc.minimumPurchase && (
                        <div>Min Spend: {formatCurrency(disc.minimumPurchase)}</div>
                      )}
                      {disc.minimumQuantity <= 1 && !disc.minimumPurchase && (
                        <div className="text-slate-400">No minimum requirement</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {disc.products.length > 0 ? (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-mono font-medium">
                          {disc.products[0].product.name}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-[#eaf3ef] text-[#1d3c34] border border-[#cce5d9] text-[10px] font-mono font-medium">
                          Whole Subscription
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500 space-y-0.5 text-[11px] font-mono">
                      <div>
                        Used: {disc.usedCount}
                        {disc.usageLimit ? ` / ${disc.usageLimit} max` : " (Unlimited)"}
                      </div>
                      <div>
                        {disc.endDate ? `Expires: ${formatDate(disc.endDate)}` : "Ongoing"}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Discount Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-1">Create Discount Rule</h3>
            <p className="text-xs text-slate-500 mb-6">
              Only admin can create volume and promotional discounts.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-slate-700 font-medium mb-1">Rule Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Volume Tier: 10+ Seats"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Discount Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount ($)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Discount Amount/Value</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="15.0"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Min Quantity (Seats)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minimumQuantity}
                    onChange={(e) => setFormData({ ...formData, minimumQuantity: parseInt(e.target.value) || 1 })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Min Purchase ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.minimumPurchase}
                    onChange={(e) => setFormData({ ...formData, minimumPurchase: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-700 font-medium mb-1">Target Application Scope</label>
                  <select
                    value={formData.productId}
                    onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  >
                    <option value="">Apply to Whole Subscription</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        Specific Product: {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">End Date (Optional)</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
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
                  {submitting ? "Saving..." : "Save Discount Rule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
