import * as React from "react";
import { Input } from "../ui/input";
import { Select, type SelectOption } from "../ui/select";
import { Button } from "../ui/button";

export interface FilterBarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: Array<{
    key: string;
    placeholder: string;
    value?: string;
    options: SelectOption[];
    onChange: (value: string) => void;
    searchable?: boolean;
  }>;
  actions?: React.ReactNode;
  onReset?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function FilterBar({
  searchValue = "", onSearchChange, searchPlaceholder = "Search records...",
  filters = [], actions, onReset, className = "", children,
}: FilterBarProps) {
  const hasActiveFilters = !!searchValue || filters.some(filter => !!filter.value);
  return (
    <div className={`flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4 ${className}`}>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        {onSearchChange && (
          <div className="w-full xl:max-w-xs">
            <Input
              aria-label="Search records"
              type="search"
              value={searchValue}
              onChange={event => onSearchChange(event.target.value)}
              placeholder={searchPlaceholder}
              leadingIcon={<span aria-hidden="true">⌕</span>}
            />
          </div>
        )}
        {filters.length > 0 && (
          <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:flex">
            {filters.map(filter => (
              <div key={filter.key} className="min-w-0 xl:min-w-40">
                <Select
                  options={filter.options}
                  value={filter.value ?? ""}
                  onChange={filter.onChange}
                  placeholder={filter.placeholder}
                  clearable
                  searchable={filter.searchable}
                />
              </div>
            ))}
          </div>
        )}
        {(actions || onReset) && (
          <div className="flex shrink-0 items-center gap-2 xl:ml-auto">
            {onReset && <Button variant="ghost" size="sm" onClick={onReset} disabled={!hasActiveFilters}>Reset</Button>}
            {actions}
          </div>
        )}
      </div>
      {children && <div className="border-t border-slate-100 pt-3">{children}</div>}
    </div>
  );
}
