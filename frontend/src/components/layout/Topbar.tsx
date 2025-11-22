import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from '@tanstack/react-router';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { LogOut, User, Menu } from 'lucide-react';
import { 
  selectUser, 
  logout, 
} from '../../store/slices/authSlice';

interface TopbarProps {
  onMenuClick?: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);

  const handleLogout = () => {
    dispatch(logout());
    navigate({ to: '/login' });
  };

  const handleProfileClick = () => {
    navigate({ to: '/profile' as any });
  };

  return (
    <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200 w-full z-10">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-md hover:bg-gray-100 text-gray-600 transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm shadow-blue-200">
              S
            </div>
            <span className="font-bold text-gray-900 text-lg tracking-tight">SilTech</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger className="flex items-center gap-3 outline-none group">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.role}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-gray-100 border-2 border-white shadow-sm flex items-center justify-center text-gray-600 group-hover:border-blue-100 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
              <User className="w-5 h-5" />
            </div>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content className="min-w-[200px] bg-white rounded-lg shadow-lg border border-gray-100 p-1 z-50 mr-4 animate-in fade-in zoom-in-95 duration-100" align="end" sideOffset={5}>
              <DropdownMenu.Item 
                onClick={handleProfileClick}
                className="flex items-center gap-2 px-2 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50 cursor-pointer outline-none"
              >
                <User className="w-4 h-4" />
                Profile
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="h-px bg-gray-100 my-1" />
              <DropdownMenu.Item 
                onClick={handleLogout}
                className="flex items-center gap-2 px-2 py-2 rounded-md text-sm text-red-600 hover:bg-red-50 cursor-pointer outline-none"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
