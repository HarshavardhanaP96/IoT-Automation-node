// src/components/common/Table.tsx

import { type ColumnDef, flexRender } from "@tanstack/react-table";
import * as React from "react";

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
}: TableProps<T>) {
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Search & page size */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-3 p-4 border-b border-gray-200">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg w-full md:w-80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {[10, 25, 50, 100].map((n) => (
            <option key={n} value={n}>
              {n} per page
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
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
                    className={`px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider select-none ${
                      enableSorting ? "cursor-pointer hover:bg-gray-100" : ""
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
          <tbody className="bg-white divide-y divide-gray-200">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-8 text-center text-gray-500"
                >
                  No data found
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={row.id}
                  className={`hover:bg-gray-50 transition-colors ${
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
                        className="px-6 py-4 text-sm text-gray-900"
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

      {/* Pagination */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-gray-200">
        <div className="text-sm text-gray-700">
          Showing{" "}
          <span className="font-medium">{(page - 1) * pageSize + 1}</span> to{" "}
          <span className="font-medium">
            {Math.min(page * pageSize, total)}
          </span>{" "}
          of <span className="font-medium">{total}</span> results
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
