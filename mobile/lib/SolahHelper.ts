import { Coordinates, CalculationMethod, PrayerTimes } from "adhan";

export type PrayerKey = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";
export type PrayerListKey = PrayerKey | "sunrise";

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
  label: string;
  time: Date;
}

export interface WidgetData {
  nextPrayerName: string;
  nextPrayerTime: string;
  countdownTimestamp: number;
  fajr: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

export const getPrayerTimes = (
  latitude: number,
  longitude: number,
  date: Date = new Date(),
): PrayerTimesResult => {
  const coordinates = new Coordinates(latitude, longitude);
  const params = CalculationMethod.MuslimWorldLeague();
  const times = new PrayerTimes(coordinates, date, params);

  return {
    fajr: times.fajr,
    sunrise: times.sunrise,
    dhuhr: times.dhuhr,
    asr: times.asr,
    maghrib: times.maghrib,
    isha: times.isha,
  };
};

export const getNextPrayer = (
  latitude: number,
  longitude: number,
  now: Date = new Date(),
): NextPrayerInfo => {
  const times = getPrayerTimes(latitude, longitude, now);

  const prayers: { key: PrayerKey; label: string; time: Date }[] = [
    { key: "fajr", label: "Fajr", time: times.fajr },
    { key: "dhuhr", label: "Dhuhr", time: times.dhuhr },
    { key: "asr", label: "Asr", time: times.asr },
    { key: "maghrib", label: "Maghrib", time: times.maghrib },
    { key: "isha", label: "Isha", time: times.isha },
  ];

  let nextP = prayers.find((p) => p.time > now);

  if (!nextP) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowTimes = getPrayerTimes(latitude, longitude, tomorrow);
    nextP = { key: "fajr", label: "Fajr", time: tomorrowTimes.fajr };
  }

  return nextP;
};

export const formatPrayerTime = (dateObj: Date) =>
  dateObj.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
