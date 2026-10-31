import * as React from "react";
import { Badge, type BadgeVariant } from "../ui/badge";

export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral" | "primary";

export type BadgeStatus =
  | "DRAFT"
  | "QUOTATION"
  | "CONFIRMED"
  | "ACTIVE"
  | "PAUSED"
  | "CLOSED"
  | "PARTIALLY_PAID"
  | "PAID"
  | "CANCELLED"
  | "PENDING"
  | "SUCCESS"
  | "FAILED"
  | "REFUNDED"
  | "ADMIN"
  | "STAFF"
  | "CUSTOMER"
  | string;

const defaultStatusMap: Record<string, StatusTone> = {
  // Database / Admin uppercase enums
  ACTIVE: "success",
  PAID: "success",
  SUCCESS: "success",
  CONFIRMED: "primary",
  QUOTATION: "info",
  PARTIALLY_PAID: "warning",
  PENDING: "warning",
  PAUSED: "warning",
  DRAFT: "neutral",
  CLOSED: "danger",
  CANCELLED: "danger",
  FAILED: "danger",
  REFUNDED: "primary",
  ADMIN: "primary",
  STAFF: "info",
  CUSTOMER: "success",

  // Lowercase & normalized variants
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
  status: BadgeStatus;
  tone?: StatusTone;
  showDot?: boolean;
  label?: string;
  size?: "sm" | "md" | "lg";
}

export function StatusBadge({
  status,
  tone,
  showDot = false,
  label,
  size = "md",
  className = "",
  ...props
}: StatusBadgeProps) {
  const trimmed = status ? String(status).trim() : "";
  const normalized = trimmed.toLowerCase();
  const resolvedTone = tone ?? defaultStatusMap[trimmed] ?? defaultStatusMap[normalized] ?? "neutral";
  const display = label ?? trimmed.replace(/[_-]+/g, " ");

  return (
    <Badge
      variant={toneVariants[resolvedTone]}
      size={size}
      dot={showDot}
      className={className}
      {...props}
    >
      {display}
    </Badge>
  );
}
