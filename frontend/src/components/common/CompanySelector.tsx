// src/components/common/CompanySelector.tsx
import { useState } from "react";
import { useCompanies } from "../../api/companies";
import { Search, X } from "lucide-react";

interface CompanySelectorProps {
  selectedCompanyIds: string[];
  onChange: (companyIds: string[]) => void;
  multiple?: boolean;
  required?: boolean;
  disabled?: boolean;
  label?: string;
}

export function CompanySelector({
  selectedCompanyIds,
  onChange,
  multiple = false,
  required = false,
  disabled = false,
  label = "Company",
}: CompanySelectorProps) {
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const { data, isLoading } = useCompanies({
    page: 1,
    limit: 50,
    search,
  });

  const companies = data?.data || [];

  const selectedCompanies = companies.filter((c) =>
    selectedCompanyIds.includes(c.id)
  );

  const handleSelect = (companyId: string) => {
    if (multiple) {
      if (selectedCompanyIds.includes(companyId)) {
        onChange(selectedCompanyIds.filter((id) => id !== companyId));
      } else {
        onChange([...selectedCompanyIds, companyId]);
      }
    } else {
      onChange([companyId]);
      setShowDropdown(false);
    }
  };

  const handleRemove = (companyId: string) => {
    onChange(selectedCompanyIds.filter((id) => id !== companyId));
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {/* Selected Companies Display */}
      {selectedCompanies.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedCompanies.map((company) => (
            <span
              key={company.id}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
            >
              {company.name}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(company.id)}
                  className="hover:bg-blue-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          disabled={disabled}
          placeholder={
            multiple ? "Search and select companies..." : "Search company..."
          }
          className={`w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
            disabled ? "bg-gray-100 cursor-not-allowed" : ""
          }`}
        />
      </div>

      {/* Dropdown */}
      {showDropdown && !disabled && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />

          {/* Dropdown Menu */}
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : companies.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No companies found
              </div>
            ) : (
              companies.map((company) => {
                const isSelected = selectedCompanyIds.includes(company.id);
                return (
                  <button
                    key={company.id}
                    type="button"
                    onClick={() => handleSelect(company.id)}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center justify-between ${
                      isSelected ? "bg-blue-50" : ""
                    }`}
                  >
                    <span className={isSelected ? "font-medium" : ""}>
                      {company.name}
                    </span>
                    {isSelected && (
                      <span className="text-blue-600 text-sm">✓</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </>
      )}

      {required && selectedCompanyIds.length === 0 && (
        <p className="mt-1 text-xs text-red-500">Company is required</p>
      )}
    </div>
  );
}
