import { Decimal } from "@prisma/client/runtime/library";

export interface LineInput {
  productId?: string | null;
  variantId?: string | null;
  taxId?: string | null;
  description: string;
  quantity: number;
  unitPrice: number | Decimal;
  taxRate?: number | Decimal | null; // e.g., 18 for 18%
  taxType?: "PERCENTAGE" | "FIXED" | null;
}

export interface DiscountRule {
  id: string;
  name: string;
  type: "PERCENTAGE" | "FIXED";
  value: number | Decimal;
  minimumPurchase?: number | Decimal | null;
  minimumQuantity?: number | null;
  startDate: Date | string;
  endDate?: Date | string | null;
  usageLimit?: number | null;
  usedCount: number;
  products?: Array<{ productId: string }>;
}

export interface LineCalculationResult {
  productId?: string | null;
  variantId?: string | null;
  taxId?: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
}

export interface BillingCalculationResult {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  lines: LineCalculationResult[];
  appliedDiscounts: Array<{ discountId: string; amount: number; name: string }>;
}

/**
 * Pure calculation function for subscription billing.
 * Computes item subtotals, applies qualifying volume and promotional discounts,
 * calculates tax breakdowns, and yields final totals.
 */
export function calculateBilling(
  lines: LineInput[],
  availableDiscounts: DiscountRule[] = [],
  targetDate: Date = new Date()
): BillingCalculationResult {
  let subtotal = 0;
  const computedLines: Array<{
    line: LineInput;
    lineSubtotal: number;
    unitPrice: number;
  }> = [];

  // 1. Calculate raw line subtotals
  for (const item of lines) {
    const qty = Math.max(1, item.quantity);
    const unitPrice = typeof item.unitPrice === "number" ? item.unitPrice : Number(item.unitPrice);
    const lineSubtotal = Number((qty * unitPrice).toFixed(2));
    subtotal += lineSubtotal;
    computedLines.push({ line: item, lineSubtotal, unitPrice });
  }

  // 2. Evaluate active and qualifying discounts
  const appliedDiscounts: Array<{ discountId: string; amount: number; name: string }> = [];
  let totalDiscount = 0;

  for (const discount of availableDiscounts) {
    // Check start and end dates
    const start = new Date(discount.startDate);
    if (targetDate < start) continue;
    if (discount.endDate && targetDate > new Date(discount.endDate)) continue;

    // Check usage limits
    if (discount.usageLimit !== null && discount.usageLimit !== undefined && discount.usedCount >= discount.usageLimit) {
      continue;
    }

    const minQty = discount.minimumQuantity || 1;
    const minPurchase = discount.minimumPurchase ? Number(discount.minimumPurchase) : 0;
    const discValue = Number(discount.value);

    // Check if discount is restricted to specific products
    const productScope = discount.products && discount.products.length > 0
      ? discount.products.map((p) => p.productId)
      : null;

    let eligibleSubtotal = 0;
    let eligibleQty = 0;

    for (const item of computedLines) {
      if (!productScope || (item.line.productId && productScope.includes(item.line.productId))) {
        eligibleSubtotal += item.lineSubtotal;
        eligibleQty += item.line.quantity;
      }
    }

    // Eligibility check
    if (eligibleQty >= minQty && eligibleSubtotal >= minPurchase) {
      let discountAmount = 0;
      if (discount.type === "PERCENTAGE") {
        discountAmount = Number(((eligibleSubtotal * discValue) / 100).toFixed(2));
      } else {
        discountAmount = Number(Math.min(discValue, eligibleSubtotal).toFixed(2));
      }

      if (discountAmount > 0) {
        appliedDiscounts.push({
          discountId: discount.id,
          amount: discountAmount,
          name: discount.name,
        });
        totalDiscount += discountAmount;
      }
    }
  }

  totalDiscount = Number(Math.min(totalDiscount, subtotal).toFixed(2));

  // 3. Distribute discounts and calculate taxes per line
  let totalTax = 0;
  const finalLines: LineCalculationResult[] = [];

  for (const item of computedLines) {
    // Proportional discount allocation for line
    const lineDiscount =
      subtotal > 0
        ? Number(((item.lineSubtotal / subtotal) * totalDiscount).toFixed(2))
        : 0;

    const lineAfterDiscount = Math.max(0, item.lineSubtotal - lineDiscount);

    // Calculate tax
    let lineTax = 0;
    const taxRate = item.line.taxRate ? Number(item.line.taxRate) : 0;
    if (taxRate > 0) {
      if (item.line.taxType === "FIXED") {
        lineTax = Number(taxRate.toFixed(2));
      } else {
        lineTax = Number(((lineAfterDiscount * taxRate) / 100).toFixed(2));
      }
    }

    totalTax += lineTax;
    const lineTotal = Number((lineAfterDiscount + lineTax).toFixed(2));

    finalLines.push({
      productId: item.line.productId || null,
      variantId: item.line.variantId || null,
      taxId: item.line.taxId || null,
      description: item.line.description,
      quantity: item.line.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.lineSubtotal,
      discountAmount: lineDiscount,
      taxAmount: lineTax,
      total: lineTotal,
    });
  }

  const grandTotal = Number((subtotal - totalDiscount + totalTax).toFixed(2));

  return {
    subtotal: Number(subtotal.toFixed(2)),
    discountAmount: Number(totalDiscount.toFixed(2)),
    taxAmount: Number(totalTax.toFixed(2)),
    total: Math.max(0, grandTotal),
    lines: finalLines,
    appliedDiscounts,
  };
}
