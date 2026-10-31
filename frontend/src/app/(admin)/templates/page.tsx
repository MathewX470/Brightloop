"use client";

import React, { useState, useEffect } from "react";
import { Topbar } from "@/components/layout/topbar";
import { formatCurrency, formatDate } from "@/lib/format";
import { PlusIcon, TemplatesIcon } from "@/components/ui/icons";

interface Plan {
  id: string;
  name: string;
  billingCycle: string;
  price: number | string;
  product: { id: string; name: string };
}

interface TemplateLine {
  id: string;
  quantity: number;
  unitPrice?: number | string | null;
  plan: Plan;
}

interface QuotationTemplate {
  id: string;
  name: string;
  description?: string;
  validityDays: number;
  lines: TemplateLine[];
  createdAt: string;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<QuotationTemplate[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    validityDays: 15,
    planId: "",
    quantity: 1,
    unitPrice: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [tplRes, plansRes] = await Promise.all([
        fetch("/api/catalog/templates"),
        fetch("/api/catalog/plans"),
      ]);

      const tplJson = await tplRes.json();
      const plansJson = await plansRes.json();

      if (tplRes.ok) setTemplates(tplJson.templates || []);
      if (plansRes.ok) {
        setPlans(plansJson.plans || []);
        if (plansJson.plans?.length > 0 && !formData.planId) {
          setFormData((prev) => ({ ...prev, planId: plansJson.plans[0].id }));
        }
      }
    } catch {
      setError("Failed to load quotation templates");
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
        description: formData.description,
        validityDays: Number(formData.validityDays) || 15,
        planId: formData.planId,
        quantity: Number(formData.quantity) || 1,
        unitPrice: formData.unitPrice ? parseFloat(formData.unitPrice) : null,
      };

      const res = await fetch("/api/catalog/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create template");

      setFormData((prev) => ({
        ...prev,
        name: "",
        description: "",
        validityDays: 15,
        quantity: 1,
        unitPrice: "",
      }));
      setIsModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error creating template");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Topbar
        title="Quotation Templates"
        subtitle="Standardized offer templates used by sales reps with preset validity days"
      />

      <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Saved Templates</h2>
            <p className="text-xs text-slate-500 mt-1">
              Sales reps generate customer offers instantly starting from pre-configured product and plan lines.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Create Template</span>
          </button>
        </div>

        {/* Templates Grid */}
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading templates...</div>
        ) : templates.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-500 border border-slate-200 rounded-xl bg-white shadow-sm">
            No quotation templates found. Click &quot;Create Template&quot; to build a reusable offer.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between hover:border-slate-300 hover:shadow-sm transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <TemplatesIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{tpl.name}</h3>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200 font-semibold">
                          Valid for {tpl.validityDays} Days
                        </span>
                      </div>
                    </div>
                  </div>

                  {tpl.description && (
                    <p className="mt-3 text-xs text-slate-600">{tpl.description}</p>
                  )}

                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                      Included Offer Lines
                    </span>
                    {tpl.lines.map((line) => (
                      <div
                        key={line.id}
                        className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-medium text-slate-900">
                            {line.plan.product.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Plan: {line.plan.name} ({line.plan.billingCycle})
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-slate-900 font-mono">
                            {formatCurrency(line.unitPrice || line.plan.price)}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Qty: {line.quantity}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 text-[11px] text-slate-400 font-mono">
                  Created {formatDate(tpl.createdAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Template Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-1">Create Quotation Template</h3>
            <p className="text-xs text-slate-500 mb-6">
              Create a reusable bundle for your sales representatives.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Template Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Standard SaaS Growth Package"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Notes shown on customer quotation proposal"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Validity (Days)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.validityDays}
                    onChange={(e) => setFormData({ ...formData, validityDays: parseInt(e.target.value) || 15 })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Select Default Plan</label>
                  <select
                    value={formData.planId}
                    onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    required
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.billingCycle})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Default Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Custom Unit Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Leave empty for plan default"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
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
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                >
                  {submitting ? "Saving..." : "Save Template"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
