// src/components/common/Table.tsx

import { type ColumnDef, flexRender } from "@tanstack/react-table";
import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type AccessorColumnDef<T> = ColumnDef<T> & { accessorKey: keyof T };

interface TableProps<T extends { id: string | number }> {
  columns: ColumnDef<T>[];
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  search: string;
  sorting: { field?: keyof T; order?: "asc" | "desc" };
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSearchChange: (value: string) => void;
  onSortingChange: (sorting: {
    field?: keyof T;
    order?: "asc" | "desc";
  }) => void;
  onRowClick?: (row: T) => void;
  actions?: React.ReactNode;
  filters?: React.ReactNode;
}

export function Table<T extends { id: string | number }>({
  columns,
  data,
  total,
  page,
  pageSize,
  search,
  sorting,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  onSortingChange,
  onRowClick,
  actions,
  filters,
}: TableProps<T>) {
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-[calc(100vh-140px)]">
      {/* Top Bar: Search, Filters, Actions */}
      <div className="p-3 border-b border-gray-200 flex flex-col md:flex-row gap-3 items-center justify-between bg-white rounded-t-lg z-10">
        <div className="flex items-center gap-3 flex-1 w-full md:w-auto">
          <div className="relative flex-1 md:max-w-xs">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          {filters}
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {actions}
        </div>
      </div>

      {/* Table Content - Scrollable */}
      <div className="flex-1 overflow-auto">
        <table className="w-full relative border-collapse">
          <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
            <tr>
              {columns.map((col, index) => {
                const accessorCol = col as AccessorColumnDef<T>;
                const hasAccessor = !!accessorCol.accessorKey;
                const enableSorting =
                  hasAccessor && accessorCol.enableSorting !== false;

                const headerKey = hasAccessor
                  ? String(accessorCol.accessorKey)
                  : `header-${index}`;

                return (
                  <th
                    key={headerKey}
                    className={`px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider select-none bg-gray-50 border-b border-gray-200 whitespace-nowrap ${
                      enableSorting ? "cursor-pointer hover:bg-gray-100 transition-colors" : ""
                    }`}
                    onClick={() => {
                      if (!enableSorting) return;

                      const isCurrentSortField =
                        sorting.field === accessorCol.accessorKey;

                      if (isCurrentSortField) {
                        onSortingChange({
                          field: accessorCol.accessorKey as keyof T,
                          order: sorting.order === "asc" ? "desc" : "asc",
                        });
                      } else {
                        onSortingChange({
                          field: accessorCol.accessorKey as keyof T,
                          order: "asc",
                        });
                      }
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {flexRender(col.header, {
                        column: col,
                        header: col,
                        table: null,
                      } as any)}
                      {hasAccessor &&
                        sorting.field === accessorCol.accessorKey && (
                          <span className="text-blue-600">
                            {sorting.order === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium">No results found</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={row.id}
                  className={`hover:bg-blue-50/50 transition-colors group ${
                    onRowClick ? "cursor-pointer" : ""
                  }`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col, index) => {
                    const accessorCol = col as AccessorColumnDef<T>;
                    const hasAccessor = !!accessorCol.accessorKey;
                    const cellKey = hasAccessor
                      ? String(accessorCol.accessorKey)
                      : `cell-${index}`;

                    let cellContent: React.ReactNode = "";

                    const value = hasAccessor
                      ? row[accessorCol.accessorKey as keyof T]
                      : undefined;

                    if (col.cell) {
                      cellContent = flexRender(col.cell, {
                        column: col,
                        row: null,
                        table: null,
                        getValue: () => value as any,
                      } as any);
                    } else if (hasAccessor) {
                      cellContent = String(value ?? "");
                    }

                    return (
                      <td
                        key={cellKey}
                        className="px-6 py-3 text-sm text-gray-700 whitespace-nowrap group-hover:text-gray-900"
                      >
                        {cellContent}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer: Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-white rounded-b-lg">
        <div className="text-sm text-gray-500 w-1/3">
          {total > 0 ? (
            <>
              Showing <span className="font-medium text-gray-900">{(page - 1) * pageSize + 1}</span>-
              <span className="font-medium text-gray-900">{Math.min(page * pageSize, total)}</span> of{' '}
              <span className="font-medium text-gray-900">{total}</span>
            </>
          ) : (
            'No results'
          )}
        </div>

        <div className="flex items-center justify-center gap-2 w-1/3">
          <button
            disabled={page <= 1}
            className="p-1.5 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            onClick={() => onPageChange(page - 1)}
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-gray-700 min-w-[3rem] text-center">
            Page {page}
          </span>
          <button
            disabled={page >= totalPages}
            className="p-1.5 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            onClick={() => onPageChange(page + 1)}
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex justify-end w-1/3">
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
