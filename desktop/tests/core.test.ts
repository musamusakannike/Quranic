import { describe, it, expect, beforeEach } from "vitest";
import {
  normalizeSearchText,
  parseQuranReference,
  getGlobalVerseNumber,
  getTotalQuranVerses,
} from "../src/lib/quran";
import {
  computePrayerTimes,
  formatTimeInZone,
  type SolahConfig,
} from "../src/lib/solah";
import {
  gregorianToHijri,
  getHijriMonthGrid,
  stepHijriMonth,
} from "../src/lib/hijri";
import { ReminderScheduler, type SchedulerInput } from "../src/lib/scheduler";
import {
  safeComputeProgress,
  useDownloadsStore,
} from "../src/stores/downloadsStore";
import { computeQiblahBearing, computeDistanceToKaabaKm } from "../src/lib/qiblah";

describe("Quran normalization & reference parsing", () => {
  it("strips Arabic diacritics, tatweel, and normalizes alef variants", () => {
    const raw = "بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ";
    const norm = normalizeSearchText(raw);
    expect(norm).toContain("بسم");
    expect(norm).toContain("الله");
    expect(norm).not.toContain("ـ");
    expect(normalizeSearchText("إبراهيم أَحْمَد آدَم ٱلله")).toBe(
      "ابراهيم احمد ادم الله",
    );
  });

  it("parses verse, surah, juz, page, and named references", () => {
    expect(parseQuranReference("2:255")).toMatchObject({
      type: "verse",
      chapter: 2,
      verse: 255,
    });
    expect(parseQuranReference("baqarah 255")).toMatchObject({
      type: "verse",
      chapter: 2,
      verse: 255,
    });
    expect(parseQuranReference("surah 36")).toMatchObject({
      type: "chapter",
      chapter: 36,
    });
    expect(parseQuranReference("juz 30")).toMatchObject({
      type: "juz",
      juz: 30,
      chapter: 78,
      verse: 1,
    });
    expect(parseQuranReference("page 604")).toMatchObject({
      type: "page",
      page: 604,
      chapter: 112,
    });
    expect(parseQuranReference("2:999")).toBeNull();
    expect(parseQuranReference("juz 31")).toBeNull();
  });

  it("computes global verse numbers accurately across 6,236 verses", () => {
    expect(getTotalQuranVerses()).toBe(6236);
    expect(getGlobalVerseNumber(1, 1)).toBe(1);
    expect(getGlobalVerseNumber(2, 1)).toBe(8);
    expect(getGlobalVerseNumber(114, 6)).toBe(6236);
  });
});

describe("Prayer times (adhan + IANA timezones)", () => {
  it("computes realistic prayer times for Makkah (UmmAlQura), London (MWL), and New York (NorthAmerica)", () => {
    const date = new Date("2025-03-15T12:00:00Z");

    const makkah: SolahConfig = {
      latitude: 21.4225,
      longitude: 39.8262,
      timezone: "Asia/Riyadh",
      method: "UmmAlQura",
      madhab: "shafi",
      highLatitudeRule: "middleOfTheNight",
    };
    const mTimes = computePrayerTimes(makkah, date);
    expect(mTimes.fajr.getTime()).toBeLessThan(mTimes.sunrise.getTime());
    expect(mTimes.sunrise.getTime()).toBeLessThan(mTimes.dhuhr.getTime());
    expect(mTimes.dhuhr.getTime()).toBeLessThan(mTimes.asr.getTime());
    expect(mTimes.asr.getTime()).toBeLessThan(mTimes.maghrib.getTime());
    expect(mTimes.maghrib.getTime()).toBeLessThan(mTimes.isha.getTime());
    // Umm al-Qura Isha is 90 minutes after Maghrib (outside Ramadan)
    const formattedMakkahDhuhr = formatTimeInZone(mTimes.dhuhr, "Asia/Riyadh", "en");
    expect(formattedMakkahDhuhr).toMatch(/12:\d{2}\s*PM/i);

    const london: SolahConfig = {
      latitude: 51.5074,
      longitude: -0.1278,
      timezone: "Europe/London",
      method: "MuslimWorldLeague",
      madhab: "shafi",
      highLatitudeRule: "middleOfTheNight",
    };
    const lTimes = computePrayerTimes(london, date);
    const lHanafi = computePrayerTimes({ ...london, madhab: "hanafi" }, date);
    // Hanafi Asr is strictly later than Shafi Asr
    expect(lHanafi.asr.getTime()).toBeGreaterThan(lTimes.asr.getTime());

    const nyc: SolahConfig = {
      latitude: 40.7128,
      longitude: -74.006,
      timezone: "America/New_York",
      method: "NorthAmerica",
      madhab: "shafi",
      highLatitudeRule: "middleOfTheNight",
    };
    const nTimes = computePrayerTimes(nyc, date);
    const nyDhuhr = formatTimeInZone(nTimes.dhuhr, "America/New_York", "en");
    // In mid-March EDT (UTC-4), solar noon in NYC is around 1:05 PM
    expect(nyDhuhr).toMatch(/01:\d{2}\s*PM/i);
  });
});

describe("Qiblah calculation", () => {
  it("computes accurate bearing and distance for London and New York", () => {
    const londonBearing = computeQiblahBearing(51.5074, -0.1278);
    expect(londonBearing).toBeGreaterThan(117);
    expect(londonBearing).toBeLessThan(120);

    const londonDist = computeDistanceToKaabaKm(51.5074, -0.1278);
    expect(londonDist).toBeGreaterThan(4750);
    expect(londonDist).toBeLessThan(4850);

    const nyBearing = computeQiblahBearing(40.7128, -74.006);
    expect(nyBearing).toBeGreaterThan(57);
    expect(nyBearing).toBeLessThan(60);
  });
});

describe("Hijri calendar conversions & edge cases", () => {
  it("supports +/-1 day moon-sighting offset and year rollover", () => {
    const base = new Date(2025, 2, 15, 12, 0, 0);
    const h0 = gregorianToHijri(base, 0);
    const hPlus = gregorianToHijri(base, 1);
    const hMinus = gregorianToHijri(base, -1);

    expect(hPlus.iDay).not.toBe(h0.iDay);
    expect(hMinus.iDay).not.toBe(h0.iDay);

    expect(stepHijriMonth(1446, 12, 1)).toEqual({ iYear: 1447, iMonth: 1 });
    expect(stepHijriMonth(1446, 1, -1)).toEqual({ iYear: 1445, iMonth: 12 });

    const grid = getHijriMonthGrid(1446, 9, 0, base);
    expect(grid.daysInMonth).toBeGreaterThanOrEqual(29);
    expect(grid.daysInMonth).toBeLessThanOrEqual(30);
    expect(grid.monthEvents.some((e) => e.event.key === "ramadanStart")).toBe(true);
    expect(grid.monthEvents.some((e) => e.event.key === "laylatAlQadr")).toBe(true);
  });
});

describe("ReminderScheduler (wake-safe, DST-safe, midnight-safe)", () => {
  const baseInput: SchedulerInput = {
    solahConfig: {
      latitude: 40.7128,
      longitude: -74.006,
      timezone: "America/New_York",
      method: "NorthAmerica",
      madhab: "shafi",
      highLatitudeRule: "middleOfTheNight",
    },
    prayerReminders: {
      fajr: { enabled: true, adhan: true, advanceMinutes: 10 },
      dhuhr: { enabled: true, adhan: false, advanceMinutes: 0 },
      asr: { enabled: false, adhan: false, advanceMinutes: 0 },
      maghrib: { enabled: false, adhan: false, advanceMinutes: 0 },
      isha: { enabled: false, adhan: false, advanceMinutes: 0 },
    },
    dailyReadingReminder: false,
    dailyReadingTime: "08:00",
    fridayKahfReminder: false,
  };

  it("fires advance and exact prayer notifications once without duplicates", () => {
    const scheduler = new ReminderScheduler(120_000);
    const day = new Date("2025-03-08T12:00:00Z"); // Day before US DST spring-forward
    const times = computePrayerTimes(baseInput.solahConfig, day);

    // 10 minutes before Fajr
    const advTime = new Date(times.fajr.getTime() - 10 * 60_000 + 5_000);
    const ev1 = scheduler.tick(advTime, baseInput);
    expect(ev1).toHaveLength(1);
    expect(ev1[0]?.kind).toBe("prayer-advance");
    expect(ev1[0]?.playAdhan).toBe(false);

    // Second tick 20s later must NOT duplicate
    const evDup = scheduler.tick(new Date(advTime.getTime() + 20_000), baseInput);
    expect(evDup).toHaveLength(0);

    // Exact Fajr time
    const fajrNow = new Date(times.fajr.getTime() + 5_000);
    const ev2 = scheduler.tick(fajrNow, baseInput);
    expect(ev2).toHaveLength(1);
    expect(ev2[0]?.kind).toBe("prayer");
    expect(ev2[0]?.playAdhan).toBe(true);
  });

  it("does not fire stale notifications after a multi-hour sleep/wake gap", () => {
    const scheduler = new ReminderScheduler(120_000);
    const day = new Date("2025-03-09T12:00:00Z"); // US DST spring-forward day
    const times = computePrayerTimes(baseInput.solahConfig, day);

    // Initial tick before Fajr
    scheduler.tick(new Date(times.fajr.getTime() - 30 * 60_000), baseInput);

    // Machine sleeps for 6 hours and wakes up well after Dhuhr
    const afterSleep = new Date(times.dhuhr.getTime() + 30 * 60_000);
    const events = scheduler.tick(afterSleep, baseInput);
    expect(events).toHaveLength(0);
  });

  it("recomputes and fires cleanly after midnight rollover across DST", () => {
    const scheduler = new ReminderScheduler(120_000);
    const day1 = new Date("2025-03-08T12:00:00Z");
    const day2 = new Date("2025-03-09T12:00:00Z"); // DST change
    const t1 = computePrayerTimes(baseInput.solahConfig, day1);
    const t2 = computePrayerTimes(baseInput.solahConfig, day2);

    const e1 = scheduler.tick(new Date(t1.dhuhr.getTime() + 5_000), baseInput);
    expect(e1).toHaveLength(1);

    const e2 = scheduler.tick(new Date(t2.dhuhr.getTime() + 5_000), baseInput);
    expect(e2).toHaveLength(1);
    expect(e2[0]?.prayer).toBe("dhuhr");
  });
});

describe("Downloads store (progress guards, concurrency, cancel)", () => {
  beforeEach(() => {
    useDownloadsStore.setState({ items: {}, hydrated: true });
  });

  it("guards against zero or null totalBytes", () => {
    expect(safeComputeProgress(100, null)).toBe(0);
    expect(safeComputeProgress(100, 0)).toBe(0);
    expect(safeComputeProgress(50, 200)).toBe(0.25);
    expect(safeComputeProgress(300, 200)).toBe(1);
  });

  it("tracks progress updates and cancellation functionally without stale state", async () => {
    useDownloadsStore.setState({
      items: {
        "r1:1": {
          id: "r1:1",
          reciterId: "r1",
          reciterName: "Reciter",
          chapter: 1,
          surahName: "Al-Fatihah",
          url: "https://example.com/001.mp3",
          relativePath: "downloads/r1-1.mp3",
          localPath: null,
          bytes: 0,
          status: "downloading",
          progress: 0,
          updatedAt: Date.now(),
        },
      },
    });

    useDownloadsStore.getState().updateProgress("r1:1", 500, 1000);
    expect(useDownloadsStore.getState().items["r1:1"]?.progress).toBe(0.5);

    await useDownloadsStore.getState().cancelDownload("r1:1");
    expect(useDownloadsStore.getState().items["r1:1"]?.status).toBe("cancelled");

    // Progress updates after cancel are ignored
    useDownloadsStore.getState().updateProgress("r1:1", 900, 1000);
    expect(useDownloadsStore.getState().items["r1:1"]?.status).toBe("cancelled");
    expect(useDownloadsStore.getState().items["r1:1"]?.progress).toBe(0.5);
  });
});
