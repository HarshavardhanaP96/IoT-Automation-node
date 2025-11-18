import { Link } from "@tanstack/react-router";

export default function Sidebar() {
  const navItems = [
    { name: "Dashboard", path: "/" },
    { name: "Users", path: "/users" },
    { name: "Devices", path: "/devices" },
    { name: "Companies", path: "/companies" },
  ];

  return (
    <nav className="flex flex-col p-4 space-y-2 bg-white h-full">
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          activeProps={{
            className: "bg-gray-200 font-semibold text-gray-900",
          }}
          inactiveProps={{
            className: "text-gray-700",
          }}
          className="px-4 py-2 rounded-md hover:bg-gray-100 transition-colors block"
        >
          {item.name}
        </Link>
      ))}
    </nav>
  );
}
