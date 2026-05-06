import { I18n } from "i18n-js";
import * as ExpoLocalization from "expo-localization";
import en from "./translations/en";
import ar from "./translations/ar";

export type AppLocale = "en" | "ar";

// Create i18n instance
const i18n = new I18n({
  en,
  ar,
});

// Enable fallback to English for missing keys
i18n.enableFallback = true;
i18n.defaultLocale = "en";

// Detect device locale and map to supported locale
export const getDeviceLocale = (): AppLocale => {
  const locales = ExpoLocalization.getLocales();
  const primaryLocale = locales[0]?.languageCode ?? "en";

  // Map Arabic variants to "ar"
  if (primaryLocale.startsWith("ar")) {
    return "ar";
  }

  return "en";
};

// Set initial locale from device
i18n.locale = getDeviceLocale();

export { i18n };
export default i18n;
