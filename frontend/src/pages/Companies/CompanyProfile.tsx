// src/pages/Companies/CompanyProfile.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  useCompany,
  useUpdateCompany,
  useDeleteCompany,
  type UpdateCompanyInput,
} from "../../api/companies";
import { useAuth } from "../../contexts/AuthContext";
import { Role, getRoleLabel } from "../../types/enums";
import { companyProfileRoute } from "../../router/routeConfigs";

export default function CompanyProfile() {
  const params = companyProfileRoute.useParams();
  const { id } = params;
  const navigate = useNavigate();
  const { user: currentUser, hasRole } = useAuth();

  const { data: company, isLoading, error } = useCompany(id);
  const updateCompanyMutation = useUpdateCompany();
  const deleteCompanyMutation = useDeleteCompany();

  const [formData, setFormData] = useState<UpdateCompanyInput>({});
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Check permissions
  // SUPER_ADMIN can edit/delete any company
  // ADMIN can only edit/delete companies they're assigned to (checked by backend)
  const canEdit = hasRole([Role.ADMIN, Role.SUPER_ADMIN]);
  const canDelete = hasRole([Role.ADMIN, Role.SUPER_ADMIN]);

  // Initialize form data when company loads
  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name,
        address: company.address,
        pinCode: company.pinCode,
        status: company.status,
      });
    }
  }, [company]);

  /* MOCK DATA - COMMENTED OUT
  useEffect(() => {
    async function fetchCompany() {
      setLoading(true);
      await new Promise((res) => setTimeout(res, 800));
      const dummyCompany = {
        id: "111e4567-e89b-12d3-a456-426614174000",
        name: "Acme Corporation",
        address: "123 Industrial Drive, Metropolis",
        pinCode: "400001",
        status: "ACTIVE",
        createdAt: new Date("2024-02-01T09:00:00Z").toISOString(),
        updatedAt: new Date("2024-10-10T12:30:00Z").toISOString(),
      };
      setCompany(dummyCompany);
      setLoading(false);
    }
    fetchCompany();
  }, [id]);
  */

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
      setUpdateError("You do not have permission to update this company.");
      return;
    }

    try {
      await updateCompanyMutation.mutateAsync({ id, ...formData });
      navigate({ to: "/companies" });
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to update company";
      setUpdateError(errorMessage);
      console.error("Failed to update company:", err);
    }
  }

  async function handleDelete() {
    if (!canDelete) {
      setUpdateError("You do not have permission to delete this company.");
      setShowDeleteConfirm(false);
      return;
    }

    try {
      await deleteCompanyMutation.mutateAsync(id);
      navigate({ to: "/companies" });
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to delete company";
      setUpdateError(errorMessage);
      console.error("Failed to delete company:", err);
    } finally {
      setShowDeleteConfirm(false);
    }
  }

  // Check if user has permission to view this page
  if (!hasRole([Role.ADMIN, Role.SUPER_ADMIN])) {
    return (
      <div className="max-w-5xl mx-auto bg-white p-6 rounded-lg shadow-md">
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
            Only ADMIN and SUPER_ADMIN users can view company details.
          </p>
          <button
            onClick={() => navigate({ to: "/" })}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="max-w-5xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <div className="text-red-600 text-center">
          <p className="font-semibold text-lg mb-2">Error Loading Company</p>
          <p className="text-gray-600">
            {(error as Error)?.message || "Company not found"}
          </p>
          <button
            onClick={() => navigate({ to: "/companies" })}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Companies
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
            {canEdit ? "Edit Company" : "View Company"}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Viewing as: <span className="font-medium">{currentUser?.name}</span>{" "}
            ({getRoleLabel(currentUser?.role || Role.ADMIN)})
          </p>
        </div>

        {/* Show delete button only if user has permission */}
        {canDelete && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
          >
            Delete Company
          </button>
        )}
      </div>

      {/* Permission warning for ADMIN */}
      {currentUser?.role === Role.ADMIN && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-800 text-sm">
            ℹ️ As an Admin, you can only edit companies you're assigned to. The
            backend will verify your access.
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
              Company ID
            </label>
            <input
              type="text"
              value={company.id}
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
              Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address || ""}
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
              Pin Code
            </label>
            <input
              type="text"
              name="pinCode"
              value={formData.pinCode || ""}
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
              value={formData.status || ""}
              onChange={handleChange}
              disabled={!canEdit}
              className={`mt-1 block w-full border border-gray-300 rounded-md p-2 ${
                canEdit
                  ? "focus:ring-blue-500 focus:border-blue-500"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              <option value="">Select Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>

          <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-600">
            <p className="mb-1">
              <span className="font-medium">Created:</span>{" "}
              {new Date(company.createdAt).toLocaleString()}
            </p>
            <p>
              <span className="font-medium">Updated:</span>{" "}
              {new Date(company.updatedAt).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="md:col-span-2 flex gap-3">
          <button
            type="button"
            onClick={() => navigate({ to: "/companies" })}
            className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition"
          >
            Back
          </button>

          {canEdit && (
            <button
              type="submit"
              disabled={updateCompanyMutation.isPending}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {updateCompanyMutation.isPending ? "Saving..." : "Save Changes"}
            </button>
          )}
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md">
            <h3 className="text-lg font-bold mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-2">
              Are you sure you want to delete company{" "}
              <strong>{company.name}</strong>?
            </p>
            <p className="text-red-600 text-sm mb-6">
              ⚠️ This action cannot be undone. The company cannot be deleted if
              it has devices or users assigned.
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
                disabled={deleteCompanyMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-400"
              >
                {deleteCompanyMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
