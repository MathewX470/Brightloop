import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { AdminAssistantRequestSchema } from "@/modules/assistant/schemas";
import { executeAssistant } from "@/modules/assistant/assistant";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user session
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to your Brightloop account." },
        { status: 401 }
      );
    }

    // 2. Strict Role Check: Exclusively for ADMIN and STAFF (strictly blocks CUSTOMER)
    if (session.role !== "ADMIN" && session.role !== "STAFF") {
      return NextResponse.json(
        { error: "Access denied. This assistant is exclusively available to administrators and staff." },
        { status: 403 }
      );
    }

    // 3. Validate request payload
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const validation = AdminAssistantRequestSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || "Invalid payload format.";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    // 4. Execute assistant logic (Mode A normal conversation or Mode B database command analysis)
    const result = await executeAssistant(validation.data, session);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Admin Assistant Route Error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while processing your request." },
      { status: 500 }
    );
  }
}

