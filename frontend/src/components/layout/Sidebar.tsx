import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useSelector } from "react-redux";
import { Users, Monitor, Building2, ArrowRightLeft, BarChart3 } from "lucide-react";
import { selectUser } from "../../store/slices/authSlice";
import { Role } from "../../types/enums";
import CompanySwitcherDialog from "./CompanySwitcherDialog";

export default function Sidebar() {
  const user = useSelector(selectUser);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

  // Define all navigation items
  const allNavItems = [
    // { name: "Dashboard", path: "/", icon: LayoutDashboard, roles: [Role.VIEWER, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN] },
    { name: "Users", path: "/users", icon: Users, roles: [Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN] },
    { name: "Devices", path: "/devices", icon: Monitor, roles: [Role.VIEWER, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN] },
    { name: "Companies", path: "/companies", icon: Building2, roles: [Role.ADMIN, Role.SUPER_ADMIN] },
    { name: "Analytics", path: "/analytics", icon: BarChart3, roles: [Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN] },
  ];

  // Filter navigation items based on user role
  const navItems = allNavItems.filter(item => 
    user?.role && item.roles.includes(user.role)
  );

  return (
    <>
      <nav className="flex flex-col h-full border-r border-gray-100 bg-white">
        <div className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              activeProps={{
                className: "bg-blue-50 text-blue-600 font-medium",
              }}
              inactiveProps={{
                className: "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group"
            >
              {({ isActive }) => (
                <>
                  <item.icon 
                    className={`w-5 h-5 transition-colors ${
                      isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"
                    }`} 
                  />
                  <span>{item.name}</span>
                </>
              )}
            </Link>
          ))}
        </div>

        {/* Company Switcher - Bottom of Sidebar - Show for ADMIN and SUPER_ADMIN */}
        {(user?.role === Role.ADMIN || user?.role === Role.SUPER_ADMIN) && (
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={() => setIsSwitcherOpen(true)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 group"
            >
              <ArrowRightLeft className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
              <span className="font-medium">Switch Company</span>
            </button>
          </div>
        )}
      </nav>

      <CompanySwitcherDialog 
        open={isSwitcherOpen} 
        onOpenChange={setIsSwitcherOpen} 
      />
    </>
  );
}
