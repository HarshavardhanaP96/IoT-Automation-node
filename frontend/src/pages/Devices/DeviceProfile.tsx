import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
// --- New Imports ---
import {
  useDevice,
  useUpdateDevice,
  type UpdateDeviceInput,
} from "../../api/devices";
import { useAppSelector } from "../../store/hooks";
import { selectUser, selectHasRole } from "../../store/slices/authSlice";
import { Role } from "../../types/enums";
import { DeviceType, type Device as DeviceTypeModel } from "../../types/device";
import { AccessDeniedPage } from "../../components/common/AccessDenied"; // Assuming this exists
import { deviceProfileRoute } from "../../router/routeConfigs";

// Define the partial type for the editable form state
type EditableDeviceState = Omit<
  DeviceTypeModel,
  "createdAt" | "updatedAt" | "companyId"
>;

export default function DeviceProfilePage() {
  const params = deviceProfileRoute.useParams();
  const { id } = params;
  const navigate = useNavigate();

  // 🚀 Auth and Query Hooks
  const currentUser = useAppSelector(selectUser);
  const fullState = useAppSelector((state) => state);

  const hasRole = (roles: Role | Role[]) => selectHasRole(fullState, roles);

  const {
    data: device,
    isLoading: isLoadingDevice,
    error: fetchError,
    isError: isFetchError,
  } = useDevice(id);
  const updateDeviceMutation = useUpdateDevice();

  // Local state for the editable form data
  const [formData, setFormData] = useState<EditableDeviceState | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  // 🚀 Initialize formData when device data is successfully fetched
  useEffect(() => {
    if (device) {
      setFormData({
        id: device.id,
        name: device.name,
        serialNumber: device.serialNumber,
        regNumber: device.regNumber ?? "",
        type: device.type,
        // Convert null/undefined numbers to undefined for clean number state
        maxValue: device.maxValue ?? undefined,
        minValue: device.minValue ?? undefined,
        precision: device.precision ?? undefined,
        location: device.location ?? "",
        manufacturer: device.manufacturer ?? "",
        price: device.price ?? undefined,
        parentId: device.parentId ?? null,
        // The original Device type includes all fields, we only care about the editable ones here
      } as EditableDeviceState);
    }
  }, [device]);

  // --- Authorization Checks ---
  const canEdit = hasRole([Role.ADMIN, Role.SUPER_ADMIN]);
  // Check if the device has a 'users' array and if the current user is in it
  const isAssignedToViewer = device?.users?.some(
    (ud: { userId: string }) => ud.userId === currentUser?.id
  );

  // Logic: ADMIN/SUPER_ADMIN can edit. VIEWER can view (but not edit) if assigned. Others get denied.
  const isViewerAssigned =
    currentUser?.role === Role.VIEWER && isAssignedToViewer;
  const isFormDisabled = updateDeviceMutation.isPending || !canEdit;

  // Render Access Denied Guard
  if (
    !isLoadingDevice &&
    !canEdit &&
    currentUser?.role !== Role.VIEWER // Other roles need explicit edit permission
  ) {
    return (
      <AccessDeniedPage message="You do not have permission to view or edit this device." />
    );
  }

  // --- Handlers ---

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value, type } = e.target;
    setLocalError(null); // Clear error on change

    setFormData((prev) => {
      if (!prev) return prev;

      let newValue: any = value;
      // Convert number inputs to actual numbers or undefined if empty
      if (type === "number") {
        newValue = value === "" ? undefined : parseFloat(value);
      } else if (
        (name === "regNumber" ||
          name === "location" ||
          name === "manufacturer" ||
          name === "parentId") &&
        value === ""
      ) {
        // Treat empty optional string as null for the API payload
        newValue = null;
      }

      return { ...prev, [name]: newValue };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData || !device || !canEdit) return; // Prevent submission if not authorized
    setLocalError(null);

    // Filter formData to match UpdateDeviceInput and remove ID
    const { id: deviceId, ...updatePayload } = formData;

    void deviceId; // To avoid unused variable warning

    try {
      await updateDeviceMutation.mutateAsync({
        id: device.id,
        ...(updatePayload as UpdateDeviceInput), // Cast the prepared object
      });

      navigate({ to: "/devices" });
    } catch (err: any) {
      console.error("Failed to update device:", err);
      setLocalError(err.response?.data?.message || "Failed to update device.");
    }
  }

  // --- Render States ---

  if (isLoadingDevice)
    return <div className="p-6 text-center">Loading device details...</div>;

  if (isFetchError || !device) {
    return (
      <div className="p-6 text-red-700 bg-red-100 border border-red-200 rounded-lg">
        Error loading device: {fetchError?.message || "Device not found."}
      </div>
    );
  }

  // If VIEWER is not assigned and device is loaded, they are denied access
  if (currentUser?.role === Role.VIEWER && !isAssignedToViewer) {
    return (
      <AccessDeniedPage message="You can only view devices assigned to you." />
    );
  }

  // --- Render Form ---
  return (
    <div className="max-w-5xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Device Profile: {device.name}</h1>

      {/* Viewer Role Warning */}
      {!canEdit && isViewerAssigned && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md mb-4">
          <p className="text-yellow-800 text-sm">
            ⚠️ You have **Read-Only** access. Only Administrators can update
            device details.
          </p>
        </div>
      )}

      {localError && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-md mb-4">
          <p className="text-red-800 text-sm">
            🛑 **Update Failed:** {localError}
          </p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* Left Column */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Device ID
            </label>
            <input
              type="text"
              value={device.id}
              readOnly
              className="mt-1 w-full bg-gray-100 border border-gray-300 rounded-md p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Device Name
            </label>
            <input
              type="text"
              name="name"
              value={formData?.name ?? ""}
              onChange={handleChange}
              disabled={isFormDisabled}
              required
              className="mt-1 w-full border border-gray-300 rounded-md p-2 disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Serial Number
            </label>
            <input
              type="text"
              name="serialNumber"
              value={formData?.serialNumber ?? ""}
              onChange={handleChange}
              disabled={isFormDisabled}
              required
              className="mt-1 w-full border border-gray-300 rounded-md p-2 disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Registration Number
            </label>
            <input
              type="text"
              name="regNumber"
              value={formData?.regNumber ?? ""}
              onChange={handleChange}
              disabled={isFormDisabled}
              className="mt-1 w-full border border-gray-300 rounded-md p-2 disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Type
            </label>
            <select
              name="type"
              value={formData?.type ?? ""}
              onChange={handleChange}
              disabled={isFormDisabled}
              required
              className="mt-1 w-full border border-gray-300 rounded-md p-2 disabled:bg-gray-50"
            >
              {/* Ensure DeviceType enum values are used here */}
              <option value={DeviceType.SENSOR}>Sensor</option>
              <option value={DeviceType.GATEWAY}>Gateway</option>
            </select>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Min
              </label>
              <input
                type="number"
                name="minValue"
                value={formData?.minValue ?? ""}
                onChange={handleChange}
                disabled={isFormDisabled}
                className="mt-1 w-full border border-gray-300 rounded-md p-2 disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Max
              </label>
              <input
                type="number"
                name="maxValue"
                value={formData?.maxValue ?? ""}
                onChange={handleChange}
                disabled={isFormDisabled}
                className="mt-1 w-full border border-gray-300 rounded-md p-2 disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Precision
              </label>
              <input
                type="number"
                name="precision"
                value={formData?.precision ?? ""}
                onChange={handleChange}
                disabled={isFormDisabled}
                className="mt-1 w-full border border-gray-300 rounded-md p-2 disabled:bg-gray-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData?.location ?? ""}
              onChange={handleChange}
              disabled={isFormDisabled}
              className="mt-1 w-full border border-gray-300 rounded-md p-2 disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Manufacturer
            </label>
            <input
              type="text"
              name="manufacturer"
              value={formData?.manufacturer ?? ""}
              onChange={handleChange}
              disabled={isFormDisabled}
              className="mt-1 w-full border border-gray-300 rounded-md p-2 disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Price
            </label>
            <input
              type="number"
              name="price"
              value={formData?.price ?? ""}
              onChange={handleChange}
              disabled={isFormDisabled}
              className="mt-1 w-full border border-gray-300 rounded-md p-2 disabled:bg-gray-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
            <div>
              Created At:{" "}
              <span className="font-medium">
                {new Date(device.createdAt).toLocaleString()}
              </span>
            </div>
            <div>
              Updated At:{" "}
              <span className="font-medium">
                {new Date(device.updatedAt).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Full-width actions */}
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={isFormDisabled}
            className={`w-full text-white py-2 rounded-md transition ${
              isFormDisabled
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {updateDeviceMutation.isPending ? "Saving..." : "Update Device"}
          </button>
        </div>
      </form>
    </div>
  );
}
