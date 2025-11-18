import { useState } from "react";
import Topbar from "./Topbar";
import Sidebar from "./Sidebar";
import { Outlet } from "@tanstack/react-router";

export default function LayoutAnimated() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Fixed Topbar */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <Topbar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      </header>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-16 left-0 bottom-0
          bg-white border-r border-gray-200
          transition-all duration-300 ease-in-out
          overflow-y-auto
          ${isSidebarOpen ? "w-64" : "w-0"}
        `}
      >
        {isSidebarOpen && <Sidebar />}
      </aside>

      {/* Main content */}
      <main
        className="flex-1 p-6 pt-16 overflow-y-auto transition-all duration-300 ease-in-out"
        style={{ marginLeft: isSidebarOpen ? 256 : 0 }} // 64 * 4 = 256px
      >
        <Outlet />
      </main>
    </div>
  );
}
