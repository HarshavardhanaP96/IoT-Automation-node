import React from "react";
import { Activity, Calendar } from "lucide-react";

interface ModeToggleProps {
  mode: "live" | "historical";
  setMode: (mode: "live" | "historical") => void;
  stopStream: () => void;
}

export const ModeToggle: React.FC<ModeToggleProps> = ({
  mode,
  setMode,
  stopStream,
}) => (
  <div className="flex gap-4 mb-4">
    <button
      onClick={() => {
        setMode("live");
        stopStream();
      }}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
        mode === "live"
          ? "bg-blue-600 text-white"
          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
      }`}
    >
      <Activity size={20} />
      Live Stream
    </button>
    <button
      onClick={() => {
        setMode("historical");
        stopStream();
      }}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
        mode === "historical"
          ? "bg-blue-600 text-white"
          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
      }`}
    >
      <Calendar size={20} />
      Historical Data
    </button>
  </div>
);
