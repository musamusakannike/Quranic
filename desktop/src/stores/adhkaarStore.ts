import { create } from "zustand";
import { dbGet, dbSet } from "../lib/db";

interface PersistedAdhkaar {
  dateKey: string; // YYYY-MM-DD local date
  counts: Record<string, number>;
}

interface AdhkaarState {
  hydrated: boolean;
  dateKey: string;
  counts: Record<string, number>;
  hydrate: () => Promise<void>;
  increment: (id: string, target: number) => void;
  decrement: (id: string) => void;
  resetItem: (id: string) => void;
  resetAllToday: () => void;
}

const DB_KEY = "adhkaar.daily_counts.v1";

function getLocalDateKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const useAdhkaarStore = create<AdhkaarState>((set) => ({
  hydrated: false,
  dateKey: getLocalDateKey(),
  counts: {},

  hydrate: async () => {
    const today = getLocalDateKey();
    const saved = await dbGet<PersistedAdhkaar | null>(DB_KEY, null);
    if (saved && saved.dateKey === today) {
      set({ dateKey: today, counts: saved.counts, hydrated: true });
    } else {
      set({ dateKey: today, counts: {}, hydrated: true });
      await dbSet(DB_KEY, { dateKey: today, counts: {} });
    }
  },

  increment: (id, target) => {
    const today = getLocalDateKey();
    set((state) => {
      const base = state.dateKey === today ? state.counts : {};
      const cur = base[id] ?? 0;
      const nextCount = Math.min(target, cur + 1);
      const counts = { ...base, [id]: nextCount };
      void dbSet(DB_KEY, { dateKey: today, counts });
      return { dateKey: today, counts };
    });
  },

  decrement: (id) => {
    const today = getLocalDateKey();
    set((state) => {
      const base = state.dateKey === today ? state.counts : {};
      const cur = base[id] ?? 0;
      const counts = { ...base, [id]: Math.max(0, cur - 1) };
      void dbSet(DB_KEY, { dateKey: today, counts });
      return { dateKey: today, counts };
    });
  },

  resetItem: (id) => {
    const today = getLocalDateKey();
    set((state) => {
      const base = state.dateKey === today ? state.counts : {};
      const counts = { ...base, [id]: 0 };
      void dbSet(DB_KEY, { dateKey: today, counts });
      return { dateKey: today, counts };
    });
  },

  resetAllToday: () => {
    const today = getLocalDateKey();
    set({ dateKey: today, counts: {} });
    void dbSet(DB_KEY, { dateKey: today, counts: {} });
  },
}));
