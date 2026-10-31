import * as React from "react";

export function Table({ className = "", density = "comfortable", ...props }: React.TableHTMLAttributes<HTMLTableElement> & { density?: "compact" | "comfortable" }) {
  return <div className="w-full overflow-x-auto rounded-lg"><table className={`w-full border-collapse text-left text-sm ${density === "compact" ? "[&_td]:py-2 [&_th]:py-2" : "[&_td]:py-3.5 [&_th]:py-3"} ${className}`} {...props} /></div>;
}
export function TableHeader({ className = "", ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={`border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500 [&_th:first-child]:pl-4 [&_th:last-child]:pr-4 ${className}`} {...props} />;
}
export function TableBody({ className = "", ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={`divide-y divide-slate-100 bg-white text-slate-700 [&_tr:hover]:bg-slate-50/70 [&_td:first-child]:pl-4 [&_td:last-child]:pr-4 ${className}`} {...props} />;
}
export function TableFooter({ className = "", ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tfoot className={`border-t border-slate-200 bg-slate-50 font-medium text-slate-700 ${className}`} {...props} />;
}
export function TableRow({ className = "", ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={`transition-colors ${className}`} {...props} />;
}
export function TableHead({ className = "", ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th scope="col" className={`whitespace-nowrap px-3 text-left font-semibold ${className}`} {...props} />;
}
export function TableCell({ className = "", ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={`px-3 align-middle ${className}`} {...props} />;
}
export function TableCaption({ className = "", ...props }: React.HTMLAttributes<HTMLTableCaptionElement>) {
  return <caption className={`caption-bottom px-3 py-3 text-left text-xs text-slate-500 ${className}`} {...props} />;
}
