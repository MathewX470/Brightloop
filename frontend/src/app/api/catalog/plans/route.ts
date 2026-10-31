import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { BillingCycle } from "@prisma/client";
import { z } from "zod";

const createPlanSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  name: z.string().min(1, "Plan name required"),
  description: z.string().optional(),
  billingCycle: z.nativeEnum(BillingCycle),
  price: z.coerce.number().min(0, "Price must be non-negative"),
  minimumQuantity: z.coerce.number().int().min(1).default(1),
  availableFrom: z.string().optional().nullable(),
  availableUntil: z.string().optional().nullable(),
  allowEarlyClosure: z.boolean().default(true),
  allowPause: z.boolean().default(true),
  allowRenewal: z.boolean().default(true),
  autoClose: z.boolean().default(false),
});

export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      include: { product: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ plans });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch plans";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createPlanSchema.parse(body);

    const plan = await prisma.plan.create({
      data: {
        productId: parsed.productId,
        name: parsed.name,
        description: parsed.description,
        billingCycle: parsed.billingCycle,
        price: parsed.price,
        minimumQuantity: parsed.minimumQuantity,
        availableFrom: parsed.availableFrom ? new Date(parsed.availableFrom) : null,
        availableUntil: parsed.availableUntil ? new Date(parsed.availableUntil) : null,
        allowEarlyClosure: parsed.allowEarlyClosure,
        allowPause: parsed.allowPause,
        allowRenewal: parsed.allowRenewal,
        autoClose: parsed.autoClose,
      },
      include: { product: true },
    });

    return NextResponse.json({ plan }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 422 });
    }
    const message = error instanceof Error ? error.message : "Failed to create plan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
