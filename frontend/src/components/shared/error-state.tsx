import * as React from "react";
import { Button } from "../ui/button";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  icon?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export function ErrorState({ title = "Something went wrong", message = "We couldn't load this information. Please try again.", onRetry, retryLabel = "Try again", icon, className = "", compact = false }: ErrorStateProps) {
  return (
    <div role="alert" className={`flex flex-col items-center justify-center text-center ${compact ? "px-4 py-8" : "rounded-xl border border-rose-100 bg-rose-50/40 px-6 py-12"} ${className}`}>
      <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-rose-100 text-rose-700 [&>svg]:size-5">{icon ?? <span className="text-xl font-semibold">!</span>}</div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm leading-6 text-slate-600">{message}</p>
      {onRetry && <Button variant="outline" size="sm" onClick={onRetry} className="mt-4">{retryLabel}</Button>}
    </div>
  );
}
