import React from "react";
import { Play, Pause } from "lucide-react";

interface ControlsProps {
  mode: "live" | "historical";
  isStreaming: boolean;
  setIsStreaming: (v: boolean) => void;
  startDate: string;
  setStartDate: (v: string) => void;
  endDate: string;
  setEndDate: (v: string) => void;
  loadHistoricalData: () => void;
}

export const Controls: React.FC<ControlsProps> = ({
  mode,
  isStreaming,
  setIsStreaming,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  loadHistoricalData,
}) => {
  return (
    <>
      {mode === "live" && (
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsStreaming(!isStreaming)}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors ${
              isStreaming
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-green-500 hover:bg-green-600 text-white"
            }`}
          >
            {isStreaming ? (
              <>
                <Pause size={20} />
                Stop Stream
              </>
            ) : (
              <>
                <Play size={20} />
                Start Stream
              </>
            )}
          </button>

          <span className="text-sm text-gray-600">
            {isStreaming ? (
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Streaming (Last 10 points)
              </span>
            ) : (
              "Paused"
            )}
          </span>
        </div>
      )}

      {mode === "historical" && (
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">From:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">To:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={loadHistoricalData}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Load Data
          </button>
        </div>
      )}
    </>
  );
};
