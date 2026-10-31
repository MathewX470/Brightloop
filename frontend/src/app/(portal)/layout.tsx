import React from "react";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Admin and Staff accounts have strictly NO access to the client portal
  if (session.role !== "CUSTOMER") {
    redirect("/dashboard");
  }

  return (
    <PortalLayout
      brandName="Brightloop"
      customerName={session.name}
      customerEmail={session.email}
    >
      {children}
    </PortalLayout>
  );
}
