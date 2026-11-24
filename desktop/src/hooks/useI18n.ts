import { useSettingsStore } from "../stores/settingsStore";
import { getDict, interpolate, formatNumber } from "../lib/i18n";

export function useI18n() {
  const lang = useSettingsStore((s) => s.language);
  const dict = getDict(lang);
  const isRTL = lang === "ar";

  return {
    lang,
    dir: isRTL ? ("rtl" as const) : ("ltr" as const),
    isRTL,
    dict,
    fmt: interpolate,
    num: (n: number) => formatNumber(n, lang),
  };
}
