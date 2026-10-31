import * as React from "react";

export interface SelectOption {
  label: string;
  value: string;
  description?: string;
  disabled?: boolean;
}
export interface SelectProps {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  label?: string;
  hint?: string;
  error?: string;
  placeholder?: string;
  searchable?: boolean;
  clearable?: boolean;
  disabled?: boolean;
  emptyMessage?: string;
  className?: string;
  name?: string;
}

export function Select({ options, value, defaultValue, onChange, label, hint, error, placeholder = "Select an option", searchable = false, clearable = false, disabled = false, emptyMessage = "No options found", className = "", name }: SelectProps) {
  const [internal, setInternal] = React.useState(defaultValue ?? "");
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const root = React.useRef<HTMLDivElement>(null);
  const inputId = React.useId();
  const selected = value !== undefined ? value : internal;
  const selectedOption = options.find(option => option.value === selected);
  const filtered = options.filter(option => `${option.label} ${option.description ?? ""}`.toLowerCase().includes(query.toLowerCase()));

  React.useEffect(() => {
    const handlePointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointer);
    return () => document.removeEventListener("pointerdown", handlePointer);
  }, []);

  const choose = (option: SelectOption) => {
    if (option.disabled) return;
    if (value === undefined) setInternal(option.value);
    onChange?.(option.value);
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={root} className={`relative w-full space-y-1.5 ${className}`}>
      {label && <label id={`${inputId}-label`} className="block text-sm font-medium text-slate-700">{label}</label>}
      <button type="button" disabled={disabled} aria-haspopup="listbox" aria-expanded={open} aria-labelledby={label ? `${inputId}-label` : undefined}
        onClick={() => setOpen(v => !v)}
        className={`flex h-10 w-full items-center justify-between gap-2 rounded-lg border bg-white px-3 text-left text-sm shadow-sm outline-none transition focus:ring-2 ${error ? "border-rose-400 focus:ring-rose-100" : "border-slate-300 focus:border-slate-500 focus:ring-slate-100"} disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60`}>
        <span className={selectedOption ? "text-slate-900" : "text-slate-400"}>{selectedOption?.label ?? placeholder}</span>
        <span className="flex items-center gap-2 text-slate-400">
          {clearable && selected && <span role="button" aria-label="Clear selection" onClick={event => { event.stopPropagation(); if (value === undefined) setInternal(""); onChange?.(""); }} className="text-lg leading-none hover:text-slate-700">×</span>}
          <span aria-hidden="true" className={`text-[10px] transition-transform ${open ? "rotate-180" : ""}`}>▼</span>
        </span>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
          {searchable && <input autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder="Search options..." className="mb-1.5 h-9 w-full rounded-md border border-slate-200 px-2.5 text-sm outline-none focus:border-slate-400" />}
          <div role="listbox" className="max-h-60 overflow-y-auto">
            {filtered.length ? filtered.map(option => (
              <button key={option.value} type="button" role="option" aria-selected={selected === option.value} disabled={option.disabled} onClick={() => choose(option)}
                className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 aria-selected:bg-slate-100">
                <span><span className="block font-medium text-slate-800">{option.label}</span>{option.description && <span className="mt-0.5 block text-xs text-slate-500">{option.description}</span>}</span>
                {selected === option.value && <span className="text-slate-700">✓</span>}
              </button>
            )) : <p className="px-3 py-5 text-center text-sm text-slate-500">{emptyMessage}</p>}
          </div>
        </div>
      )}
      {name && <input type="hidden" name={name} value={selected} />}
      {error ? <p role="alert" className="text-xs text-rose-600">{error}</p> : hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
