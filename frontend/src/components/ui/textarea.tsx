import * as React from "react";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  showCount?: boolean;
  autoResize?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ id, label, hint, error, showCount = false, autoResize = false, maxLength, value, defaultValue, onChange, className = "", ...props }, ref) => {
    const generatedId = React.useId();
    const fieldId = id ?? generatedId;
    const [internal, setInternal] = React.useState(String(defaultValue ?? ""));
    const current = value !== undefined ? String(value ?? "") : internal;
    const localRef = React.useRef<HTMLTextAreaElement | null>(null);
    const setRefs = (node: HTMLTextAreaElement | null) => {
      localRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    };
    React.useEffect(() => {
      if (autoResize && localRef.current) {
        localRef.current.style.height = "auto";
        localRef.current.style.height = `${localRef.current.scrollHeight}px`;
      }
    }, [current, autoResize]);
    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (value === undefined) setInternal(event.target.value);
      onChange?.(event);
    };
    return (
      <div className="w-full space-y-1.5">
        {label && <label htmlFor={fieldId} className="block text-sm font-medium text-slate-700">{label}{props.required && <span className="ml-1 text-rose-500">*</span>}</label>}
        <textarea ref={setRefs} id={fieldId} value={value} defaultValue={value === undefined ? defaultValue : undefined} onChange={handleChange} maxLength={maxLength}
          aria-invalid={!!error} className={`min-h-24 w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60 ${error ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100" : "border-slate-300 focus:border-slate-500 focus:ring-slate-100"} ${autoResize ? "resize-none overflow-hidden" : "resize-y"} ${className}`} {...props} />
        <div className="flex justify-between gap-3">{error ? <p role="alert" className="text-xs text-rose-600">{error}</p> : hint ? <p className="text-xs text-slate-500">{hint}</p> : <span />}{showCount && maxLength && <span className="text-xs tabular-nums text-slate-400">{current.length}/{maxLength}</span>}</div>
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
