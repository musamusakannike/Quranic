import AsyncStorage from "@react-native-async-storage/async-storage";

const LAST_READ_STORAGE_KEY = "@quran_last_read_progress";

export type LastReadProgress = {
  chapter: number;
  verse: number;
  page: number | null;
  juz: number | null;
  updatedAt: number;
};

const isValidProgress = (value: unknown): value is LastReadProgress => {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<LastReadProgress>;
  return (
    Number.isInteger(candidate.chapter) &&
    Number.isInteger(candidate.verse) &&
    typeof candidate.updatedAt === "number"
  );
};

export const saveLastReadProgress = async (
  progress: Omit<LastReadProgress, "updatedAt">,
): Promise<void> => {
  const payload: LastReadProgress = {
    ...progress,
    updatedAt: Date.now(),
  };

  await AsyncStorage.setItem(LAST_READ_STORAGE_KEY, JSON.stringify(payload));
};

export const getLastReadProgress = async (): Promise<LastReadProgress | null> => {
  const raw = await AsyncStorage.getItem(LAST_READ_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    return isValidProgress(parsed) ? parsed : null;
  } catch {
    return null;
  }
};
