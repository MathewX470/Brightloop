import React from "react";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <div className="portal-layout">{children}</div>;
}
