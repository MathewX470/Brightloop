
export function formatINR(value: number | string | null | undefined) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

export function formatDashboardDate(
  value: string | Date | null | undefined
) {
  if (!value) return "Not scheduled";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDashboardDateTime(
  value: string | Date | null | undefined
) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
