import prisma from "@/lib/db";
import { PlanInput } from "./schemas";

export async function listPlans(productId?: string) {
  return prisma.plan.findMany({
    where: {
      ...(productId ? { productId } : {}),
      isActive: true,
    },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPlanById(id: string) {
  return prisma.plan.findUnique({
    where: { id },
    include: { product: true },
  });
}

export async function createPlan(data: PlanInput) {
  return prisma.plan.create({
    data,
  });
}

export async function updatePlan(id: string, data: Partial<PlanInput>) {
  return prisma.plan.update({
    where: { id },
    data,
  });
}

