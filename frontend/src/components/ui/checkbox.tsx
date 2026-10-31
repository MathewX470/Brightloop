import * as React from "react";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: React.ReactNode;
  description?: string;
  indeterminate?: boolean;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ id, label, description, indeterminate = false, error, className = "", checked, defaultChecked, onChange, disabled, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const localRef = React.useRef<HTMLInputElement | null>(null);
    const assignRef = (node: HTMLInputElement | null) => {
      localRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    };
    React.useEffect(() => { if (localRef.current) localRef.current.indeterminate = indeterminate; }, [indeterminate]);
    return (
      <div className="space-y-1">
        <label htmlFor={inputId} className={`group flex cursor-pointer items-start gap-2.5 ${disabled ? "cursor-not-allowed opacity-60" : ""}`}>
          <input ref={assignRef} id={inputId} type="checkbox" checked={checked} defaultChecked={defaultChecked} onChange={onChange} disabled={disabled}
            className={`mt-0.5 size-4 shrink-0 rounded border-slate-300 text-slate-900 accent-slate-900 focus:ring-2 focus:ring-slate-300 focus:ring-offset-1 ${className}`} {...props} />
          {(label || description) && <span className="min-w-0"><span className="block text-sm font-medium text-slate-800">{label}</span>{description && <span className="mt-0.5 block text-xs leading-5 text-slate-500">{description}</span>}</span>}
        </label>
        {error && <p role="alert" className="text-xs text-rose-600">{error}</p>}
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";
