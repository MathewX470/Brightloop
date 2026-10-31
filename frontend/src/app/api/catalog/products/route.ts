import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { ProductType } from "@prisma/client";
import { z } from "zod";

const createProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  type: z.nativeEnum(ProductType).default(ProductType.SOFTWARE),
  salesPrice: z.coerce.number().min(0, "Sales price must be positive"),
  costPrice: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
  variants: z
    .array(
      z.object({
        name: z.string().min(1, "Variant name required"),
        priceModifier: z.coerce.number().default(0),
      })
    )
    .optional(),
});

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        variants: true,
        plans: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ products });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch products";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createProductSchema.parse(body);

    const product = await prisma.product.create({
      data: {
        name: parsed.name,
        description: parsed.description,
        type: parsed.type,
        salesPrice: parsed.salesPrice,
        costPrice: parsed.costPrice,
        notes: parsed.notes,
        variants: parsed.variants && parsed.variants.length > 0
          ? {
              create: parsed.variants.map((v) => ({
                name: v.name,
                priceModifier: v.priceModifier,
              })),
            }
          : undefined,
      },
      include: {
        variants: true,
        plans: true,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 422 });
    }
    const message = error instanceof Error ? error.message : "Failed to create product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
