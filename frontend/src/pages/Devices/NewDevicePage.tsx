import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
// 🚀 New Imports
import { useAuth } from "../../contexts/AuthContext";
import { useCreateDevice, type CreateDeviceInput } from "../../api/devices";
import { Role } from "../../types/enums";
import { DeviceType } from "../../types/device";
import { AccessDeniedPage } from "../../components/common/AccessDenied"; // Assuming you have this component

// Define the shape for the form data to ensure type safety,
// matching the backend expected structure for creating a device.
// The initial state uses 'undefined' for optional number fields.

export default function NewDevicePage() {
  const navigate = useNavigate();
  // 🚀 Auth and Mutation Hooks
  const { user: currentUser, hasRole, activeCompanyId } = useAuth();
  const createDeviceMutation = useCreateDevice();

  // 🚀 State for form data and local error
  const [formData, setFormData] = useState<CreateDeviceInput>({
    name: "",
    serialNumber: "",
    regNumber: "",
    // Initialize type with a default enum value
    type: DeviceType.SENSOR,
    // REQUIRED: Get company ID from the context
    companyId: activeCompanyId || "",
    // Number fields should be initialized to undefined/null for empty state in TS
    maxValue: undefined,
    minValue: undefined,
    precision: undefined,
    location: "",
    manufacturer: "",
    price: undefined,
    // Optional parent ID
    parentId: null,
  });
  const [error, setError] = useState<string | null>(null);

  // 🚀 Access Control Guard
  // Only allow ADMIN and SUPER_ADMIN roles to access this page
  if (!hasRole([Role.ADMIN, Role.SUPER_ADMIN])) {
    return <AccessDeniedPage />;
  }

  // 🚀 Update handleChange to handle number conversion and reset error
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value, type } = e.target;
    setError(null); // Clear error on change

    setFormData((prev) => {
      let newValue: any = value;
      // Convert number inputs to actual numbers or undefined if empty
      if (type === "number") {
        newValue = value === "" ? undefined : parseFloat(value);
      }

      return { ...prev, [name]: newValue };
    });
  }

  // 🚀 Refactored handleSubmit using the mutation hook
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); // Clear previous errors

    // 🚀 Company ID Requirement Check
    if (!formData.companyId) {
      setError("Active company is required. Please set it in the header.");
      return;
    }

    // Convert null parentId string to null if needed (though it should be `null` initially)
    const dataToSubmit = {
      ...formData,
      parentId: formData.parentId === "" ? null : formData.parentId,
    };

    try {
      // Use the tanstack-query mutation hook
      await createDeviceMutation.mutateAsync(dataToSubmit as CreateDeviceInput);
      navigate({ to: "/devices" });
    } catch (err: any) {
      // Handle error from the backend (assuming an axios-like response structure)
      console.error("Failed to add device:", err);
      setError(
        err.response?.data?.message ||
          "Failed to create device. Check console for details."
      );
    }
  }

  // Use the loading state from the mutation hook
  const loading = createDeviceMutation.isPending;
  const isFormDisabled = loading || !activeCompanyId; // Disable if loading or no active company

  return (
    <div className="max-w-5xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Add New Device</h1>

      {/* 🚀 Info banner for ADMIN when companyId is missing */}
      {currentUser?.role === Role.ADMIN && !activeCompanyId && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md mb-4">
          <p className="text-yellow-800 text-sm">
            ⚠️ **Please set an active company** in the header to create devices.
          </p>
        </div>
      )}

      {/* 🚀 Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-md mb-4">
          <p className="text-red-800 text-sm">🛑 {error}</p>
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
              Device Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={isFormDisabled}
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
              value={formData.serialNumber}
              onChange={handleChange}
              required
              disabled={isFormDisabled}
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
              value={formData.regNumber}
              onChange={handleChange}
              disabled={isFormDisabled}
              className="mt-1 w-full border border-gray-300 rounded-md p-2 disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Device Type
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              disabled={isFormDisabled}
              className="mt-1 w-full border border-gray-300 rounded-md p-2 disabled:bg-gray-50"
            >
              {/* <option value="">Select Type</option> REMOVED, default to SENSOR */}
              <option value={DeviceType.SENSOR}>Sensor</option>
              <option value={DeviceType.CONTROLLER}>Controller</option>
              <option value={DeviceType.GATEWAY}>Gateway</option>
            </select>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Min Value
              </label>
              <input
                type="number"
                name="minValue"
                value={formData.minValue === undefined ? "" : formData.minValue}
                onChange={handleChange}
                disabled={isFormDisabled}
                className="mt-1 w-full border border-gray-300 rounded-md p-2 disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Max Value
              </label>
              <input
                type="number"
                name="maxValue"
                value={formData.maxValue === undefined ? "" : formData.maxValue}
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
                value={
                  formData.precision === undefined ? "" : formData.precision
                }
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
              value={formData.location}
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
              value={formData.manufacturer}
              onChange={handleChange}
              disabled={isFormDisabled}
              className="mt-1 w-full border border-gray-300 rounded-md p-2 disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Price (USD)
            </label>
            <input
              type="number"
              name="price"
              value={formData.price === undefined ? "" : formData.price}
              onChange={handleChange}
              disabled={isFormDisabled}
              className="mt-1 w-full border border-gray-300 rounded-md p-2 disabled:bg-gray-50"
            />
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
            {loading ? "Saving..." : "Add Device"}
          </button>
        </div>
      </form>
    </div>
  );
}
