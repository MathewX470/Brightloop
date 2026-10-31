import * as React from "react";

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  siblingCount?: number;
  className?: string;
}
export function Pagination({ page, pageSize, total, onPageChange, onPageSizeChange, pageSizeOptions = [10, 20, 50], siblingCount = 1, className = "" }: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), pages);
  const start = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const end = Math.min(current * pageSize, total);
  const numbers = Array.from({ length: pages }, (_, index) => index + 1).filter(n => n === 1 || n === pages || Math.abs(n - current) <= siblingCount);
  const sequence: (number | "ellipsis")[] = [];
  numbers.forEach((n, i) => {
    if (i && n - numbers[i - 1] > 1) sequence.push("ellipsis");
    sequence.push(n);
  });
  const control = "inline-flex size-8 items-center justify-center rounded-lg border text-sm transition disabled:pointer-events-none disabled:opacity-40";
  return <div className={`flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${className}`}>
    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
      <span>Showing <strong className="font-semibold text-slate-700">{start}–{end}</strong> of <strong className="font-semibold text-slate-700">{total}</strong></span>
      {onPageSizeChange && <label className="ml-1 flex items-center gap-1.5">Rows <select value={pageSize} onChange={event => onPageSizeChange(Number(event.target.value))} className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-slate-200">{pageSizeOptions.map(size => <option key={size} value={size}>{size}</option>)}</select></label>}
    </div>
    <nav aria-label="Pagination" className="flex items-center gap-1">
      <button type="button" aria-label="First page" disabled={current === 1} onClick={() => onPageChange(1)} className={`${control} border-slate-200 text-slate-600 hover:bg-slate-50`}>«</button>
      <button type="button" aria-label="Previous page" disabled={current === 1} onClick={() => onPageChange(current - 1)} className={`${control} border-slate-200 text-slate-600 hover:bg-slate-50`}>‹</button>
      {sequence.map((item, index) => item === "ellipsis" ? <span key={`e-${index}`} className="px-1 text-slate-400">…</span> : <button key={item} type="button" aria-current={current === item ? "page" : undefined} onClick={() => onPageChange(item)} className={`${control} ${current === item ? "border-slate-900 bg-slate-900 text-white" : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50"}`}>{item}</button>)}
      <button type="button" aria-label="Next page" disabled={current === pages} onClick={() => onPageChange(current + 1)} className={`${control} border-slate-200 text-slate-600 hover:bg-slate-50`}>›</button>
      <button type="button" aria-label="Last page" disabled={current === pages} onClick={() => onPageChange(pages)} className={`${control} border-slate-200 text-slate-600 hover:bg-slate-50`}>»</button>
    </nav>
  </div>;
}
