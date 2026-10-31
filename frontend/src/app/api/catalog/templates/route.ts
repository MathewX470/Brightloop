import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { z } from "zod";

const createTemplateSchema = z.object({
  name: z.string().min(1, "Name required"),
  description: z.string().optional(),
  validityDays: z.coerce.number().int().min(1).default(15),
  planId: z.string().uuid("Plan required"),
  variantId: z.string().optional().nullable(),
  quantity: z.coerce.number().int().min(1).default(1),
  unitPrice: z.coerce.number().optional().nullable(),
});

export async function GET() {
  try {
    const templates = await prisma.quotationTemplate.findMany({
      include: {
        lines: {
          include: {
            plan: { include: { product: true } },
            variant: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ templates });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch quotation templates";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createTemplateSchema.parse(body);

    const template = await prisma.quotationTemplate.create({
      data: {
        name: parsed.name,
        description: parsed.description,
        validityDays: parsed.validityDays,
        lines: {
          create: [
            {
              planId: parsed.planId,
              variantId: parsed.variantId || undefined,
              quantity: parsed.quantity,
              unitPrice: parsed.unitPrice,
            },
          ],
        },
      },
      include: {
        lines: {
          include: {
            plan: { include: { product: true } },
            variant: true,
          },
        },
      },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 422 });
    }
    const message = error instanceof Error ? error.message : "Failed to create template";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

