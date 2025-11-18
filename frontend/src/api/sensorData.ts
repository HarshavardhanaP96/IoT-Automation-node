import type { SensorDataPoint } from "../types/sensor";

export const generateMockData = (count = 10): SensorDataPoint[] => {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => ({
    timestamp: new Date(now - (count - i - 1) * 5000).toISOString(),
    temperature: 20 + Math.random() * 10,
    humidity: 40 + Math.random() * 20,
  }));
};

export const generateHistoricalData = (
  startDate: string,
  endDate: string
): SensorDataPoint[] => {
  const data: SensorDataPoint[] = [];
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const interval = (end - start) / 50;

  for (let i = 0; i <= 50; i++) {
    const timestamp = new Date(start + interval * i);
    data.push({
      timestamp: timestamp.toISOString(),
      temperature: 22 + Math.sin(i / 5) * 5 + Math.random() * 2,
      humidity: 50 + Math.cos(i / 5) * 15 + Math.random() * 3,
    });
  }
  return data;
};

/**
 * 
 * // For live data - connect to WebSocket
useEffect(() => {
  const ws = new WebSocket('ws://your-server:3000');
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    setLiveData(prev => [...prev, data].slice(-10));
  };
}, []);

// For historical data - fetch from InfluxDB
const loadHistoricalData = async () => {
  const response = await fetch(`/api/historical?start=${startDate}&end=${endDate}`);
  const data = await response.json();
  setHistoricalData(data);
};
 */
