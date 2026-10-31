import * as React from "react";
import { PageHeader, type PageHeaderProps } from "../shared/page-header";

/**
 * Portal-specific page heading.
 * Keeps all customer pages aligned with the shared PageHeader component,
 * while providing a single place to evolve portal heading styling.
 */
export interface PortalHeaderProps extends PageHeaderProps {
  /** Optional content shown below the heading, such as a last-updated note. */
  footer?: React.ReactNode;
}

export function PortalHeader({ footer, className = "", ...headerProps }: PortalHeaderProps) {
  return (
    <div className="mb-7">
      <PageHeader {...headerProps} className={`mb-0 ${className}`} />
      {footer && <div className="mt-3 text-xs text-slate-500">{footer}</div>}
    </div>
  );
}
