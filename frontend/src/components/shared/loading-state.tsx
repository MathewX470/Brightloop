import * as React from "react";
import { Skeleton, SkeletonCard, SkeletonTable } from "../ui/skeleton";

export interface LoadingStateProps {
  variant?: "spinner" | "page" | "cards" | "table" | "inline";
  message?: string;
  count?: number;
  className?: string;
}

export function LoadingState({ variant = "spinner", message = "Loading...", count = 4, className = "" }: LoadingStateProps) {
  if (variant === "cards") return <div aria-label={message} aria-busy="true" className={`grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 ${className}`}>{Array.from({ length: count }, (_, i) => <SkeletonCard key={i} />)}</div>;
  if (variant === "table") return <div aria-label={message} aria-busy="true" className={className}><SkeletonTable rows={count} /></div>;
  if (variant === "page") return <div aria-label={message} aria-busy="true" className={`space-y-6 ${className}`}><div className="space-y-2"><Skeleton width="30%" height={12} /><Skeleton width="48%" height={28} /><Skeleton width="65%" height={12} /></div><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <SkeletonCard key={i} />)}</div><SkeletonTable rows={5} /></div>;
  if (variant === "inline") return <span role="status" className={`inline-flex items-center gap-2 text-sm text-slate-500 ${className}`}><span className="size-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-800" />{message}</span>;
  return <div role="status" aria-live="polite" className={`flex min-h-40 flex-col items-center justify-center gap-3 text-sm text-slate-500 ${className}`}><span className="size-7 animate-spin rounded-full border-[3px] border-slate-200 border-t-slate-800" />{message}</div>;
}
