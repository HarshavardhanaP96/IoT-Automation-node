import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { SensorDataPoint } from "../../types/sensor";
import { CustomTooltip } from "./CustomTooltip";

// Recharts passes an event object containing info about active data points
export interface RechartsMouseEvent {
  chartX?: number;
  chartY?: number;
  activeLabel?: string;
  activePayload?: Array<{
    name?: string;
    value?: number | string;
    payload: SensorDataPoint;
  }>;
  activeCoordinate?: { x: number; y: number };
}

interface ChartContainerProps {
  title: string;
  data: SensorDataPoint[];
  yAxisKey: "temperature" | "humidity";
  formatTime: (timestamp: string) => string;
  onMouseMove?: (e: RechartsMouseEvent) => void;
  onMouseLeave?: () => void;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  data,
  yAxisKey,
  formatTime,
  onMouseMove,
  onMouseLeave,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">{title}</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          syncId="sensorCharts"
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatTime}
            stroke="#666"
            style={{ fontSize: "12px" }}
          />
          <YAxis
            stroke="#666"
            style={{ fontSize: "12px" }}
            label={{
              value:
                yAxisKey === "temperature"
                  ? "Temperature (°C)"
                  : "Humidity (%)",
              angle: -90,
              position: "insideLeft",
              style: { fontSize: "14px", fill: "#666" },
            }}
          />
          <Tooltip content={<CustomTooltip formatTime={formatTime} />} />
          <Legend />
          <Line
            type="monotone"
            dataKey={yAxisKey}
            stroke={yAxisKey === "temperature" ? "#ef4444" : "#3b82f6"}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            name={yAxisKey === "temperature" ? "Temperature" : "Humidity"}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
