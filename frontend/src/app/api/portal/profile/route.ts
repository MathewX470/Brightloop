import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedPortalCustomer } from "@/lib/portal-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { customer, error, statusCode } = await getAuthenticatedPortalCustomer();
    if (!customer) {
      return NextResponse.json({ error }, { status: statusCode || 401 });
    }

    return NextResponse.json({
      customer: {
        id: customer.id,
        companyName: customer.companyName,
        email: customer.email,
        phone: customer.phone || "",
        taxId: customer.taxId || "",
        billingAddress: customer.billingAddress || "",
        createdAt: customer.createdAt,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load customer profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { customer, error, statusCode } = await getAuthenticatedPortalCustomer();
    if (!customer) {
      return NextResponse.json({ error }, { status: statusCode || 401 });
    }

    const body = await request.json();
    const { phone, taxId, billingAddress } = body;

    const updated = await prisma.customer.update({
      where: { id: customer.id },
      data: {
        phone: phone !== undefined ? phone : customer.phone,
        taxId: taxId !== undefined ? taxId : customer.taxId,
        billingAddress: billingAddress !== undefined ? billingAddress : customer.billingAddress,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Company details updated successfully.",
      customer: updated,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

