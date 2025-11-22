// src/pages/Analytics/AnalyticsPage.tsx
import { useState } from "react";
import { useAnalyticsCounts } from "../../api/analytics";
import { useCompanies } from "../../api/companies";
import { useAppSelector } from "../../store/hooks";
import { selectUser, selectHasRole, selectActiveCompanyId } from "../../store/slices/authSlice";
import { Role, UserStatus } from "../../types/enums";
import { BarChart3, Users, Cpu, Building2 } from "lucide-react";

export default function AnalyticsPage() {
  const currentUser = useAppSelector(selectUser);
  const fullState = useAppSelector((state) => state);
  const activeCompanyId = useAppSelector(selectActiveCompanyId);
  const hasRole = (roles: Role | Role[]) => selectHasRole(fullState, roles);

  const isSuperAdmin = hasRole(Role.SUPER_ADMIN);

  // Filter states
  const [roleFilter, setRoleFilter] = useState<Role | undefined>();
  const [statusFilter, setStatusFilter] = useState<UserStatus | undefined>();
  const [companyFilter, setCompanyFilter] = useState<string | undefined>(
    isSuperAdmin ? undefined : activeCompanyId || undefined
  );

  // Fetch analytics data
  const { data: counts, isLoading, error } = useAnalyticsCounts({
    role: roleFilter,
    status: statusFilter,
    companyId: companyFilter,
  });

  // Fetch companies for Super Admin filter (only if Super Admin)
  const { data: companiesData } = useCompanies({
    page: 1,
    limit: 1000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md">
          <div className="text-red-600 text-center">
            <p className="font-semibold text-lg mb-2">Error Loading Analytics</p>
            <p className="text-gray-600">{(error as Error).message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          </div>
          <p className="text-gray-600">
            {isSuperAdmin
              ? "System-wide analytics and insights"
              : `Analytics for ${currentUser?.role === Role.ADMIN ? "your company" : "your active company"}`}
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Role Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                value={roleFilter || ""}
                onChange={(e) => setRoleFilter((e.target.value as Role) || undefined)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">All Roles</option>
                <option value={Role.SUPER_ADMIN}>Super Admin</option>
                <option value={Role.ADMIN}>Admin</option>
                <option value={Role.MANAGER}>Manager</option>
                <option value={Role.VIEWER}>Viewer</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={statusFilter || ""}
                onChange={(e) => setStatusFilter((e.target.value as UserStatus) || undefined)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>

            {/* Company Filter (Super Admin only) */}
            {isSuperAdmin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company
                </label>
                <select
                  value={companyFilter || ""}
                  onChange={(e) => setCompanyFilter(e.target.value || undefined)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">All Companies</option>
                  {companiesData?.data.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Count Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Users Card */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 p-3 rounded-lg">
                <Users className="w-8 h-8" />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium opacity-90">Total Users</p>
                <p className="text-4xl font-bold">{counts?.users || 0}</p>
              </div>
            </div>
            <div className="border-t border-white/20 pt-3">
              <p className="text-sm opacity-75">
                {roleFilter ? `Filtered by ${roleFilter}` : "All roles"}
              </p>
            </div>
          </div>

          {/* Devices Card */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 p-3 rounded-lg">
                <Cpu className="w-8 h-8" />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium opacity-90">Total Devices</p>
                <p className="text-4xl font-bold">{counts?.devices || 0}</p>
              </div>
            </div>
            <div className="border-t border-white/20 pt-3">
              <p className="text-sm opacity-75">
                {companyFilter ? "Filtered by company" : "All devices"}
              </p>
            </div>
          </div>

          {/* Companies Card (Super Admin only) */}
          {isSuperAdmin && (
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-lg">
                  <Building2 className="w-8 h-8" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium opacity-90">Total Companies</p>
                  <p className="text-4xl font-bold">{counts?.companies || 0}</p>
                </div>
              </div>
              <div className="border-t border-white/20 pt-3">
                <p className="text-sm opacity-75">Active companies</p>
              </div>
            </div>
          )}
        </div>

        {/* Info Banner */}
        <div className="mt-6 bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <p className="text-blue-800 text-sm">
            ℹ️ {isSuperAdmin
              ? "As a Super Admin, you can view analytics across all companies. Use filters to narrow down the data."
              : `As ${currentUser?.role === Role.ADMIN ? "an Admin" : "a Manager"}, you can view analytics for your active company only.`}
          </p>
        </div>
      </div>
    </div>
  );
}
