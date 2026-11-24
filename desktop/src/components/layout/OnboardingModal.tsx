import React, { useMemo, useState } from "react";
import { MapPin, Check } from "lucide-react";
import { useI18n } from "../../hooks/useI18n";
import { useSettingsStore, getActivePlace } from "../../stores/settingsStore";
import { CALCULATION_METHODS, defaultMethodForCountry } from "../../lib/solah";
import { Button, Dialog, SegmentedControl } from "../ui";
import citiesRaw from "../../data/cities.json";

type CompactCity = [string, string, number, number, string];
const CITIES = citiesRaw as CompactCity[];

export const OnboardingModal: React.FC = () => {
  const { dict } = useI18n();
  const hydrated = useSettingsStore((s) => s.hydrated);
  const hasCompleted = useSettingsStore((s) => s.hasCompletedOnboarding);
  const language = useSettingsStore((s) => s.language);
  const theme = useSettingsStore((s) => s.theme);
  const method = useSettingsStore((s) => s.calculationMethod);
  const places = useSettingsStore((s) => s.places);
  const activePlaceId = useSettingsStore((s) => s.activePlaceId);

  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const addPlace = useSettingsStore((s) => s.addPlace);
  const update = useSettingsStore((s) => s.update);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [cityQuery, setCityQuery] = useState("");

  const activePlace = getActivePlace({ places, activePlaceId });

  const matchingCities = useMemo(() => {
    const q = cityQuery.trim().toLowerCase();
    if (!q) return CITIES.slice(0, 8);
    return CITIES.filter(
      (c) =>
        c[0].toLowerCase().includes(q) || c[1].toLowerCase().includes(q),
    ).slice(0, 10);
  }, [cityQuery]);

  if (!hydrated || hasCompleted) return null;

  const finish = () => update({ hasCompletedOnboarding: true });

  return (
    <Dialog
      open
      onClose={finish}
      title={
        step === 1
          ? dict.onboarding.step1Title
          : step === 2
            ? dict.onboarding.step2Title
            : dict.onboarding.step3Title
      }
      maxWidth="max-w-lg"
    >
      <div className="space-y-5">
        <p className="text-[13px] text-[var(--color-text-muted)]">
          {step === 1
            ? dict.onboarding.step1Desc
            : step === 2
              ? dict.onboarding.step2Desc
              : dict.onboarding.step3Desc}
        </p>

        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-medium">{dict.settings.language}</span>
              <SegmentedControl
                ariaLabel={dict.settings.language}
                value={language}
                onChange={setLanguage}
                options={[
                  { value: "en", label: "English" },
                  { value: "ar", label: "العربية" },
                ]}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-medium">{dict.settings.theme}</span>
              <SegmentedControl
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
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <input
              type="text"
              value={cityQuery}
              onChange={(e) => setCityQuery(e.target.value)}
              placeholder={dict.prayer.searchCityPlaceholder}
              className="h-9 w-full rounded-[6px] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-[14px]"
            />
            <div className="max-h-56 overflow-y-auto divide-y divide-[var(--color-border)] rounded-[8px] border border-[var(--color-border)]">
              {matchingCities.map((c) => {
                const id = `${c[0]}-${c[1]}-${c[2]}`.toLowerCase();
                const selected = activePlace.id === id;
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
                      update({ calculationMethod: defaultMethodForCountry(c[1]) });
                    }}
                    className={`flex w-full items-center justify-between px-3 py-2 text-start text-[13px] cursor-pointer hover:bg-[var(--color-surface-2)] ${
                      selected ? "bg-[var(--color-primary-tint)] font-semibold" : ""
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <MapPin size={14} className="text-[var(--color-primary)]" />
                      {c[0]}, {c[1]}
                    </span>
                    <span className="flex items-center gap-2 text-[12px] text-[var(--color-text-muted)]">
                      {c[4]}
                      {selected && <Check size={14} className="text-[var(--color-primary)]" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="max-h-60 overflow-y-auto divide-y divide-[var(--color-border)] rounded-[8px] border border-[var(--color-border)]">
            {CALCULATION_METHODS.map((m) => {
              const selected = method === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => update({ calculationMethod: m.id })}
                  className={`flex w-full items-center justify-between px-3.5 py-2.5 text-start text-[13px] cursor-pointer hover:bg-[var(--color-surface-2)] ${
                    selected
                      ? "bg-[var(--color-primary-tint)] font-semibold text-[var(--color-primary)]"
                      : ""
                  }`}
                >
                  <span>{m.label}</span>
                  {selected && <Check size={15} />}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-4">
          <Button variant="ghost" size="sm" onClick={finish}>
            {dict.common.skip}
          </Button>
          <div className="flex items-center gap-2">
            {step > 1 && (
              <Button
                variant="subtle"
                size="sm"
                onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
              >
                {dict.common.previous}
              </Button>
            )}
            {step < 3 ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setStep((s) => (s === 1 ? 2 : 3))}
              >
                {dict.common.next}
              </Button>
            ) : (
              <Button variant="primary" size="sm" onClick={finish}>
                {dict.onboarding.finish}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
};
