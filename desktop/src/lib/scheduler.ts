import {
  computePrayerTimes,
  getZonedDateKey,
  getZonedDateParts,
  type PrayerKey,
  type SolahConfig,
} from "./solah";
import type { PrayerReminderConfig } from "../stores/settingsStore";

export interface ScheduledNotificationEvent {
  eventKey: string;
  kind: "prayer" | "prayer-advance" | "daily-reading" | "friday-kahf";
  prayer?: PrayerKey;
  playAdhan: boolean;
  title: string;
  body: string;
}

export interface SchedulerInput {
  solahConfig: SolahConfig;
  prayerReminders: Record<PrayerKey, PrayerReminderConfig>;
  dailyReadingReminder: boolean;
  dailyReadingTime: string; // "HH:MM"
  fridayKahfReminder: boolean;
}

const PRAYER_NAMES: Record<PrayerKey, string> = {
  fajr: "Fajr",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
};

const PRAYER_KEYS: PrayerKey[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

/**
 * Wake-safe, DST-safe, midnight-safe idempotent notification scheduler.
 * Uses a single wall-clock tick comparison (no long setTimeout drift).
 * Tracks fired event keys in memory (pruned by date) so duplicate notifications never fire.
 */
export class ReminderScheduler {
  private firedKeys = new Set<string>();
  private lastTickMs: number | null = null;
  private lastDateKey: string | null = null;

  /**
   * Maximum grace window (in ms) after a scheduled time during which
   * a missed event (e.g. from short timer jitter) still fires.
   * If the computer slept for hours, we do NOT fire stale prayers from 4 hours ago.
   */
  private readonly graceWindowMs: number;

  constructor(graceWindowMs = 120_000) {
    this.graceWindowMs = graceWindowMs;
  }

  public reset(): void {
    this.firedKeys.clear();
    this.lastTickMs = null;
    this.lastDateKey = null;
  }

  public tick(now: Date, input: SchedulerInput): ScheduledNotificationEvent[] {
    const nowMs = now.getTime();
    const tz = input.solahConfig.timezone;
    const todayKey = getZonedDateKey(now, tz);

    // Midnight rollover: prune old fired keys
    if (this.lastDateKey && this.lastDateKey !== todayKey) {
      for (const k of Array.from(this.firedKeys)) {
        if (!k.startsWith(todayKey)) {
          this.firedKeys.delete(k);
        }
      }
    }
    this.lastDateKey = todayKey;

    // On first tick or after long sleep (> 10 minutes gap), only consider events
    // within the grace window around `now`, avoiding stale notification storms on wake.
    const effectiveWindowStart =
      this.lastTickMs === null || nowMs - this.lastTickMs > 600_000
        ? nowMs - this.graceWindowMs
        : Math.min(this.lastTickMs, nowMs - 1000);

    this.lastTickMs = nowMs;

    const events: ScheduledNotificationEvent[] = [];
    const times = computePrayerTimes(input.solahConfig, now, 0);

    for (const key of PRAYER_KEYS) {
      const cfg = input.prayerReminders[key];
      if (!cfg?.enabled) continue;

      const prayerMs = times[key].getTime();
      const label = PRAYER_NAMES[key];

      // 1. Exact prayer time event
      const exactKey = `${todayKey}:${key}:0`;
      if (
        !this.firedKeys.has(exactKey) &&
        prayerMs >= effectiveWindowStart &&
        prayerMs <= nowMs
      ) {
        this.firedKeys.add(exactKey);
        events.push({
          eventKey: exactKey,
          kind: "prayer",
          prayer: key,
          playAdhan: cfg.adhan,
          title: `${label} Prayer Time`,
          body: `It is now time for ${label} prayer.`,
        });
      }

      // 2. Advance reminder (5/10/15/30 min before)
      if (cfg.advanceMinutes > 0) {
        const advMs = prayerMs - cfg.advanceMinutes * 60_000;
        const advKey = `${todayKey}:${key}:-${cfg.advanceMinutes}`;
        if (
          !this.firedKeys.has(advKey) &&
          advMs >= effectiveWindowStart &&
          advMs <= nowMs
        ) {
          this.firedKeys.add(advKey);
          events.push({
            eventKey: advKey,
            kind: "prayer-advance",
            prayer: key,
            playAdhan: false,
            title: `${label} in ${cfg.advanceMinutes} minutes`,
            body: `Prepare for ${label} prayer.`,
          });
        }
      }
    }

    // 3. Daily Quran reading reminder (in user's local/selected timezone)
    const parts = getZonedDateParts(now, tz);
    if (input.dailyReadingReminder && input.dailyReadingTime) {
      const [hStr, mStr] = input.dailyReadingTime.split(":");
      const targetH = Number(hStr);
      const targetM = Number(mStr);
      if (!Number.isNaN(targetH) && !Number.isNaN(targetM)) {
        const dailyKey = `${todayKey}:daily-reading:${input.dailyReadingTime}`;
        if (
          !this.firedKeys.has(dailyKey) &&
          parts.hour === targetH &&
          parts.minute >= targetM &&
          parts.minute <= targetM + 1
        ) {
          this.firedKeys.add(dailyKey);
          events.push({
            eventKey: dailyKey,
            kind: "daily-reading",
            playAdhan: false,
            title: "Daily Quran Reading",
            body: "Take a few quiet minutes to read and reflect on the Quran today.",
          });
        }
      }
    }

    // 4. Friday Surah al-Kahf reminder (Fridays at 09:00)
    if (input.fridayKahfReminder && parts.weekday === 5) {
      const kahfKey = `${todayKey}:friday-kahf`;
      if (
        !this.firedKeys.has(kahfKey) &&
        parts.hour === 9 &&
        parts.minute <= 2
      ) {
        this.firedKeys.add(kahfKey);
        events.push({
          eventKey: kahfKey,
          kind: "friday-kahf",
          playAdhan: false,
          title: "Jumu'ah Mubarak — Surah al-Kahf",
          body: "Remember to recite Surah al-Kahf today.",
        });
      }
    }

    return events;
  }
}
