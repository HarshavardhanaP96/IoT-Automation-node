import { InfluxDB } from "influx";

export const influx = new InfluxDB({
  host: process.env.INFLUX_HOST || "localhost",
  database: process.env.INFLUX_DB || "iot_data",
});
