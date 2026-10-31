import prisma from "@/lib/db";
import { ProductInput } from "./schemas";

export async function listProducts(includeInactive = false) {
  return prisma.product.findMany({
    where: includeInactive ? {} : { isActive: true },
    include: {
      variants: true,
      plans: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProductById(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: {
      variants: true,
      plans: true,
    },
  });
}

export async function createProduct(data: ProductInput) {
  return prisma.product.create({
    data,
  });
}

export async function updateProduct(id: string, data: Partial<ProductInput>) {
  return prisma.product.update({
    where: { id },
    data,
  });
}

export async function createProductVariant(productId: string, name: string, priceModifier = 0) {
  return prisma.productVariant.create({
    data: {
      productId,
      name,
      priceModifier,
    },
  });
}

