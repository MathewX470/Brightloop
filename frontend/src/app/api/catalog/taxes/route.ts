import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { TaxType } from "@prisma/client";
import { z } from "zod";

const createTaxSchema = z.object({
  name: z.string().min(1, "Tax name required"),
  type: z.nativeEnum(TaxType).default(TaxType.PERCENTAGE),
  rate: z.coerce.number().min(0, "Rate must be non-negative"),
  description: z.string().optional(),
});

export async function GET() {
  try {
    const taxes = await prisma.tax.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ taxes });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch taxes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createTaxSchema.parse(body);

    const tax = await prisma.tax.create({
      data: {
        name: parsed.name,
        type: parsed.type,
        rate: parsed.rate,
        description: parsed.description,
        isActive: true,
      },
    });

    return NextResponse.json({ tax }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 422 });
    }
    const message = error instanceof Error ? error.message : "Failed to create tax";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
