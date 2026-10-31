import * as React from "react";
import { Button } from "../ui/button";

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  secondaryAction?: React.ReactNode;
  compact?: boolean;
  className?: string;
}

export function EmptyState({ title, description, icon, actionLabel, onAction, secondaryAction, compact = false, className = "" }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? "px-4 py-9" : "rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-14"} ${className}`}>
      {icon && <div className={`mb-4 flex items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm ring-1 ring-slate-200 [&>svg]:size-6 ${compact ? "size-11" : "size-14"}`}>{icon}</div>}
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {description && <p className="mt-1.5 max-w-md text-sm leading-6 text-slate-500">{description}</p>}
      {(actionLabel && onAction) || secondaryAction ? (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {actionLabel && onAction && <Button size="sm" onClick={onAction}>{actionLabel}</Button>}
          {secondaryAction}
        </div>
      ) : null}
    </div>
  );
}
