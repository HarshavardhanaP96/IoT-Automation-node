import { useState } from "react";
import Topbar from "./Topbar";
import Sidebar from "./Sidebar";
import { Outlet } from "@tanstack/react-router";

export default function LayoutAnimated() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
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
          overflow-y-auto z-40
          ${isSidebarOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full lg:w-0 lg:translate-x-0 lg:hidden"}
        `}
      >
        <Sidebar />
      </aside>

      {/* Main content */}
      <main
        className={`
          flex-1 p-6 pt-20 overflow-y-auto transition-all duration-300 ease-in-out min-h-screen
          ${isSidebarOpen ? "lg:ml-64" : "ml-0"}
        `}
      >
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
