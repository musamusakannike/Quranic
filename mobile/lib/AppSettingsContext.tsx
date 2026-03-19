import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ReminderTime = {
  hour: number;
  minute: number;
};

export type ReadingView = "list" | "verse_by_verse" | "mushaf";

type AppSettingsContextValue = {
  showTranslations: boolean;
  showTransliterations: boolean;
  reminderEnabled: boolean;
  reminderTime: ReminderTime;
  arabicFontSize: number;
  translationFontSize: number;
  hasSeenOnboarding: boolean;
  isLoaded: boolean;
  setShowTranslations: (enabled: boolean) => Promise<void>;
  setShowTransliterations: (enabled: boolean) => Promise<void>;
  setReminderTime: (time: ReminderTime) => Promise<void>;
  enableReminder: (time: ReminderTime) => Promise<boolean>;
  disableReminder: () => Promise<void>;
  setHasSeenOnboarding: (hasSeen: boolean) => Promise<void>;
  setArabicFontSize: (size: number) => Promise<void>;
  setTranslationFontSize: (size: number) => Promise<void>;
  readingView: ReadingView;
  setReadingView: (view: ReadingView) => Promise<void>;
};

type StoredSettings = {
  showTranslations: boolean;
  showTransliterations: boolean;
  reminderEnabled: boolean;
  reminderTime: ReminderTime;
  reminderNotificationId: string | null;
  hasSeenOnboarding: boolean;
  arabicFontSize: number;
  translationFontSize: number;
  readingView: ReadingView;
};

const SETTINGS_STORAGE_KEY = "@app_reader_settings";

const DEFAULT_SETTINGS: StoredSettings = {
  showTranslations: false,
  showTransliterations: false,
  reminderEnabled: false,
  reminderTime: { hour: 20, minute: 0 },
  reminderNotificationId: null,
  hasSeenOnboarding: false,
  arabicFontSize: 31,
  translationFontSize: 14,
  readingView: "list",
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const AppSettingsContext = createContext<AppSettingsContextValue | undefined>(
  undefined,
);

const parseStoredSettings = (raw: string | null): StoredSettings => {
  if (!raw) return DEFAULT_SETTINGS;

  try {
    const parsed = JSON.parse(raw) as Partial<StoredSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      reminderTime: {
        hour: parsed.reminderTime?.hour ?? DEFAULT_SETTINGS.reminderTime.hour,
        minute:
          parsed.reminderTime?.minute ?? DEFAULT_SETTINGS.reminderTime.minute,
      },
      readingView: parsed.readingView ?? DEFAULT_SETTINGS.readingView,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

const saveSettings = async (settings: StoredSettings) => {
  await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
};

const requestNotificationPermission = async () => {
  const current = await Notifications.getPermissionsAsync();

  if (
    current.granted ||
    current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  ) {
    return true;
  }

  const request = await Notifications.requestPermissionsAsync();
  return (
    request.granted ||
    request.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
};

export const AppSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<StoredSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "android") return;

    void Notifications.setNotificationChannelAsync("daily-reminders", {
      name: "Daily reminders",
      importance: Notifications.AndroidImportance.MAX,
    });
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const rawSettings = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
        setSettings(parseStoredSettings(rawSettings));
      } catch {
        setSettings(DEFAULT_SETTINGS);
      } finally {
        setIsLoaded(true);
      }
    };

    void loadSettings();
  }, []);

  const updateSettings = useCallback(
    async (updater: (current: StoredSettings) => StoredSettings) => {
      setSettings((current) => {
        const next = updater(current);
        void saveSettings(next);
        return next;
      });
    },
    [],
  );

  const setShowTranslations = useCallback(
    async (enabled: boolean) => {
      await updateSettings((current) => ({
        ...current,
        showTranslations: enabled,
      }));
    },
    [updateSettings],
  );

  const setShowTransliterations = useCallback(
    async (enabled: boolean) => {
      await updateSettings((current) => ({
        ...current,
        showTransliterations: enabled,
      }));
    },
    [updateSettings],
  );

  const setReminderTime = useCallback(
    async (time: ReminderTime) => {
      await updateSettings((current) => ({ ...current, reminderTime: time }));
    },
    [updateSettings],
  );

  const disableReminder = useCallback(async () => {
    await updateSettings((current) => {
      if (current.reminderNotificationId) {
        void Notifications.cancelScheduledNotificationAsync(
          current.reminderNotificationId,
        );
      }

      return {
        ...current,
        reminderEnabled: false,
        reminderNotificationId: null,
      };
    });
  }, [updateSettings]);

  const setHasSeenOnboarding = useCallback(
    async (hasSeen: boolean) => {
      await updateSettings((current) => ({
        ...current,
        hasSeenOnboarding: hasSeen,
      }));
    },
    [updateSettings],
  );

  const setArabicFontSize = useCallback(
    async (size: number) => {
      await updateSettings((current) => ({ ...current, arabicFontSize: size }));
    },
    [updateSettings],
  );

  const setTranslationFontSize = useCallback(
    async (size: number) => {
      await updateSettings((current) => ({
        ...current,
        translationFontSize: size,
      }));
    },
    [updateSettings],
  );

  const setReadingView = useCallback(
    async (view: ReadingView) => {
      await updateSettings((current) => ({
        ...current,
        readingView: view,
      }));
    },
    [updateSettings],
  );

  const enableReminder = useCallback(
    async (time: ReminderTime) => {
      const permissionGranted = await requestNotificationPermission();

      if (!permissionGranted) {
        return false;
      }

      const currentNotificationId = settings.reminderNotificationId;
      if (currentNotificationId) {
        await Notifications.cancelScheduledNotificationAsync(
          currentNotificationId,
        );
      }

      const reminderNotificationId =
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Quran reminder",
            body: "Take a moment to recite the Quran today.",
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            channelId: "daily-reminders",
            hour: time.hour,
            minute: time.minute,
          } as Notifications.NotificationTriggerInput,
        });

      await updateSettings((current) => ({
        ...current,
        reminderEnabled: true,
        reminderTime: time,
        reminderNotificationId,
      }));

      return true;
    },
    [settings.reminderNotificationId, updateSettings],
  );

  const contextValue = useMemo<AppSettingsContextValue>(
    () => ({
      showTranslations: settings.showTranslations,
      showTransliterations: settings.showTransliterations,
      reminderEnabled: settings.reminderEnabled,
      reminderTime: settings.reminderTime,
      arabicFontSize: settings.arabicFontSize,
      translationFontSize: settings.translationFontSize,
      hasSeenOnboarding: settings.hasSeenOnboarding,
      readingView: settings.readingView,
      isLoaded,
      setShowTranslations,
      setShowTransliterations,
      setReminderTime,
      enableReminder,
      disableReminder,
      setHasSeenOnboarding,
      setArabicFontSize,
      setTranslationFontSize,
      setReadingView,
    }),
    [
      settings.showTranslations,
      settings.showTransliterations,
      settings.reminderEnabled,
      settings.reminderTime,
      settings.arabicFontSize,
      settings.translationFontSize,
      settings.hasSeenOnboarding,
      isLoaded,
      setShowTranslations,
      setShowTransliterations,
      setReminderTime,
      enableReminder,
      disableReminder,
      setHasSeenOnboarding,
      setArabicFontSize,
      setTranslationFontSize,
      settings.readingView,
      setReadingView,
    ],
  );

  if (!isLoaded) {
    return null;
  }

  return (
    <AppSettingsContext.Provider value={contextValue}>
      {children}
    </AppSettingsContext.Provider>
  );
};

export const useAppSettings = () => {
  const context = useContext(AppSettingsContext);

  if (!context) {
    throw new Error("useAppSettings must be used within AppSettingsProvider");
  }

  return context;
};
