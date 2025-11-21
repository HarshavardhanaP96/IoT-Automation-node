// src/pages/Companies/CompaniesPage.tsx
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { type ColumnDef } from "@tanstack/react-table";
import { useCompanies } from "../../api/companies";
import { useAppSelector } from "../../store/hooks";
import { selectUser, selectHasRole } from "../../store/slices/authSlice";
import { Table } from "../../components/common/Table";
import {
  companyProfileRoute,
  newCompanyRoute,
} from "../../router/routeConfigs";
import { Role, getRoleLabel } from "../../types/enums";
import type { Company } from "../../types/company";

export default function CompaniesPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [sorting, setSorting] = useState<{
    field?: keyof Company;
    order?: "asc" | "desc";
  }>({});

  const navigate = useNavigate();
  const currentUser = useAppSelector(selectUser);
  const hasRole = (roles: Role | Role[]) => useAppSelector(state => selectHasRole(state, roles));

  // Check if user can create companies (ADMIN and SUPER_ADMIN only)
  const canCreateCompanies = hasRole([Role.ADMIN, Role.SUPER_ADMIN]);

  // Real API call
  const { data, isLoading, error } = useCompanies({
    page,
    limit: pageSize,
    search,
    status: statusFilter,
  });

  /* MOCK DATA - COMMENTED OUT
  const data = {
    success: true,
    data: [
      { 
        id: "1", 
        name: "Acme Corp", 
        address: "123 Main St", 
        pinCode: "400001",
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deleted: false,
      },
      {
        id: "2",
        name: "Globex Inc",
        address: "456 Elm St",
        pinCode: "400002",
        status: "INACTIVE",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deleted: false,
      },
    ],
    pagination: {
      total: 50,
      page: 1,
      limit: 10,
      totalPages: 5,
    },
  };
  const isLoading = false;
  const error = null;
  */

  // Check if user can view companies
  if (!hasRole([Role.ADMIN, Role.SUPER_ADMIN])) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
          <div className="text-center text-red-600">
            <svg
              className="w-16 h-16 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">
              Only ADMIN and SUPER_ADMIN users can manage companies.
            </p>
            <button
              onClick={() => navigate({ to: "/" })}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Table columns
  const columns: ColumnDef<Company>[] = [
    {
      accessorKey: "name",
      header: "Company Name",
      enableSorting: true,
    },
    {
      accessorKey: "address",
      header: "Address",
      cell: ({ getValue }) => getValue() || "—",
    },
    {
      accessorKey: "pinCode",
      header: "Pin Code",
      cell: ({ getValue }) => getValue() || "—",
    },
    {
      accessorKey: "status",
      header: "Status",
      enableSorting: true,
      cell: ({ getValue }) => {
        const status = getValue() as string;
        const colors: Record<string, string> = {
          ACTIVE: "bg-green-100 text-green-800",
          INACTIVE: "bg-gray-100 text-gray-800",
          SUSPENDED: "bg-red-100 text-red-800",
        };
        return status ? (
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              colors[status] || "bg-gray-100 text-gray-800"
            }`}
          >
            {status}
          </span>
        ) : (
          "—"
        );
      },
    },
  ];

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading companies...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md">
          <div className="text-red-600 text-center">
            <svg
              className="w-12 h-12 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="font-semibold text-lg mb-2">
              Error Loading Companies
            </p>
            <p className="text-gray-600">{(error as Error).message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Companies</h1>
            <p className="text-gray-600 mt-1">Manage your company records</p>
            {currentUser && (
              <p className="text-sm text-gray-500 mt-1">
                Logged in as:{" "}
                <span className="font-medium">{currentUser.name}</span> (
                {getRoleLabel(currentUser.role)})
              </p>
            )}
          </div>

          {/* Show "Add Company" button only for ADMIN and SUPER_ADMIN */}
          {canCreateCompanies && (
            <button
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
              onClick={() => navigate({ to: newCompanyRoute.to })}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Company
            </button>
          )}
        </div>

        {/* Info banner for ADMIN */}
        {currentUser?.role === Role.ADMIN && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
            <p className="text-blue-800 text-sm">
              ℹ️ As an Admin, you can view and manage companies assigned to you.
              You will be automatically assigned to companies you create.
            </p>
          </div>
        )}

        {/* Status Filter */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
          <select
            value={statusFilter || ""}
            onChange={(e) => setStatusFilter(e.target.value || undefined)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>

        {/* Table */}
        <Table
          columns={columns}
          data={data?.data ?? []}
          total={data?.pagination.total ?? 0}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          search={search}
          onSearchChange={setSearch}
          sorting={sorting}
          onSortingChange={setSorting}
          onRowClick={(company) =>
            navigate({ to: companyProfileRoute.to, params: { id: company.id } })
          }
        />
      </div>
    </div>
  );
}
