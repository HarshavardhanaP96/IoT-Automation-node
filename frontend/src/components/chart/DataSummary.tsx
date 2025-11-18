import React from "react";
import type { SensorDataPoint } from "../../types/sensor";

interface DataSummaryProps {
  data: SensorDataPoint[];
  mode: "live" | "historical";
}

export const DataSummary: React.FC<DataSummaryProps> = ({ data, mode }) => {
  const avgTemp =
    data.length > 0
      ? data.reduce((sum, d) => sum + d.temperature, 0) / data.length
      : 0;
  const avgHum =
    data.length > 0
      ? data.reduce((sum, d) => sum + d.humidity, 0) / data.length
      : 0;

  return (
    <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Data Summary</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-600">Data Points</p>
          <p className="text-2xl font-bold text-blue-600">{data.length}</p>
        </div>
        <div className="p-4 bg-red-50 rounded-lg">
          <p className="text-sm text-gray-600">Avg Temperature</p>
          <p className="text-2xl font-bold text-red-600">
            {avgTemp.toFixed(1)}°C
          </p>
        </div>
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-600">Avg Humidity</p>
          <p className="text-2xl font-bold text-blue-600">
            {avgHum.toFixed(1)}%
          </p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-gray-600">Mode</p>
          <p className="text-2xl font-bold text-green-600 capitalize">{mode}</p>
        </div>
      </div>
    </div>
  );
};
