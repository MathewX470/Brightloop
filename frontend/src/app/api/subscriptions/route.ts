import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { SubscriptionStatus, BillingCycle } from "@prisma/client";
import { z } from "zod";

const createSubscriptionSchema = z.object({
  customerId: z.string().uuid("Customer required"),
  planId: z.string().uuid("Plan required"),
  quantity: z.coerce.number().int().min(1).default(1),
  unitPrice: z.coerce.number().min(0),
  billingCycle: z.nativeEnum(BillingCycle).default(BillingCycle.MONTHLY),
  paymentTermsDays: z.coerce.number().int().default(15),
  startDate: z.string().optional(),
});

const updateStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.nativeEnum(SubscriptionStatus),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");

    const subscriptions = await prisma.subscription.findMany({
      where: statusParam ? { status: statusParam as SubscriptionStatus } : {},
      include: {
        customer: true,
        lines: {
          include: {
            product: true,
            plan: true,
            variant: true,
          },
        },
        invoices: {
          select: { id: true, invoiceNumber: true, status: true, total: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ subscriptions });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch subscriptions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createSubscriptionSchema.parse(body);

    const plan = await prisma.plan.findUnique({
      where: { id: parsed.planId },
      include: { product: true },
    });

    if (!plan) {
      return NextResponse.json({ error: "Selected plan not found" }, { status: 404 });
    }

    const count = await prisma.subscription.count();
    const subNumber = `SUB-${String(count + 1001).padStart(5, "0")}`;

    const startDate = parsed.startDate ? new Date(parsed.startDate) : new Date();
    const nextBillingDate = new Date(startDate);
    if (parsed.billingCycle === "DAILY") nextBillingDate.setDate(nextBillingDate.getDate() + 1);
    else if (parsed.billingCycle === "WEEKLY") nextBillingDate.setDate(nextBillingDate.getDate() + 7);
    else if (parsed.billingCycle === "YEARLY") nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
    else nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

    const subscription = await prisma.subscription.create({
      data: {
        subscriptionNumber: subNumber,
        customerId: parsed.customerId,
        status: SubscriptionStatus.DRAFT,
        billingCycle: parsed.billingCycle,
        paymentTermsDays: parsed.paymentTermsDays,
        startDate,
        nextBillingDate,
        lines: {
          create: [
            {
              productId: plan.productId,
              planId: plan.id,
              quantity: parsed.quantity,
              unitPrice: parsed.unitPrice,
            },
          ],
        },
      },
      include: {
        customer: true,
        lines: { include: { product: true, plan: true } },
      },
    });

    return NextResponse.json({ subscription }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 422 });
    }
    const message = error instanceof Error ? error.message : "Failed to create subscription";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status } = updateStatusSchema.parse(body);

    const subscription = await prisma.subscription.update({
      where: { id },
      data: {
        status,
        ...(status === SubscriptionStatus.ACTIVE ? { startDate: new Date() } : {}),
        ...(status === SubscriptionStatus.PAUSED ? { pausedAt: new Date() } : {}),
        ...(status === SubscriptionStatus.CLOSED ? { closedAt: new Date() } : {}),
      },
    });

    return NextResponse.json({ subscription });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 422 });
    }
    const message = error instanceof Error ? error.message : "Failed to update subscription status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
