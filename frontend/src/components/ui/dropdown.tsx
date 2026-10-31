import * as React from "react";

interface DropdownContextValue { open: boolean; setOpen: (open: boolean) => void; }
const DropdownContext = React.createContext<DropdownContextValue | null>(null);
function useDropdown() {
  const context = React.useContext(DropdownContext);
  if (!context) throw new Error("Dropdown components must be used inside Dropdown.");
  return context;
}
export function Dropdown({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const root = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const close = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", close); document.addEventListener("keydown", key);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", key); };
  }, []);
  return <DropdownContext.Provider value={{ open, setOpen }}><div ref={root} className="relative inline-flex">{children}</div></DropdownContext.Provider>;
}
export function DropdownTrigger({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { open, setOpen } = useDropdown();
  return <button type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)} className={className}>{children}</button>;
}
export function DropdownContent({ children, align = "end", className = "" }: { children: React.ReactNode; align?: "start" | "end"; className?: string }) {
  const { open } = useDropdown();
  if (!open) return null;
  return <div role="menu" className={`absolute top-full z-50 mt-2 min-w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl ${align === "end" ? "right-0" : "left-0"} ${className}`}>{children}</div>;
}
export function DropdownItem({ children, onSelect, destructive = false, disabled = false, icon, className = "" }: { children: React.ReactNode; onSelect?: () => void; destructive?: boolean; disabled?: boolean; icon?: React.ReactNode; className?: string }) {
  const { setOpen } = useDropdown();
  return <button type="button" role="menuitem" disabled={disabled} onClick={() => { onSelect?.(); setOpen(false); }}
    className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 ${destructive ? "text-rose-600 hover:bg-rose-50" : "text-slate-700"} ${className}`}>
    {icon && <span className="shrink-0 [&>svg]:size-4">{icon}</span>}{children}
  </button>;
}
export function DropdownSeparator() { return <div role="separator" className="my-1 h-px bg-slate-100" />; }
export function DropdownLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 ${className}`}>{children}</div>;
}
