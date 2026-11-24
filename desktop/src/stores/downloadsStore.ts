import { create } from "zustand";
import { dbGet, dbSet } from "../lib/db";
import { isTauriRuntime, tauriInvoke, tauriListen } from "../lib/tauri";

export interface DownloadItem {
  id: string;
  reciterId: string;
  reciterName: string;
  chapter: number;
  surahName: string;
  url: string;
  relativePath: string;
  localPath: string | null;
  bytes: number;
  status: "downloading" | "completed" | "failed" | "cancelled";
  progress: number; // 0..1
  error?: string;
  updatedAt: number;
}

interface DownloadProgressEvent {
  id: string;
  receivedBytes: number;
  totalBytes: number | null;
  progress: number;
}

interface DownloadsState {
  hydrated: boolean;
  items: Record<string, DownloadItem>;
  hydrate: () => Promise<void>;
  startDownload: (params: {
    id: string;
    reciterId: string;
    reciterName: string;
    chapter: number;
    surahName: string;
    url: string;
    relativePath: string;
  }) => Promise<void>;
  updateProgress: (id: string, receivedBytes: number, totalBytes: number | null) => void;
  cancelDownload: (id: string) => Promise<void>;
  deleteDownload: (id: string) => Promise<void>;
  clearAllDownloads: () => Promise<void>;
  getTotalBytes: () => number;
}

const DB_KEY = "downloads.index.v1";

export function safeComputeProgress(
  receivedBytes: number,
  totalBytes: number | null,
): number {
  if (!totalBytes || totalBytes <= 0) return 0;
  return Math.max(0, Math.min(1, receivedBytes / totalBytes));
}

function persistCompleted(items: Record<string, DownloadItem>): void {
  const completedOnly: Record<string, DownloadItem> = {};
  for (const [k, v] of Object.entries(items)) {
    if (v.status === "completed") {
      completedOnly[k] = v;
    }
  }
  void dbSet(DB_KEY, completedOnly);
}

let listenerBound = false;

export const useDownloadsStore = create<DownloadsState>((set, get) => ({
  hydrated: false,
  items: {},

  hydrate: async () => {
    const saved = await dbGet<Record<string, DownloadItem>>(DB_KEY, {});
    set({ items: saved, hydrated: true });

    if (!listenerBound && isTauriRuntime()) {
      listenerBound = true;
      void tauriListen<DownloadProgressEvent>("download-progress", (payload) => {
        get().updateProgress(payload.id, payload.receivedBytes, payload.totalBytes);
      });
    }
  },

  updateProgress: (id, receivedBytes, totalBytes) => {
    const progress = safeComputeProgress(receivedBytes, totalBytes);
    set((state) => {
      const existing = state.items[id];
      if (!existing || existing.status !== "downloading") return state;
      return {
        items: {
          ...state.items,
          [id]: {
            ...existing,
            bytes: receivedBytes,
            progress,
            updatedAt: Date.now(),
          },
        },
      };
    });
  },

  startDownload: async (params) => {
    const existing = get().items[params.id];
    if (existing?.status === "downloading") return;

    const initial: DownloadItem = {
      ...params,
      localPath: null,
      bytes: 0,
      status: "downloading",
      progress: 0,
      updatedAt: Date.now(),
    };

    set((state) => ({
      items: { ...state.items, [params.id]: initial },
    }));

    if (!isTauriRuntime()) {
      // Browser fallback simulation for UI preview
      set((state) => {
        const cur = state.items[params.id];
        if (!cur || cur.status !== "downloading") return state;
        const nextItems: Record<string, DownloadItem> = {
          ...state.items,
          [params.id]: {
            ...cur,
            status: "completed",
            progress: 1,
            localPath: params.url,
            bytes: 0,
            updatedAt: Date.now(),
          },
        };
        persistCompleted(nextItems);
        return { items: nextItems };
      });
      return;
    }

    try {
      const res = await tauriInvoke<{ id: string; path: string; bytes: number }>(
        "download_file",
        {
          id: params.id,
          url: params.url,
          relativePath: params.relativePath,
        },
      );

      set((state) => {
        const cur = state.items[params.id];
        if (!cur || cur.status === "cancelled") return state;
        const nextItems: Record<string, DownloadItem> = {
          ...state.items,
          [params.id]: {
            ...cur,
            status: "completed",
            progress: 1,
            localPath: res.path,
            bytes: res.bytes,
            error: undefined,
            updatedAt: Date.now(),
          },
        };
        persistCompleted(nextItems);
        return { items: nextItems };
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isCancelled = msg.toLowerCase().includes("cancel");
      set((state) => {
        const cur = state.items[params.id];
        if (!cur) return state;
        return {
          items: {
            ...state.items,
            [params.id]: {
              ...cur,
              status: isCancelled ? "cancelled" : "failed",
              error: isCancelled ? undefined : msg,
              updatedAt: Date.now(),
            },
          },
        };
      });
    }
  },

  cancelDownload: async (id) => {
    set((state) => {
      const cur = state.items[id];
      if (!cur) return state;
      return {
        items: {
          ...state.items,
          [id]: { ...cur, status: "cancelled", updatedAt: Date.now() },
        },
      };
    });
    if (isTauriRuntime()) {
      await tauriInvoke("cancel_download", { id }).catch(() => {});
    }
  },

  deleteDownload: async (id) => {
    const item = get().items[id];
    if (item && isTauriRuntime()) {
      await tauriInvoke("delete_app_file", {
        relativePath: item.relativePath,
      }).catch(() => {});
    }
    set((state) => {
      const next = { ...state.items };
      delete next[id];
      persistCompleted(next);
      return { items: next };
    });
  },

  clearAllDownloads: async () => {
    if (isTauriRuntime()) {
      await tauriInvoke("delete_app_file", { relativePath: "downloads" }).catch(() => {});
    }
    set({ items: {} });
    await dbSet(DB_KEY, {});
  },

  getTotalBytes: () => {
    return Object.values(get().items)
      .filter((i) => i.status === "completed")
      .reduce((acc, i) => acc + (i.bytes || 0), 0);
  },
}));
