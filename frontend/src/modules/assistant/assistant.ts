import { AdminAssistantRequest, AssistantResponse } from "./schemas";
import { parseCommand, SUPPORTED_COMMANDS } from "./commands";
import {
  fetchChurnData,
  fetchRevenueData,
  fetchSubscriptionData,
  fetchPaymentData,
  fetchCustomerData,
  fetchForecastData,
} from "./data-fetchers";
import {
  aggregateChurn,
  aggregateRevenue,
  aggregateSubscriptions,
  aggregatePayments,
  aggregateCustomers,
  aggregateForecast,
} from "./aggregations";
import { MODE_A_SYSTEM_PROMPT, getAnalyticalSystemPrompt } from "./prompts";
import { SessionUser } from "@/lib/auth/session";

const GROQ_MODEL = "openai/gpt-oss-120b";
const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

/**
 * Builds a fallback analytical report in markdown if Groq API is temporarily unreachable.
 */
function buildFallbackReport(command: string, summary: Record<string, unknown>): string {
  return `
### 1. Executive Summary
*(Generated directly from database aggregates while AI formatting service is busy)*
A comprehensive analysis was executed for **${command.toUpperCase()}** over the selected period.

### 2. Key Metrics
\`\`\`json
${JSON.stringify(summary, null, 2)}
\`\`\`

### 3. Detailed Analysis
The figures above represent actual production database records queried via Prisma.

### 4. Trends and Observations
All records have been synchronized and calculated using current system billing and subscription logs.

### 5. Potential Risks
Ensure pending invoices and upcoming renewals are reviewed on the respective dashboard tables.

### 6. Actionable Recommendations
- Review delinquent or expiring accounts directly in the Subscriptions and Invoices modules.
- Re-run with specific date filters (e.g. \`/${command} last 30 days\`).

### 7. Data Limitations & Methodology
Data fetched in real-time from active Prisma client models. Direct AI narrative interpretation was bypassed due to high API load.
  `.trim();
}

/**
 * Core coordinator for the Admin Intelligence Assistant
 */
export async function executeAssistant(
  input: AdminAssistantRequest,
  session: SessionUser
): Promise<AssistantResponse> {
  const { message, history } = input;
  const parsed = parseCommand(message);
  const nowStr = new Date().toISOString();

  // 1. Unknown Command Handling
  if (parsed.isCommand && parsed.isUnknownCommand) {
    const list = SUPPORTED_COMMANDS.map((c) => `- **${c.label}**: ${c.description}\n  *Example:* \`${c.examplePrompt}\``).join("\n\n");
    return {
      reply: `Command \`/${parsed.unknownCommandName}\` is not recognized.\n\nHere are the analytical intelligence commands available to administrators:\n\n${list}`,
      isCommand: true,
      generatedAt: nowStr,
    };
  }

  const apiKey = process.env.GROQ_KEY || process.env.GROQ_API_KEY;

  // 2. Analytical Command Mode (Mode B)
  if (parsed.isCommand && parsed.command) {
    let dataSummary: Record<string, unknown> = {};

    try {
      switch (parsed.command) {
        case "churn": {
          const raw = await fetchChurnData(parsed.dateRange);
          dataSummary = aggregateChurn(raw);
          break;
        }
        case "revenue": {
          const raw = await fetchRevenueData(parsed.dateRange);
          dataSummary = aggregateRevenue(raw);
          break;
        }
        case "subscriptions": {
          const raw = await fetchSubscriptionData(parsed.dateRange);
          dataSummary = aggregateSubscriptions(raw);
          break;
        }
        case "payments": {
          const raw = await fetchPaymentData(parsed.dateRange);
          dataSummary = aggregatePayments(raw);
          break;
        }
        case "customers": {
          const raw = await fetchCustomerData(parsed.dateRange);
          dataSummary = aggregateCustomers(raw);
          break;
        }
        case "forecast": {
          const raw = await fetchForecastData(parsed.dateRange);
          dataSummary = aggregateForecast(raw);
          break;
        }
      }
    } catch (dbError) {
      console.error(`Database fetch error for /${parsed.command}:`, dbError);
      return {
        reply: `⚠️ An error occurred while retrieving database records for \`/${parsed.command}\`. Please verify your database connection.`,
        isCommand: true,
        command: parsed.command,
        generatedAt: nowStr,
      };
    }

    if (!apiKey) {
      // Return structured markdown directly if no key configured
      return {
        reply: buildFallbackReport(parsed.command, dataSummary),
        isCommand: true,
        command: parsed.command,
        dataSummary,
        generatedAt: nowStr,
      };
    }

    const systemPrompt = getAnalyticalSystemPrompt(parsed.command);
    const userPrompt = `
Administrator Query: "${message}"
Requested Command: /${parsed.command}
Target Date Period: ${parsed.dateRange.label}

Verified Real Database Summary:
${JSON.stringify(dataSummary, null, 2)}

Please analyze this actual database data and generate the complete 7-section report as instructed.
    `.trim();

    try {
      const groqRes = await fetch(GROQ_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.2, // Low temperature for high factual accuracy
          max_tokens: 1800,
        }),
      });

      if (!groqRes.ok) {
        const errText = await groqRes.text();
        console.warn("Groq API response error for command:", errText);
        return {
          reply: buildFallbackReport(parsed.command, dataSummary),
          isCommand: true,
          command: parsed.command,
          dataSummary,
          generatedAt: nowStr,
        };
      }

      const groqData = await groqRes.json();
      const content = groqData.choices?.[0]?.message?.content;

      if (!content || !content.trim()) {
        return {
          reply: buildFallbackReport(parsed.command, dataSummary),
          isCommand: true,
          command: parsed.command,
          dataSummary,
          generatedAt: nowStr,
        };
      }

      return {
        reply: content.trim(),
        isCommand: true,
        command: parsed.command,
        dataSummary,
        generatedAt: nowStr,
      };
    } catch (groqErr) {
      console.error("Groq network/call exception:", groqErr);
      return {
        reply: buildFallbackReport(parsed.command, dataSummary),
        isCommand: true,
        command: parsed.command,
        dataSummary,
        generatedAt: nowStr,
      };
    }
  }

  // 3. Normal Conversation Mode (Mode A)
  if (!apiKey) {
    return {
      reply: "The Groq AI API key is not currently configured on the server. Please check your environment configuration.",
      isCommand: false,
      generatedAt: nowStr,
    };
  }

  const groqMessages = [
    { role: "system", content: MODE_A_SYSTEM_PROMPT },
    ...history.slice(-6).map((h) => ({
      role: h.sender === "user" ? ("user" as const) : ("assistant" as const),
      content: h.text,
    })),
    { role: "user", content: message },
  ];

  try {
    const groqRes = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: groqMessages,
        temperature: 0.5,
        max_tokens: 900,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error("Groq API error in Mode A:", errText);
      return {
        reply: "I am temporarily experiencing high load communicating with the AI service. Please try asking your question again in a moment.",
        isCommand: false,
        generatedAt: nowStr,
      };
    }

    const groqData = await groqRes.json();
    const reply =
      groqData.choices?.[0]?.message?.content?.trim() ||
      "I apologize, I could not generate a response. Please rephrase your question.";

    return {
      reply,
      isCommand: false,
      generatedAt: nowStr,
    };
  } catch (error) {
    console.error("Admin Assistant Mode A error:", error);
    return {
      reply: "A network error occurred while communicating with the assistant service. Please check your internet connection and try again.",
      isCommand: false,
      generatedAt: nowStr,
    };
  }
}

