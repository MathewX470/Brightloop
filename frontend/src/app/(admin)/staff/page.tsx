"use client";

import React, { useState, useEffect } from "react";
import { Topbar } from "@/components/layout/topbar";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/format";
import { PlusIcon, StaffIcon } from "@/components/ui/icons";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "STAFF",
  });

  const loadStaff = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/staff");
      const json = await res.json();
      if (res.ok) {
        setStaff(json.staff || []);
      }
    } catch {
      setError("Failed to load staff members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to create staff member");
      }

      setFormData({ name: "", email: "", password: "", role: "STAFF" });
      setIsModalOpen(false);
      await loadStaff();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error creating staff");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Topbar
        title="Staff & Team Management"
        subtitle="Only administrators can manage internal team members and permissions"
      />

      <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Header with Call to Action */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Internal Staff Team</h2>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                Admin Restricted
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Internal staff handle day-to-day work with limited access. Customers cannot access this area.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#1d3c34] hover:bg-[#142d26] text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-xs"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Add Member of Staff</span>
          </button>
        </div>

        {/* Staff Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3.5">Staff Name</th>
                  <th className="px-6 py-3.5">Email Address</th>
                  <th className="px-6 py-3.5">Assigned Role</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Added Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      Loading staff records...
                    </td>
                  </tr>
                ) : staff.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      No staff members found. Click &quot;Add Member of Staff&quot; above.
                    </td>
                  </tr>
                ) : (
                  staff.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900 flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-[11px] text-slate-700">
                          {member.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span>{member.name}</span>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-600">{member.email}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={member.role} />
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border ${
                            member.isActive
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${member.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                          {member.isActive ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-mono">
                        {formatDate(member.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-1">
              <StaffIcon className="w-5 h-5 text-[#1d3c34]" />
              <h3 className="text-base font-bold text-slate-900">Add New Member of Staff</h3>
            </div>
            <p className="text-xs text-slate-500 mb-6">
              Only an admin can provision internal staff credentials.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="alex@brightloop.local"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Initial Password</label>
                <input
                  type="password"
                  required
                  placeholder="Temporary password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Minimum 8 characters</span>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Role Permissions</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                >
                  <option value="STAFF">STAFF (Day-to-day operations & quotes)</option>
                  <option value="ADMIN">ADMIN (Full ERP & settings control)</option>
                </select>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:text-slate-900 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#1d3c34] hover:bg-[#142d26] text-white font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50 shadow-xs"
                >
                  {submitting ? "Adding Member..." : "Save Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
