"use client";

import React, { useState, useEffect } from "react";
import { Topbar } from "@/components/layout/topbar";
import { formatDate } from "@/lib/format";
import { PlusIcon, TaxesIcon } from "@/components/ui/icons";

interface Tax {
  id: string;
  name: string;
  type: string;
  rate: number | string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export default function TaxesPage() {
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    type: "PERCENTAGE",
    rate: "",
    description: "",
  });

  const loadTaxes = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/catalog/taxes");
      const json = await res.json();
      if (res.ok) setTaxes(json.taxes || []);
    } catch {
      setError("Failed to load taxes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTaxes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/catalog/taxes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          rate: parseFloat(formData.rate) || 0,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create tax rule");

      setFormData({ name: "", type: "PERCENTAGE", rate: "", description: "" });
      setIsModalOpen(false);
      await loadTaxes();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error creating tax");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Topbar
        title="Automated Tax Rules"
        subtitle="Define regional sales tax, GST, or VAT automatically calculated during billing"
      />

      <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Tax Configurations</h2>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
                Admin Set
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Invoices automatically calculate taxes based on the active rules set by the admin.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#1d3c34] hover:bg-[#142d26] text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Create Tax Rule</span>
          </button>
        </div>

        {/* Taxes Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-6 py-3.5">Tax Name</th>
                <th className="px-6 py-3.5">Calculation Type</th>
                <th className="px-6 py-3.5">Applied Rate</th>
                <th className="px-6 py-3.5">Description</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    Loading taxes...
                  </td>
                </tr>
              ) : taxes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No tax rules defined. Click &quot;Create Tax Rule&quot; to add one.
                  </td>
                </tr>
              ) : (
                taxes.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#eaf3ef] flex items-center justify-center text-[#1d3c34]">
                        <TaxesIcon className="w-4 h-4" />
                      </div>
                      <span>{t.name}</span>
                    </td>
                    <td className="px-6 py-4 font-mono uppercase text-[10px] text-slate-500">
                      {t.type}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {t.type === "PERCENTAGE" ? `${t.rate}%` : `$${t.rate}`}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{t.description || "-"}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-md text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-mono">
                      {formatDate(t.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Tax Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-1">Create Tax Rule</h3>
            <p className="text-xs text-slate-500 mb-6">Set rate percentage for automated invoice calculation.</p>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Tax Label / Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Standard GST 18%"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Type</label>
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
                  <label className="block text-slate-700 font-medium mb-1">Rate Value</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="18.0"
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Optional notes or tax registration code"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
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
                  {submitting ? "Saving..." : "Save Tax Rule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
