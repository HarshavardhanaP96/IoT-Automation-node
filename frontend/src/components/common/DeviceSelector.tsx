// src/components/common/DeviceSelector.tsx
import { useState } from "react";
import { useDevices } from "../../api/devices";
import { useAppSelector } from "../../store/hooks";
import { selectActiveCompanyId } from "../../store/slices/authSlice";

interface DeviceSelectorProps {
  selectedDeviceIds: string[];
  onChange: (deviceIds: string[]) => void;
  multiple?: boolean;
  required?: boolean;
  disabled?: boolean;
  label?: string;
  companyId?: string; // Optional override for company filter
}

export function DeviceSelector({
  selectedDeviceIds,
  onChange,
  multiple = true,
  required = false,
  disabled = false,
  label = "Devices",
  companyId,
}: DeviceSelectorProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const activeCompanyId = useAppSelector(selectActiveCompanyId);

  // Use provided companyId or fall back to active company
  const filterCompanyId = companyId || activeCompanyId || undefined;

  const { data, isLoading, error } = useDevices({
    page,
    limit: 50, // Show more devices for selection
    search,
    companyId: filterCompanyId,
  });

  const devices = data?.data || [];

  const handleToggleDevice = (deviceId: string) => {
    if (disabled) return;

    if (multiple) {
      if (selectedDeviceIds.includes(deviceId)) {
        onChange(selectedDeviceIds.filter((id) => id !== deviceId));
      } else {
        onChange([...selectedDeviceIds, deviceId]);
      }
    } else {
      onChange([deviceId]);
    }
  };

  const handleSelectAll = () => {
    if (disabled) return;
    onChange(devices.map((d) => d.id));
  };

  const handleClearAll = () => {
    if (disabled) return;
    onChange([]);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Search Input */}
      <div className="mb-3">
        <input
          type="text"
          placeholder="Search by serial number or registration number..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1); // Reset to first page on search
          }}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100 disabled:text-gray-600"
        />
      </div>

      {/* Action Buttons */}
      {multiple && !disabled && devices.length > 0 && (
        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Select All
          </button>
          <span className="text-gray-300">|</span>
          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Device List */}
      <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto bg-gray-50">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            Loading devices...
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-600 text-sm">
            Error loading devices: {(error as Error).message}
          </div>
        ) : devices.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            {search
              ? "No devices found matching your search"
              : "No devices available"}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {devices.map((device) => {
              const isSelected = selectedDeviceIds.includes(device.id);

              return (
                <label
                  key={device.id}
                  className={`flex items-start gap-3 p-3 cursor-pointer hover:bg-blue-50 transition ${
                    disabled ? "opacity-50 cursor-not-allowed" : ""
                  } ${isSelected ? "bg-blue-50" : "bg-white"}`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleDevice(device.id)}
                    disabled={disabled}
                    className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:cursor-not-allowed"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {device.name}
                    </p>
                    <div className="flex gap-3 mt-1">
                      <p className="text-xs text-gray-500">
                        SN: {device.serialNumber}
                      </p>
                      {device.regNumber && (
                        <p className="text-xs text-gray-500">
                          Reg: {device.regNumber}
                        </p>
                      )}
                    </div>
                    {device.location && (
                      <p className="text-xs text-gray-400 mt-1">
                        📍 {device.location}
                      </p>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Selection Summary */}
      {selectedDeviceIds.length > 0 && (
        <p className="mt-2 text-xs text-gray-600">
          {selectedDeviceIds.length} device{selectedDeviceIds.length !== 1 ? "s" : ""} selected
        </p>
      )}

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 text-sm">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || disabled}
            className="px-3 py-1 text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-gray-600">
            Page {page} of {data.pagination.totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
            disabled={page === data.pagination.totalPages || disabled}
            className="px-3 py-1 text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
