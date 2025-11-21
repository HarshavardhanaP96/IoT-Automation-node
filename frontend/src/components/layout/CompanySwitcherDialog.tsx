import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as Dialog from '@radix-ui/react-dialog';
import { Search, Building2, Check, X } from 'lucide-react';
import { useCompanies } from '../../api/companies';
import { selectActiveCompanyId, setActiveCompanyId } from '../../store/slices/authSlice';

interface CompanySwitcherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CompanySwitcherDialog({ open, onOpenChange }: CompanySwitcherDialogProps) {
  const dispatch = useDispatch();
  const activeCompanyId = useSelector(selectActiveCompanyId);
  const [search, setSearch] = useState('');
  
  // Fetch companies with search
  const { data: companiesData, isLoading } = useCompanies({
    page: 1,
    limit: 50, // Fetch enough to scroll
    search: search,
  });

  const companies = companiesData?.data || [];

  const handleSelectCompany = (companyId: string) => {
    dispatch(setActiveCompanyId(companyId));
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white p-0 shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-gray-100">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              Switch Company
            </Dialog.Title>
            <Dialog.Close className="rounded-full p-1.5 hover:bg-gray-100 text-gray-500 transition-colors outline-none">
              <X className="w-4 h-4" />
            </Dialog.Close>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search companies..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                autoFocus
              />
            </div>
          </div>

          {/* List */}
          <div className="max-h-[300px] overflow-y-auto p-2">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-gray-500">Loading companies...</div>
            ) : companies.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">No companies found</div>
            ) : (
              <div className="space-y-1">
                {companies.map((company) => (
                  <button
                    key={company.id}
                    onClick={() => handleSelectCompany(company.id)}
                    className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors ${
                      activeCompanyId === company.id
                        ? 'bg-blue-50 border border-blue-100'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div className={`mt-1 w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${
                      activeCompanyId === company.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className={`text-sm font-semibold truncate ${
                          activeCompanyId === company.id ? 'text-blue-900' : 'text-gray-900'
                        }`}>
                          {company.name}
                        </p>
                        {activeCompanyId === company.id && (
                          <Check className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {company.address || 'No address provided'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="px-6 py-3 bg-gray-50 rounded-b-xl border-t border-gray-100 text-xs text-gray-500 text-center">
            Showing results for "{search || 'all'}"
          </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
