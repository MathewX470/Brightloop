import { AdminCommandType, ParsedCommand } from "./schemas";

export interface CommandDefinition {
  command: AdminCommandType;
  label: string;
  description: string;
  examplePrompt: string;
  icon: string;
}

export const SUPPORTED_COMMANDS: CommandDefinition[] = [
  {
    command: "churn",
    label: "/churn",
    description: "Subscription Churn & Cancellation Analysis",
    examplePrompt: "/churn Give me a report on customer churn over the last 3 months.",
    icon: "📉",
  },
  {
    command: "revenue",
    label: "/revenue",
    description: "Financial Performance, Invoiced vs Collected & Trends",
    examplePrompt: "/revenue Analyse revenue for the previous 6 months.",
    icon: "💰",
  },
  {
    command: "subscriptions",
    label: "/subscriptions",
    description: "Active Subscriptions, Distribution & Renewal Health",
    examplePrompt: "/subscriptions Give me a complete subscription report.",
    icon: "📑",
  },
  {
    command: "payments",
    label: "/payments",
    description: "Collections, Payment Methods & Overdue Invoices",
    examplePrompt: "/payments Show me the payment collection report for this month.",
    icon: "💳",
  },
  {
    command: "customers",
    label: "/customers",
    description: "Customer Base Segmentation & Growth Metrics",
    examplePrompt: "/customers Analyse our customer base.",
    icon: "👥",
  },
  {
    command: "forecast",
    label: "/forecast",
    description: "3-Month Revenue & Recurring Cashflow Projections",
    examplePrompt: "/forecast Predict our revenue for the next 3 months.",
    icon: "🔮",
  },
];

const VALID_COMMAND_NAMES = new Set<string>([
  "churn",
  "revenue",
  "subscriptions",
  "subscription",
  "payments",
  "payment",
  "customers",
  "customer",
  "forecast",
  "predict",
]);

function normalizeCommand(raw: string): AdminCommandType | null {
  const lower = raw.toLowerCase().trim();
  switch (lower) {
    case "churn":
      return "churn";
    case "revenue":
      return "revenue";
    case "subscriptions":
    case "subscription":
      return "subscriptions";
    case "payments":
    case "payment":
      return "payments";
    case "customers":
    case "customer":
      return "customers";
    case "forecast":
    case "predict":
      return "forecast";
    default:
      return null;
  }
}

/**
 * Extracts a date range from user filter text.
 * Falls back to default sensible periods per command.
 */
export function extractDateRange(
  text: string,
  commandType?: AdminCommandType
): { start: Date; end: Date; label: string } {
  const now = new Date();
  const lower = text.toLowerCase();

  // 1. "last X months" / "X months"
  const monthsMatch = lower.match(/(?:last|past|previous)?\s*(\d+)\s*months?/);
  if (monthsMatch && monthsMatch[1]) {
    const numMonths = Math.min(Math.max(parseInt(monthsMatch[1], 10), 1), 24);
    const start = new Date(now.getFullYear(), now.getMonth() - numMonths, 1);
    return {
      start,
      end: now,
      label: `Last ${numMonths} Months (${start.toISOString().slice(0, 10)} to ${now.toISOString().slice(0, 10)})`,
    };
  }

  // 2. "last X days" / "X days"
  const daysMatch = lower.match(/(?:last|past|previous)?\s*(\d+)\s*days?/);
  if (daysMatch && daysMatch[1]) {
    const numDays = Math.min(Math.max(parseInt(daysMatch[1], 10), 1), 365);
    const start = new Date(now.getTime() - numDays * 24 * 60 * 60 * 1000);
    return {
      start,
      end: now,
      label: `Last ${numDays} Days (${start.toISOString().slice(0, 10)} to ${now.toISOString().slice(0, 10)})`,
    };
  }

  // 3. "this month"
  if (lower.includes("this month") || lower.includes("current month")) {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      start,
      end: now,
      label: `Current Month (${start.toISOString().slice(0, 10)} to ${now.toISOString().slice(0, 10)})`,
    };
  }

  // 4. "last month" / "previous month"
  if (lower.includes("last month") || lower.includes("previous month")) {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    return {
      start,
      end,
      label: `Previous Month (${start.toISOString().slice(0, 10)} to ${end.toISOString().slice(0, 10)})`,
    };
  }

  // 5. "this year" / "last 1 year" / "12 months"
  if (lower.includes("this year") || lower.includes("last year") || lower.includes("1 year")) {
    const start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    return {
      start,
      end: now,
      label: `Past 12 Months (${start.toISOString().slice(0, 10)} to ${now.toISOString().slice(0, 10)})`,
    };
  }

  // Defaults per command
  switch (commandType) {
    case "churn": {
      const start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      return {
        start,
        end: now,
        label: `Default 3 Months (${start.toISOString().slice(0, 10)} to ${now.toISOString().slice(0, 10)})`,
      };
    }
    case "revenue": {
      const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      return {
        start,
        end: now,
        label: `Default 6 Months (${start.toISOString().slice(0, 10)} to ${now.toISOString().slice(0, 10)})`,
      };
    }
    case "payments": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        start,
        end: now,
        label: `Current Month (${start.toISOString().slice(0, 10)} to ${now.toISOString().slice(0, 10)})`,
      };
    }
    case "forecast": {
      // Forecast projects forward 3 months from now, but considers past 3-6 months history
      const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      return {
        start,
        end: now,
        label: `Next 3 Months Projection (based on past 6 months data)`,
      };
    }
    case "customers":
    case "subscriptions":
    default: {
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return {
        start,
        end: now,
        label: `Current Overview (Last 30 Days New Activity)`,
      };
    }
  }
}

/**
 * Parses user input to detect if it's a slash command.
 */
export function parseCommand(input: string): ParsedCommand {
  const trimmed = input.trim();
  const now = new Date();

  if (!trimmed.startsWith("/")) {
    return {
      isCommand: false,
      dateRange: { start: new Date(0), end: now, label: "All time" },
      rawQuery: trimmed,
    };
  }

  // Match command like /churn, /revenue, etc.
  const match = trimmed.match(/^\/([a-zA-Z0-9_-]+)(?:\s+([\s\S]*))?$/);

  if (!match) {
    return {
      isCommand: false,
      dateRange: { start: new Date(0), end: now, label: "All time" },
      rawQuery: trimmed,
    };
  }

  const rawCmdName = match[1];
  const filterText = (match[2] || "").trim();
  const normalizedCmd = normalizeCommand(rawCmdName);

  if (!normalizedCmd) {
    return {
      isCommand: true,
      isUnknownCommand: true,
      unknownCommandName: rawCmdName,
      dateRange: { start: new Date(0), end: now, label: "Unknown" },
      rawQuery: trimmed,
      filterText,
    };
  }

  const dateRange = extractDateRange(filterText, normalizedCmd);

  return {
    isCommand: true,
    command: normalizedCmd,
    filterText,
    dateRange,
    rawQuery: trimmed,
  };
}
