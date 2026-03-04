import quranDataRaw from "../docs/quran_optimized_array.json";

// Cast the imported JSON to an array of arrays of strings.
// Note: Index 0 is null/undefined to allow 1-based indexing for chapters and verses.
const quranData = quranDataRaw as (string | null)[][];

export interface SearchResult {
  chapter: number;
  verse: number;
  text: string;
}

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
  } catch (error) {
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
 * Search the entire Quran for a specific term.
 * Searching 6000+ string array elements in JS is very fast and should only take ~2-5ms in React Native.
 *
 * @param searchTerm - The text to search for
 * @returns Array of formatting search results
 */
export const searchQuran = (searchTerm: string): SearchResult[] => {
  if (!searchTerm || searchTerm.trim() === "") return [];

  const results: SearchResult[] = [];
  const normalizedTerm = searchTerm.toLowerCase(); // Note: Arabic might not need toLowerCase(), but good for standard text.

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
