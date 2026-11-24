import { httpGetJson } from "./tauri";
import { dbGet, dbSet } from "./db";
import { getGlobalVerseNumber } from "./quran";

export interface Moshaf {
  id: number;
  name: string;
  server: string;
  surah_total: number;
  moshaf_type: number;
  surah_list: string;
}

export interface ChapterReciter {
  id: number;
  name: string;
  letter: string;
  moshaf: Moshaf[];
}

export interface Riwayah {
  id: number;
  name: string;
}

export interface MoshafDefinition {
  id: number;
  moshaf_type: number;
  moshaf_id: number;
  name: string;
}

export interface VerseReciter {
  identifier: string;
  name: string;
  englishName: string;
  server: string;
}

export interface ReciterCatalog {
  chapterReciters: ChapterReciter[];
  riwayat: Riwayah[];
  moshafs: MoshafDefinition[];
  verseReciters: VerseReciter[];
  fetchedAt: number;
}

const CACHE_KEY = "audio.reciter_catalog.v1";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function fetchReciterCatalog(
  forceRefresh = false,
): Promise<ReciterCatalog> {
  if (!forceRefresh) {
    const cached = await dbGet<ReciterCatalog | null>(CACHE_KEY, null);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      return cached;
    }
  }

  const [recitersData, riwayatData, moshafsData, verseData] = await Promise.all([
    httpGetJson<{ reciters?: ChapterReciter[] }>(
      "https://mp3quran.net/api/v3/reciters?language=eng",
    ),
    httpGetJson<{ riwayat?: Riwayah[] }>(
      "https://mp3quran.net/api/v3/riwayat?language=eng",
    ),
    httpGetJson<{ riwayat?: MoshafDefinition[] }>(
      "https://mp3quran.net/api/v3/moshaf?language=eng",
    ),
    httpGetJson<{
      data?: { identifier: string; name: string; englishName: string; type: string }[];
    }>("https://api.alquran.cloud/v1/edition/format/audio"),
  ]);

  const verseReciters: VerseReciter[] = (verseData.data ?? [])
    .filter((r) => r.type === "versebyverse")
    .map((r) => ({
      identifier: r.identifier,
      name: r.name,
      englishName: r.englishName,
      server: `https://cdn.islamic.network/quran/audio/128/${r.identifier}/`,
    }));

  const catalog: ReciterCatalog = {
    chapterReciters: recitersData.reciters ?? [],
    riwayat: riwayatData.riwayat ?? [],
    moshafs: moshafsData.riwayat ?? [],
    verseReciters,
    fetchedAt: Date.now(),
  };

  await dbSet(CACHE_KEY, catalog);
  return catalog;
}

export function buildChapterAudioUrl(server: string, surahId: number): string {
  const base = server.endsWith("/") ? server : `${server}/`;
  return `${base}${String(surahId).padStart(3, "0")}.mp3`;
}

export function buildVerseAudioUrl(
  server: string,
  chapter: number,
  verse: number,
): string {
  const base = server.endsWith("/") ? server : `${server}/`;
  const globalNum = getGlobalVerseNumber(chapter, verse);
  return `${base}${globalNum}.mp3`;
}

export const DEFAULT_VERSE_RECITER: VerseReciter = {
  identifier: "ar.alafasy",
  name: "مشاري راشد العفاسي",
  englishName: "Mishary Rashid Alafasy",
  server: "https://cdn.islamic.network/quran/audio/128/ar.alafasy/",
};
