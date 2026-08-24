/**
 * spaceData — real-time scientific telemetry for start.cobos.io.
 *
 * Public, key-less APIs:
 *   - NOAA SWPC solar wind plasma (speed in km/s)
 *   - NOAA SWPC planetary K-index (geomagnetic activity 0–9)
 *   - wheretheiss.at (real ISS lat/lon/velocity)
 *   - Open-Notify astros (how many humans are in space right now)
 *
 * Every fetch is isolated with allSettled + a hard timeout: if any source
 * is down, the page falls back to plausible constants instead of failing.
 */
export type SpaceData = {
  solarWind: number; // km/s
  kp: number; // 0–9
  iss: { lat: number; lon: number; velKms: number } | null;
  people: number; // humans in space
};

const FALLBACK: SpaceData = {
  solarWind: 420,
  kp: 2,
  iss: null,
  people: 7,
};

async function fetchJson(url: string, revalidate: number): Promise<unknown> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(4000),
    next: { revalidate },
  });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json();
}

export async function getSpaceData(): Promise<SpaceData> {
  const [windR, kpR, issR, astrosR] = await Promise.allSettled([
    fetchJson(
      "https://services.swpc.noaa.gov/json/rtsw/rtsw_wind_1m.json",
      300
    ),
    fetchJson(
      "https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json",
      300
    ),
    fetchJson("https://api.wheretheiss.at/v1/satellites/25544", 60),
    fetchJson("https://api.open-notify.org/astros.json", 300),
  ]);

  const data = { ...FALLBACK };

  // rtsw_wind_1m.json → array of { time_tag, proton_speed, ... }
  if (windR.status === "fulfilled" && Array.isArray(windR.value)) {
    const rows = windR.value as { proton_speed?: number | null }[];
    const speed = rows[rows.length - 1]?.proton_speed;
    if (typeof speed === "number" && speed > 100 && speed < 2500) {
      data.solarWind = Math.round(speed);
    }
  }

  // noaa-planetary-k-index.json → array of { time_tag, Kp, ... }
  if (kpR.status === "fulfilled" && Array.isArray(kpR.value)) {
    const rows = kpR.value as { Kp?: number | string }[];
    const kp = Number(rows[rows.length - 1]?.Kp);
    if (Number.isFinite(kp) && kp >= 0 && kp <= 9) {
      data.kp = Math.round(kp * 10) / 10;
    }
  }

  if (issR.status === "fulfilled") {
    const v = issR.value as { latitude?: number; longitude?: number; velocity?: number };
    if (
      typeof v.latitude === "number" &&
      typeof v.longitude === "number" &&
      typeof v.velocity === "number"
    ) {
      data.iss = {
        lat: Math.round(v.latitude * 100) / 100,
        lon: Math.round(v.longitude * 100) / 100,
        velKms: Math.round((v.velocity / 3600) * 100) / 100, // km/h → km/s
      };
    }
  }

  if (astrosR.status === "fulfilled") {
    const v = astrosR.value as { number?: number };
    if (typeof v.number === "number" && v.number > 0) data.people = v.number;
  }

  return data;
}
