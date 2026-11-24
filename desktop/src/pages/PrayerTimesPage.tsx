import React, { useEffect, useMemo, useState } from "react";
import { MapPin, Volume2, Square, Globe, Trash2, Check, Plus } from "lucide-react";
import {
  CALCULATION_METHODS,
  computeNextPrayer,
  computePrayerTimes,
  defaultMethodForCountry,
  formatCountdown,
  formatTimeInZone,
  isValidTimezone,
  type HighLatitudeRuleId,
  type MadhabId,
  type PrayerKey,
  type PrayerListKey,
  type SolahConfig,
} from "../lib/solah";
import {
  useSettingsStore,
  getActivePlace,
  type SavedPlace,
} from "../stores/settingsStore";
import { useAudioStore } from "../stores/audioStore";
import { httpGetJson } from "../lib/tauri";
import { useI18n } from "../hooks/useI18n";
import { Button, Dialog, Toggle } from "../components/ui";
import citiesRaw from "../data/cities.json";

type CompactCity = [string, string, number, number, string];
const CITIES = citiesRaw as CompactCity[];

const PRAYER_ROWS: PrayerListKey[] = [
  "fajr",
  "sunrise",
  "dhuhr",
  "asr",
  "maghrib",
  "isha",
];

const REMINDABLE_KEYS: PrayerKey[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

export const PrayerTimesPage: React.FC = () => {
  const { dict, fmt, lang } = useI18n();
  const places = useSettingsStore((s) => s.places);
  const activePlaceId = useSettingsStore((s) => s.activePlaceId);
  const calculationMethod = useSettingsStore((s) => s.calculationMethod);
  const madhab = useSettingsStore((s) => s.madhab);
  const highLatitudeRule = useSettingsStore((s) => s.highLatitudeRule);
  const adjustments = useSettingsStore((s) => s.adjustments);
  const prayerReminders = useSettingsStore((s) => s.prayerReminders);

  const addPlace = useSettingsStore((s) => s.addPlace);
  const removePlace = useSettingsStore((s) => s.removePlace);
  const setActivePlace = useSettingsStore((s) => s.setActivePlace);
  const updateSettings = useSettingsStore((s) => s.update);
  const updatePrayerReminder = useSettingsStore((s) => s.updatePrayerReminder);
  const updateAdjustment = useSettingsStore((s) => s.updateAdjustment);
  const showToast = useSettingsStore((s) => s.showToast);

  const isAdhanPlaying = useAudioStore((s) => s.isAdhanPlaying);
  const playAdhan = useAudioStore((s) => s.playAdhan);
  const stopAdhan = useAudioStore((s) => s.stopAdhan);

  const [now, setNow] = useState(() => new Date());
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [cityQuery, setCityQuery] = useState("");
  const [detectingIp, setDetectingIp] = useState(false);

  // Manual coordinates form
  const [manualName, setManualName] = useState("");
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");
  const [manualTz, setManualTz] = useState(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  );

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

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

  const todayTimes = useMemo(() => computePrayerTimes(solahConfig, now, 0), [solahConfig, now]);
  const tomorrowTimes = useMemo(() => computePrayerTimes(solahConfig, now, 1), [solahConfig, now]);
  const nextPrayer = useMemo(() => computeNextPrayer(solahConfig, now), [solahConfig, now]);
  const countdown = formatCountdown(nextPrayer.time, now);

  const matchingCities = useMemo(() => {
    const q = cityQuery.trim().toLowerCase();
    if (!q) return CITIES.slice(0, 12);
    return CITIES.filter(
      (c) => c[0].toLowerCase().includes(q) || c[1].toLowerCase().includes(q),
    ).slice(0, 20);
  }, [cityQuery]);

  const handleDetectFromIp = async () => {
    setDetectingIp(true);
    try {
      const data = await httpGetJson<{
        city?: string;
        country_code?: string;
        latitude?: number;
        longitude?: number;
        timezone?: string;
      }>("https://ipapi.co/json/");
      if (data.latitude !== undefined && data.longitude !== undefined) {
        const tz = data.timezone && isValidTimezone(data.timezone) ? data.timezone : "UTC";
        const newPlace: SavedPlace = {
          id: `ip-${data.city ?? "loc"}-${data.latitude.toFixed(2)}`.toLowerCase(),
          name: data.city || "Detected location",
          country: data.country_code || "",
          latitude: data.latitude,
          longitude: data.longitude,
          timezone: tz,
        };
        addPlace(newPlace, true);
        if (data.country_code) {
          updateSettings({ calculationMethod: defaultMethodForCountry(data.country_code) });
        }
        showToast(`${newPlace.name} (${tz})`, "success");
        setLocationDialogOpen(false);
      }
    } catch {
      showToast(dict.common.networkError, "error");
    } finally {
      setDetectingIp(false);
    }
  };

  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = Number(manualLat);
    const lng = Number(manualLng);
    if (Number.isNaN(lat) || Number.isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      showToast("Enter valid latitude (-90..90) and longitude (-180..180).", "error");
      return;
    }
    if (!isValidTimezone(manualTz)) {
      showToast("Enter a valid IANA timezone (e.g. America/New_York).", "error");
      return;
    }
    const newPlace: SavedPlace = {
      id: `manual-${Date.now()}`,
      name: manualName.trim() || `${lat.toFixed(2)}, ${lng.toFixed(2)}`,
      country: "",
      latitude: lat,
      longitude: lng,
      timezone: manualTz,
    };
    addPlace(newPlace, true);
    setManualName("");
    setManualLat("");
    setManualLng("");
    setLocationDialogOpen(false);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[820px] px-8 py-8 space-y-8">
        {/* Top Next Prayer Hero */}
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--color-border)] pb-6">
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-accent-text)]">
              {place.name}
              {place.country ? `, ${place.country}` : ""} · {place.timezone}
            </div>
            <h1 className="mt-1 text-[28px] font-bold tracking-tight tabular-nums">
              {fmt(dict.prayer.nextHeader, {
                prayer: dict.prayer[nextPrayer.key],
                countdown,
              })}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="subtle"
              size="sm"
              onClick={() => (isAdhanPlaying ? stopAdhan() : playAdhan())}
            >
              {isAdhanPlaying ? <Square size={14} /> : <Volume2 size={14} />}
              {isAdhanPlaying ? dict.prayer.stopAdhan : dict.prayer.testAdhan}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setLocationDialogOpen(true)}
            >
              <MapPin size={14} />
              {dict.prayer.location}
            </Button>
          </div>
        </header>

        {/* Today's 6 Prayer Times Table */}
        <section aria-label={dict.prayer.todaySchedule}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              {dict.prayer.todaySchedule}
            </h2>
            <span className="text-[12px] text-[var(--color-text-muted)]">
              {dict.prayer.tomorrowPreview}: {dict.prayer.fajr}{" "}
              {formatTimeInZone(tomorrowTimes.fajr, place.timezone, lang)}
            </span>
          </div>

          <div className="divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
            {PRAYER_ROWS.map((key) => {
              const isSunrise = key === "sunrise";
              const isNext = !nextPrayer.isTomorrow && nextPrayer.key === key;
              const remCfg = !isSunrise ? prayerReminders[key] : null;
              return (
                <div
                  key={key}
                  className={`flex flex-wrap items-center justify-between gap-4 px-3 py-3.5 ${
                    isNext
                      ? "bg-[var(--color-primary-tint)] border-s-2 border-s-[var(--color-accent)]"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-[160px]">
                    <span className="text-[15px] font-semibold text-[var(--color-text)]">
                      {dict.prayer[key]}
                    </span>
                    <span className="text-[15px] tabular-nums font-medium text-[var(--color-primary)]">
                      {formatTimeInZone(todayTimes[key], place.timezone, lang)}
                    </span>
                  </div>

                  {isSunrise ? (
                    <span className="text-[12px] text-[var(--color-text-muted)]">
                      {dict.prayer.informational}
                    </span>
                  ) : (
                    remCfg && (
                      <div className="flex flex-wrap items-center gap-4">
                        <label className="flex items-center gap-2 text-[12px] text-[var(--color-text-muted)]">
                          <span>{dict.prayer.reminder}</span>
                          <Toggle
                            checked={remCfg.enabled}
                            onChange={(v) => updatePrayerReminder(key, { enabled: v })}
                            ariaLabel={`${dict.prayer[key]} ${dict.prayer.reminder}`}
                          />
                        </label>

                        <label className="flex items-center gap-2 text-[12px] text-[var(--color-text-muted)]">
                          <span>{dict.prayer.adhanAudio}</span>
                          <Toggle
                            checked={remCfg.adhan}
                            disabled={!remCfg.enabled}
                            onChange={(v) => updatePrayerReminder(key, { adhan: v })}
                            ariaLabel={`${dict.prayer[key]} ${dict.prayer.adhanAudio}`}
                          />
                        </label>

                        <select
                          aria-label={`${dict.prayer[key]} advance reminder`}
                          disabled={!remCfg.enabled}
                          value={remCfg.advanceMinutes}
                          onChange={(e) =>
                            updatePrayerReminder(key, {
                              advanceMinutes: Number(e.target.value) as 0 | 5 | 10 | 15 | 30,
                            })
                          }
                          className="h-8 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-[12px] disabled:opacity-45"
                        >
                          <option value={0}>{dict.prayer.advanceOff}</option>
                          <option value={5}>{fmt(dict.prayer.advanceMin, { n: 5 })}</option>
                          <option value={10}>{fmt(dict.prayer.advanceMin, { n: 10 })}</option>
                          <option value={15}>{fmt(dict.prayer.advanceMin, { n: 15 })}</option>
                          <option value={30}>{fmt(dict.prayer.advanceMin, { n: 30 })}</option>
                        </select>
                      </div>
                    )
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Calculation Settings */}
        <section aria-label={dict.prayer.calculationSettings} className="space-y-4">
          <h2 className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            {dict.prayer.calculationSettings}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="space-y-1.5">
              <span className="text-[13px] font-medium">{dict.prayer.method}</span>
              <select
                value={calculationMethod}
                onChange={(e) =>
                  updateSettings({
                    calculationMethod: e.target.value as SolahConfig["method"],
                  })
                }
                className="h-9 w-full rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 text-[13px]"
              >
                {CALCULATION_METHODS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="text-[13px] font-medium">{dict.prayer.madhab}</span>
              <select
                value={madhab}
                onChange={(e) => updateSettings({ madhab: e.target.value as MadhabId })}
                className="h-9 w-full rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 text-[13px]"
              >
                <option value="shafi">{dict.prayer.madhabShafi}</option>
                <option value="hanafi">{dict.prayer.madhabHanafi}</option>
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="text-[13px] font-medium">{dict.prayer.highLatRule}</span>
              <select
                value={highLatitudeRule}
                onChange={(e) =>
                  updateSettings({
                    highLatitudeRule: e.target.value as HighLatitudeRuleId,
                  })
                }
                className="h-9 w-full rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 text-[13px]"
              >
                <option value="middleOfTheNight">{dict.prayer.highLatMiddle}</option>
                <option value="seventhOfTheNight">{dict.prayer.highLatSeventh}</option>
                <option value="twilightAngle">{dict.prayer.highLatTwilight}</option>
              </select>
            </label>
          </div>

          {/* Per-prayer minute adjustments */}
          <div className="pt-2">
            <div className="text-[13px] font-medium mb-2">{dict.prayer.adjustments}</div>
            <div className="grid grid-cols-5 gap-2">
              {REMINDABLE_KEYS.map((key) => (
                <label key={key} className="space-y-1">
                  <span className="text-[12px] text-[var(--color-text-muted)]">
                    {dict.prayer[key]}
                  </span>
                  <input
                    type="number"
                    min={-60}
                    max={60}
                    value={adjustments[key]}
                    onChange={(e) => updateAdjustment(key, Number(e.target.value))}
                    className="h-8 w-full rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-center text-[13px] tabular-nums"
                  />
                </label>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Location Picker Dialog */}
      <Dialog
        open={locationDialogOpen}
        onClose={() => setLocationDialogOpen(false)}
        title={dict.prayer.location}
        maxWidth="max-w-xl"
      >
        <div className="space-y-5">
          {/* Saved places */}
          {places.length > 0 && (
            <div>
              <div className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
                {dict.prayer.savedPlaces}
              </div>
              <div className="divide-y divide-[var(--color-border)] rounded-[8px] border border-[var(--color-border)]">
                {places.map((p) => {
                  const active = p.id === place.id;
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between px-3 py-2 text-[13px]"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setActivePlace(p.id);
                          setLocationDialogOpen(false);
                        }}
                        className="flex flex-1 items-center gap-2 text-start cursor-pointer"
                      >
                        <MapPin size={14} className="text-[var(--color-primary)]" />
                        <span className={active ? "font-semibold" : ""}>
                          {p.name}
                          {p.country ? `, ${p.country}` : ""}
                        </span>
                        <span className="text-[12px] text-[var(--color-text-muted)]">
                          ({p.timezone})
                        </span>
                      </button>
                      <div className="flex items-center gap-1">
                        {active && <Check size={14} className="text-[var(--color-primary)]" />}
                        {places.length > 1 && (
                          <Button
                            variant="icon"
                            size="sm"
                            onClick={() => removePlace(p.id)}
                            aria-label={dict.common.delete}
                            className="h-7 w-7"
                          >
                            <Trash2 size={13} />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Offline city search */}
          <div className="space-y-2">
            <input
              type="text"
              value={cityQuery}
              onChange={(e) => setCityQuery(e.target.value)}
              placeholder={dict.prayer.searchCityPlaceholder}
              className="h-9 w-full rounded-[6px] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-[13px]"
            />
            <div className="max-h-44 overflow-y-auto divide-y divide-[var(--color-border)] rounded-[8px] border border-[var(--color-border)]">
              {matchingCities.map((c) => {
                const id = `${c[0]}-${c[1]}-${c[2]}`.toLowerCase();
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      addPlace(
                        {
                          id,
                          name: c[0],
                          country: c[1],
                          latitude: c[2],
                          longitude: c[3],
                          timezone: c[4],
                        },
                        true,
                      );
                      updateSettings({ calculationMethod: defaultMethodForCountry(c[1]) });
                      setLocationDialogOpen(false);
                    }}
                    className="flex w-full items-center justify-between px-3 py-2 text-start text-[13px] hover:bg-[var(--color-surface-2)] cursor-pointer"
                  >
                    <span>
                      {c[0]}, {c[1]}
                    </span>
                    <span className="text-[12px] text-[var(--color-text-muted)]">
                      {c[4]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional IP lookup */}
          <div className="flex items-center justify-between gap-3 rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3">
            <div className="text-[12px] text-[var(--color-text-muted)]">
              {dict.prayer.detectByIpNote}
            </div>
            <Button
              variant="subtle"
              size="sm"
              disabled={detectingIp}
              onClick={() => void handleDetectFromIp()}
              className="shrink-0"
            >
              <Globe size={14} />
              {detectingIp ? dict.common.loading : dict.prayer.detectByIp}
            </Button>
          </div>

          {/* Manual coordinates */}
          <form onSubmit={handleAddManual} className="space-y-2 border-t border-[var(--color-border)] pt-4">
            <div className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              {dict.prayer.manualCoords}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder={dict.prayer.cityName}
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                className="h-8 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 text-[13px]"
              />
              <input
                type="text"
                placeholder={dict.prayer.timezone}
                value={manualTz}
                onChange={(e) => setManualTz(e.target.value)}
                className="h-8 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 text-[13px]"
              />
              <input
                type="number"
                step="any"
                placeholder={dict.prayer.latitude}
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                className="h-8 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 text-[13px]"
              />
              <input
                type="number"
                step="any"
                placeholder={dict.prayer.longitude}
                value={manualLng}
                onChange={(e) => setManualLng(e.target.value)}
                className="h-8 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 text-[13px]"
              />
            </div>
            <Button variant="subtle" size="sm" type="submit">
              <Plus size={14} /> {dict.prayer.addPlace}
            </Button>
          </form>
        </div>
      </Dialog>
    </div>
  );
};
