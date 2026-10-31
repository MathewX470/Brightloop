import * as React from "react";

interface TabsContextValue { value: string; setValue: (value: string) => void; }
const TabsContext = React.createContext<TabsContextValue | null>(null);
function useTabs() { const context = React.useContext(TabsContext); if (!context) throw new Error("Tabs components must be used inside Tabs."); return context; }

export function Tabs({ children, value, defaultValue = "", onValueChange, className = "" }: { children: React.ReactNode; value?: string; defaultValue?: string; onValueChange?: (value: string) => void; className?: string }) {
  const [internal, setInternal] = React.useState(defaultValue);
  const active = value ?? internal;
  const setValue = (next: string) => { if (value === undefined) setInternal(next); onValueChange?.(next); };
  return <TabsContext.Provider value={{ value: active, setValue }}><div className={className}>{children}</div></TabsContext.Provider>;
}
export function TabsList({ children, className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div role="tablist" className={`inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1 ${className}`} {...props}>{children}</div>;
}
export function TabsTrigger({ value, children, disabled = false, className = "" }: { value: string; children: React.ReactNode; disabled?: boolean; className?: string }) {
  const { value: active, setValue } = useTabs();
  const selected = active === value;
  return <button type="button" role="tab" aria-selected={selected} aria-controls={`tab-panel-${value}`} disabled={disabled} onClick={() => setValue(value)}
    className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:opacity-40 ${selected ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"} ${className}`}>{children}</button>;
}
export function TabsContent({ value, children, className = "" }: { value: string; children: React.ReactNode; className?: string }) {
  const { value: active } = useTabs();
  if (active !== value) return null;
  return <div id={`tab-panel-${value}`} role="tabpanel" tabIndex={0} className={`mt-4 outline-none ${className}`}>{children}</div>;
}
