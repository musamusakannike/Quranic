import momentHijri from "moment-hijri";
import type { Language } from "./i18n";
import { getDict, formatNumber } from "./i18n";

// moment-hijri attaches iYear/iMonth/iDate methods to moment
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mHijri = momentHijri as any;

export interface IslamicEvent {
  iMonth: number; // 1-12
  iDay: number; // 1-30
  key:
    | "newYear"
    | "ashura"
    | "mawlid"
    | "israMiraj"
    | "shaabanMiddle"
    | "ramadanStart"
    | "laylatAlQadr"
    | "eidAlFitr"
    | "arafah"
    | "eidAlAdha";
  color: string;
}

export const ISLAMIC_EVENTS: IslamicEvent[] = [
  { iMonth: 1, iDay: 1, key: "newYear", color: "#D4AF37" },
  { iMonth: 1, iDay: 10, key: "ashura", color: "#8B5CF6" },
  { iMonth: 3, iDay: 12, key: "mawlid", color: "#10B981" },
  { iMonth: 7, iDay: 27, key: "israMiraj", color: "#3B82F6" },
  { iMonth: 8, iDay: 15, key: "shaabanMiddle", color: "#F59E0B" },
  { iMonth: 9, iDay: 1, key: "ramadanStart", color: "#EF4444" },
  { iMonth: 9, iDay: 27, key: "laylatAlQadr", color: "#D4AF37" },
  { iMonth: 10, iDay: 1, key: "eidAlFitr", color: "#10B981" },
  { iMonth: 12, iDay: 9, key: "arafah", color: "#F59E0B" },
  { iMonth: 12, iDay: 10, key: "eidAlAdha", color: "#10B981" },
];

export interface HijriDateParts {
  iYear: number;
  iMonth: number; // 1-12
  iDay: number; // 1-30
  gregorian: Date;
  weekday: number; // 0=Sun..6=Sat
}

export type CalendarCell =
  | { type: "empty"; id: string }
  | {
      type: "day";
      id: string;
      iYear: number;
      iMonth: number;
      iDay: number;
      gregorian: Date;
      isToday: boolean;
      isFriday: boolean;
      events: IslamicEvent[];
    };

export function gregorianToHijri(date: Date, offsetDays: number = 0): HijriDateParts {
  const shifted = mHijri(date).add(offsetDays, "days");
  return {
    iYear: shifted.iYear(),
    iMonth: shifted.iMonth() + 1,
    iDay: shifted.iDate(),
    gregorian: new Date(date.getTime()),
    weekday: date.getDay(),
  };
}

export function formatHijriDate(
  date: Date,
  lang: Language,
  offsetDays: number = 0,
): string {
  const h = gregorianToHijri(date, offsetDays);
  const dict = getDict(lang);
  const monthName = dict.hijri.months[h.iMonth - 1] ?? "";
  const day = formatNumber(h.iDay, lang);
  const year = formatNumber(h.iYear, lang);
  return lang === "ar" ? `${day} ${monthName} ${year} هـ` : `${day} ${monthName} ${year} AH`;
}

export function getHijriMonthGrid(
  iYear: number,
  iMonth: number, // 1-12
  offsetDays: number = 0,
  today: Date = new Date(),
): {
  cells: CalendarCell[];
  daysInMonth: number;
  monthEvents: { day: number; event: IslamicEvent }[];
  gregorianRange: { start: Date; end: Date };
} {
  // First day of the Hijri month in Hijri calendar; subtract offsetDays to get corresponding Gregorian date
  const firstHijriMoment = mHijri(
    `${iYear}-${String(iMonth).padStart(2, "0")}-01`,
    "iYYYY-iMM-iDD",
  );
  const daysInMonth: number = mHijri.iDaysInMonth(iYear, iMonth - 1);
  const firstGreg = firstHijriMoment.clone().subtract(offsetDays, "days").toDate() as Date;
  const startWeekday = firstGreg.getDay();

  const todayHijri = gregorianToHijri(today, offsetDays);
  const cells: CalendarCell[] = [];

  for (let e = 0; e < startWeekday; e++) {
    cells.push({ type: "empty", id: `empty-${iYear}-${iMonth}-${e}` });
  }

  const monthEvents: { day: number; event: IslamicEvent }[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const greg = new Date(firstGreg.getFullYear(), firstGreg.getMonth(), firstGreg.getDate() + (d - 1));
    const events = ISLAMIC_EVENTS.filter((ev) => ev.iMonth === iMonth && ev.iDay === d);
    events.forEach((ev) => monthEvents.push({ day: d, event: ev }));

    cells.push({
      type: "day",
      id: `${iYear}-${iMonth}-${d}`,
      iYear,
      iMonth,
      iDay: d,
      gregorian: greg,
      isToday:
        todayHijri.iYear === iYear &&
        todayHijri.iMonth === iMonth &&
        todayHijri.iDay === d,
      isFriday: greg.getDay() === 5,
      events,
    });
  }

  const lastGreg = new Date(
    firstGreg.getFullYear(),
    firstGreg.getMonth(),
    firstGreg.getDate() + (daysInMonth - 1),
  );

  return {
    cells,
    daysInMonth,
    monthEvents,
    gregorianRange: { start: firstGreg, end: lastGreg },
  };
}

export function stepHijriMonth(
  iYear: number,
  iMonth: number,
  delta: number,
): { iYear: number; iMonth: number } {
  let m = iMonth + delta;
  let y = iYear;
  while (m > 12) {
    m -= 12;
    y += 1;
  }
  while (m < 1) {
    m += 12;
    y -= 1;
  }
  return { iYear: y, iMonth: m };
}
