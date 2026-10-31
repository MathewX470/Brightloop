import * as React from "react";

export type BadgeVariant = "default" | "primary" | "success" | "warning" | "danger" | "info" | "neutral" | "outline";
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: "sm" | "md" | "lg";
  dot?: boolean;
  pill?: boolean;
  icon?: React.ReactNode;
}

const styles: Record<BadgeVariant, string> = {
  default: "bg-slate-100 text-slate-700",
  primary: "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200",
  success: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  warning: "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200",
  danger: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
  info: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200",
  neutral: "bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-200",
  outline: "border border-slate-300 bg-white text-slate-700",
};
const dots: Partial<Record<BadgeVariant, string>> = { success: "bg-emerald-500", warning: "bg-amber-500", danger: "bg-rose-500", info: "bg-sky-500", primary: "bg-indigo-500", default: "bg-slate-400", neutral: "bg-slate-400" };

export function Badge({ variant = "default", size = "md", dot = false, pill = false, icon, className = "", children, ...props }: BadgeProps) {
  const sizes = { sm: "px-2 py-0.5 text-[11px]", md: "px-2.5 py-1 text-xs", lg: "px-3 py-1.5 text-sm" };
  return <span className={`inline-flex max-w-full items-center gap-1.5 font-medium ${pill ? "rounded-full" : "rounded-md"} ${sizes[size]} ${styles[variant]} ${className}`} {...props}>
    {dot && <span className={`size-1.5 shrink-0 rounded-full ${dots[variant] ?? "bg-current"}`} />}
    {icon && <span className="shrink-0 [&>svg]:size-3.5">{icon}</span>}
    {children}
  </span>;
}
