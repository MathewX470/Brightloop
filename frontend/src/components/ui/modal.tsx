import * as React from "react";
import { createPortal } from "react-dom";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  className?: string;
}
const widths = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl", full: "max-w-[calc(100vw-2rem)]" };

export function Modal({ open, onClose, children, size = "md", closeOnBackdrop = true, closeOnEscape = true, showCloseButton = true, className = "" }: ModalProps) {
  const [mounted, setMounted] = React.useState(false);
  const panelRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => { setMounted(true); }, []);
  React.useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && closeOnEscape) onClose();
      if (event.key === "Tab" && panelRef.current) {
        const nodes = panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
        if (!nodes.length) return;
        const first = nodes[0], last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", handleKey);
    requestAnimationFrame(() => panelRef.current?.querySelector<HTMLElement>("button, input, [tabindex]")?.focus());
    return () => { document.body.style.overflow = previous; document.removeEventListener("keydown", handleKey); };
  }, [open, closeOnEscape, onClose]);
  if (!mounted || !open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4">
      <button aria-label="Close dialog backdrop" tabIndex={-1} className="absolute inset-0 cursor-default bg-slate-950/45 backdrop-blur-[2px]" onClick={() => closeOnBackdrop && onClose()} />
      <div ref={panelRef} role="dialog" aria-modal="true" className={`relative z-10 flex max-h-[calc(100vh-2rem)] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20 ${widths[size]} ${className}`}>
        {showCloseButton && <button type="button" aria-label="Close dialog" onClick={onClose} className="absolute right-4 top-4 z-10 flex size-8 items-center justify-center rounded-lg text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-800">×</button>}
        {children}
      </div>
    </div>,
    document.body
  );
}
export function ModalHeader({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`border-b border-slate-100 px-6 py-5 pr-14 ${className}`} {...props} />;
}
export function ModalTitle({ className = "", ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={`text-lg font-semibold tracking-tight text-slate-900 ${className}`} {...props} />;
}
export function ModalDescription({ className = "", ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={`mt-1 text-sm text-slate-500 ${className}`} {...props} />;
}
export function ModalContent({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`overflow-y-auto px-6 py-5 ${className}`} {...props} />;
}
export function ModalFooter({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`mt-auto flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 px-6 py-4 ${className}`} {...props} />;
}
