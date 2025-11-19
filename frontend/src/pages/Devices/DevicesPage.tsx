// src/pages/Devices/DevicesPage.tsx
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { type ColumnDef } from "@tanstack/react-table";
import { useDevices } from "../../api/devices";
import { useAuth } from "../../contexts/AuthContext";
import { Table } from "../../components/common/Table";
import { deviceProfileRoute, newDeviceRoute } from "../../router/routeConfigs";
import { Role, getRoleLabel } from "../../types/enums";
import type { Device } from "../../types/device";
import { DeviceType } from "../../types/device";

export default function DevicesPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<DeviceType | undefined>();
  const [sorting, setSorting] = useState<{
    field?: keyof Device;
    order?: "asc" | "desc";
  }>({});

  const navigate = useNavigate();
  const { user: currentUser, hasRole, activeCompanyId } = useAuth();

  // Permission checks
  const canCreateDevices = hasRole([Role.ADMIN, Role.SUPER_ADMIN]);
  const canViewDevices = hasRole([
    Role.VIEWER,
    Role.MANAGER,
    Role.ADMIN,
    Role.SUPER_ADMIN,
  ]);

  // To avoid unused variable warning
  void activeCompanyId;
  void canViewDevices;

  // Real API call
  const { data, isLoading, error } = useDevices({
    page,
    limit: pageSize,
    search,
    type: typeFilter,
  });

  /* MOCK DATA - COMMENTED OUT
  const data = {
    success: true,
    data: [
      {
        id: "1",
        name: "Thermostat X100",
        type: DeviceType.SENSOR,
        status: "ACTIVE",
        location: "Office Building A",
        serialNumber: "SN001",
        // ... other fields
      },
    ],
    pagination: { total: 50, page: 1, limit: 10, totalPages: 5 },
  };
  */

  // Table columns
  const columns: ColumnDef<Device>[] = [
    {
      accessorKey: "name",
      header: "Device Name",
      enableSorting: true,
    },
    {
      accessorKey: "serialNumber",
      header: "Serial Number",
    },
    {
      accessorKey: "type",
      header: "Type",
      enableSorting: true,
      cell: ({ getValue }) => {
        const type = getValue() as DeviceType;
        const colors: Record<DeviceType, string> = {
          [DeviceType.SENSOR]: "bg-blue-100 text-blue-800",
          [DeviceType.GATEWAY]: "bg-purple-100 text-purple-800",
        };
        return (
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${colors[type]}`}
          >
            {type}
          </span>
        );
      },
    },
    {
      accessorKey: "location",
      header: "Location",
      cell: ({ getValue }) => getValue() || "—",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => {
        const status = getValue() as string;
        const color =
          status === "ACTIVE"
            ? "bg-green-100 text-green-800"
            : "bg-gray-100 text-gray-800";
        return (
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${color}`}
          >
            {status}
          </span>
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading devices...</p>
        </div>
      </div>
    );
  }

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
            <p className="font-semibold text-lg mb-2">Error Loading Devices</p>
            <p className="text-gray-600">{(error as Error).message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Devices</h1>
            <p className="text-gray-600 mt-1">
              Manage your devices, sensors, and equipment
            </p>
            {currentUser && (
              <p className="text-sm text-gray-500 mt-1">
                Logged in as:{" "}
                <span className="font-medium">{currentUser.name}</span> (
                {getRoleLabel(currentUser.role)})
              </p>
            )}
          </div>

          {canCreateDevices && (
            <button
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
              onClick={() => navigate({ to: newDeviceRoute.to })}
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
              Add Device
            </button>
          )}
        </div>

        {/* Role-based info banners */}
        {currentUser?.role === Role.VIEWER && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
            <p className="text-blue-800 text-sm">
              ℹ️ As a Viewer, you can only see devices assigned to you.
            </p>
          </div>
        )}

        {currentUser?.role === Role.MANAGER && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
            <p className="text-blue-800 text-sm">
              ℹ️ As a Manager, you can view all devices in your active company.
            </p>
          </div>
        )}

        {currentUser?.role === Role.ADMIN && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
            <p className="text-blue-800 text-sm">
              ℹ️ As an Admin, you can manage devices in your active company. Set
              your active company using the header.
            </p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
          <select
            value={typeFilter || ""}
            onChange={(e) =>
              setTypeFilter((e.target.value as DeviceType) || undefined)
            }
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">All Types</option>
            <option value={DeviceType.SENSOR}>Sensor</option>
            <option value={DeviceType.GATEWAY}>Gateway</option>
          </select>
        </div>

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
          onRowClick={(device) =>
            navigate({ to: deviceProfileRoute.to, params: { id: device.id } })
          }
        />
      </div>
    </div>
  );
}
