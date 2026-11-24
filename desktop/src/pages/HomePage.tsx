import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  BookOpen,
  Headphones,
  Clock,
  Compass,
  Sparkles,
  CalendarDays,
  Layers,
  Bookmark,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { useI18n } from "../hooks/useI18n";
import { useSettingsStore, getActivePlace } from "../stores/settingsStore";
import { useReadingStore } from "../stores/readingStore";
import {
  getAyahOfTheDay,
  getChapterMetadata,
  getFirstVerseForJuz,
  getVerseText,
  getVersesCount,
} from "../lib/quran";
import { loadTranslationPack, type TranslationData } from "../data/translations";
import {
  computeNextPrayer,
  formatCountdown,
  formatTimeInZone,
  type SolahConfig,
} from "../lib/solah";
import { formatHijriDate } from "../lib/hijri";
import { Button, Dialog } from "../components/ui";

export const HomePage: React.FC = () => {
  const { dict, fmt, num, lang, isRTL } = useI18n();
  const navigate = useNavigate();

  const places = useSettingsStore((s) => s.places);
  const activePlaceId = useSettingsStore((s) => s.activePlaceId);
  const calculationMethod = useSettingsStore((s) => s.calculationMethod);
  const madhab = useSettingsStore((s) => s.madhab);
  const highLatitudeRule = useSettingsStore((s) => s.highLatitudeRule);
  const adjustments = useSettingsStore((s) => s.adjustments);
  const hijriOffsetDays = useSettingsStore((s) => s.hijriOffsetDays);
  const translationPackId = useSettingsStore((s) => s.translationPackId);

  const lastRead = useReadingStore((s) => s.lastRead);

  const [now, setNow] = useState(() => new Date());
  const [juzModalOpen, setJuzModalOpen] = useState(false);
  const [translationData, setTranslationData] = useState<TranslationData | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    void loadTranslationPack(translationPackId).then(setTranslationData);
  }, [translationPackId]);

  const place = getActivePlace({ places, activePlaceId });

  const solahConfig: SolahConfig = useMemo(
    () => ({
      latitude: place.latitude,
      longitude: place.longitude,
      timezone: place.timezone,
      method: calculationMethod,
      madhab,
      highLatitudeRule,
      adjustments,
    }),
    [place, calculationMethod, madhab, highLatitudeRule, adjustments],
  );

  const nextPrayer = useMemo(() => computeNextPrayer(solahConfig, now), [solahConfig, now]);
  const countdown = formatCountdown(nextPrayer.time, now);

  const greeting = useMemo(() => {
    const h = now.getHours();
    if (h < 5) return dict.home.greetingNight;
    if (h < 12) return dict.home.greetingMorning;
    if (h < 17) return dict.home.greetingAfternoon;
    return dict.home.greetingEvening;
  }, [now, dict]);

  const gregorianDate = new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);
  const hijriDate = formatHijriDate(now, lang, hijriOffsetDays);

  const dailyAyah = useMemo(() => getAyahOfTheDay(now), [now]);
  const dailyMeta = getChapterMetadata(dailyAyah.chapter);
  const dailyArabic = getVerseText(dailyAyah.chapter, dailyAyah.verse) ?? "";
  const dailyTrans = translationData?.[dailyAyah.chapter]?.[dailyAyah.verse] ?? null;

  const lastReadMeta = lastRead ? getChapterMetadata(lastRead.chapter) : null;
  const lastReadPercent = lastRead
    ? Math.round((lastRead.verse / Math.max(1, getVersesCount(lastRead.chapter))) * 100)
    : 0;

  const quickLinks = [
    { to: "/quran", label: dict.nav.quran, icon: BookOpen },
    { to: "/audio", label: dict.nav.audio, icon: Headphones },
    { to: "/hifz", label: dict.nav.hifz, icon: Layers },
    { to: "/adhkaar", label: dict.nav.adhkaar, icon: Sparkles },
    { to: "/prayer-times", label: dict.nav.prayerTimes, icon: Clock },
    { to: "/qiblah", label: dict.nav.qiblah, icon: Compass },
    { to: "/hijri", label: dict.nav.hijri, icon: CalendarDays },
    { to: "/bookmarks", label: dict.nav.bookmarks, icon: Bookmark },
  ];

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;
  const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

  const jumpToJuz = (juz: number) => {
    const ref = getFirstVerseForJuz(juz);
    if (ref) {
      setJuzModalOpen(false);
      navigate(`/quran/${ref.chapter}?verse=${ref.verse}`);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[760px] px-8 py-8 space-y-8">
        {/* Top Greeting + Next Prayer */}
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--color-border)] pb-6">
          <div>
            <h1 className="text-[28px] font-bold tracking-tight text-[var(--color-text)]">
              {greeting}
            </h1>
            <p className="mt-1 text-[13px] text-[var(--color-text-muted)]">
              {gregorianDate} · <span className="text-[var(--color-text)]">{hijriDate}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/prayer-times")}
            className="text-end hover:opacity-85 transition-opacity cursor-pointer"
          >
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-accent-text)]">
              {dict.home.nextPrayer} · {place.name}
            </div>
            <div className="mt-0.5 flex items-baseline justify-end gap-2">
              <span className="text-[18px] font-bold text-[var(--color-text)]">
                {dict.prayer[nextPrayer.key]}
              </span>
              <span className="text-[14px] tabular-nums text-[var(--color-primary)] font-medium">
                {formatTimeInZone(nextPrayer.time, place.timezone, lang)}
              </span>
              <span className="text-[13px] tabular-nums text-[var(--color-text-muted)]">
                ({countdown})
              </span>
            </div>
          </button>
        </header>

        {/* Continue Reading Row */}
        <section aria-label={dict.home.continueReading} className="border-b border-[var(--color-border)] pb-6">
          <div className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            {dict.home.continueReading}
          </div>
          {lastRead && lastReadMeta ? (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-3">
                  <span className="font-quran text-[24px] leading-none text-[var(--color-text)]">
                    {lastReadMeta.arabicname}
                  </span>
                  <span className="text-[16px] font-semibold text-[var(--color-text)]">
                    {lastReadMeta.name}
                  </span>
                </div>
                <p className="mt-1 text-[13px] text-[var(--color-text-muted)]">
                  {fmt(dict.home.resumeAt, {
                    verse: num(lastRead.verse),
                    juz: num(lastRead.juz),
                    page: num(lastRead.page),
                  })}
                </p>
                <div className="mt-2.5 flex items-center gap-3 max-w-sm">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
                    <div
                      className="h-full bg-[var(--color-primary)]"
                      style={{ width: `${lastReadPercent}%` }}
                    />
                  </div>
                  <span className="text-[12px] tabular-nums text-[var(--color-text-muted)]">
                    {fmt(dict.home.progressThrough, { percent: num(lastReadPercent) })}
                  </span>
                </div>
              </div>
              <Button
                variant="primary"
                onClick={() =>
                  navigate(`/quran/${lastRead.chapter}?verse=${lastRead.verse}`)
                }
              >
                {dict.common.resume}
                <ArrowIcon size={15} strokeWidth={1.75} />
              </Button>
            </div>
          ) : (
            <div className="mt-3 flex items-center justify-between gap-4">
              <p className="text-[14px] text-[var(--color-text-muted)]">
                {dict.home.startReading} — Surah Al-Fatihah
              </p>
              <Button variant="primary" onClick={() => navigate("/quran/1")}>
                {dict.home.openReader}
                <ArrowIcon size={15} strokeWidth={1.75} />
              </Button>
            </div>
          )}
        </section>

        {/* Ayah of the Day */}
        <section aria-label={dict.home.ayahOfDay} className="border-b border-[var(--color-border)] pb-6">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-accent-text)]">
              {dict.home.ayahOfDay}
            </span>
            <span className="text-[13px] text-[var(--color-text-muted)]">
              {dailyMeta?.name} {num(dailyAyah.chapter)}:{num(dailyAyah.verse)}
            </span>
          </div>
          <p
            dir="rtl"
            className="font-quran mt-4 text-right text-[28px] leading-[2.15] text-[var(--color-text)]"
          >
            {dailyArabic}
          </p>
          {dailyTrans && (
            <p
              dir="ltr"
              className="mt-3 text-left text-[15px] leading-relaxed text-[var(--color-text-muted)]"
            >
              {dailyTrans}
            </p>
          )}
          <div className="mt-4">
            <Button
              variant="subtle"
              size="sm"
              onClick={() =>
                navigate(`/quran/${dailyAyah.chapter}?verse=${dailyAyah.verse}`)
              }
            >
              {dict.home.readInContext}
              <ChevronIcon size={14} strokeWidth={1.75} />
            </Button>
          </div>
        </section>

        {/* Quick Access (compact editorial row of text links with icons) */}
        <section aria-label={dict.home.quickAccess} className="border-b border-[var(--color-border)] pb-6">
          <div className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
            {dict.home.quickAccess}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-1 gap-x-4">
            {quickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.to}
                  type="button"
                  onClick={() => navigate(item.to)}
                  className="flex h-9 items-center gap-2.5 rounded-[6px] px-2 text-[14px] text-[var(--color-text)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-primary)] transition-colors cursor-pointer"
                >
                  <Icon
                    size={16}
                    strokeWidth={1.75}
                    className="shrink-0 text-[var(--color-text-muted)]"
                  />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Juz Index */}
        <section aria-label={dict.home.juzIndex}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              {dict.home.juzIndex}
            </span>
            <button
              type="button"
              onClick={() => setJuzModalOpen(true)}
              className="text-[13px] font-medium text-[var(--color-primary)] hover:underline cursor-pointer"
            >
              {dict.home.seeAllJuz}
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 15 }, (_, i) => i + 1).map((juz) => (
              <button
                key={juz}
                type="button"
                onClick={() => jumpToJuz(juz)}
                className="h-8 min-w-[44px] rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[13px] tabular-nums text-[var(--color-text)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors cursor-pointer"
              >
                {num(juz)}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setJuzModalOpen(true)}
              className="h-8 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 text-[13px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] cursor-pointer"
            >
              +15
            </button>
          </div>
        </section>
      </div>

      <Dialog
        open={juzModalOpen}
        onClose={() => setJuzModalOpen(false)}
        title={dict.home.seeAllJuz}
        maxWidth="max-w-lg"
      >
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 30 }, (_, i) => i + 1).map((juz) => (
            <button
              key={juz}
              type="button"
              onClick={() => jumpToJuz(juz)}
              className="flex h-10 items-center justify-center rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] text-[13px] font-medium hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] cursor-pointer"
            >
              {fmt(dict.home.juzLabel, { n: num(juz) })}
            </button>
          ))}
        </div>
      </Dialog>
    </div>
  );
};
