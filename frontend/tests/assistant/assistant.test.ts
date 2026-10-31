import { describe, it, expect } from "vitest";
import { parseCommand, extractDateRange, SUPPORTED_COMMANDS } from "@/modules/assistant/commands";
import {
  aggregateChurn,
  aggregateRevenue,
  aggregateSubscriptions,
  aggregatePayments,
  aggregateCustomers,
  aggregateForecast,
} from "@/modules/assistant/aggregations";
import { AdminAssistantRequestSchema } from "@/modules/assistant/schemas";

describe("Admin Assistant - Command Parsing", () => {
  it("should identify normal conversational messages without commands", () => {
    const parsed = parseCommand("How does the subscription lifecycle work in Brightloop?");
    expect(parsed.isCommand).toBe(false);
    expect(parsed.command).toBeUndefined();
  });

  it("should parse /churn command and extract date range", () => {
    const parsed = parseCommand("/churn Give me a report on customer churn over the last 3 months.");
    expect(parsed.isCommand).toBe(true);
    expect(parsed.command).toBe("churn");
    expect(parsed.dateRange).toBeDefined();
    expect(parsed.dateRange.label).toContain("3 Months");
  });

  it("should parse /revenue command with 6 months filter", () => {
    const parsed = parseCommand("/revenue Analyse revenue for the previous 6 months.");
    expect(parsed.isCommand).toBe(true);
    expect(parsed.command).toBe("revenue");
    expect(parsed.dateRange.label).toContain("6 Months");
  });

  it("should parse /subscriptions without extra filter and use default", () => {
    const parsed = parseCommand("/subscriptions Give me a complete subscription report.");
    expect(parsed.isCommand).toBe(true);
    expect(parsed.command).toBe("subscriptions");
  });

  it("should parse /payments with 'this month' filter", () => {
    const parsed = parseCommand("/payments Show me the payment collection report for this month.");
    expect(parsed.isCommand).toBe(true);
    expect(parsed.command).toBe("payments");
    expect(parsed.dateRange.label).toContain("Current Month");
  });

  it("should parse /customers command", () => {
    const parsed = parseCommand("/customers Analyse our customer base.");
    expect(parsed.isCommand).toBe(true);
    expect(parsed.command).toBe("customers");
  });

  it("should parse /forecast command", () => {
    const parsed = parseCommand("/forecast Predict our revenue for the next 3 months.");
    expect(parsed.isCommand).toBe(true);
    expect(parsed.command).toBe("forecast");
  });

  it("should flag unknown commands", () => {
    const parsed = parseCommand("/unknownCommand test argument");
    expect(parsed.isCommand).toBe(true);
    expect(parsed.isUnknownCommand).toBe(true);
    expect(parsed.unknownCommandName).toBe("unknownCommand");
  });

  it("should provide metadata for all 6 supported commands", () => {
    expect(SUPPORTED_COMMANDS).toHaveLength(6);
    const cmds = SUPPORTED_COMMANDS.map((c) => c.command);
    expect(cmds).toContain("churn");
    expect(cmds).toContain("revenue");
    expect(cmds).toContain("subscriptions");
    expect(cmds).toContain("payments");
    expect(cmds).toContain("customers");
    expect(cmds).toContain("forecast");
  });
});

describe("Admin Assistant - Aggregations", () => {
  it("aggregateChurn should compute accurate churn metrics and formula", () => {
    const result = aggregateChurn({
      period: "Last 3 Months",
      activeSubscriptions: 10,
      pausedSubscriptions: 1,
      newSubscriptionsInPeriod: 3,
      closedSubscriptionsInPeriod: 2,
      allTimeClosedSubscriptions: 5,
      closedSubscriptionsSample: [
        {
          subscriptionNumber: "SUB-001",
          customer: "Acme Corp",
          billingCycle: "MONTHLY",
          closedAt: "2026-10-15",
          plan: "Pro Plan",
          monthlyValue: 100,
        },
      ],
      activePlanDistribution: [{ plan: "Pro Plan", activeSubscribers: 10 }],
    });

    expect(result.summaryMetrics.activeSubscriptions).toBe(10);
    expect(result.summaryMetrics.closedSubscriptionsInPeriod).toBe(2);
    // Churn rate: 2 / (10 + 2) = 16.7%
    expect(result.summaryMetrics.churnRate).toBe("16.7%");
    expect(result.summaryMetrics.churnFormulaUsed).toContain("Closed in Period (2)");
    expect(result.dataLimitations).toHaveLength(2);
  });

  it("aggregateRevenue should differentiate collected cash from invoiced totals", () => {
    const result = aggregateRevenue({
      period: "Last 6 Months",
      paymentsInPeriod: [
        { amount: 500, date: "2026-09-10", month: "2026-09", method: "UPI" },
        { amount: 1000, date: "2026-10-10", month: "2026-10", method: "RAZORPAY" },
      ],
      invoicesInPeriod: [
        { total: 600, paidAmount: 500, status: "PAID", date: "2026-09-01", month: "2026-09" },
        { total: 1200, paidAmount: 1000, status: "PARTIALLY_PAID", date: "2026-10-01", month: "2026-10" },
      ],
      allTimeCollected: 1500,
      allTimePaymentCount: 2,
      overdueInvoices: [
        {
          invoiceNumber: "INV-001",
          customer: "Beta Inc",
          total: 1200,
          paidAmount: 1000,
          balanceDue: 200,
          dueDate: "2026-10-15",
        },
      ],
      activeSubsWithLines: [
        {
          billingCycle: "MONTHLY",
          lines: [{ planName: "Growth", productName: "SaaS", unitPrice: 200, quantity: 1 }],
        },
      ],
    });

    expect(result.summaryMetrics.totalCollectedInPeriod).toBe("$1,500.00");
    expect(result.summaryMetrics.totalInvoicedInPeriod).toBe("$1,800.00");
    // Collection efficiency: 1500 / 1800 = 83.3%
    expect(result.summaryMetrics.collectionEfficiency).toBe("83.3%");
    expect(result.summaryMetrics.outstandingOverdueAmount).toBe("$200.00");
    expect(result.monthlyTrend).toHaveLength(2);
    expect(result.businessRuleNote).toContain("Unpaid invoices are not treated as collected revenue");
  });

  it("aggregateForecast should calculate MRR, ARR and scenario forecasts", () => {
    const result = aggregateForecast({
      period: "Next 3 Months",
      activeSubscriptions: [
        {
          subscriptionNumber: "SUB-1",
          billingCycle: "MONTHLY",
          nextBillingDate: "2026-11-01",
          expiryDate: null,
          lines: [{ unitPrice: 500, quantity: 2, plan: "Enterprise" }], // 1000/mo
        },
        {
          subscriptionNumber: "SUB-2",
          billingCycle: "YEARLY",
          nextBillingDate: "2027-05-01",
          expiryDate: null,
          lines: [{ unitPrice: 1200, quantity: 1, plan: "Annual Pro" }], // 100/mo
        },
      ],
      expiringSubscriptions: [],
      historicalPayments: [{ amount: 1100, month: "2026-10" }],
      historicalInvoices: [{ total: 1100, paidAmount: 1100, month: "2026-10" }],
    });

    // 1000 + 100 = 1100 MRR
    expect(result.summaryMetrics.currentBaseMRR).toBe("$1,100.00");
    expect(result.summaryMetrics.currentBaseARR).toBe("$13,200.00");
    expect(result.threeMonthProjections.baselineScenario.quarterRevenue).toBe("$3,300.00");
    expect(result.forecastDisclaimer).toBeDefined();
  });
});

describe("Admin Assistant - Schema Validation", () => {
  it("should validate valid request payloads", () => {
    const valid = AdminAssistantRequestSchema.safeParse({
      message: "/churn last 3 months",
      history: [{ sender: "user", text: "hello" }],
    });
    expect(valid.success).toBe(true);
  });

  it("should reject empty messages", () => {
    const invalid = AdminAssistantRequestSchema.safeParse({
      message: "",
    });
    expect(invalid.success).toBe(false);
  });
});

