import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { Customer } from "@prisma/client";

/**
 * Resolves the authenticated customer for portal pages and APIs.
 * Strictly enforces that only CUSTOMER accounts can access portal resources.
 * Admin and Staff accounts are forbidden (403).
 */
export async function getAuthenticatedPortalCustomer(): Promise<{
  customer: Customer | null;
  error?: string;
  statusCode?: number;
}> {
  const session = await getSession();

  if (!session) {
    return {
      customer: null,
      error: "Please log in to access the customer portal.",
      statusCode: 401,
    };
  }

  // Strictly block ADMIN and STAFF from customer portal resources
  if (session.role !== "CUSTOMER") {
    return {
      customer: null,
      error: "Access denied. Admin and Staff accounts cannot access customer portal resources.",
      statusCode: 403,
    };
  }

  // 1. Direct session customerId lookup
  if (session.customerId) {
    const customer = await prisma.customer.findUnique({
      where: { id: session.customerId },
    });
    if (customer && customer.isActive) {
      return { customer };
    }
  }

  // 2. Query user record if session cookie didn't carry customerId
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { customerId: true, isActive: true },
  });

  if (user?.customerId && user.isActive) {
    const customer = await prisma.customer.findUnique({
      where: { id: user.customerId },
    });
    if (customer && customer.isActive) {
      return { customer };
    }
  }

  return {
    customer: null,
    error: "No active customer account associated with this login.",
    statusCode: 403,
  };
}
