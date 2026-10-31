import * as React from "react";
import { Pagination } from "../ui/pagination";
import { SkeletonTable } from "../ui/skeleton";

export interface DataTableColumn<T> {
  key: string;
  header: React.ReactNode;
  render?: (row: T, index: number) => React.ReactNode;
  accessor?: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  align?: "left" | "center" | "right";
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowId: (row: T, index: number) => React.Key;
  loading?: boolean;
  emptyState?: React.ReactNode;
  onRowClick?: (row: T) => void;
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  density?: "compact" | "comfortable";
  className?: string;
  rowClassName?: (row: T) => string;
}

export function DataTable<T>({
  columns, data, getRowId, loading = false, emptyState, onRowClick,
  page, pageSize, total, onPageChange, onPageSizeChange, pageSizeOptions,
  density = "comfortable", className = "", rowClassName,
}: DataTableProps<T>) {
  const hasPagination = page !== undefined && pageSize !== undefined && total !== undefined && onPageChange;
  const cellY = density === "compact" ? "py-2.5" : "py-3.5";
  const alignment = { left: "text-left", center: "text-center", right: "text-right" };

  return (
    <div className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead className="border-b border-slate-200 bg-slate-50/90">
            <tr>
              {columns.map(column => (
                <th key={column.key} scope="col" className={`whitespace-nowrap px-4 ${cellY} text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 ${alignment[column.align ?? "left"]} ${column.headerClassName ?? ""}`}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={columns.length} className="p-4"><SkeletonTable rows={5} columns={Math.min(columns.length, 5)} /></td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={columns.length} className="px-4 py-14 text-center">{emptyState ?? <div className="text-sm text-slate-500">No records found.</div>}</td></tr>
            ) : data.map((row, index) => (
              <tr key={getRowId(row, index)} onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`bg-white transition-colors hover:bg-slate-50/80 ${onRowClick ? "cursor-pointer" : ""} ${rowClassName?.(row) ?? ""}`}>
                {columns.map(column => (
                  <td key={column.key} className={`px-4 ${cellY} text-slate-700 ${alignment[column.align ?? "left"]} ${column.className ?? ""}`}>
                    {column.render ? column.render(row, index) : column.accessor ? column.accessor(row) : (row as Record<string, React.ReactNode>)[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasPagination && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          pageSizeOptions={pageSizeOptions}
        />
      )}
    </div>
  );
}
