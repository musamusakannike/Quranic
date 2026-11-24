import { create } from "zustand";
import { dbGet, dbSet } from "../lib/db";
import { getVersesCount } from "../lib/quran";

export type MemorizationStatus = "not_started" | "learning" | "memorized";

interface HifzState {
  hydrated: boolean;
  /** Map of `${chapter}:${verse}` -> "learning" | "memorized" (omitted = "not_started") */
  progress: Record<string, Exclude<MemorizationStatus, "not_started">>;
  hydrate: () => Promise<void>;
  setVerseStatus: (chapter: number, verse: number, status: MemorizationStatus) => void;
  getVerseStatus: (chapter: number, verse: number) => MemorizationStatus;
  markSurahStatus: (chapter: number, status: MemorizationStatus) => void;
  getCounts: () => { memorized: number; learning: number; remaining: number };
  getSurahCounts: (chapter: number) => { memorized: number; learning: number; total: number };
  resetHifz: () => Promise<void>;
}

const DB_KEY = "hifz.progress.v1";
const TOTAL_VERSES = 6236;

export const useHifzStore = create<HifzState>((set, get) => ({
  hydrated: false,
  progress: {},

  hydrate: async () => {
    const saved = await dbGet<Record<string, Exclude<MemorizationStatus, "not_started">>>(
      DB_KEY,
      {},
    );
    set({ progress: saved, hydrated: true });
  },

  setVerseStatus: (chapter, verse, status) => {
    const key = `${chapter}:${verse}`;
    set((state) => {
      const next = { ...state.progress };
      if (status === "not_started") {
        delete next[key];
      } else {
        next[key] = status;
      }
      void dbSet(DB_KEY, next);
      return { progress: next };
    });
  },

  getVerseStatus: (chapter, verse) => {
    return get().progress[`${chapter}:${verse}`] ?? "not_started";
  },

  markSurahStatus: (chapter, status) => {
    const count = getVersesCount(chapter);
    set((state) => {
      const next = { ...state.progress };
      for (let v = 1; v <= count; v++) {
        const key = `${chapter}:${v}`;
        if (status === "not_started") {
          delete next[key];
        } else {
          next[key] = status;
        }
      }
      void dbSet(DB_KEY, next);
      return { progress: next };
    });
  },

  getCounts: () => {
    let memorized = 0;
    let learning = 0;
    for (const val of Object.values(get().progress)) {
      if (val === "memorized") memorized++;
      else if (val === "learning") learning++;
    }
    return {
      memorized,
      learning,
      remaining: Math.max(0, TOTAL_VERSES - memorized - learning),
    };
  },

  getSurahCounts: (chapter) => {
    const total = getVersesCount(chapter);
    const prog = get().progress;
    let memorized = 0;
    let learning = 0;
    for (let v = 1; v <= total; v++) {
      const s = prog[`${chapter}:${v}`];
      if (s === "memorized") memorized++;
      else if (s === "learning") learning++;
    }
    return { memorized, learning, total };
  },

  resetHifz: async () => {
    set({ progress: {} });
    await dbSet(DB_KEY, {});
  },
}));
