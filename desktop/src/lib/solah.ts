import {
  Coordinates,
  CalculationMethod,
  CalculationParameters,
  Madhab,
  HighLatitudeRule,
  PrayerTimes,
} from "adhan";

export type PrayerKey = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";
export type PrayerListKey = PrayerKey | "sunrise";

export type CalculationMethodId =
  | "MuslimWorldLeague"
  | "NorthAmerica"
  | "Egyptian"
  | "UmmAlQura"
  | "Karachi"
  | "Dubai"
  | "Qatar"
  | "Kuwait"
  | "Singapore"
  | "Turkey"
  | "Tehran"
  | "MoonsightingCommittee";

export type MadhabId = "shafi" | "hanafi";
export type HighLatitudeRuleId =
  | "middleOfTheNight"
  | "seventhOfTheNight"
  | "twilightAngle";

export interface CalculationOption {
  id: CalculationMethodId;
  label: string;
}

export const CALCULATION_METHODS: CalculationOption[] = [
  { id: "MuslimWorldLeague", label: "Muslim World League (MWL)" },
  { id: "NorthAmerica", label: "ISNA / North America" },
  { id: "Egyptian", label: "Egyptian General Authority" },
  { id: "UmmAlQura", label: "Umm al-Qura University, Makkah" },
  { id: "Karachi", label: "University of Islamic Sciences, Karachi" },
  { id: "Dubai", label: "Dubai" },
  { id: "Qatar", label: "Qatar" },
  { id: "Kuwait", label: "Kuwait" },
  { id: "Singapore", label: "Singapore (MUIS)" },
  { id: "Turkey", label: "Diyanet, Turkey" },
  { id: "Tehran", label: "Institute of Geophysics, Tehran" },
  { id: "MoonsightingCommittee", label: "Moonsighting Committee" },
];

export interface SolahConfig {
  latitude: number;
  longitude: number;
  timezone: string;
  method: CalculationMethodId;
  madhab: MadhabId;
  highLatitudeRule: HighLatitudeRuleId;
  adjustments?: Partial<Record<PrayerKey, number>>;
}

export interface PrayerTimesResult {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
}

export interface NextPrayerInfo {
  key: PrayerKey;
  time: Date;
  isTomorrow: boolean;
}

export function defaultMethodForCountry(countryCode: string): CalculationMethodId {
  const cc = countryCode.toUpperCase();
  if (cc === "US" || cc === "CA") return "NorthAmerica";
  if (cc === "SA") return "UmmAlQura";
  if (cc === "EG" || cc === "NG" || cc === "SD" || cc === "LY") return "Egyptian";
  if (cc === "PK" || cc === "IN" || cc === "BD" || cc === "AF") return "Karachi";
  if (cc === "AE") return "Dubai";
  if (cc === "QA") return "Qatar";
  if (cc === "KW") return "Kuwait";
  if (cc === "SG" || cc === "MY" || cc === "ID" || cc === "BN") return "Singapore";
  if (cc === "TR") return "Turkey";
  if (cc === "IR") return "Tehran";
  if (cc === "GB") return "MoonsightingCommittee";
  return "MuslimWorldLeague";
}

function buildParameters(config: SolahConfig): CalculationParameters {
  let params: CalculationParameters;
  switch (config.method) {
    case "NorthAmerica":
      params = CalculationMethod.NorthAmerica();
      break;
    case "Egyptian":
      params = CalculationMethod.Egyptian();
      break;
    case "UmmAlQura":
      params = CalculationMethod.UmmAlQura();
      break;
    case "Karachi":
      params = CalculationMethod.Karachi();
      break;
    case "Dubai":
      params = CalculationMethod.Dubai();
      break;
    case "Qatar":
      params = CalculationMethod.Qatar();
      break;
    case "Kuwait":
      params = CalculationMethod.Kuwait();
      break;
    case "Singapore":
      params = CalculationMethod.Singapore();
      break;
    case "Turkey":
      params = CalculationMethod.Turkey();
      break;
    case "Tehran":
      params = CalculationMethod.Tehran();
      break;
    case "MoonsightingCommittee":
      params = CalculationMethod.MoonsightingCommittee();
      break;
    case "MuslimWorldLeague":
    default:
      params = CalculationMethod.MuslimWorldLeague();
      break;
  }

  params.madhab = config.madhab === "hanafi" ? Madhab.Hanafi : Madhab.Shafi;
  switch (config.highLatitudeRule) {
    case "seventhOfTheNight":
      params.highLatitudeRule = HighLatitudeRule.SeventhOfTheNight;
      break;
    case "twilightAngle":
      params.highLatitudeRule = HighLatitudeRule.TwilightAngle;
      break;
    case "middleOfTheNight":
    default:
      params.highLatitudeRule = HighLatitudeRule.MiddleOfTheNight;
      break;
  }

  if (config.adjustments) {
    params.adjustments.fajr = config.adjustments.fajr ?? 0;
    params.adjustments.dhuhr = config.adjustments.dhuhr ?? 0;
    params.adjustments.asr = config.adjustments.asr ?? 0;
    params.adjustments.maghrib = config.adjustments.maghrib ?? 0;
    params.adjustments.isha = config.adjustments.isha ?? 0;
  }

  return params;
}

/**
 * Extract Y-M-D calendar date in a specific IANA timezone using Intl.
 */
export function getZonedDateParts(
  date: Date,
  timezone: string,
): { year: number; month: number; day: number; hour: number; minute: number; weekday: number } {
  const safeTz = isValidTimezone(timezone) ? timezone : "UTC";
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: safeTz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")) % 24,
    minute: Number(get("minute")),
    weekday: weekdayMap[get("weekday")] ?? 0,
  };
}

export function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function getZonedDateKey(date: Date, timezone: string): string {
  const p = getZonedDateParts(date, timezone);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/**
 * Compute prayer times for the local calendar day of `date` in `config.timezone`.
 * Note: `adhan` reads `date.getFullYear()/getMonth()/getDate()`, so we construct
 * a Date whose local Y/M/D matches the target timezone's calendar day.
 */
export function computePrayerTimes(
  config: SolahConfig,
  date: Date = new Date(),
  dayOffset: number = 0,
): PrayerTimesResult {
  const parts = getZonedDateParts(date, config.timezone);
  const calendarDate = new Date(parts.year, parts.month - 1, parts.day + dayOffset, 12, 0, 0);
  const coordinates = new Coordinates(config.latitude, config.longitude);
  const params = buildParameters(config);
  const times = new PrayerTimes(coordinates, calendarDate, params);

  return {
    fajr: times.fajr,
    sunrise: times.sunrise,
    dhuhr: times.dhuhr,
    asr: times.asr,
    maghrib: times.maghrib,
    isha: times.isha,
  };
}

export function computeNextPrayer(
  config: SolahConfig,
  now: Date = new Date(),
): NextPrayerInfo {
  const today = computePrayerTimes(config, now, 0);
  const ordered: { key: PrayerKey; time: Date }[] = [
    { key: "fajr", time: today.fajr },
    { key: "dhuhr", time: today.dhuhr },
    { key: "asr", time: today.asr },
    { key: "maghrib", time: today.maghrib },
    { key: "isha", time: today.isha },
  ];

  const upcoming = ordered.find((p) => p.time.getTime() > now.getTime());
  if (upcoming) {
    return { ...upcoming, isTomorrow: false };
  }

  const tomorrow = computePrayerTimes(config, now, 1);
  return { key: "fajr", time: tomorrow.fajr, isTomorrow: true };
}

export function formatTimeInZone(
  date: Date,
  timezone: string,
  locale: string = "en",
): string {
  const safeTz = isValidTimezone(timezone) ? timezone : "UTC";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    timeZone: safeTz,
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatCountdown(target: Date, now: Date = new Date()): string {
  const diffSec = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
  const hrs = Math.floor(diffSec / 3600);
  const mins = Math.floor((diffSec % 3600) / 60);
  const secs = diffSec % 60;
  return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function formatShortCountdown(target: Date, now: Date = new Date()): string {
  const diffMin = Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 60000));
  const hrs = Math.floor(diffMin / 60);
  const mins = diffMin % 60;
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}
