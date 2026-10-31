import { z } from "zod";
import { ProductType, BillingCycle, DiscountType, TaxType } from "@prisma/client";

export const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  type: z.nativeEnum(ProductType).default(ProductType.SERVICE),
  salesPrice: z.number().min(0, "Sales price must be positive"),
  costPrice: z.number().min(0).default(0),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const productVariantSchema = z.object({
  productId: z.string().uuid(),
  name: z.string().min(1, "Variant name is required"),
  priceModifier: z.number().default(0),
  isActive: z.boolean().default(true),
});

export const planSchema = z.object({
  productId: z.string().uuid(),
  name: z.string().min(1, "Plan name is required"),
  description: z.string().optional(),
  billingCycle: z.nativeEnum(BillingCycle),
  price: z.number().min(0, "Price must be non-negative"),
  minimumQuantity: z.number().int().min(1).default(1),
  availableFrom: z.coerce.date().optional(),
  availableUntil: z.coerce.date().optional(),
  allowEarlyClosure: z.boolean().default(true),
  allowPause: z.boolean().default(true),
  allowRenewal: z.boolean().default(true),
  autoClose: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const taxSchema = z.object({
  name: z.string().min(1, "Tax name is required"),
  type: z.nativeEnum(TaxType).default(TaxType.PERCENTAGE),
  rate: z.number().min(0, "Rate must be non-negative"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const discountSchema = z.object({
  name: z.string().min(1, "Discount name is required"),
  description: z.string().optional(),
  type: z.nativeEnum(DiscountType),
  value: z.number().min(0, "Value must be positive"),
  minimumPurchase: z.number().min(0).optional(),
  minimumQuantity: z.number().int().min(1).default(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  usageLimit: z.number().int().min(1).optional(),
  productIds: z.array(z.string().uuid()).optional(),
  isActive: z.boolean().default(true),
});

export type ProductInput = z.infer<typeof productSchema>;
export type PlanInput = z.infer<typeof planSchema>;
export type TaxInput = z.infer<typeof taxSchema>;
export type DiscountInput = z.infer<typeof discountSchema>;

