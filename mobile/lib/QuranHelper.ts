import quranDataRaw from "../docs/quran_optimized_array.json";
import quranTranslationRaw from "../docs/eng-abdelhaleem_optimized_array.json";
import quranTransliterationRaw from "../docs/ara-quran-la_optimized_array.json";
import quranMetadataRaw from "../docs/quran_metadata_optimized.json";

// Cast the imported JSON to an array of arrays of strings.
// Note: Index 0 is null/undefined to allow 1-based indexing for chapters and verses.
const quranData = quranDataRaw as (string | null)[][];
const quranTranslationData = quranTranslationRaw as (string | null)[][];
const quranTransliterationData = quranTransliterationRaw as (string | null)[][];

export interface SearchResult {
  chapter: number;
  verse: number;
  text: string;
}

export interface VerseMetadata {
  line: number;
  juz: number;
  manzil: number;
  page: number;
  ruku: number;
  maqra: number;
  sajda: boolean | object;
}

export interface ChapterMetadata {
  name: string;
  englishname: string;
  arabicname: string;
  revelation: string;
  verses: (VerseMetadata | null)[];
}

export interface QuranMetadata {
  total_verses: number;
  chapters: (ChapterMetadata | null)[];
}

// Cast JSON to typed metadata structures
const quranMetadata = quranMetadataRaw as unknown as QuranMetadata;

/**
 * Get a specific verse's text instantly (O(1) Time Complexity).
 *
 * @param chapter - The chapter number (1-114)
 * @param verse - The verse number (from 1)
 * @returns The text of the verse, or null if it doesn't exist
 */
export const getVerseText = (chapter: number, verse: number): string | null => {
  try {
    return quranData[chapter][verse] || null;
  } catch {
    return null;
  }
};

export const getVerseTransliteration = (
  chapter: number,
  verse: number,
): string | null => {
  const chapterTransliterations = quranTransliterationData[chapter];
  if (!chapterTransliterations) return null;
  return chapterTransliterations[verse] ?? null;
};

export const getVerseTranslation = (
  chapter: number,
  verse: number,
): string | null => {
  const chapterTranslations = quranTranslationData[chapter];
  if (!chapterTranslations) return null;
  return chapterTranslations[verse] ?? null;
};

/**
 * Get metadata for a specific verse instantly (O(1) Time Complexity).
 *
 * @param chapter - The chapter number (1-114)
 * @param verse - The verse number (from 1)
 * @returns Metadata object for the verse, or null if it doesn't exist
 */
export const getVerseMetadata = (
  chapter: number,
  verse: number,
): VerseMetadata | null => {
  try {
    const chapterMeta = quranMetadata.chapters[chapter];
    return chapterMeta ? chapterMeta.verses[verse] || null : null;
  } catch {
    return null;
  }
};

/**
 * Get metadata for a specific chapter instantly (O(1) Time Complexity).
 * Note: This returns the chapter details (name, revelation info, etc.) without the large verses layout.
 *
 * @param chapter - The chapter number (1-114)
 * @returns Metadata object for the chapter, or null if it doesn't exist
 */
export const getChapterMetadata = (
  chapter: number,
): Omit<ChapterMetadata, "verses"> | null => {
  try {
    const chapterMeta = quranMetadata.chapters[chapter];
    if (!chapterMeta) return null;
    const { verses, ...metaWithoutVerses } = chapterMeta;
    return metaWithoutVerses;
  } catch {
    return null;
  }
};

/**
 * Get an array of all verses for a given chapter.
 *
 * @param chapter - The chapter number (1-114)
 * @returns Array of verse strings (index 0 is verse 1)
 */
export const getChapterVerses = (chapter: number): string[] => {
  const verses = quranData[chapter];
  // Since index 0 is null, we slice from index 1 to get a clean array for FlatList
  return verses ? (verses.slice(1) as string[]) : [];
};

/**
 * Gets the total number of verses in a specific chapter.
 *
 * @param chapter - The chapter number (1-114)
 * @returns Number of verses
 */
export const getVersesCount = (chapter: number): number => {
  const verses = quranData[chapter];
  return verses ? verses.length - 1 : 0;
};

/**
 * Get overall metadata like total verses overall.
 */
export const getTotalQuranVerses = (): number => {
  return quranMetadata.total_verses;
};

/**
 * Search the entire Quran for a specific term.
 * Searching 6000+ string array elements in JS is very fast and should only take ~2-5ms in React Native.
 *
 * @param searchTerm - The text to search for
 * @returns Array of formatting search results
 */
export const searchQuran = (searchTerm: string): SearchResult[] => {
  if (!searchTerm || searchTerm.trim() === "") return [];

  const results: SearchResult[] = [];
  const normalizedTerm = searchTerm.toLowerCase();

  quranData.forEach((chapterVerses, chapterIndex) => {
    if (!chapterVerses) return;

    chapterVerses.forEach((verseText, verseIndex) => {
      if (verseText && verseText.toLowerCase().includes(normalizedTerm)) {
        results.push({
          chapter: chapterIndex,
          verse: verseIndex,
          text: verseText,
        });
      }
    });
  });

  return results;
};
