"use client";

import React, { useState } from "react";
import Link from "next/link";
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
  userName = "Rohan John",
  userRole = "Admin",
}: TopbarProps) {
  const [imgError, setImgError] = useState(false);
  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "RJ";

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

        {/* User Profile */}
        <div className="flex items-center space-x-3 pl-2 border-l border-gray-100">
          {!imgError ? (
            <img
              alt={userName}
              className="w-9 h-9 rounded-full object-cover ring-1 ring-gray-200"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB7W0mbpUnNMyIHxfjAD2yV2uOEwTcIpcIUJ8MzbZhDnsHzPQ0OpvoSq5hgoUZXqnzDN3C15k233L1TwqAXhzOdNkLjXolVjPsLMfO_iVBb3MX_N4bhl5XxF5v8eWB9z5VZzgJBP0pW5DCOMYyUV8eZtfb5O3b9eWkSIjcl0NqIFJCntb4Z2o5IseVlvjwOElceAQQTjDaz7h2TKd6lPa8ZK8F5-Mq7Ns4lhDMeYA"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#1d3c34] to-[#28584c] text-white font-bold text-xs flex items-center justify-center ring-1 ring-gray-200">
              {initials}
            </div>
          )}
          <div className="text-left leading-tight hidden sm:block">
            <h4 className="text-xs font-bold text-gray-900">{userName}</h4>
            <span className="text-[11px] font-medium text-gray-400 capitalize">{userRole}</span>
          </div>
          <svg className="w-3.5 h-3.5 text-gray-400 stroke-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </header>
  );
}
