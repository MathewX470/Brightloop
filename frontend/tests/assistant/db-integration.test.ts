import { describe, it, expect } from "vitest";
import {
  fetchChurnData,
  fetchRevenueData,
  fetchSubscriptionData,
  fetchPaymentData,
  fetchCustomerData,
  fetchForecastData,
} from "@/modules/assistant/data-fetchers";
import {
  aggregateChurn,
  aggregateRevenue,
  aggregateSubscriptions,
  aggregatePayments,
  aggregateCustomers,
  aggregateForecast,
} from "@/modules/assistant/aggregations";
import { extractDateRange } from "@/modules/assistant/commands";

describe("Admin Assistant - Live DB Fetchers & Aggregators", () => {
  it("fetches and aggregates churn data from live DB", async () => {
    const range = extractDateRange("last 3 months", "churn");
    const data = await fetchChurnData(range);
    expect(data).toBeDefined();
    expect(typeof data.activeSubscriptions).toBe("number");
    const agg = aggregateChurn(data);
    expect(agg.summaryMetrics.churnRate).toBeDefined();
  });

  it("fetches and aggregates revenue data from live DB", async () => {
    const range = extractDateRange("last 6 months", "revenue");
    const data = await fetchRevenueData(range);
    expect(data).toBeDefined();
    expect(Array.isArray(data.paymentsInPeriod)).toBe(true);
    const agg = aggregateRevenue(data);
    expect(agg.summaryMetrics.totalCollectedInPeriod).toBeDefined();
  });

  it("fetches and aggregates subscriptions data from live DB", async () => {
    const range = extractDateRange("", "subscriptions");
    const data = await fetchSubscriptionData(range);
    expect(data).toBeDefined();
    expect(typeof data.totalSubscriptions).toBe("number");
    const agg = aggregateSubscriptions(data);
    expect(agg.summaryMetrics.totalSubscriptions).toBeGreaterThanOrEqual(0);
  });

  it("fetches and aggregates payments data from live DB", async () => {
    const range = extractDateRange("this month", "payments");
    const data = await fetchPaymentData(range);
    expect(data).toBeDefined();
    const agg = aggregatePayments(data);
    expect(agg.summaryMetrics.paymentSuccessRate).toBeDefined();
  });

  it("fetches and aggregates customers data from live DB", async () => {
    const range = extractDateRange("", "customers");
    const data = await fetchCustomerData(range);
    expect(data).toBeDefined();
    expect(typeof data.totalCustomers).toBe("number");
    const agg = aggregateCustomers(data);
    expect(agg.summaryMetrics.totalRegisteredCustomers).toBeGreaterThanOrEqual(0);
  });

  it("fetches and aggregates forecast data from live DB", async () => {
    const range = extractDateRange("", "forecast");
    const data = await fetchForecastData(range);
    expect(data).toBeDefined();
    const agg = aggregateForecast(data);
    expect(agg.summaryMetrics.currentBaseMRR).toBeDefined();
    expect(agg.threeMonthProjections.baselineScenario).toBeDefined();
  });
});
