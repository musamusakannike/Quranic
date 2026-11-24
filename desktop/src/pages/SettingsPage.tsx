import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { ChevronRight, ChevronLeft, Download, X, Trash2 } from "lucide-react";
import {
  useSettingsStore,
  type ReadingMode,
  type ThemeMode,
} from "../stores/settingsStore";
import { useReadingStore } from "../stores/readingStore";
import { useHifzStore } from "../stores/hifzStore";
import { useDownloadsStore } from "../stores/downloadsStore";
import { getAvailableTranslationPacks } from "../data/translations";
import {
  clearMushafCache,
  resolveMushafPageSrc,
  TOTAL_MUSHAF_PAGES,
} from "../lib/mushaf";
import { dbClearAll } from "../lib/db";
import { getAutostartEnabled, setAutostartEnabled } from "../lib/tauri";
import { useI18n } from "../hooks/useI18n";
import { Button, SegmentedControl, Slider, Toggle } from "../components/ui";

export const SettingsPage: React.FC = () => {
  const { dict, fmt, num, isRTL } = useI18n();
  const navigate = useNavigate();

  const theme = useSettingsStore((s) => s.theme);
  const language = useSettingsStore((s) => s.language);
  const readingMode = useSettingsStore((s) => s.readingMode);
  const showTranslation = useSettingsStore((s) => s.showTranslation);
  const showTransliteration = useSettingsStore((s) => s.showTransliteration);
  const translationPackId = useSettingsStore((s) => s.translationPackId);
  const arabicFontSize = useSettingsStore((s) => s.arabicFontSize);
  const translationFontSize = useSettingsStore((s) => s.translationFontSize);
  const dailyReadingReminder = useSettingsStore((s) => s.dailyReadingReminder);
  const dailyReadingTime = useSettingsStore((s) => s.dailyReadingTime);
  const fridayKahfReminder = useSettingsStore((s) => s.fridayKahfReminder);
  const closeToTray = useSettingsStore((s) => s.closeToTray);

  const setTheme = useSettingsStore((s) => s.setTheme);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const update = useSettingsStore((s) => s.update);
  const resetSettings = useSettingsStore((s) => s.resetSettings);
  const showToast = useSettingsStore((s) => s.showToast);

  const clearAllDownloads = useDownloadsStore((s) => s.clearAllDownloads);
  const resetReading = useReadingStore((s) => s.resetReading);
  const resetHifz = useHifzStore((s) => s.resetHifz);

  const [autostart, setAutostart] = useState(false);
  const [mushafDownloading, setMushafDownloading] = useState(false);
  const [mushafDone, setMushafDone] = useState(0);
  const mushafCancelRef = useRef(false);

  const packs = getAvailableTranslationPacks();

  useEffect(() => {
    void getAutostartEnabled().then(setAutostart);
  }, []);

  const handleToggleAutostart = async (val: boolean) => {
    setAutostart(val);
    try {
      await setAutostartEnabled(val);
    } catch {
      showToast(dict.common.errorGeneric, "error");
    }
  };

  const handleDownloadAllMushaf = async () => {
    mushafCancelRef.current = false;
    setMushafDownloading(true);
    setMushafDone(0);
    for (let p = 1; p <= TOTAL_MUSHAF_PAGES; p++) {
      if (mushafCancelRef.current) break;
      try {
        await resolveMushafPageSrc(p);
        setMushafDone(p);
      } catch {
        // Continue on individual failure or stop if offline
        if (p === 1) {
          showToast(dict.common.networkError, "error");
          break;
        }
      }
    }
    setMushafDownloading(false);
  };

  const handleResetAll = async () => {
    if (!window.confirm(dict.settings.resetConfirm)) return;
    await clearAllDownloads();
    await clearMushafCache();
    await resetReading();
    await resetHifz();
    await dbClearAll();
    await resetSettings();
    showToast(dict.common.done, "success");
  };

  const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[740px] px-8 py-8 space-y-8 pb-16">
        <header className="border-b border-[var(--color-border)] pb-5">
          <h1 className="text-[22px] font-bold tracking-tight">
            {dict.settings.title}
          </h1>
        </header>

        {/* Appearance & Language */}
        <section className="space-y-4 border-b border-[var(--color-border)] pb-6">
          <h2 className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            {dict.settings.appearance}
          </h2>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[14px]">{dict.settings.theme}</span>
            <SegmentedControl<ThemeMode>
              ariaLabel={dict.settings.theme}
              value={theme}
              onChange={setTheme}
              options={[
                { value: "system", label: dict.settings.themeSystem },
                { value: "light", label: dict.settings.themeLight },
                { value: "dark", label: dict.settings.themeDark },
              ]}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[14px]">{dict.settings.language}</span>
            <SegmentedControl<"en" | "ar">
              ariaLabel={dict.settings.language}
              value={language}
              onChange={setLanguage}
              options={[
                { value: "en", label: "English" },
                { value: "ar", label: "العربية" },
              ]}
            />
          </div>
        </section>

        {/* Reading & Typography */}
        <section className="space-y-4 border-b border-[var(--color-border)] pb-6">
          <h2 className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            {dict.settings.reading}
          </h2>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[14px]">{dict.settings.defaultMode}</span>
            <SegmentedControl<ReadingMode>
              ariaLabel={dict.settings.defaultMode}
              value={readingMode}
              onChange={(m) => update({ readingMode: m })}
              options={[
                { value: "list", label: dict.reader.modeList },
                { value: "focus", label: dict.reader.modeFocus },
                { value: "mushaf", label: dict.reader.modeMushaf },
              ]}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[14px]">{dict.settings.showTranslation}</span>
            <Toggle
              checked={showTranslation}
              onChange={(v) => update({ showTranslation: v })}
              ariaLabel={dict.settings.showTranslation}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[14px]">{dict.settings.showTransliteration}</span>
            <Toggle
              checked={showTransliteration}
              onChange={(v) => update({ showTransliteration: v })}
              ariaLabel={dict.settings.showTransliteration}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[14px]">{dict.settings.translationPack}</span>
            <select
              aria-label={dict.settings.translationPack}
              value={translationPackId}
              onChange={(e) => update({ translationPackId: e.target.value })}
              className="h-9 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[13px]"
            >
              {packs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.translator} — {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="text-[14px]">{dict.settings.arabicFontSize}</div>
            <Slider
              ariaLabel={dict.settings.arabicFontSize}
              min={24}
              max={64}
              value={arabicFontSize}
              onChange={(v) => update({ arabicFontSize: v })}
              readout={`${arabicFontSize}px`}
            />
            <p
              dir="rtl"
              className="font-quran text-right text-[var(--color-text)] pt-1"
              style={{ fontSize: `${arabicFontSize}px` }}
            >
              بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
            </p>
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="text-[14px]">{dict.settings.translationFontSize}</div>
            <Slider
              ariaLabel={dict.settings.translationFontSize}
              min={13}
              max={24}
              value={translationFontSize}
              onChange={(v) => update({ translationFontSize: v })}
              readout={`${translationFontSize}px`}
            />
          </div>
        </section>

        {/* Reminders */}
        <section className="space-y-4 border-b border-[var(--color-border)] pb-6">
          <h2 className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            {dict.settings.reminders}
          </h2>

          <div className="flex items-center justify-between">
            <span className="text-[14px]">{dict.settings.dailyReadingReminder}</span>
            <Toggle
              checked={dailyReadingReminder}
              onChange={(v) => update({ dailyReadingReminder: v })}
              ariaLabel={dict.settings.dailyReadingReminder}
            />
          </div>

          {dailyReadingReminder && (
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-[var(--color-text-muted)]">
                {dict.settings.dailyReadingTime}
              </span>
              <input
                type="time"
                aria-label={dict.settings.dailyReadingTime}
                value={dailyReadingTime}
                onChange={(e) => update({ dailyReadingTime: e.target.value })}
                className="h-8 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 text-[13px]"
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-[14px]">{dict.settings.fridayKahfReminder}</span>
            <Toggle
              checked={fridayKahfReminder}
              onChange={(v) => update({ fridayKahfReminder: v })}
              ariaLabel={dict.settings.fridayKahfReminder}
            />
          </div>
        </section>

        {/* Desktop & Tray */}
        <section className="space-y-4 border-b border-[var(--color-border)] pb-6">
          <h2 className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            {dict.settings.desktopBehavior}
          </h2>

          <div className="flex items-center justify-between gap-4">
            <span className="text-[14px]">{dict.settings.closeToTray}</span>
            <Toggle
              checked={closeToTray}
              onChange={(v) => update({ closeToTray: v })}
              ariaLabel={dict.settings.closeToTray}
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-[14px]">{dict.settings.autostart}</span>
            <Toggle
              checked={autostart}
              onChange={(v) => void handleToggleAutostart(v)}
              ariaLabel={dict.settings.autostart}
            />
          </div>
        </section>

        {/* Mushaf Offline Pack */}
        <section className="space-y-3 border-b border-[var(--color-border)] pb-6">
          <h2 className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            {dict.settings.mushafPack}
          </h2>
          <p className="text-[13px] text-[var(--color-text-muted)]">
            {dict.settings.mushafPackDesc}
          </p>
          {mushafDownloading ? (
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
                  <div
                    className="h-full bg-[var(--color-primary)]"
                    style={{
                      width: `${Math.round((mushafDone / TOTAL_MUSHAF_PAGES) * 100)}%`,
                    }}
                  />
                </div>
                <div className="mt-1 text-[12px] text-[var(--color-text-muted)]">
                  {fmt(dict.settings.mushafProgress, {
                    done: num(mushafDone),
                    total: num(TOTAL_MUSHAF_PAGES),
                  })}
                </div>
              </div>
              <Button
                variant="subtle"
                size="sm"
                onClick={() => {
                  mushafCancelRef.current = true;
                }}
              >
                <X size={14} /> {dict.common.cancel}
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="subtle"
                size="sm"
                onClick={() => void handleDownloadAllMushaf()}
              >
                <Download size={14} /> {dict.settings.downloadAllPages}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await clearMushafCache();
                  showToast(dict.common.done, "info");
                }}
              >
                {dict.settings.mushafClear}
              </Button>
            </div>
          )}
        </section>

        {/* Data Management */}
        <section className="space-y-3 border-b border-[var(--color-border)] pb-6">
          <h2 className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            {dict.settings.dataManagement}
          </h2>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="subtle"
              size="sm"
              onClick={async () => {
                await clearAllDownloads();
                showToast(dict.common.done, "info");
              }}
            >
              {dict.settings.clearDownloads}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => void handleResetAll()}
            >
              <Trash2 size={14} /> {dict.settings.resetAll}
            </Button>
          </div>
        </section>

        {/* About & Attributions Link */}
        <button
          type="button"
          onClick={() => navigate("/about")}
          className="flex w-full items-center justify-between rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-[14px] font-medium hover:bg-[var(--color-surface-2)] cursor-pointer"
        >
          <span>{dict.settings.aboutLink}</span>
          <ChevronIcon size={16} className="text-[var(--color-text-muted)]" />
        </button>
      </div>
    </div>
  );
};
