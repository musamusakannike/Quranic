import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { I18nManager } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n, { getDeviceLocale, type AppLocale } from "./i18n";

const LANGUAGE_STORAGE_KEY = "@app_language";

interface LanguageContextValue {
  locale: AppLocale;
  isRTL: boolean;
  setLocale: (locale: AppLocale) => Promise<void>;
  t: (scope: string, options?: Record<string, unknown>) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined,
);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState<AppLocale>(getDeviceLocale());
  const [isReady, setIsReady] = useState(false);

  // Load persisted language on mount
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (stored === "en" || stored === "ar") {
          setLocaleState(stored);
          i18n.locale = stored;
        } else {
          // Use device locale as default
          const deviceLocale = getDeviceLocale();
          setLocaleState(deviceLocale);
          i18n.locale = deviceLocale;
        }
      } catch {
        // Fallback to device locale
        const deviceLocale = getDeviceLocale();
        setLocaleState(deviceLocale);
        i18n.locale = deviceLocale;
      } finally {
        setIsReady(true);
      }
    };

    void loadLanguage();
  }, []);

  const setLocale = useCallback(async (newLocale: AppLocale) => {
    i18n.locale = newLocale;
    setLocaleState(newLocale);

    // Update RTL layout for Arabic
    const shouldBeRTL = newLocale === "ar";
    if (I18nManager.isRTL !== shouldBeRTL) {
      I18nManager.forceRTL(shouldBeRTL);
      // Note: RTL changes require app restart to fully take effect on native
      // The UI will update immediately for most components
    }

    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, newLocale);
    } catch {
      console.error("Failed to save language preference");
    }
  }, []);

  const t = useCallback(
    (scope: string, options?: Record<string, unknown>): string => {
      return i18n.t(scope, options);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale], // Re-memoize when locale changes
  );

  const isRTL = locale === "ar";

  const value = useMemo(
    () => ({ locale, isRTL, setLocale, t }),
    [locale, isRTL, setLocale, t],
  );

  // Don't render children until language is loaded to avoid flash
  if (!isReady) return null;

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextValue => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
