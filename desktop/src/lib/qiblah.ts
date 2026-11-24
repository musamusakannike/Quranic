const KAABA_LAT = 21.422487;
const KAABA_LNG = 39.826206;
const EARTH_RADIUS_KM = 6371.0088;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/**
 * Great-circle initial bearing from (lat, lng) to the Kaaba in Makkah (0-360 degrees from true north).
 */
export function computeQiblahBearing(lat: number, lng: number): number {
  const phi1 = toRad(lat);
  const phi2 = toRad(KAABA_LAT);
  const deltaLambda = toRad(KAABA_LNG - lng);

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  const theta = toDeg(Math.atan2(y, x));
  return (theta + 360) % 360;
}

/**
 * Haversine great-circle distance to the Kaaba in kilometers.
 */
export function computeDistanceToKaabaKm(lat: number, lng: number): number {
  const dLat = toRad(KAABA_LAT - lat);
  const dLng = toRad(KAABA_LNG - lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat)) * Math.cos(toRad(KAABA_LAT)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

export function bearingToCardinal(bearing: number, lang: "en" | "ar" = "en"): string {
  const enDirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const arDirs = ["شمال", "شمال شرق", "شرق", "جنوب شرق", "جنوب", "جنوب غرب", "غرب", "شمال غرب"];
  const idx = Math.round(((bearing % 360) / 45)) % 8;
  return (lang === "ar" ? arDirs[idx] : enDirs[idx]) ?? "N";
}
