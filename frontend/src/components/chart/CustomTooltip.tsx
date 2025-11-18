import React from "react";
import type { SensorDataPoint } from "../../types/sensor";

// Define what each payload item looks like
interface PayloadItem {
  name?: string;
  value?: number | string;
  color?: string;
  payload: SensorDataPoint;
}

// Props for the tooltip component
interface CustomTooltipProps {
  active?: boolean;
  payload?: PayloadItem[];
  formatTime: (timestamp: string) => string;
}

export const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  formatTime,
}) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;
    const timestamp = data.timestamp;

    return (
      <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
        <p className="font-semibold text-sm mb-2">{formatTime(timestamp)}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}:{" "}
            {typeof entry.value === "number"
              ? entry.value.toFixed(2)
              : entry.value}
            {entry.name?.toLowerCase().includes("temperature") ? "°C" : "%"}
          </p>
        ))}
      </div>
    );
  }

  return null;
};
