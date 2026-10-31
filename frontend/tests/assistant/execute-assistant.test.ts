import { describe, it, expect } from "vitest";
import { executeAssistant } from "@/modules/assistant/assistant";
import { SessionUser } from "@/lib/auth/session";

const mockAdminSession: SessionUser = {
  id: "test-admin-id",
  email: "admin@brightloop.io",
  name: "System Administrator",
  role: "ADMIN",
};

describe("Admin Assistant - End-to-End Execution", () => {
  it("executes Mode A normal conversation with Groq", async () => {
    const result = await executeAssistant(
      {
        message: "Briefly explain the difference between monthly and yearly billing cycles in Brightloop in 1 sentence.",
        history: [],
      },
      mockAdminSession
    );

    expect(result).toBeDefined();
    expect(result.isCommand).toBe(false);
    expect(result.reply).toBeDefined();
    expect(result.reply.length).toBeGreaterThan(10);
    console.log("Mode A Test Reply:", result.reply);
  }, 25000);

  it("executes Mode B analytical /subscriptions command with real DB data and Groq analysis", async () => {
    const result = await executeAssistant(
      {
        message: "/subscriptions Give me a subscription health report.",
        history: [],
      },
      mockAdminSession
    );

    expect(result).toBeDefined();
    expect(result.isCommand).toBe(true);
    expect(result.command).toBe("subscriptions");
    expect(result.reply).toBeDefined();
    expect(result.dataSummary).toBeDefined();
    // Verify structured report contains expected sections
    expect(result.reply).toContain("Executive Summary");
    console.log("Mode B Test Subscriptions Summary Metrics:", result.dataSummary?.summaryMetrics);
  }, 25000);

  it("handles unknown commands gracefully", async () => {
    const result = await executeAssistant(
      {
        message: "/invalidCmd test",
        history: [],
      },
      mockAdminSession
    );

    expect(result.isCommand).toBe(true);
    expect(result.reply).toContain("Command `/invalidCmd` is not recognized");
    expect(result.reply).toContain("/churn");
    expect(result.reply).toContain("/revenue");
  });
});

