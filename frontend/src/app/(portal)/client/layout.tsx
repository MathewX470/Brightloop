import React from "react";
import { PortalLayout } from "@/components/portal/PortalLayout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <PortalLayout
      brandName="Brightloop"
      customerName="Alex Morgan"
      customerEmail="alex@company.com"
    >
      {children}
    </PortalLayout>
  );
}
