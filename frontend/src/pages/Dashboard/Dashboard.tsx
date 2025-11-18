import { useState, useEffect, useRef, useCallback } from "react";
import { generateMockData, generateHistoricalData } from "../../api/sensorData";
import type { SensorDataPoint } from "../../types/sensor";
import { ChartContainer } from "../../components/chart/ChartContainer";
import { ModeToggle } from "../../components/chart/ModeToggle";
import { ParameterSelector } from "../../components/chart/ParameterSelector";
import { DataSummary } from "../../components/chart/DataSummary";
import { Controls } from "../../components/chart/Controls";
import type { RechartsMouseEvent } from "../../components/chart/ChartContainer";

const Dashboard = () => {
  const [mode, setMode] = useState<"live" | "historical">("live");
  const [isStreaming, setIsStreaming] = useState(false);
  const [liveData, setLiveData] = useState<SensorDataPoint[]>(
    generateMockData(10)
  );
  const [historicalData, setHistoricalData] = useState<SensorDataPoint[]>([]);
  const [syncedTime, setSyncedTime] = useState<string | null>(null);

  const [yAxis1, setYAxis1] = useState("temperature");
  const [yAxis2, setYAxis2] = useState("humidity");

  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Live data streaming
  useEffect(() => {
    if (mode === "live" && isStreaming) {
      intervalRef.current = setInterval(() => {
        setLiveData((prev) => {
          const newDataPoint: SensorDataPoint = {
            timestamp: new Date().toISOString(),
            temperature: 20 + Math.random() * 10,
            humidity: 40 + Math.random() * 20,
          };
          const updated = [...prev, newDataPoint];
          return updated.slice(-10);
        });
      }, 5000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [mode, isStreaming]);

  const loadHistoricalData = useCallback(() => {
    const data = generateHistoricalData(startDate, endDate);
    setHistoricalData(data);
  }, [startDate, endDate]);

  useEffect(() => {
    if (mode === "historical") {
      loadHistoricalData();
    }
  }, [mode, loadHistoricalData]);

  const currentData = mode === "live" ? liveData : historicalData;

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    if (mode === "live") {
      return date.toLocaleTimeString();
    }
    return date.toLocaleString();
  };

  const handleMouseMove = (e: RechartsMouseEvent) => {
    if (e?.activePayload && e.activePayload.length > 0) {
      setSyncedTime(e.activePayload[0].payload.timestamp);
    }
  };

  const handleMouseLeave = () => {
    setSyncedTime(null);
  };

  const stopStream = () => {
    setIsStreaming(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            BusLogFi Sensor Dashboard
          </h1>

          <ModeToggle mode={mode} setMode={setMode} stopStream={stopStream} />

          <Controls
            mode={mode}
            isStreaming={isStreaming}
            setIsStreaming={setIsStreaming}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            loadHistoricalData={loadHistoricalData}
          />

          <ParameterSelector
            yAxis1={yAxis1}
            yAxis2={yAxis2}
            setYAxis1={setYAxis1}
            setYAxis2={setYAxis2}
          />
        </div>

        <div className="space-y-6">
          <ChartContainer
            title={`Chart 1: ${
              yAxis1.charAt(0).toUpperCase() + yAxis1.slice(1)
            }`}
            data={currentData}
            yAxisKey={yAxis1 as "temperature" | "humidity"}
            formatTime={formatTime}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          />

          <ChartContainer
            title={`Chart 2: ${
              yAxis2.charAt(0).toUpperCase() + yAxis2.slice(1)
            }`}
            data={currentData}
            yAxisKey={yAxis2 as "temperature" | "humidity"}
            formatTime={formatTime}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          />
        </div>

        <DataSummary data={currentData} mode={mode} />
      </div>
    </div>
  );
};

export default Dashboard;
