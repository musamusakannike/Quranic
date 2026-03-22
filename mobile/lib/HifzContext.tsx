import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type MemorizationStatus = "memorized" | "learning" | "not_started";

export interface VerseMemorizationEntry {
  chapter: number;
  verse: number;
  status: MemorizationStatus;
  updatedAt: number;
}

export interface HifzLoopConfig {
  chapter: number;
  startVerse: number;
  endVerse: number;
  repeatCount: number; // how many times to loop
}

export interface HifzReciter {
  identifier: string;
  name: string;
  englishName: string;
}

export interface HifzProgress {
  [key: string]: VerseMemorizationEntry; // key: "chapter:verse"
}

interface HifzContextProps {
  progress: HifzProgress;
  loopConfig: HifzLoopConfig | null;
  reciter: HifzReciter;
  setReciter: (config: HifzReciter) => Promise<void>;
  setLoopConfig: (config: HifzLoopConfig | null) => void;
  setVerseStatus: (chapter: number, verse: number, status: MemorizationStatus) => Promise<void>;
  getVerseStatus: (chapter: number, verse: number) => MemorizationStatus;
  getChapterStats: (chapter: number, totalVerses: number) => {
    memorized: number;
    learning: number;
    notStarted: number;
    total: number;
  };
  getJuzStats: (juzVerseList: Array<{ chapter: number; verse: number }>) => {
    memorized: number;
    learning: number;
    notStarted: number;
    total: number;
  };
  resetChapter: (chapter: number, totalVerses: number) => Promise<void>;
}

const HIFZ_STORAGE_KEY = "@quran_hifz_progress";
const HIFZ_RECITER_KEY = "@quran_hifz_reciter";

const DEFAULT_RECITER: HifzReciter = {
  identifier: "ar.muhammadayyoub",
  name: "محمد أيوب",
  englishName: "Muhammad Ayyoub",
};

const HifzContext = createContext<HifzContextProps | undefined>(undefined);

export const HifzProvider = ({ children }: { children: ReactNode }) => {
  const [progress, setProgress] = useState<HifzProgress>({});
  const [loopConfig, setLoopConfig] = useState<HifzLoopConfig | null>(null);
  const [reciter, setReciterState] = useState<HifzReciter>(DEFAULT_RECITER);

  useEffect(() => {
    const load = async () => {
      try {
        const rawProgress = await AsyncStorage.getItem(HIFZ_STORAGE_KEY);
        if (rawProgress) {
          const parsed = JSON.parse(rawProgress) as HifzProgress;
          setProgress(parsed);
        }

        const rawReciter = await AsyncStorage.getItem(HIFZ_RECITER_KEY);
        if (rawReciter) {
          const parsed = JSON.parse(rawReciter) as HifzReciter;
          setReciterState(parsed);
        }
      } catch {
        // ignore
      }
    };
    void load();
  }, []);

  const persist = useCallback(async (updated: HifzProgress) => {
    try {
      await AsyncStorage.setItem(HIFZ_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }, []);

  const setVerseStatus = useCallback(
    async (chapter: number, verse: number, status: MemorizationStatus) => {
      const key = `${chapter}:${verse}`;
      const entry: VerseMemorizationEntry = { chapter, verse, status, updatedAt: Date.now() };
      const updated = { ...progress, [key]: entry };
      setProgress(updated);
      await persist(updated);
    },
    [progress, persist],
  );

  const getVerseStatus = useCallback(
    (chapter: number, verse: number): MemorizationStatus => {
      const key = `${chapter}:${verse}`;
      return progress[key]?.status ?? "not_started";
    },
    [progress],
  );

  const getChapterStats = useCallback(
    (chapter: number, totalVerses: number) => {
      let memorized = 0;
      let learning = 0;
      for (let v = 1; v <= totalVerses; v++) {
        const status = progress[`${chapter}:${v}`]?.status ?? "not_started";
        if (status === "memorized") memorized++;
        else if (status === "learning") learning++;
      }
      return {
        memorized,
        learning,
        notStarted: totalVerses - memorized - learning,
        total: totalVerses,
      };
    },
    [progress],
  );

  const getJuzStats = useCallback(
    (juzVerseList: Array<{ chapter: number; verse: number }>) => {
      let memorized = 0;
      let learning = 0;
      for (const { chapter, verse } of juzVerseList) {
        const status = progress[`${chapter}:${verse}`]?.status ?? "not_started";
        if (status === "memorized") memorized++;
        else if (status === "learning") learning++;
      }
      return {
        memorized,
        learning,
        notStarted: juzVerseList.length - memorized - learning,
        total: juzVerseList.length,
      };
    },
    [progress],
  );

  const resetChapter = useCallback(
    async (chapter: number, totalVerses: number) => {
      const updated = { ...progress };
      for (let v = 1; v <= totalVerses; v++) {
        delete updated[`${chapter}:${v}`];
      }
      setProgress(updated);
      await persist(updated);
    },
    [progress, persist],
  );

  const setReciter = useCallback(async (newReciter: HifzReciter) => {
    setReciterState(newReciter);
    try {
      await AsyncStorage.setItem(HIFZ_RECITER_KEY, JSON.stringify(newReciter));
    } catch {
      // ignore
    }
  }, []);

  return (
    <HifzContext.Provider
      value={{
        progress,
        loopConfig,
        reciter,
        setReciter,
        setLoopConfig,
        setVerseStatus,
        getVerseStatus,
        getChapterStats,
        getJuzStats,
        resetChapter,
      }}
    >
      {children}
    </HifzContext.Provider>
  );
};

export const useHifz = () => {
  const context = useContext(HifzContext);
  if (!context) throw new Error("useHifz must be used within a HifzProvider");
  return context;
};
