"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlusIcon } from "@/components/ui/icons";

interface TopbarProps {
  title?: string;
  subtitle?: string;
  actionHref?: string;
  actionLabel?: string;
  showSearch?: boolean;
  userName?: string;
  userRole?: string;
}

export function Topbar({
  title,
  subtitle,
  actionHref,
  actionLabel,
  showSearch = true,
  userName: initialUserName,
  userRole: initialUserRole,
}: TopbarProps) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
    role: string;
  } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch logged in session if not provided via props
  useEffect(() => {
    fetch("/api/auth")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setCurrentUser({
            name: data.user.name,
            email: data.user.email,
            role:
              data.user.role === "ADMIN"
                ? "Admin"
                : data.user.role === "STAFF"
                ? "Staff"
                : "Customer",
          });
        }
      })
      .catch(() => {});
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayName = currentUser?.name || initialUserName || "Brightloop Admin";
  const displayRole = currentUser?.role || initialUserRole || "Admin";
  const displayEmail = currentUser?.email || "admin@brightloop.io";

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      window.location.href = "/login";
    }
  };

  return (
    <header
      className="h-20 bg-white/70 backdrop-blur-md border-b border-[#ebf0ed] px-8 flex items-center justify-between sticky top-0 z-30"
      data-purpose="top-navigation-header"
    >
      {/* Left Area: Title / Search */}
      <div className="flex items-center gap-6 min-w-0">
        {title && (
          <div className="min-w-0">
            <h1 className="text-base font-bold text-gray-900 tracking-tight leading-tight truncate">
              {title}
            </h1>
            {subtitle && <p className="text-xs text-gray-500 font-medium truncate">{subtitle}</p>}
          </div>
        )}

        {showSearch && (
          <div className="relative hidden md:block w-72 lg:w-96">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            </span>
            <input
              className="w-full pl-10 pr-4 py-2 bg-white text-xs text-gray-800 placeholder-gray-400 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1d3c34]/20 focus:border-[#1d3c34] transition-all"
              placeholder="Search customers, subscriptions, invoices..."
              type="text"
            />
          </div>
        )}
      </div>

      {/* Right Area: Action, Bell & Profile */}
      <div className="flex items-center space-x-4 sm:space-x-5 shrink-0">
        {actionHref && actionLabel && (
          <Link
            href={actionHref}
            className="flex items-center space-x-2 bg-[#1d3c34] hover:bg-[#142d26] text-white px-3.5 sm:px-4 py-2 rounded-xl font-medium text-xs shadow-sm transition-all"
          >
            <PlusIcon className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{actionLabel}</span>
          </Link>
        )}

        {/* Bell Icon */}
        <button
          className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
          aria-label="Notifications"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
        </button>

        {/* User Profile with Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-2.5 pl-2 border-l border-gray-100 hover:opacity-85 transition-opacity focus:outline-none"
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
          >
            {/* Clean Profile Icon */}
            <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200/80 text-slate-600 flex items-center justify-center hover:bg-slate-200/60 transition-colors shadow-2xs">
              <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="text-left leading-tight hidden sm:block">
              <h4 className="text-xs font-bold text-gray-900">{displayName}</h4>
              <span className="text-[11px] font-medium text-gray-400 capitalize">{displayRole}</span>
            </div>
            <svg
              className={`w-3.5 h-3.5 text-gray-400 stroke-2 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Profile Dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white shadow-xl border border-gray-100 py-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-gray-900 truncate">{displayName}</p>
                  <p className="text-[11px] text-gray-500 truncate">{displayEmail}</p>
                  <div className="mt-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {displayRole}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-1.5">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
