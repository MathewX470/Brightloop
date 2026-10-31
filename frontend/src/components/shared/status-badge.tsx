import * as React from "react";
import { Badge, type BadgeVariant } from "../ui/badge";

export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral" | "primary";

const defaultStatusMap: Record<string, StatusTone> = {
  active: "success",
  paid: "success",
  completed: "success",
  approved: "success",
  successful: "success",
  pending: "warning",
  awaiting: "warning",
  draft: "neutral",
  inactive: "neutral",
  expired: "neutral",
  cancelled: "danger",
  canceled: "danger",
  overdue: "danger",
  failed: "danger",
  rejected: "danger",
  unpaid: "warning",
  processing: "info",
  in_progress: "info",
  "in progress": "info",
  suspended: "danger",
  trial: "primary",
};

const toneVariants: Record<StatusTone, BadgeVariant> = {
  success: "success",
  warning: "warning",
  danger: "danger",
  info: "info",
  neutral: "neutral",
  primary: "primary",
};

export interface StatusBadgeProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  status: string;
  tone?: StatusTone;
  showDot?: boolean;
  label?: string;
  size?: "sm" | "md" | "lg";
}

export function StatusBadge({ status, tone, showDot = true, label, size = "md", className = "", ...props }: StatusBadgeProps) {
  const normalized = status.trim().toLowerCase();
  const resolvedTone = tone ?? defaultStatusMap[normalized] ?? "neutral";
  const display = label ?? status.replace(/[_-]+/g, " ").replace(/\b\w/g, char => char.toUpperCase());
  return <Badge variant={toneVariants[resolvedTone]} size={size} dot={showDot} className={className} {...props}>{display}</Badge>;
}
