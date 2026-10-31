import React from "react";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { getSession } from "@/lib/auth/session";

export default async function Layout({ children }: { children: React.ReactNode }) {
    const session = await getSession();

    return (
        <PortalLayout
            brandName="Brightloop"
            customerName={session?.name ?? "Guest"}
            customerEmail={session?.email ?? ""}
        >
            {children}
        </PortalLayout>
    );
}
