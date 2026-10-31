"use client";

import React, { useState, useEffect } from "react";
import { Topbar } from "@/components/layout/topbar";
import { formatCurrency, formatDate } from "@/lib/format";
import { PlusIcon, ProductsIcon } from "@/components/ui/icons";

interface ProductVariant {
  id: string;
  name: string;
  priceModifier: number | string;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  type: string;
  salesPrice: number | string;
  costPrice: number | string;
  notes?: string;
  variants: ProductVariant[];
  createdAt: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    type: "SOFTWARE",
    salesPrice: "",
    costPrice: "",
    notes: "",
    variantName: "",
    variantPriceModifier: "",
  });

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/catalog/products");
      const json = await res.json();
      if (res.ok) {
        setProducts(json.products || []);
      }
    } catch {
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload: {
        name: string;
        type: string;
        salesPrice: number;
        costPrice: number;
        notes: string;
        variants?: Array<{ name: string; priceModifier: number }>;
      } = {
        name: formData.name,
        type: formData.type,
        salesPrice: parseFloat(formData.salesPrice) || 0,
        costPrice: parseFloat(formData.costPrice) || 0,
        notes: formData.notes,
      };

      if (formData.variantName.trim()) {
        payload.variants = [
          {
            name: formData.variantName,
            priceModifier: parseFloat(formData.variantPriceModifier) || 0,
          },
        ];
      }

      const res = await fetch("/api/catalog/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to create product");
      }

      setFormData({
        name: "",
        type: "SOFTWARE",
        salesPrice: "",
        costPrice: "",
        notes: "",
        variantName: "",
        variantPriceModifier: "",
      });
      setIsModalOpen(false);
      await loadProducts();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error creating product");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Topbar
        title="Products & Variants Catalog"
        subtitle="Configure software, add-ons, and pricing variations"
      />

      <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Product Offerings</h2>
            <p className="text-xs text-slate-500 mt-1">
              Products can be attached to subscription plans with custom brand and feature variants.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#1d3c34] hover:bg-[#142d26] text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Launch New Product</span>
          </button>
        </div>

        {/* Product Cards Grid */}
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading catalog...</div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-500 border border-slate-200 rounded-xl bg-white shadow-sm">
            No products in catalog yet. Click &quot;Launch New Product&quot; to add your first product.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((prod) => (
              <div
                key={prod.id}
                className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between hover:border-slate-300 hover:shadow-sm transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#eaf3ef] flex items-center justify-center text-[#1d3c34]">
                        <ProductsIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{prod.name}</h3>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {prod.type}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-bold text-slate-900 font-mono">
                        {formatCurrency(prod.salesPrice)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Cost: {formatCurrency(prod.costPrice)}
                      </div>
                    </div>
                  </div>

                  {prod.notes && (
                    <p className="mt-3 text-xs text-slate-600 italic line-clamp-2">
                      &quot;{prod.notes}&quot;
                    </p>
                  )}

                  {/* Variants Section */}
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                      Available Variants
                    </span>
                    {prod.variants.length === 0 ? (
                      <span className="text-xs text-slate-400">Standard base variant only</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {prod.variants.map((v) => (
                          <span
                            key={v.id}
                            className="text-xs px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-700 flex items-center gap-1.5 font-mono"
                          >
                            <span>{v.name}</span>
                            <span className="text-[#1d3c34] font-semibold">
                              (+{formatCurrency(v.priceModifier)})
                            </span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>ID: {prod.id.slice(0, 8)}...</span>
                  <span>{formatDate(prod.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-1">Launch New Product</h3>
            <p className="text-xs text-slate-500 mb-6">
              Add base pricing and define brand or tier variants.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-slate-700 font-medium mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Business ERP Suite"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Product Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  >
                    <option value="SOFTWARE">SOFTWARE</option>
                    <option value="SERVICE">SERVICE</option>
                    <option value="DIGITAL">DIGITAL</option>
                    <option value="PHYSICAL">PHYSICAL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Sales Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="999.00"
                    value={formData.salesPrice}
                    onChange={(e) => setFormData({ ...formData, salesPrice: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Cost Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="250.00"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-700 font-medium mb-1">Notes</label>
                  <input
                    type="text"
                    placeholder="Optional internal notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              </div>

              {/* Initial Variant (e.g. Brand: Odoo +560) */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <span className="text-xs font-semibold text-slate-700 block">
                  Add Brand or Feature Variant (Optional)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Variant Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Brand: Odoo"
                      value={formData.variantName}
                      onChange={(e) => setFormData({ ...formData, variantName: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Price Add-on ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 560"
                      value={formData.variantPriceModifier}
                      onChange={(e) =>
                        setFormData({ ...formData, variantPriceModifier: e.target.value })
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                  </div>
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
                  {submitting ? "Saving..." : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
