import quranDataRaw from "../data/quran_optimized_array.json";
import quranTranslitRaw from "../data/ara-quran-la_optimized_array.json";
import { loadTranslationPack } from "../data/translations";

export interface WorkerSearchResult {
  chapter: number;
  verse: number;
  text: string;
  translation: string | null;
  transliteration: string | null;
  matchType: "arabic" | "translation" | "transliteration";
}

interface IndexedVerse {
  chapter: number;
  verse: number;
  text: string;
  normArabic: string;
  translit: string | null;
  normTranslit: string;
  translation: string | null;
  normTranslation: string;
}

const ARABIC_DIACRITICS = /[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed]/g;

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(ARABIC_DIACRITICS, "")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ـ/g, "")
    .trim();
}

const quranData = quranDataRaw as (string | null)[][];
const translitData = quranTranslitRaw as (string | null)[][];

let indexedPackId: string | null = null;
let indexCache: IndexedVerse[] | null = null;

async function ensureIndex(packId: string): Promise<IndexedVerse[]> {
  if (indexCache && indexedPackId === packId) {
    return indexCache;
  }

  const translationData = await loadTranslationPack(packId);
  const built: IndexedVerse[] = [];

  for (let c = 1; c < quranData.length; c++) {
    const chArabic = quranData[c];
    const chTrans = translationData[c];
    const chTranslit = translitData[c];
    if (!chArabic) continue;

    for (let v = 1; v < chArabic.length; v++) {
      const arabic = chArabic[v] ?? "";
      const translation = chTrans?.[v] ?? null;
      const translit = chTranslit?.[v] ?? null;
      built.push({
        chapter: c,
        verse: v,
        text: arabic,
        normArabic: normalize(arabic),
        translation,
        normTranslation: translation ? normalize(translation) : "",
        translit,
        normTranslit: translit ? normalize(translit) : "",
      });
    }
  }

  indexCache = built;
  indexedPackId = packId;
  return built;
}

interface SearchRequest {
  requestId: number;
  query: string;
  packId: string;
  chapterFilter?: number;
  limit?: number;
}

self.onmessage = async (event: MessageEvent<SearchRequest>) => {
  const { requestId, query, packId, chapterFilter, limit = 100 } = event.data;
  const normQuery = normalize(query);
  if (!normQuery) {
    self.postMessage({ requestId, results: [] });
    return;
  }

  const index = await ensureIndex(packId);
  const results: WorkerSearchResult[] = [];

  for (let i = 0; i < index.length; i++) {
    const item = index[i]!;
    if (chapterFilter !== undefined && item.chapter !== chapterFilter) continue;

    let matchType: "arabic" | "translation" | "transliteration" | null = null;
    if (item.normArabic.includes(normQuery)) {
      matchType = "arabic";
    } else if (item.normTranslation && item.normTranslation.includes(normQuery)) {
      matchType = "translation";
    } else if (item.normTranslit && item.normTranslit.includes(normQuery)) {
      matchType = "transliteration";
    }

    if (matchType) {
      results.push({
        chapter: item.chapter,
        verse: item.verse,
        text: item.text,
        translation: item.translation,
        transliteration: item.translit,
        matchType,
      });
      if (results.length >= limit) break;
    }
  }

  self.postMessage({ requestId, results });
};
