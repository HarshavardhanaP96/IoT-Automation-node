// src/pages/Users/NewUserPage.tsx (with role-based restrictions)
import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useCreateUser } from "../../api/users";
import { useAppSelector } from "../../store/hooks";
import {
  selectUser,
  selectCanCreateUser,
  selectHasRole,
  selectActiveCompanyId,
} from "../../store/slices/authSlice";
import { Role, getRoleLabel } from "../../types/enums";
import type { CreateUserInput } from "../../types/user";
import { CompanySelector } from "../../components/common/CompanySelector";
import { DeviceSelector } from "../../components/common/DeviceSelector";

export default function NewUserPage() {
  const navigate = useNavigate();
  const createUserMutation = useCreateUser();
  const currentUser = useAppSelector(selectUser);
  const authState = useAppSelector((state) => state);
  const activeCompanyId = useAppSelector(selectActiveCompanyId);

  const canCreateUser = (role: Role) => selectCanCreateUser(authState, role);

  const hasRole = (roles: Role | Role[]) => selectHasRole(authState, roles);

  const [formData, setFormData] = useState<CreateUserInput>({
    name: "",
    email: "",
    password: "",
    phoneNumber: "",
    role: Role.VIEWER,
    position: "",
    companyIds: [],
    deviceIds: [],
  });

  const [error, setError] = useState<string | null>(null);

  // Check if user has permission to access this page
  if (!hasRole([Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN])) {
    return (
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
            You do not have permission to create users.
          </p>
          <button
            onClick={() => navigate({ to: "/users" })}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  }

  // Auto-populate company for ADMIN users when creating MANAGER/VIEWER
  useEffect(() => {
    if (
      currentUser?.role === Role.ADMIN &&
      activeCompanyId &&
      (formData.role === Role.MANAGER || formData.role === Role.VIEWER)
    ) {
      setFormData((prev) => ({ ...prev, companyIds: [activeCompanyId] }));
    }
  }, [formData.role, currentUser?.role, activeCompanyId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validate if current user can create this role
    if (!canCreateUser(formData.role)) {
      setError(
        `You do not have permission to create ${getRoleLabel(
          formData.role
        )} users.`
      );
      return;
    }

    // Validate company requirement for MANAGER and VIEWER
    if (
      (formData.role === Role.MANAGER || formData.role === Role.VIEWER) &&
      (!formData.companyIds || formData.companyIds.length === 0)
    ) {
      setError(
        `${getRoleLabel(
          formData.role
        )} users must be assigned to at least one company.`
      );
      return;
    }

    // Validate device requirement for VIEWER
    if (
      formData.role === Role.VIEWER &&
      (!formData.deviceIds || formData.deviceIds.length === 0)
    ) {
      setError("VIEWER users must have at least one device assigned.");
      return;
    }

    try {
      await createUserMutation.mutateAsync(formData);
      navigate({ to: "/users" });
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to create user";
      setError(errorMessage);
      console.error("Failed to create user:", err);
    }
  }

  // Get available roles based on current user's permissions
  const getAvailableRoles = () => {
    if (!currentUser) return [];

    switch (currentUser.role) {
      case Role.SUPER_ADMIN:
        return [Role.VIEWER, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN];
      case Role.ADMIN:
        return [Role.VIEWER, Role.MANAGER];
      case Role.MANAGER:
        return [Role.VIEWER];
      default:
        return [];
    }
  };

  const availableRoles = getAvailableRoles();

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Add New User</h1>
        <p className="text-sm text-gray-600 mt-1">
          Creating as: <span className="font-medium">{currentUser?.name}</span>{" "}
          ({getRoleLabel(currentUser?.role || Role.VIEWER)})
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm">{error}</p>
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
              Name <span className="text-red-500">*</span>
            </label>
            <input
              required
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              required
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              required
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              minLength={8}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">Minimum 8 characters</p>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {availableRoles.map((role) => (
                <option key={role} value={role}>
                  {getRoleLabel(role)}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              You can create:{" "}
              {availableRoles.map((r) => getRoleLabel(r)).join(", ")}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Position
            </label>
            <input
              type="text"
              name="position"
              value={formData.position}
              onChange={handleChange}
              placeholder="e.g., Operations Manager"
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Company Selection - Full Width */}
        {(formData.role === Role.MANAGER || formData.role === Role.VIEWER) && (
          <div className="md:col-span-2">
            {currentUser?.role === Role.SUPER_ADMIN ? (
              <CompanySelector
                selectedCompanyIds={formData.companyIds || []}
                onChange={(companyIds) =>
                  setFormData((prev) => ({ ...prev, companyIds }))
                }
                multiple={true}
                required={true}
                label="Companies"
              />
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company <span className="text-red-500">*</span>
                </label>
                <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                  ℹ️ Company will be automatically assigned from your active
                  company
                </div>
              </div>
            )}
          </div>
        )}

        {/* Device Selection - Full Width */}
        <div className="md:col-span-2">
          <DeviceSelector
            selectedDeviceIds={formData.deviceIds || []}
            onChange={(deviceIds) =>
              setFormData((prev) => ({ ...prev, deviceIds }))
            }
            multiple={true}
            required={formData.role === Role.VIEWER}
            label="Assigned Devices"
          />
          {formData.role === Role.VIEWER && (
            <p className="mt-1 text-xs text-gray-500">
              VIEWER users must have at least one device assigned.
            </p>
          )}
        </div>

        <div className="md:col-span-2">
          <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
            <p className="font-medium mb-1">Initial Status</p>
            <p>
              New users will be created with{" "}
              <span className="font-medium text-gray-700">ADDED</span> status
            </p>
          </div>
        </div>

        {/* Permission Info Banner */}
        {currentUser?.role === Role.MANAGER && (
          <div className="md:col-span-2 bg-blue-50 border border-blue-200 p-4 rounded-md">
            <p className="text-blue-800 text-sm">
              ℹ️ As a Manager, you can only create Viewer users.
            </p>
          </div>
        )}

        {currentUser?.role === Role.ADMIN && (
          <div className="md:col-span-2 bg-blue-50 border border-blue-200 p-4 rounded-md">
            <p className="text-blue-800 text-sm">
              ℹ️ As an Admin, you can create Manager and Viewer users.
            </p>
          </div>
        )}

        {/* Full Width Buttons */}
        <div className="md:col-span-2 flex gap-3">
          <button
            type="button"
            onClick={() => navigate({ to: "/users" })}
            className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createUserMutation.isPending}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {createUserMutation.isPending ? "Creating..." : "Create User"}
          </button>
        </div>
      </form>
    </div>
  );
}
