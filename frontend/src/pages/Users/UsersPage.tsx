// src/pages/Users/UsersPage.tsx (with role-based UI)
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { type ColumnDef } from "@tanstack/react-table";
import { useUsers } from "../../api/users";
import { useAuth } from "../../contexts/AuthContext";
import { Table } from "../../components/common/Table";
import { userProfileRoute, newUserRoute } from "../../router/routeConfigs";
import type { User } from "../../types/user";
import {
  Role,
  UserStatus,
  getRoleLabel,
  getStatusLabel,
  getRoleColor,
  getStatusColor,
} from "../../types/enums";

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | undefined>();
  const [statusFilter, setStatusFilter] = useState<UserStatus | undefined>();
  const [sorting, setSorting] = useState<{
    field?: keyof User;
    order?: "asc" | "desc";
  }>({});

  const navigate = useNavigate();
  const { user: currentUser, hasRole } = useAuth();

  // Real API call
  const { data, isLoading, error } = useUsers({
    page,
    limit: pageSize,
    search,
    role: roleFilter,
    status: statusFilter,
  });

  // Check if current user can create users
  const canCreateUsers = hasRole([Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN]);

  // Column definitions with role-based actions
  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: "Name",
      enableSorting: true,
    },
    {
      accessorKey: "email",
      header: "Email",
      enableSorting: true,
    },
    {
      accessorKey: "phoneNumber",
      header: "Phone",
      cell: ({ getValue }) => getValue() || "—",
    },
    {
      accessorKey: "role",
      header: "Role",
      enableSorting: true,
      cell: ({ getValue }) => {
        const role = getValue() as Role;
        return (
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(
              role
            )}`}
          >
            {getRoleLabel(role)}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      enableSorting: true,
      cell: ({ getValue }) => {
        const status = getValue() as UserStatus;
        return (
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
              status
            )}`}
          >
            {getStatusLabel(status)}
          </span>
        );
      },
    },
    {
      accessorKey: "position",
      header: "Position",
      cell: ({ getValue }) => getValue() || "—",
    },
  ];

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
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
            <p className="font-semibold text-lg mb-2">Error Loading Users</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Users</h1>
            <p className="text-gray-600 mt-1">
              Manage your user accounts and permissions
            </p>
            {currentUser && (
              <p className="text-sm text-gray-500 mt-1">
                Logged in as:{" "}
                <span className="font-medium">{currentUser.name}</span> (
                {getRoleLabel(currentUser.role)})
              </p>
            )}
          </div>

          {/* Show "Add User" button only if user has permission */}
          {canCreateUsers && (
            <button
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
              onClick={() => navigate({ to: newUserRoute.to })}
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
              Add User
            </button>
          )}
        </div>

        {/* Permission Notice for VIEWER */}
        {hasRole(Role.VIEWER) && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
            <p className="text-blue-800 text-sm">
              ℹ️ As a Viewer, you can only view your own profile.
            </p>
          </div>
        )}

        {/* Filters - Only show for MANAGER and above */}
        {hasRole([Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN]) && (
          <div className="bg-white p-4 rounded-lg shadow-sm mb-4 flex gap-4">
            <select
              value={roleFilter || ""}
              onChange={(e) =>
                setRoleFilter((e.target.value as Role) || undefined)
              }
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Roles</option>
              <option value={Role.VIEWER}>Viewer</option>
              <option value={Role.MANAGER}>Manager</option>
              {hasRole([Role.ADMIN, Role.SUPER_ADMIN]) && (
                <option value={Role.ADMIN}>Admin</option>
              )}
              {hasRole(Role.SUPER_ADMIN) && (
                <option value={Role.SUPER_ADMIN}>Super Admin</option>
              )}
            </select>

            <select
              value={statusFilter || ""}
              onChange={(e) =>
                setStatusFilter((e.target.value as UserStatus) || undefined)
              }
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Statuses</option>
              <option value={UserStatus.ADDED}>Added</option>
              <option value={UserStatus.VALIDATED}>Validated</option>
              <option value={UserStatus.SUSPENDED}>Suspended</option>
            </select>
          </div>
        )}

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
          onRowClick={(user) =>
            navigate({ to: userProfileRoute.to, params: { id: user.id } })
          }
        />
      </div>
    </div>
  );
}
