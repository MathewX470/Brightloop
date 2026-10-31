import React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { getSession } from "@/modules/auth/session";
import { AdminAssistantWidget } from "@/components/admin/AdminAssistantWidget";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <div className="flex min-h-screen bg-[#f8faf9] text-gray-800 font-sans selection:bg-[#eaf3ef] selection:text-[#1d3c34]">
      <Sidebar currentRole={session?.role ?? "ADMIN"} />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1">{children}</main>
      </div>
      <AdminAssistantWidget />
    </div>
  );
}
