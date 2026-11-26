import { cached } from "../cache";
import { env } from "../env";
import { fetchJson, withProvider } from "../logger";
import type { Weather } from "../types";

const CODES: Record<number, string> = {
  0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast", 45: "Fog", 48: "Rime fog",
  51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle", 61: "Light rain", 63: "Rain", 65: "Heavy rain",
  71: "Light snow", 73: "Snow", 75: "Heavy snow", 80: "Rain showers", 81: "Rain showers", 82: "Violent showers",
  95: "Thunderstorm", 96: "Thunderstorm with hail", 99: "Thunderstorm with hail",
};

export async function getWeather(lat?: number, lon?: number, city?: string): Promise<Weather> {
  // ~10 km precision: enough for weather, and the exact location never leaves the server.
  const la = Math.round((Number.isFinite(lat) ? (lat as number) : env.defaultLat) * 10) / 10;
  const lo = Math.round((Number.isFinite(lon) ? (lon as number) : env.defaultLon) * 10) / 10;
  const name = city || (lat === undefined ? env.defaultCity : "Your location");
  // Round coordinates so nearby users share a cache entry.
  const key = `weather:${la.toFixed(1)}:${lo.toFixed(1)}`;
  return cached(key, { kind: "weather", date: "-", ttlSeconds: 20 * 60 }, () =>
    withProvider(
      "open-meteo",
      env.useMocks
        ? null
        : async () => {
            type R = {
              current: { temperature_2m: number; apparent_temperature: number; weather_code: number; is_day: number };
              daily: { temperature_2m_max: number[]; temperature_2m_min: number[] };
            };
            const d = await fetchJson<R>(
              `https://api.open-meteo.com/v1/forecast?latitude=${la}&longitude=${lo}&current=temperature_2m,apparent_temperature,weather_code,is_day&daily=temperature_2m_max,temperature_2m_min&forecast_days=1&timezone=auto`,
            );
            return {
              city: name,
              temperature: Math.round(d.current.temperature_2m),
              apparent: Math.round(d.current.apparent_temperature),
              code: d.current.weather_code,
              description: CODES[d.current.weather_code] ?? "—",
              high: Math.round(d.daily.temperature_2m_max[0]),
              low: Math.round(d.daily.temperature_2m_min[0]),
              isDay: d.current.is_day === 1,
            };
          },
      () => ({ city: name, temperature: 24, apparent: 25, code: 1, description: "Mainly clear", high: 28, low: 17, isDay: true, mock: true }),
    ),
  );
}
