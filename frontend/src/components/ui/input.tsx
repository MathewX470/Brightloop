import * as React from "react";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  hint?: string;
  error?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  clearable?: boolean;
  showCount?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ id, label, hint, error, leadingIcon, trailingIcon, clearable = false, showCount = false, className = "", type = "text", value, defaultValue, onChange, maxLength, disabled, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);
    const [internalValue, setInternalValue] = React.useState(String(defaultValue ?? ""));
    const controlled = value !== undefined;
    const current = controlled ? String(value ?? "") : internalValue;
    const inputId = id ?? React.useId();
    const actualType = type === "password" && visible ? "text" : type;

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!controlled) setInternalValue(event.target.value);
      onChange?.(event);
    };
    const clear = () => {
      if (!controlled) setInternalValue("");
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      const element = document.getElementById(inputId) as HTMLInputElement | null;
      if (element && setter) {
        setter.call(element, "");
        element.dispatchEvent(new Event("input", { bubbles: true }));
        element.dispatchEvent(new Event("change", { bubbles: true }));
      }
      element?.focus();
    };

    return (
      <div className="w-full space-y-1.5">
        {label && <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">{label}{props.required && <span className="ml-1 text-rose-500">*</span>}</label>}
        <div className={[
          "flex min-h-10 items-center gap-2 rounded-lg border bg-white px-3 shadow-sm transition",
          error ? "border-rose-400 focus-within:border-rose-500 focus-within:ring-2 focus-within:ring-rose-100" : "border-slate-300 focus-within:border-slate-500 focus-within:ring-2 focus-within:ring-slate-100",
          disabled ? "bg-slate-50 opacity-70" : "",
        ].join(" ")}>
          {leadingIcon && <span className="shrink-0 text-slate-400">{leadingIcon}</span>}
          <input
            ref={ref} id={inputId} type={actualType} value={controlled ? value : undefined}
            defaultValue={controlled ? undefined : defaultValue} onChange={handleChange}
            maxLength={maxLength} disabled={disabled}
            className={`h-9 min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed ${className}`}
            aria-invalid={!!error} aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
          {type === "password" && (
            <button type="button" onClick={() => setVisible(v => !v)} className="text-xs font-medium text-slate-500 hover:text-slate-800" aria-label={visible ? "Hide password" : "Show password"}>
              {visible ? "Hide" : "Show"}
            </button>
          )}
          {clearable && current && !disabled && (
            <button type="button" onClick={clear} className="text-slate-400 hover:text-slate-700" aria-label="Clear input">×</button>
          )}
          {trailingIcon && <span className="shrink-0 text-slate-400">{trailingIcon}</span>}
        </div>
        <div className="flex items-start justify-between gap-3">
          {error ? <p id={`${inputId}-error`} role="alert" className="text-xs text-rose-600">{error}</p> : hint ? <p id={`${inputId}-hint`} className="text-xs text-slate-500">{hint}</p> : <span />}
          {showCount && maxLength && <span className="text-xs tabular-nums text-slate-400">{current.length}/{maxLength}</span>}
        </div>
      </div>
    );
  }
);
Input.displayName = "Input";
