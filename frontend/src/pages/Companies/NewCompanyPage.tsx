// src/pages/Companies/NewCompanyPage.tsx
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useCreateCompany, type CreateCompanyInput } from "../../api/companies";
import { useAuth } from "../../contexts/AuthContext";
import { Role, getRoleLabel } from "../../types/enums";

export default function NewCompanyPage() {
  const navigate = useNavigate();
  const createCompanyMutation = useCreateCompany();
  const { user: currentUser, hasRole } = useAuth();

  const [formData, setFormData] = useState<CreateCompanyInput>({
    name: "",
    address: "",
    pinCode: "",
    status: "",
  });

  const [error, setError] = useState<string | null>(null);

  // Check if user has permission to access this page
  if (!hasRole([Role.ADMIN, Role.SUPER_ADMIN])) {
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
            Only ADMIN and SUPER_ADMIN users can create companies.
          </p>
          <button
            onClick={() => navigate({ to: "/companies" })}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Companies
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      await createCompanyMutation.mutateAsync(formData);
      navigate({ to: "/companies" });
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to create company";
      setError(errorMessage);
      console.error("Failed to create company:", err);
    }
  }

  /* MOCK SUBMIT - COMMENTED OUT
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await new Promise((res) => setTimeout(res, 500));
      console.log("Submitted company:", formData);
      navigate({ to: "/companies" });
    } catch (err) {
      console.error("Failed to add company:", err);
      alert("Failed to add company.");
    } finally {
      setLoading(false);
    }
  }
  */

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Add New Company</h1>
        <p className="text-sm text-gray-600 mt-1">
          Creating as: <span className="font-medium">{currentUser?.name}</span>{" "}
          ({getRoleLabel(currentUser?.role || Role.ADMIN)})
        </p>
      </div>

      {/* Info banner for ADMIN */}
      {currentUser?.role === Role.ADMIN && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-800 text-sm">
            ℹ️ You will be automatically assigned to this company once created.
            It will be set as your primary company if it's your first one.
          </p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* Left column */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              required
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Acme Corporation"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 123 Industrial Drive"
            />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Pin Code
            </label>
            <input
              type="text"
              name="pinCode"
              value={formData.pinCode}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 400001"
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
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>

          <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
            <p className="font-medium mb-1">Auto-generated Fields</p>
            <p>
              Created At and Updated At will be set automatically by the system.
            </p>
          </div>
        </div>

        {/* Submit buttons full width */}
        <div className="md:col-span-2 flex gap-3">
          <button
            type="button"
            onClick={() => navigate({ to: "/companies" })}
            className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createCompanyMutation.isPending}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {createCompanyMutation.isPending ? "Creating..." : "Create Company"}
          </button>
        </div>
      </form>
    </div>
  );
}
