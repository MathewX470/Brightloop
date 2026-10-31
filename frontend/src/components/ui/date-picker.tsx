import * as React from "react";

export interface DatePickerProps {
  value?: Date | null;
  defaultValue?: Date | null;
  onChange?: (date: Date | null) => void;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  placeholder?: string;
  label?: string;
  className?: string;
  clearable?: boolean;
  name?: string;
}
const formatDate = (date: Date) => date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export function DatePicker({ value, defaultValue = null, onChange, minDate, maxDate, disabled, placeholder = "Choose a date", label, className = "", clearable = true, name }: DatePickerProps) {
  const [internal, setInternal] = React.useState<Date | null>(defaultValue);
  const [open, setOpen] = React.useState(false);
  const selected = value !== undefined ? value : internal;
  const [view, setView] = React.useState(() => selected ?? new Date());
  const root = React.useRef<HTMLDivElement>(null);
  const id = React.useId();
  const year = view.getFullYear(), month = view.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((firstDay + days) / 7) * 7 }, (_, index) => {
    const day = index - firstDay + 1;
    return day > 0 && day <= days ? new Date(year, month, day) : null;
  });
  React.useEffect(() => {
    const close = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  const choose = (date: Date) => {
    if ((minDate && date < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())) || (maxDate && date > new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate()))) return;
    if (value === undefined) setInternal(date);
    onChange?.(date);
    setOpen(false);
  };
  const changeMonth = (delta: number) => setView(new Date(year, month + delta, 1));
  return <div ref={root} className={`relative w-full space-y-1.5 ${className}`}>
    {label && <label id={`${id}-label`} className="block text-sm font-medium text-slate-700">{label}</label>}
    <button type="button" disabled={disabled} aria-expanded={open} aria-labelledby={label ? `${id}-label` : undefined} onClick={() => setOpen(v => !v)}
      className="flex h-10 w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-3 text-sm shadow-sm outline-none transition hover:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50 disabled:opacity-60">
      <span className={selected ? "text-slate-900" : "text-slate-400"}>{selected ? formatDate(selected) : placeholder}</span><span className="text-slate-400">▦</span>
    </button>
    {name && <input type="hidden" name={name} value={selected ? selected.toISOString().slice(0, 10) : ""} />}
    {open && <div className="absolute left-0 top-full z-50 mt-2 w-[292px] rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
      <div className="mb-3 flex items-center justify-between"><button type="button" onClick={() => changeMonth(-1)} className="size-8 rounded-lg text-slate-600 hover:bg-slate-100" aria-label="Previous month">‹</button><span className="text-sm font-semibold text-slate-800">{view.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</span><button type="button" onClick={() => changeMonth(1)} className="size-8 rounded-lg text-slate-600 hover:bg-slate-100" aria-label="Next month">›</button></div>
      <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-medium uppercase text-slate-400">{["Su","Mo","Tu","We","Th","Fr","Sa"].map(day => <span key={day} className="py-2">{day}</span>)}</div>
      <div className="grid grid-cols-7 gap-1">{cells.map((date, index) => {
        if (!date) return <span key={`blank-${index}`} />;
        const outOfRange = !!((minDate && date < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())) || (maxDate && date > new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate())));
        const active = !!selected && sameDay(date, selected);
        return <button key={date.toISOString()} type="button" disabled={outOfRange} onClick={() => choose(date)} aria-pressed={active}
          className={`aspect-square rounded-lg text-xs transition disabled:cursor-not-allowed disabled:text-slate-200 ${active ? "bg-slate-900 font-semibold text-white" : sameDay(date, new Date()) ? "border border-slate-300 font-semibold text-slate-900" : "text-slate-700 hover:bg-slate-100"}`}>{date.getDate()}</button>;
      })}</div>
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2"><button type="button" onClick={() => choose(new Date())} className="text-xs font-medium text-slate-600 hover:text-slate-900">Today</button>{clearable && selected && <button type="button" onClick={() => { if (value === undefined) setInternal(null); onChange?.(null); setOpen(false); }} className="text-xs font-medium text-slate-500 hover:text-rose-600">Clear</button>}</div>
    </div>}
  </div>;
}
