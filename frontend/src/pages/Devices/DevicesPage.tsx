// src/pages/Devices/DevicesPage.tsx
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { type ColumnDef } from "@tanstack/react-table";
import { useDevices } from "../../api/devices";
import { useAppSelector } from "../../store/hooks";
import {
  selectUser,
  selectHasRole,
  selectActiveCompanyId,
} from "../../store/slices/authSlice";
import { Table } from "../../components/common/Table";
import { deviceProfileRoute, newDeviceRoute } from "../../router/routeConfigs";
import { Role } from "../../types/enums";
import type { Device } from "../../types/device";
import { DeviceType } from "../../types/device";
import { Plus } from "lucide-react";

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
  const currentUser = useAppSelector(selectUser);
  const fullState = useAppSelector((state) => state);

  const hasRole = (roles: Role | Role[]) => selectHasRole(fullState, roles);

  const activeCompanyId = useAppSelector(selectActiveCompanyId);

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
    <div className="h-[calc(100vh-64px)] bg-gray-50 p-4 md:p-6 overflow-hidden flex flex-col">
      {/* Role-based info banners */}
      {currentUser?.role === Role.VIEWER && (
        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-4 shrink-0">
          <p className="text-blue-800 text-sm">
            ℹ️ As a Viewer, you can only see devices assigned to you.
          </p>
        </div>
      )}

      {currentUser?.role === Role.MANAGER && (
        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-4 shrink-0">
          <p className="text-blue-800 text-sm">
            ℹ️ As a Manager, you can view all devices in your active company.
          </p>
        </div>
      )}

      {currentUser?.role === Role.ADMIN && (
        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-4 shrink-0">
          <p className="text-blue-800 text-sm">
            ℹ️ As an Admin, you can manage devices in your active company. Set
            your active company using the header.
          </p>
        </div>
      )}

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
          onRowClick={(device) =>
            navigate({ to: deviceProfileRoute.to, params: { id: device.id } })
          }
          actions={
            canCreateDevices && (
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2 text-sm"
                onClick={() => navigate({ to: newDeviceRoute.to })}
              >
                <Plus className="w-4 h-4" />
                Add Device
              </button>
            )
          }
          filters={
            <div className="flex gap-2">
              <select
                value={typeFilter || ""}
                onChange={(e) =>
                  setTypeFilter((e.target.value as DeviceType) || undefined)
                }
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">All Types</option>
                <option value={DeviceType.SENSOR}>Sensor</option>
                <option value={DeviceType.GATEWAY}>Gateway</option>
              </select>
            </div>
          }
        />
      </div>
    </div>
  );
}
