import * as React from "react";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  rounded?: "sm" | "md" | "lg" | "full";
  animation?: "pulse" | "shimmer" | "none";
}
export function Skeleton({ width, height, rounded = "md", animation = "shimmer", className = "", style, ...props }: SkeletonProps) {
  const radius = { sm: "rounded", md: "rounded-md", lg: "rounded-xl", full: "rounded-full" };
  const motion = { pulse: "animate-pulse", shimmer: "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent", none: "" };
  return <div aria-hidden="true" className={`bg-slate-200/80 ${radius[rounded]} ${motion[animation]} ${className}`} style={{ width, height, ...style }} {...props} />;
}
export function SkeletonText({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return <div className={`space-y-2 ${className}`}>{Array.from({ length: lines }, (_, index) => <Skeleton key={index} height={12} width={index === lines - 1 ? "68%" : "100%"} />)}</div>;
}
export function SkeletonAvatar({ size = 40, className = "" }: { size?: number; className?: string }) {
  return <Skeleton width={size} height={size} rounded="full" className={className} />;
}
export function SkeletonCard({ className = "" }: { className?: string }) {
  return <div className={`rounded-xl border border-slate-200 bg-white p-5 ${className}`}><div className="mb-4 flex items-center justify-between"><Skeleton width="38%" height={12} /><Skeleton width={32} height={32} rounded="lg" /></div><Skeleton width="48%" height={28} className="mb-3" /><Skeleton width="70%" height={10} /></div>;
}
export function SkeletonTable({ rows = 5, columns = 4, className = "" }: { rows?: number; columns?: number; className?: string }) {
  return <div className={`overflow-hidden rounded-xl border border-slate-200 ${className}`}><div className="flex gap-4 border-b border-slate-100 bg-slate-50 px-4 py-3">{Array.from({ length: columns }, (_, i) => <Skeleton key={i} height={10} width={`${100 / columns}%`} />)}</div>{Array.from({ length: rows }, (_, row) => <div key={row} className="flex gap-4 border-b border-slate-100 px-4 py-4 last:border-0">{Array.from({ length: columns }, (_, col) => <Skeleton key={col} height={12} width={`${100 / columns}%`} />)}</div>)}</div>;
}
