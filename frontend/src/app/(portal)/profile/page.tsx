"use client";

import React, { useEffect, useState } from "react";
import { formatDashboardDate } from "../client/dashboard/dashboard-utils";

interface CustomerProfile {
  id: string;
  companyName: string;
  email: string;
  phone: string;
  taxId: string;
  billingAddress: string;
  createdAt: string;
}

export default function CustomerProfilePage() {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState("");
  const [taxId, setTaxId] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  async function fetchProfile() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/portal/profile");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load profile.");

      setProfile(data.customer);
      setPhone(data.customer.phone || "");
      setTaxId(data.customer.taxId || "");
      setBillingAddress(data.customer.billingAddress || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading profile");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProfile();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      setIsSaving(true);
      setFeedback(null);
      const res = await fetch("/api/portal/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, taxId, billingAddress }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed.");

      setFeedback({ type: "success", message: data.message });
      setIsEditing(false);
      await fetchProfile();
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to update company details.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-7 max-w-4xl">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-7 shadow-xl sm:px-8">
        <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
              CUSTOMER PORTAL / ACCOUNT
            </p>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
              Company & Billing Profile
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-400">
              Manage your registered corporate details, GSTIN/Tax ID, and invoice dispatch address.
            </p>
          </div>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`rounded-xl p-4 text-xs font-semibold flex items-center justify-between border ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="underline hover:opacity-80">
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-200/80 bg-white">
          <div className="text-center">
            <div className="mx-auto size-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-800" />
            <p className="mt-3 text-xs text-slate-500">Loading company profile...</p>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
          <p className="text-xs font-semibold text-rose-700">{error}</p>
          <button onClick={fetchProfile} className="mt-3 px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold">
            Retry
          </button>
        </div>
      ) : profile ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Identity Card */}
          <div className="md:col-span-1 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-lg flex items-center justify-center">
                {profile.companyName.charAt(0)}
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900">{profile.companyName}</h3>
              <p className="text-xs text-slate-500 truncate">{profile.email}</p>

              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs">
                <div>
                  <span className="text-[11px] text-slate-400">Account Type</span>
                  <p className="font-semibold text-slate-800">Verified Corporate Client</p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400">Client Since</span>
                  <p className="font-semibold text-slate-800">{formatDashboardDate(profile.createdAt)}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Active Subscription Account
              </span>
            </div>
          </div>

          {/* Details / Form Card */}
          <div className="md:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Billing Information</h3>
                <p className="text-xs text-slate-500">Official details printed on generated tax invoices</p>
              </div>

              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Edit Details
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>

            {!isEditing ? (
              <div className="mt-6 space-y-4 text-xs">
                <div>
                  <p className="text-[11px] text-slate-400">Company Name</p>
                  <p className="mt-1 font-semibold text-slate-900 text-sm">{profile.companyName}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[11px] text-slate-400">Billing Email</p>
                    <p className="mt-1 font-semibold text-slate-800">{profile.email}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400">Contact Phone</p>
                    <p className="mt-1 font-semibold text-slate-800">{profile.phone || "Not configured"}</p>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] text-slate-400">GSTIN / Tax Identification</p>
                  <p className="mt-1 font-mono font-semibold text-slate-900">{profile.taxId || "Not provided"}</p>
                </div>

                <div>
                  <p className="text-[11px] text-slate-400">Registered Billing Address</p>
                  <p className="mt-1 font-semibold text-slate-800 leading-relaxed">
                    {profile.billingAddress || "No registered billing address"}
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSave} className="mt-6 space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">GSTIN / Tax ID</label>
                  <input
                    type="text"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    placeholder="27AABCU9603R1ZM"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Registered Billing Address</label>
                  <textarea
                    rows={3}
                    value={billingAddress}
                    onChange={(e) => setBillingAddress(e.target.value)}
                    placeholder="Street, City, State, ZIP, Country"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 rounded-xl bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-xs"
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

