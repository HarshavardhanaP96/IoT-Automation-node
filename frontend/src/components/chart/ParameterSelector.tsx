import React from "react";
interface ParameterSelectorProps {
  yAxis1: string;
  yAxis2: string;
  setYAxis1: (v: string) => void;
  setYAxis2: (v: string) => void;
}

export const ParameterSelector: React.FC<ParameterSelectorProps> = ({
  yAxis1,
  yAxis2,
  setYAxis1,
  setYAxis2,
}) => (
  <div className="mt-4 pt-4 border-t border-gray-200">
    <h3 className="text-sm font-semibold text-gray-700 mb-3">
      Chart Parameters
    </h3>
    <div className="flex gap-6 flex-wrap">
      <div>
        <label className="text-sm font-medium text-gray-600 block mb-1">
          Chart 1 Y-Axis:
        </label>
        <select
          value={yAxis1}
          onChange={(e) => setYAxis1(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="temperature">Temperature (°C)</option>
          <option value="humidity">Humidity (%)</option>
        </select>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-600 block mb-1">
          Chart 2 Y-Axis:
        </label>
        <select
          value={yAxis2}
          onChange={(e) => setYAxis2(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="humidity">Humidity (%)</option>
          <option value="temperature">Temperature (°C)</option>
        </select>
      </div>
    </div>
  </div>
);
