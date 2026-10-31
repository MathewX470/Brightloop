import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { DiscountType } from "@prisma/client";
import { z } from "zod";

const createDiscountSchema = z.object({
  name: z.string().min(1, "Name required"),
  description: z.string().optional(),
  type: z.nativeEnum(DiscountType),
  value: z.coerce.number().min(0, "Value must be positive"),
  minimumPurchase: z.coerce.number().min(0).optional().nullable(),
  minimumQuantity: z.coerce.number().int().min(1).default(1),
  startDate: z.string(),
  endDate: z.string().optional().nullable(),
  usageLimit: z.coerce.number().int().min(1).optional().nullable(),
  productId: z.string().optional().nullable(),
});

export async function GET() {
  try {
    const discounts = await prisma.discount.findMany({
      include: {
        products: { include: { product: true } },
        usages: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ discounts });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch discounts";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createDiscountSchema.parse(body);

    const discount = await prisma.discount.create({
      data: {
        name: parsed.name,
        description: parsed.description,
        type: parsed.type,
        value: parsed.value,
        minimumPurchase: parsed.minimumPurchase,
        minimumQuantity: parsed.minimumQuantity,
        startDate: new Date(parsed.startDate),
        endDate: parsed.endDate ? new Date(parsed.endDate) : null,
        usageLimit: parsed.usageLimit,
        products: parsed.productId
          ? {
              create: [{ productId: parsed.productId }],
            }
          : undefined,
      },
      include: {
        products: { include: { product: true } },
      },
    });

    return NextResponse.json({ discount }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 422 });
    }
    const message = error instanceof Error ? error.message : "Failed to create discount";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
