"use client";

import React from "react";
import Link from "next/link";
import { PlusIcon } from "@/components/ui/icons";

interface TopbarProps {
  title?: string;
  subtitle?: string;
  actionHref?: string;
  actionLabel?: string;
}

export function Topbar({
  title = "Management Console",
  subtitle = "Brightloop Software ERP",
  actionHref,
  actionLabel,
}: TopbarProps) {
  return (
    <header className="h-16 border-b border-slate-200 bg-white/90 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      <div>
        <h1 className="text-base font-bold text-slate-900 tracking-tight">{title}</h1>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {actionHref && actionLabel && (
          <Link
            href={actionHref}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-colors shadow-xs"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            <span>{actionLabel}</span>
          </Link>
        )}
      </div>
    </header>
  );
}
