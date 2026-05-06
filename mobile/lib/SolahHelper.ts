import { Coordinates, CalculationMethod, PrayerTimes } from "adhan";

export type PrayerKey = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";
export type PrayerListKey = PrayerKey | "sunrise";

// ── Rich notification content pool ──────────────────────────────────────────
// Each entry is a short, meaningful line shown as the notification subtitle.
// One is picked at random each time a notification fires.
const NOTIFICATION_EXTRAS: string[] = [
  "الصَّلَاةُ خَيْرٌ مِنَ النَّوْمِ — Prayer is better than sleep.",
  "حَافِظُوا عَلَى الصَّلَوَاتِ — Guard your prayers diligently.",
  "إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَوْقُوتًا — Prayer is an obligation at fixed times. (4:103)",
  "وَأَقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ — Establish prayer and give zakah. (2:43)",
  "Purify your heart and stand before Allah.",
  "Every prayer is a conversation with Allah — don't miss it.",
  "The first thing you'll be asked about on the Day of Judgement is your prayer.",
  "Two rak'ahs prayed with full presence are worth more than a thousand prayed absent-mindedly.",
  "وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ — Seek help through patience and prayer. (2:45)",
  "Prayer is the pillar of the deen — uphold it.",
  "Take a moment, make wudu, and reconnect with Allah.",
  "The coolness of the Prophet's ﷺ eyes was in prayer.",
  "Between a person and shirk is the abandonment of prayer.",
  "Prayer wipes away the sins between it and the next prayer.",
];

/** Returns a random extra line for a prayer notification body. */
export const getRandomNotificationExtra = (): string => {
  const index = Math.floor(Math.random() * NOTIFICATION_EXTRAS.length);
  return NOTIFICATION_EXTRAS[index] ?? NOTIFICATION_EXTRAS[0]!;
};

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
