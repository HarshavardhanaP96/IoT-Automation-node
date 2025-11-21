// src/pages/Users/UsersPage.tsx (with role-based UI)
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { type ColumnDef } from "@tanstack/react-table";
import { useUsers } from "../../api/users";
import { useAppSelector } from "../../store/hooks";
import { selectHasRole } from "../../store/slices/authSlice";
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
import { Plus } from "lucide-react";

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

  // read full state once
  const fullState = useAppSelector((state) => state);

  // pure helper function
  const hasRole = (roles: Role | Role[]) => selectHasRole(fullState, roles);

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
    <div className="h-[calc(100vh-64px)] bg-gray-50 p-4 md:p-6 overflow-hidden flex flex-col">
      {/* Permission Notice for VIEWER */}
      {hasRole(Role.VIEWER) && (
        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-4 shrink-0">
          <p className="text-blue-800 text-sm">
            ℹ️ As a Viewer, you can only view your own profile.
          </p>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 min-h-0">
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
          actions={
            canCreateUsers && (
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2 text-sm"
                onClick={() => navigate({ to: newUserRoute.to })}
              >
                <Plus className="w-4 h-4" />
                Add User
              </button>
            )
          }
          filters={
            hasRole([Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN]) && (
              <div className="flex gap-2">
                <select
                  value={roleFilter || ""}
                  onChange={(e) =>
                    setRoleFilter((e.target.value as Role) || undefined)
                  }
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">All Statuses</option>
                  <option value={UserStatus.ADDED}>Added</option>
                  <option value={UserStatus.VALIDATED}>Validated</option>
                  <option value={UserStatus.SUSPENDED}>Suspended</option>
                </select>
              </div>
            )
          }
        />
      </div>
    </div>
  );
}
