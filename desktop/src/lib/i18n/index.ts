import { en, type TranslationDict } from "./en";
import { ar } from "./ar";

export type Language = "en" | "ar";

const dictionaries: Record<Language, TranslationDict> = { en, ar };

export function getDict(lang: Language): TranslationDict {
  return dictionaries[lang] ?? en;
}

export function interpolate(
  template: string,
  params?: Record<string, string | number>,
): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
    params[key] !== undefined ? String(params[key]) : "",
  );
}

const ARABIC_INDIC = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

export function toArabicIndic(num: number | string): string {
  return String(num).replace(/\d/g, (d) => ARABIC_INDIC[Number(d)] ?? d);
}

export function formatNumber(num: number, lang: Language): string {
  return lang === "ar" ? toArabicIndic(num) : String(num);
}
