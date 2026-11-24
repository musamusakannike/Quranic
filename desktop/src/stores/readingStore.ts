import { create } from "zustand";
import { dbGet, dbSet } from "../lib/db";
import type { ReadingMode } from "./settingsStore";

export interface LastReadState {
  chapter: number;
  verse: number;
  page: number;
  juz: number;
  mode: ReadingMode;
  updatedAt: number;
}

export interface BookmarkItem {
  id: string; // `${chapter}:${verse}`
  chapter: number;
  verse: number;
  createdAt: number;
}

interface ReadingState {
  hydrated: boolean;
  lastRead: LastReadState | null;
  bookmarks: BookmarkItem[];
  hydrate: () => Promise<void>;
  setLastRead: (entry: Omit<LastReadState, "updatedAt">) => void;
  toggleBookmark: (chapter: number, verse: number) => boolean;
  removeBookmark: (id: string) => void;
  isBookmarked: (chapter: number, verse: number) => boolean;
  resetReading: () => Promise<void>;
}

const LAST_READ_KEY = "reading.last_read.v1";
const BOOKMARKS_KEY = "reading.bookmarks.v1";

let throttleTimer: ReturnType<typeof setTimeout> | null = null;
let pendingLastRead: LastReadState | null = null;

export const useReadingStore = create<ReadingState>((set, get) => ({
  hydrated: false,
  lastRead: null,
  bookmarks: [],

  hydrate: async () => {
    const [lastRead, bookmarks] = await Promise.all([
      dbGet<LastReadState | null>(LAST_READ_KEY, null),
      dbGet<BookmarkItem[]>(BOOKMARKS_KEY, []),
    ]);
    set({ lastRead, bookmarks, hydrated: true });
  },

  setLastRead: (entry) => {
    const full: LastReadState = { ...entry, updatedAt: Date.now() };
    set({ lastRead: full });
    pendingLastRead = full;
    if (!throttleTimer) {
      throttleTimer = setTimeout(() => {
        throttleTimer = null;
        if (pendingLastRead) {
          void dbSet(LAST_READ_KEY, pendingLastRead);
          pendingLastRead = null;
        }
      }, 1000);
    }
  },

  toggleBookmark: (chapter, verse) => {
    const id = `${chapter}:${verse}`;
    const exists = get().bookmarks.some((b) => b.id === id);
    const next = exists
      ? get().bookmarks.filter((b) => b.id !== id)
      : [{ id, chapter, verse, createdAt: Date.now() }, ...get().bookmarks];
    set({ bookmarks: next });
    void dbSet(BOOKMARKS_KEY, next);
    return !exists;
  },

  removeBookmark: (id) => {
    const next = get().bookmarks.filter((b) => b.id !== id);
    set({ bookmarks: next });
    void dbSet(BOOKMARKS_KEY, next);
  },

  isBookmarked: (chapter, verse) => {
    const id = `${chapter}:${verse}`;
    return get().bookmarks.some((b) => b.id === id);
  },

  resetReading: async () => {
    set({ lastRead: null, bookmarks: [] });
    await Promise.all([dbSet(LAST_READ_KEY, null), dbSet(BOOKMARKS_KEY, [])]);
  },
}));
