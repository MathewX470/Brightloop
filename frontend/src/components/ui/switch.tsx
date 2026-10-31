import * as React from "react";

export interface SwitchProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: React.ReactNode;
  description?: string;
  onLabel?: string;
  offLabel?: string;
  size?: "sm" | "md" | "lg";
}

const dimensions = { sm: "h-5 w-9 after:size-3", md: "h-6 w-11 after:size-4", lg: "h-7 w-[3.25rem] after:size-5" };

export function Switch({ checked, defaultChecked = false, onChange, label, description, onLabel, offLabel, size = "md", disabled, className = "", ...props }: SwitchProps) {
  const [internal, setInternal] = React.useState(defaultChecked);
  const active = checked ?? internal;
  const toggle = () => {
    if (disabled) return;
    if (checked === undefined) setInternal(!active);
    onChange?.(!active);
  };
  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      {(label || description) && <div className="min-w-0"><div className="text-sm font-medium text-slate-800">{label}</div>{description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}</div>}
      <div className="flex shrink-0 items-center gap-2">
        {offLabel && <span className={`text-xs ${!active ? "font-medium text-slate-800" : "text-slate-400"}`}>{offLabel}</span>}
        <button type="button" role="switch" aria-checked={active} disabled={disabled} onClick={toggle}
          className={`relative inline-flex shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${dimensions[size]} ${active ? "bg-slate-900" : "bg-slate-300"}`} {...props}>
          <span className={`absolute left-0.5 top-1/2 -translate-y-1/2 rounded-full bg-white shadow-sm transition-transform duration-200 ${size === "sm" ? "size-3" : size === "lg" ? "size-5" : "size-4"} ${active ? (size === "sm" ? "translate-x-4" : size === "lg" ? "translate-x-6" : "translate-x-5") : "translate-x-0"}`} />
        </button>
        {onLabel && <span className={`text-xs ${active ? "font-medium text-slate-800" : "text-slate-400"}`}>{onLabel}</span>}
      </div>
    </div>
  );
}
