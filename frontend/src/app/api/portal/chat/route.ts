import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const { message, history } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const apiKey = process.env.GROQ_KEY || process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Groq API key is not configured in .env." },
        { status: 500 }
      );
    }

    // 1. Fetch live customer context (Subscriptions, Invoices, Customer details)
    let customerContext = "User is not linked to a customer profile.";

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: {
        customer: {
          include: {
            subscriptions: {
              include: {
                lines: { include: { plan: true, product: true } },
              },
            },
            invoices: {
              orderBy: { issueDate: "desc" },
              take: 5,
            },
          },
        },
      },
    });

    if (user?.customer) {
      const activeSubs = user.customer.subscriptions.map((s) => ({
        subNumber: s.subscriptionNumber,
        status: s.status,
        billingCycle: s.billingCycle,
        nextBillingDate: s.nextBillingDate ? s.nextBillingDate.toISOString().slice(0, 10) : "N/A",
        plans: s.lines.map((l) => `${l.product.name} (${l.plan.name}) - $${l.unitPrice}`),
      }));

      const recentInvoices = user.customer.invoices.map((inv) => ({
        invoiceNumber: inv.invoiceNumber,
        status: inv.status,
        total: `$${inv.total}`,
        dueDate: inv.dueDate.toISOString().slice(0, 10),
      }));

      customerContext = `
Customer Profile:
- Company/Name: ${user.customer.companyName}
- Email: ${user.customer.email}
- Active Subscriptions: ${JSON.stringify(activeSubs, null, 2)}
- Recent Invoices: ${JSON.stringify(recentInvoices, null, 2)}
      `;
    }

    // 2. Build system prompt
    const systemPrompt = `
You are the intelligent, friendly, and helpful Customer Support Assistant for Brightloop - a Unified B2B Subscription & Recurring Billing Management Platform.

Current Logged-in Customer Context:
${customerContext}

Your Responsibilities:
1. Answer customer queries regarding their subscriptions, next renewal dates, active plans, invoice totals, and payment status using the exact customer context provided above.
2. If asked about billing policies:
   - Dunning policy: Days 1-6 are grace periods with friendly reminders ($0 extra).
   - Day 7 overdue: A 5% late surcharge is applied.
   - Day 10 overdue: Subscriptions are temporarily paused until outstanding invoices are settled.
   - Customers can view and pay invoices at the "My Invoices" tab.
3. Be concise, polite, professional, and clear. Format lists or numbers cleanly with markdown bullet points.
4. Strict Scope & Guardrails (Off-Topic Questions):
   - You are exclusively a Brightloop billing and subscription support assistant.
   - If the user asks off-topic questions (e.g. general trivia, coding help, recipes, politics, weather, math, etc.), politely decline and steer them back:
     "I'm here to assist specifically with your Brightloop account, subscriptions, invoices, and billing queries. How can I help with your account today?"
5. If they request an action you cannot perform (like cancelling an account or refunding cash), politely advise them to reach out to their account manager or support team.
    `.trim();

    // 3. Format message history for Groq
    const groqMessages = [
      { role: "system", content: systemPrompt },
      ...(Array.isArray(history)
        ? history.slice(-6).map((h: { sender: string; text: string }) => ({
            role: h.sender === "user" ? "user" : "assistant",
            content: h.text,
          }))
        : []),
      { role: "user", content: message },
    ];

    // 4. Call Groq Chat Completions API
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: groqMessages,
        temperature: 0.5,
        max_tokens: 600,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error("Groq API error:", errText);
      return NextResponse.json({ error: "AI Assistant is currently unavailable." }, { status: 502 });
    }

    const groqData = await groqRes.json();
    const reply = groqData.choices?.[0]?.message?.content || "I apologize, I was unable to generate a response.";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chatbot API error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

