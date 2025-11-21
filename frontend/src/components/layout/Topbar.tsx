interface TopbarProps {
  onMenuClick?: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const companyName = "SilTech Pvt Ltd";
  const userName = "John Doe";

  return (
    <header className="flex items-center justify-between h-16 px-6 bg-white shadow-md w-full">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          aria-label="Toggle menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <div className="text-xl font-bold text-gray-800">{companyName}</div>
      </div>
      <div className="text-sm text-gray-700 font-medium">{userName}</div>
    </header>
  );
}
