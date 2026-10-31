import * as React from "react";

export interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
}

export function PageHeader({ eyebrow, title, description, actions, breadcrumbs, meta, className = "" }: PageHeaderProps) {
  return (
    <header className={`mb-6 space-y-3 ${className}`}>
      {breadcrumbs && <div className="text-xs text-slate-500">{breadcrumbs}</div>}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow && <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{eyebrow}</p>}
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-[28px]">{title}</h1>
            {meta}
          </div>
          {description && <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
