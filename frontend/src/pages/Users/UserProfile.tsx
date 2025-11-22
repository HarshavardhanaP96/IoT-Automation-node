// src/pages/Users/UserProfile.tsx (with role-based permissions)
import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useUser, useUpdateUser, useDeleteUser } from "../../api/users";
import { useAppSelector } from "../../store/hooks";
import {
  selectUser,
  selectCanUpdateUser,
  selectCanDeleteUser,
} from "../../store/slices/authSlice";
import {
  Role,
  UserStatus,
  getRoleLabel,
  getStatusLabel,
} from "../../types/enums";
import type { UpdateUserInput } from "../../types/user";
import { userProfileRoute } from "../../router/routeConfigs";
import { CompanySelector } from "../../components/common/CompanySelector";
import { DeviceSelector } from "../../components/common/DeviceSelector";

export default function UserProfile() {
  const params = userProfileRoute.useParams();
  const { id } = params;
  const navigate = useNavigate();
  const currentUser = useAppSelector(selectUser);

  const fullState = useAppSelector((state) => state);

  const canUpdateUser = (role: Role) => selectCanUpdateUser(fullState, role);

  const canDeleteUser = (role: Role) => selectCanDeleteUser(fullState, role);

  const { data: user, isLoading, error } = useUser(id);
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  const [formData, setFormData] = useState<UpdateUserInput>({});
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Check permissions
  const canEdit = user ? canUpdateUser(user.role) : false;
  const canDelete = user ? canDeleteUser(user.role) : false;
  const isOwnProfile = currentUser?.id === id;

  // Initialize form data when user loads
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        phoneNumber: user.phoneNumber,
        role: user.role,
        status: user.status,
        position: user.position,
        companyIds: user.companies?.map((c) => c.id) || [],
        deviceIds: user.devices?.map((d) => d.id) || [],
      });
    }
  }, [user]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setUpdateError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setUpdateError(null);

    if (!canEdit) {
      setUpdateError("You do not have permission to update this user.");
      return;
    }

    // Validate company requirement for MANAGER and VIEWER
    if (
      (formData.role === Role.MANAGER || formData.role === Role.VIEWER) &&
      (!formData.companyIds || formData.companyIds.length === 0)
    ) {
      setUpdateError(
        `${getRoleLabel(formData.role)} users must be assigned to at least one company.`
      );
      return;
    }

    // Validate device requirement for VIEWER
    if (
      user &&
      (formData.role === Role.VIEWER || user.role === Role.VIEWER) &&
      (!formData.deviceIds || formData.deviceIds.length === 0)
    ) {
      setUpdateError("VIEWER users must have at least one device assigned.");
      return;
    }

    try {
      await updateUserMutation.mutateAsync({ id, ...formData });
      navigate({ to: "/users" });
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to update user";
      setUpdateError(errorMessage);
      console.error("Failed to update user:", err);
    }
  }

  async function handleDelete() {
    if (!canDelete) {
      setUpdateError("You do not have permission to delete this user.");
      setShowDeleteConfirm(false);
      return;
    }

    if (isOwnProfile) {
      setUpdateError("You cannot delete your own account.");
      setShowDeleteConfirm(false);
      return;
    }

    try {
      await deleteUserMutation.mutateAsync(id);
      navigate({ to: "/users" });
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to delete user";
      setUpdateError(errorMessage);
      console.error("Failed to delete user:", err);
    } finally {
      setShowDeleteConfirm(false);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="max-w-5xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <div className="text-red-600 text-center">
          <p className="font-semibold text-lg mb-2">Error Loading User</p>
          <p className="text-gray-600">
            {(error as Error)?.message || "User not found"}
          </p>
          <button
            onClick={() => navigate({ to: "/users" })}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {canEdit ? "Edit User" : "View User"}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Viewing as: <span className="font-medium">{currentUser?.name}</span>{" "}
            ({getRoleLabel(currentUser?.role || Role.VIEWER)})
          </p>
        </div>

        {/* Show delete button only if user has permission and not own profile */}
        {canDelete && !isOwnProfile && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
          >
            Delete User
          </button>
        )}
      </div>

      {/* Permission warnings */}
      {!canEdit && !isOwnProfile && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-800 text-sm">
            ⚠️ You can only view this user's information. You do not have
            permission to edit.
          </p>
        </div>
      )}

      {isOwnProfile && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-800 text-sm">
            ℹ️ This is your profile. Some fields may be restricted.
          </p>
        </div>
      )}

      {updateError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm">{updateError}</p>
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
              User ID
            </label>
            <input
              type="text"
              value={user.id}
              readOnly
              className="mt-1 block w-full bg-gray-100 border border-gray-300 rounded-md p-2 text-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name || ""}
              onChange={handleChange}
              disabled={!canEdit}
              className={`mt-1 block w-full border border-gray-300 rounded-md p-2 ${
                canEdit
                  ? "focus:ring-blue-500 focus:border-blue-500"
                  : "bg-gray-100 text-gray-600"
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={user.email}
              readOnly
              className="mt-1 block w-full bg-gray-100 border border-gray-300 rounded-md p-2 text-gray-600"
            />
            <p className="mt-1 text-xs text-gray-500">
              Email cannot be changed
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber || ""}
              onChange={handleChange}
              disabled={!canEdit}
              className={`mt-1 block w-full border border-gray-300 rounded-md p-2 ${
                canEdit
                  ? "focus:ring-blue-500 focus:border-blue-500"
                  : "bg-gray-100 text-gray-600"
              }`}
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Role
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={!canEdit}
              className={`mt-1 block w-full border border-gray-300 rounded-md p-2 ${
                canEdit
                  ? "focus:ring-blue-500 focus:border-blue-500"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {availableRoles.map((role) => (
                <option key={role} value={role}>
                  {getRoleLabel(role)}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Current: {getRoleLabel(user.role)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Position
            </label>
            <input
              type="text"
              name="position"
              value={formData.position || ""}
              onChange={handleChange}
              disabled={!canEdit}
              className={`mt-1 block w-full border border-gray-300 rounded-md p-2 ${
                canEdit
                  ? "focus:ring-blue-500 focus:border-blue-500"
                  : "bg-gray-100 text-gray-600"
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              disabled={!canEdit}
              className={`mt-1 block w-full border border-gray-300 rounded-md p-2 ${
                canEdit
                  ? "focus:ring-blue-500 focus:border-blue-500"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              <option value={UserStatus.ADDED}>Added</option>
              <option value={UserStatus.VALIDATED}>Validated</option>
              <option value={UserStatus.SUSPENDED}>Suspended</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Current: {getStatusLabel(user.status)}
            </p>
          </div>

          <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-600">
            <p className="mb-1">
              <span className="font-medium">Created:</span>{" "}
              {new Date(user.createdAt).toLocaleString()}
            </p>
            <p>
              <span className="font-medium">Updated:</span>{" "}
              {new Date(user.updatedAt).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Company Management - Full Width */}
        <div className="md:col-span-2">
          <CompanySelector
            selectedCompanyIds={formData.companyIds || []}
            onChange={(companyIds) =>
              setFormData((prev) => ({ ...prev, companyIds }))
            }
            multiple={true}
            required={
              formData.role === Role.MANAGER || formData.role === Role.VIEWER
            }
            disabled={!canEdit}
            label="Assigned Companies"
          />
          {(formData.role === Role.MANAGER ||
            formData.role === Role.VIEWER) && (
            <p className="mt-1 text-xs text-gray-500">
              {getRoleLabel(formData.role)} users must have at least one
              company assigned.
            </p>
          )}
        </div>

        {/* Devices Management - Full Width */}
        <div className="md:col-span-2">
          {canEdit ? (
            <>
              <DeviceSelector
                selectedDeviceIds={formData.deviceIds || []}
                onChange={(deviceIds) =>
                  setFormData((prev) => ({ ...prev, deviceIds }))
                }
                multiple={true}
                required={formData.role === Role.VIEWER}
                disabled={!canEdit}
                label="Assigned Devices"
              />
              {formData.role === Role.VIEWER && (
                <p className="mt-1 text-xs text-gray-500">
                  VIEWER users must have at least one device assigned.
                </p>
              )}
            </>
          ) : (
            user.devices && user.devices.length > 0 && (
              <>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigned Devices
                </label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {user.devices.map((device) => (
                      <div
                        key={device.id}
                        className="flex items-center justify-between bg-white p-3 rounded-md border border-gray-200"
                      >
                        <div>
                          <p className="font-medium text-sm">{device.name}</p>
                          <p className="text-xs text-gray-500">
                            SN: {device.serialNumber}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )
          )}
        </div>

        {/* Companies Display (Read-only view) */}
        {user.companies && user.companies.length > 0 && !canEdit && (
          <div className="md:col-span-2 bg-blue-50 p-4 rounded-md">
            <p className="font-medium text-sm text-gray-700 mb-2">
              Assigned Companies:
            </p>
            <div className="flex flex-wrap gap-2">
              {user.companies.map((company) => (
                <span
                  key={company.id}
                  className="px-3 py-1 bg-white border border-blue-200 rounded-full text-sm"
                >
                  {company.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="md:col-span-2 flex gap-3">
          <button
            type="button"
            onClick={() => navigate({ to: "/users" })}
            className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition"
          >
            Back
          </button>

          {canEdit && (
            <button
              type="submit"
              disabled={updateUserMutation.isPending}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
            </button>
          )}
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md">
            <h3 className="text-lg font-bold mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete user <strong>{user.name}</strong>?
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteUserMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-400"
              >
                {deleteUserMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
