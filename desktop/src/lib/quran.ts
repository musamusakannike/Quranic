import quranDataRaw from "../data/quran_optimized_array.json";
import quranTransliterationRaw from "../data/ara-quran-la_optimized_array.json";
import quranMetadataRaw from "../data/quran_metadata_optimized.json";

const quranData = quranDataRaw as (string | null)[][];
const quranTransliterationData = quranTransliterationRaw as (string | null)[][];

export interface VerseMetadata {
  line: number;
  juz: number;
  manzil: number;
  page: number;
  ruku: number;
  maqra: number;
  sajda: boolean | Record<string, unknown>;
}

export interface ChapterMetadata {
  name: string;
  englishname: string;
  arabicname: string;
  revelation: string;
  verses: (VerseMetadata | null)[];
}

export interface ChapterSummary {
  number: number;
  name: string;
  englishname: string;
  arabicname: string;
  revelation: string;
  versesCount: number;
  firstPage: number;
  lastPage: number;
  juzRange: string;
}

export interface QuranMetadata {
  total_verses: number;
  chapters: (ChapterMetadata | null)[];
}

export interface VerseReference {
  chapter: number;
  verse: number;
  page: number;
  juz: number;
}

export interface ParsedReference {
  type: "verse" | "chapter" | "juz" | "page";
  chapter: number;
  verse?: number;
  juz?: number;
  page?: number;
  label: string;
}

const quranMetadata = quranMetadataRaw as unknown as QuranMetadata;

const ARABIC_DIACRITICS = /[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed]/g;

/**
 * Normalize Arabic and Latin search text:
 * - strip tashkeel / harakat
 * - normalize alef variants (إ أ آ ٱ -> ا)
 * - normalize teh marbuta / alef maksura gently where helpful
 * - remove tatweel (ـ)
 */
export function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .replace(ARABIC_DIACRITICS, "")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ـ/g, "")
    .trim();
}

export function getVerseText(chapter: number, verse: number): string | null {
  return quranData[chapter]?.[verse] ?? null;
}

export function getVerseTransliteration(chapter: number, verse: number): string | null {
  return quranTransliterationData[chapter]?.[verse] ?? null;
}

export function getVerseMetadata(chapter: number, verse: number): VerseMetadata | null {
  return quranMetadata.chapters[chapter]?.verses[verse] ?? null;
}

export function getChapterMetadata(
  chapter: number,
): Omit<ChapterMetadata, "verses"> | null {
  const meta = quranMetadata.chapters[chapter];
  if (!meta) return null;
  const { verses: _verses, ...rest } = meta;
  return rest;
}

export function getChapterVerses(chapter: number): string[] {
  const verses = quranData[chapter];
  return verses ? (verses.slice(1) as string[]) : [];
}

export function getVersesCount(chapter: number): number {
  const verses = quranData[chapter];
  return verses ? verses.length - 1 : 0;
}

export function getTotalQuranVerses(): number {
  return quranMetadata.total_verses;
}

let cachedChapterSummaries: ChapterSummary[] | null = null;

export function getAllChapters(): ChapterSummary[] {
  if (cachedChapterSummaries) return cachedChapterSummaries;
  const list: ChapterSummary[] = [];
  for (let c = 1; c <= 114; c++) {
    const meta = quranMetadata.chapters[c];
    if (!meta) continue;
    const count = getVersesCount(c);
    let minPage = 604;
    let maxPage = 1;
    let minJuz = 30;
    let maxJuz = 1;
    for (let v = 1; v <= count; v++) {
      const vm = meta.verses[v];
      if (!vm) continue;
      if (vm.page < minPage) minPage = vm.page;
      if (vm.page > maxPage) maxPage = vm.page;
      if (vm.juz < minJuz) minJuz = vm.juz;
      if (vm.juz > maxJuz) maxJuz = vm.juz;
    }
    list.push({
      number: c,
      name: meta.name,
      englishname: meta.englishname,
      arabicname: meta.arabicname,
      revelation: meta.revelation,
      versesCount: count,
      firstPage: minPage,
      lastPage: maxPage,
      juzRange: minJuz === maxJuz ? `${minJuz}` : `${minJuz}–${maxJuz}`,
    });
  }
  cachedChapterSummaries = list;
  return list;
}

// Precompute cumulative verse offsets for O(1) global verse number lookup
const chapterOffsets: number[] = [0];
for (let c = 1; c <= 114; c++) {
  chapterOffsets[c] = (chapterOffsets[c - 1] ?? 0) + getVersesCount(c);
}

export function getGlobalVerseNumber(chapter: number, verse: number): number {
  return (chapterOffsets[chapter - 1] ?? 0) + verse;
}

export function getChapterPages(chapter: number): number[] {
  const meta = quranMetadata.chapters[chapter];
  if (!meta) return [];
  const pages = new Set<number>();
  for (let i = 1; i < meta.verses.length; i++) {
    const v = meta.verses[i];
    if (v?.page) pages.add(v.page);
  }
  return Array.from(pages).sort((a, b) => a - b);
}

export function getFirstVerseForJuz(juz: number): VerseReference | null {
  if (!Number.isInteger(juz) || juz < 1 || juz > 30) return null;
  for (let c = 1; c <= 114; c++) {
    const meta = quranMetadata.chapters[c];
    if (!meta) continue;
    for (let v = 1; v < meta.verses.length; v++) {
      const vm = meta.verses[v];
      if (vm && vm.juz === juz) {
        return { chapter: c, verse: v, page: vm.page, juz: vm.juz };
      }
    }
  }
  return null;
}

export function getFirstVerseForPage(page: number): VerseReference | null {
  if (!Number.isInteger(page) || page < 1 || page > 604) return null;
  for (let c = 1; c <= 114; c++) {
    const meta = quranMetadata.chapters[c];
    if (!meta) continue;
    for (let v = 1; v < meta.verses.length; v++) {
      const vm = meta.verses[v];
      if (vm && vm.page === page) {
        return { chapter: c, verse: v, page: vm.page, juz: vm.juz };
      }
    }
  }
  return null;
}

export function getPageInfo(page: number): {
  chapter: number;
  chapterName: string;
  arabicName: string;
  juz: number;
} | null {
  const ref = getFirstVerseForPage(page);
  if (!ref) return null;
  const meta = getChapterMetadata(ref.chapter);
  return {
    chapter: ref.chapter,
    chapterName: meta?.name ?? `Surah ${ref.chapter}`,
    arabicName: meta?.arabicname ?? "",
    juz: ref.juz,
  };
}

/**
 * Deterministic daily Ayah of the Day based on YYYY-MM-DD.
 */
const CURATED_DAILY_AYAHS: [number, number][] = [
  [2, 255],
  [2, 286],
  [3, 190],
  [13, 28],
  [94, 5],
  [94, 6],
  [2, 152],
  [39, 53],
  [65, 3],
  [16, 97],
  [29, 69],
  [55, 13],
  [24, 35],
  [49, 13],
  [31, 17],
  [17, 23],
  [59, 22],
  [67, 2],
  [18, 10],
  [20, 114],
];

export function getAyahOfTheDay(date: Date = new Date()): {
  chapter: number;
  verse: number;
} {
  const daySeed =
    date.getFullYear() * 372 + (date.getMonth() + 1) * 31 + date.getDate();
  const [chapter, verse] =
    CURATED_DAILY_AYAHS[daySeed % CURATED_DAILY_AYAHS.length] ?? [2, 255];
  return { chapter, verse };
}

/**
 * Parse natural Quran references:
 * - "2:255" or "2 255"
 * - "baqarah 255", "al-baqarah 255", "البقرة 255"
 * - "surah 36", "sura 36", "chapter 36", "سورة 36"
 * - "juz 30", "جزء 30"
 * - "page 604", "pg 604", "صفحة 604"
 */
export function parseQuranReference(input: string): ParsedReference | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // 1. Direct "chapter:verse" e.g. "2:255"
  const colonMatch = trimmed.match(/^(\d{1,3})\s*[:.]\s*(\d{1,3})$/);
  if (colonMatch) {
    const c = Number(colonMatch[1]);
    const v = Number(colonMatch[2]);
    if (c >= 1 && c <= 114 && v >= 1 && v <= getVersesCount(c)) {
      const meta = getChapterMetadata(c);
      return {
        type: "verse",
        chapter: c,
        verse: v,
        label: `${meta?.name ?? `Surah ${c}`} ${c}:${v}`,
      };
    }
    return null;
  }

  // 2. "juz N" / "جزء N"
  const juzMatch = trimmed.match(/^(?:juz|juz'|جزء)\s+(\d{1,2})$/i);
  if (juzMatch) {
    const j = Number(juzMatch[1]);
    const ref = getFirstVerseForJuz(j);
    if (ref) {
      return {
        type: "juz",
        chapter: ref.chapter,
        verse: ref.verse,
        juz: j,
        page: ref.page,
        label: `Juz ${j}`,
      };
    }
    return null;
  }

  // 3. "page N" / "pg N" / "صفحة N"
  const pageMatch = trimmed.match(/^(?:page|pg|p|صفحة)\s+(\d{1,3})$/i);
  if (pageMatch) {
    const p = Number(pageMatch[1]);
    const ref = getFirstVerseForPage(p);
    if (ref) {
      return {
        type: "page",
        chapter: ref.chapter,
        verse: ref.verse,
        page: p,
        juz: ref.juz,
        label: `Page ${p}`,
      };
    }
    return null;
  }

  // 4. "surah N" / "chapter N" / "سورة N"
  const surahNumMatch = trimmed.match(/^(?:surah|sura|chapter|سورة)\s+(\d{1,3})$/i);
  if (surahNumMatch) {
    const c = Number(surahNumMatch[1]);
    if (c >= 1 && c <= 114) {
      const meta = getChapterMetadata(c);
      return {
        type: "chapter",
        chapter: c,
        label: `Surah ${c} · ${meta?.name ?? ""}`,
      };
    }
    return null;
  }

  // 5. "<surah name> [verse]" e.g. "baqarah 255", "yasin", "al-kahf 10", "البقرة 255"
  const nameVerseMatch = trimmed.match(/^(?:surah\s+|sura\s+|سورة\s+)?(.+?)(?:\s+(\d{1,3}))?$/i);
  if (nameVerseMatch) {
    const cleanLatin = (s: string) =>
      normalizeSearchText(s)
        .replace(/^al[-\s']?/, "")
        .replace(/['`\-\s]/g, "")
        .replace(/h$/, "");
    const rawName = cleanLatin(nameVerseMatch[1] ?? "");
    const rawArabic = normalizeSearchText(nameVerseMatch[1] ?? "").replace(/^سورة\s*/, "");
    const maybeVerse = nameVerseMatch[2] ? Number(nameVerseMatch[2]) : undefined;
    if (rawName.length >= 2) {
      const chapters = getAllChapters();
      const matched = chapters.find((ch) => {
        const normName = cleanLatin(ch.name);
        const normEn = cleanLatin(ch.englishname);
        const normAr = normalizeSearchText(ch.arabicname).replace(/^سورة\s*/, "");
        return (
          normName === rawName ||
          normName.startsWith(rawName) ||
          rawName.startsWith(normName) ||
          normEn === rawName ||
          (rawArabic.length >= 2 && (normAr === rawArabic || normAr.includes(rawArabic)))
        );
      });
      if (matched) {
        if (maybeVerse !== undefined) {
          if (maybeVerse >= 1 && maybeVerse <= matched.versesCount) {
            return {
              type: "verse",
              chapter: matched.number,
              verse: maybeVerse,
              label: `${matched.name} ${matched.number}:${maybeVerse}`,
            };
          }
          return null;
        }
        return {
          type: "chapter",
          chapter: matched.number,
          label: `Surah ${matched.number} · ${matched.name}`,
        };
      }
    }
  }

  return null;
}

export function isSajdaVerse(meta: VerseMetadata | null): boolean {
  if (!meta) return false;
  return Boolean(meta.sajda);
}
