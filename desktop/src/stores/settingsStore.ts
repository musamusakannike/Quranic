import { create } from "zustand";
import { dbGet, dbSet } from "../lib/db";
import type { Language } from "../lib/i18n";
import { getDefaultTranslationPackId } from "../data/translations";
import type { PrayerKey, CalculationMethodId, MadhabId, HighLatitudeRuleId } from "../lib/solah";

export type ThemeMode = "system" | "light" | "dark";
export type ReadingMode = "list" | "focus" | "mushaf";

export interface SavedPlace {
  id: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface PrayerReminderConfig {
  enabled: boolean;
  adhan: boolean;
  advanceMinutes: 0 | 5 | 10 | 15 | 30;
}

export interface ToastItem {
  id: string;
  message: string;
  variant: "info" | "success" | "error";
}

export interface PersistedSettings {
  theme: ThemeMode;
  language: Language;
  readingMode: ReadingMode;
  showTranslation: boolean;
  showTransliteration: boolean;
  translationPackId: string;
  arabicFontSize: number;
  translationFontSize: number;
  followAudio: boolean;
  places: SavedPlace[];
  activePlaceId: string | null;
  calculationMethod: CalculationMethodId;
  madhab: MadhabId;
  highLatitudeRule: HighLatitudeRuleId;
  adjustments: Record<PrayerKey, number>;
  prayerReminders: Record<PrayerKey, PrayerReminderConfig>;
  dailyReadingReminder: boolean;
  dailyReadingTime: string; // "HH:MM"
  fridayKahfReminder: boolean;
  hijriOffsetDays: -1 | 0 | 1;
  closeToTray: boolean;
  hasSeenTrayNotice: boolean;
  hasCompletedOnboarding: boolean;
  sidebarCollapsed: boolean;
}

const DEFAULT_PLACE: SavedPlace = {
  id: "makkah-default",
  name: "Mecca",
  country: "SA",
  latitude: 21.4225,
  longitude: 39.8262,
  timezone: "Asia/Riyadh",
};

export const DEFAULT_SETTINGS: PersistedSettings = {
  theme: "system",
  language: "en",
  readingMode: "list",
  showTranslation: true,
  showTransliteration: false,
  translationPackId: getDefaultTranslationPackId(),
  arabicFontSize: 36,
  translationFontSize: 16,
  followAudio: true,
  places: [DEFAULT_PLACE],
  activePlaceId: DEFAULT_PLACE.id,
  calculationMethod: "MuslimWorldLeague",
  madhab: "shafi",
  highLatitudeRule: "middleOfTheNight",
  adjustments: { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
  prayerReminders: {
    fajr: { enabled: false, adhan: false, advanceMinutes: 0 },
    dhuhr: { enabled: false, adhan: false, advanceMinutes: 0 },
    asr: { enabled: false, adhan: false, advanceMinutes: 0 },
    maghrib: { enabled: false, adhan: false, advanceMinutes: 0 },
    isha: { enabled: false, adhan: false, advanceMinutes: 0 },
  },
  dailyReadingReminder: false,
  dailyReadingTime: "08:00",
  fridayKahfReminder: false,
  hijriOffsetDays: 0,
  closeToTray: true,
  hasSeenTrayNotice: false,
  hasCompletedOnboarding: false,
  sidebarCollapsed: false,
};

const DB_KEY = "settings.v1";

function applyThemeToDom(theme: ThemeMode): "light" | "dark" {
  const resolved: "light" | "dark" =
    theme === "system"
      ? typeof window !== "undefined" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", resolved);
    document.documentElement.style.colorScheme = resolved;
  }
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("quranic.theme", theme);
  }
  return resolved;
}

function applyLanguageToDom(lang: Language): void {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
  }
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("quranic.lang", lang);
  }
}

interface SettingsState extends PersistedSettings {
  hydrated: boolean;
  resolvedTheme: "light" | "dark";
  toasts: ToastItem[];
  hydrate: () => Promise<void>;
  update: (patch: Partial<PersistedSettings>) => void;
  setTheme: (theme: ThemeMode) => void;
  setLanguage: (lang: Language) => void;
  addPlace: (place: SavedPlace, makeActive?: boolean) => void;
  removePlace: (id: string) => void;
  setActivePlace: (id: string) => void;
  updatePrayerReminder: (prayer: PrayerKey, patch: Partial<PrayerReminderConfig>) => void;
  updateAdjustment: (prayer: PrayerKey, minutes: number) => void;
  showToast: (message: string, variant?: "info" | "success" | "error") => void;
  dismissToast: (id: string) => void;
  resetSettings: () => Promise<void>;
}

function extractPersisted(s: SettingsState): PersistedSettings {
  return {
    theme: s.theme,
    language: s.language,
    readingMode: s.readingMode,
    showTranslation: s.showTranslation,
    showTransliteration: s.showTransliteration,
    translationPackId: s.translationPackId,
    arabicFontSize: s.arabicFontSize,
    translationFontSize: s.translationFontSize,
    followAudio: s.followAudio,
    places: s.places,
    activePlaceId: s.activePlaceId,
    calculationMethod: s.calculationMethod,
    madhab: s.madhab,
    highLatitudeRule: s.highLatitudeRule,
    adjustments: s.adjustments,
    prayerReminders: s.prayerReminders,
    dailyReadingReminder: s.dailyReadingReminder,
    dailyReadingTime: s.dailyReadingTime,
    fridayKahfReminder: s.fridayKahfReminder,
    hijriOffsetDays: s.hijriOffsetDays,
    closeToTray: s.closeToTray,
    hasSeenTrayNotice: s.hasSeenTrayNotice,
    hasCompletedOnboarding: s.hasCompletedOnboarding,
    sidebarCollapsed: s.sidebarCollapsed,
  };
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULT_SETTINGS,
  hydrated: false,
  resolvedTheme: applyThemeToDom(DEFAULT_SETTINGS.theme),
  toasts: [],

  hydrate: async () => {
    const saved = await dbGet<Partial<PersistedSettings>>(DB_KEY, {});
    const merged: PersistedSettings = {
      ...DEFAULT_SETTINGS,
      ...saved,
      adjustments: { ...DEFAULT_SETTINGS.adjustments, ...(saved.adjustments ?? {}) },
      prayerReminders: {
        ...DEFAULT_SETTINGS.prayerReminders,
        ...(saved.prayerReminders ?? {}),
      },
      places:
        saved.places && saved.places.length > 0 ? saved.places : DEFAULT_SETTINGS.places,
    };
    const resolvedTheme = applyThemeToDom(merged.theme);
    applyLanguageToDom(merged.language);
    set({ ...merged, resolvedTheme, hydrated: true });
  },

  update: (patch) => {
    set((state) => {
      const next = { ...state, ...patch };
      void dbSet(DB_KEY, extractPersisted(next));
      return next;
    });
  },

  setTheme: (theme) => {
    const resolvedTheme = applyThemeToDom(theme);
    set((state) => {
      const next = { ...state, theme, resolvedTheme };
      void dbSet(DB_KEY, extractPersisted(next));
      return next;
    });
  },

  setLanguage: (language) => {
    applyLanguageToDom(language);
    set((state) => {
      const next = { ...state, language };
      void dbSet(DB_KEY, extractPersisted(next));
      return next;
    });
  },

  addPlace: (place, makeActive = true) => {
    set((state) => {
      const exists = state.places.some((p) => p.id === place.id);
      const places = exists
        ? state.places.map((p) => (p.id === place.id ? place : p))
        : [place, ...state.places];
      const next = {
        ...state,
        places,
        activePlaceId: makeActive ? place.id : state.activePlaceId,
      };
      void dbSet(DB_KEY, extractPersisted(next));
      return next;
    });
  },

  removePlace: (id) => {
    set((state) => {
      const places = state.places.filter((p) => p.id !== id);
      const activePlaceId =
        state.activePlaceId === id ? (places[0]?.id ?? null) : state.activePlaceId;
      const next = { ...state, places, activePlaceId };
      void dbSet(DB_KEY, extractPersisted(next));
      return next;
    });
  },

  setActivePlace: (id) => {
    set((state) => {
      const next = { ...state, activePlaceId: id };
      void dbSet(DB_KEY, extractPersisted(next));
      return next;
    });
  },

  updatePrayerReminder: (prayer, patch) => {
    set((state) => {
      const prayerReminders = {
        ...state.prayerReminders,
        [prayer]: { ...state.prayerReminders[prayer], ...patch },
      };
      const next = { ...state, prayerReminders };
      void dbSet(DB_KEY, extractPersisted(next));
      return next;
    });
  },

  updateAdjustment: (prayer, minutes) => {
    set((state) => {
      const clamped = Math.max(-60, Math.min(60, Math.round(minutes)));
      const adjustments = { ...state.adjustments, [prayer]: clamped };
      const next = { ...state, adjustments };
      void dbSet(DB_KEY, extractPersisted(next));
      return next;
    });
  },

  showToast: (message, variant = "info") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    set((state) => ({ toasts: [...state.toasts.slice(-3), { id, message, variant }] }));
    setTimeout(() => {
      get().dismissToast(id);
    }, 3500);
  },

  dismissToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },

  resetSettings: async () => {
    const resolvedTheme = applyThemeToDom(DEFAULT_SETTINGS.theme);
    applyLanguageToDom(DEFAULT_SETTINGS.language);
    set({ ...DEFAULT_SETTINGS, resolvedTheme });
    await dbSet(DB_KEY, DEFAULT_SETTINGS);
  },
}));

export function getActivePlace(state: Pick<PersistedSettings, "places" | "activePlaceId">): SavedPlace {
  return (
    state.places.find((p) => p.id === state.activePlaceId) ??
    state.places[0] ??
    DEFAULT_PLACE
  );
}

export function hasAnyPrayerReminderEnabled(
  reminders: Record<PrayerKey, PrayerReminderConfig>,
): boolean {
  return Object.values(reminders).some((r) => r.enabled);
}
