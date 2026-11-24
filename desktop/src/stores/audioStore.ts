import { create } from "zustand";
import {
  buildChapterAudioUrl,
  buildVerseAudioUrl,
  DEFAULT_VERSE_RECITER,
} from "../lib/audioApi";
import { getChapterMetadata, getVersesCount } from "../lib/quran";
import { dbGet, dbSet } from "../lib/db";

export type AudioMode = "chapter" | "verse_by_verse";
export type RepeatMode = "off" | "surah" | "verse";
export type SleepTimerMode = "off" | "15" | "30" | "45" | "60" | "end_of_surah";

export interface ActiveReciter {
  id: string;
  name: string;
  server: string;
  mode: AudioMode;
  moshafName?: string;
}

export interface AudioTrack {
  id: string;
  audioUrl: string;
  chapter: number;
  verse?: number;
  surahName: string;
  reciterId: string;
  reciterName: string;
  server: string;
  mode: AudioMode;
}

export interface LoopConfig {
  chapter: number;
  startVerse: number;
  endVerse: number;
  repeatsTotal: number; // 0 = infinite
  repeatsDone: number;
}

interface AudioState {
  activeReciter: ActiveReciter;
  currentTrack: AudioTrack | null;
  queue: AudioTrack[];
  history: AudioTrack[];
  isPlaying: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  volume: number;
  muted: boolean;
  repeatMode: RepeatMode;
  sleepTimerMode: SleepTimerMode;
  sleepEndsAt: number | null;
  error: string | null;
  loopConfig: LoopConfig | null;
  isAdhanPlaying: boolean;

  hydrate: () => Promise<void>;
  setActiveReciter: (reciter: ActiveReciter) => void;
  playTrack: (track: AudioTrack, nextQueue?: AudioTrack[]) => void;
  playSurahFromVerse: (chapter: number, startVerse?: number) => void;
  startLoop: (chapter: number, startVerse: number, endVerse: number, repeatsTotal: number) => void;
  stopLoop: () => void;
  togglePlayPause: (forcePlay?: boolean) => void;
  seekTo: (seconds: number) => void;
  seekBy: (delta: number) => void;
  skipNext: () => void;
  skipPrevious: () => void;
  setPlaybackRate: (rate: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  cycleRepeatMode: () => void;
  setRepeatMode: (mode: RepeatMode) => void;
  setSleepTimer: (mode: SleepTimerMode) => void;
  addToQueue: (track: AudioTrack) => void;
  playNextInQueue: (track: AudioTrack) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  clearQueue: () => void;
  closePlayer: () => void;
  playAdhan: () => void;
  stopAdhan: () => void;
}

const RECITER_DB_KEY = "audio.active_reciter.v1";

const DEFAULT_RECITER: ActiveReciter = {
  id: DEFAULT_VERSE_RECITER.identifier,
  name: DEFAULT_VERSE_RECITER.englishName,
  server: DEFAULT_VERSE_RECITER.server,
  mode: "verse_by_verse",
  moshafName: "Verse by Verse",
};

let audioEl: HTMLAudioElement | null = null;
let adhanEl: HTMLAudioElement | null = null;
let sleepTimeout: ReturnType<typeof setTimeout> | null = null;

function getAudioElement(): HTMLAudioElement | null {
  if (typeof Audio === "undefined") return null;
  if (!audioEl) {
    audioEl = new Audio();
    audioEl.preload = "auto";
  }
  return audioEl;
}

function getAdhanElement(): HTMLAudioElement | null {
  if (typeof Audio === "undefined") return null;
  if (!adhanEl) {
    adhanEl = new Audio("/audio/azan.mp3");
    adhanEl.preload = "none";
  }
  return adhanEl;
}

function makeTrackId(reciterId: string, chapter: number, verse?: number): string {
  return `${reciterId}:${chapter}:${verse ?? "full"}:${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function buildVerseQueueForSurah(
  reciter: ActiveReciter,
  chapter: number,
  startVerse: number,
  endVerse?: number,
): AudioTrack[] {
  const meta = getChapterMetadata(chapter);
  const surahName = meta?.name ?? `Surah ${chapter}`;
  const last = Math.min(endVerse ?? getVersesCount(chapter), getVersesCount(chapter));
  const tracks: AudioTrack[] = [];
  for (let v = startVerse; v <= last; v++) {
    tracks.push({
      id: makeTrackId(reciter.id, chapter, v),
      audioUrl: buildVerseAudioUrl(reciter.server, chapter, v),
      chapter,
      verse: v,
      surahName,
      reciterId: reciter.id,
      reciterName: reciter.name,
      server: reciter.server,
      mode: "verse_by_verse",
    });
  }
  return tracks;
}

export function buildChapterTrack(
  reciter: ActiveReciter,
  chapter: number,
  overrideUrl?: string,
): AudioTrack {
  const meta = getChapterMetadata(chapter);
  return {
    id: makeTrackId(reciter.id, chapter),
    audioUrl: overrideUrl ?? buildChapterAudioUrl(reciter.server, chapter),
    chapter,
    surahName: meta?.name ?? `Surah ${chapter}`,
    reciterId: reciter.id,
    reciterName: reciter.name,
    server: reciter.server,
    mode: "chapter",
  };
}

function syncMediaSession(track: AudioTrack | null, isPlaying: boolean): void {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
  try {
    if (!track) {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = "none";
      return;
    }
    if (typeof MediaMetadata !== "undefined") {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.verse ? `${track.surahName} · Ayah ${track.verse}` : track.surahName,
        artist: track.reciterName,
        album: "Quranic",
      });
    }
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
  } catch {
    // Some webviews have partial MediaSession support
  }
}

export const useAudioStore = create<AudioState>((set, get) => {
  const bindAudioEvents = (el: HTMLAudioElement) => {
    if ((el as unknown as { __quranicBound?: boolean }).__quranicBound) return;
    (el as unknown as { __quranicBound?: boolean }).__quranicBound = true;

    el.addEventListener("timeupdate", () => {
      set({ currentTime: el.currentTime || 0 });
    });
    el.addEventListener("loadedmetadata", () => {
      set({ duration: Number.isFinite(el.duration) ? el.duration : 0 });
    });
    el.addEventListener("waiting", () => set({ isBuffering: true }));
    el.addEventListener("playing", () => {
      set({ isPlaying: true, isBuffering: false, error: null });
      syncMediaSession(get().currentTrack, true);
    });
    el.addEventListener("pause", () => {
      set({ isPlaying: false });
      syncMediaSession(get().currentTrack, false);
    });
    el.addEventListener("error", () => {
      set({
        isPlaying: false,
        isBuffering: false,
        error: "Unable to play audio. Check your connection or try another reciter.",
      });
    });
    el.addEventListener("ended", () => {
      const state = get();
      const { currentTrack, queue, repeatMode, sleepTimerMode, loopConfig, activeReciter } = state;
      if (!currentTrack) return;

      // Sleep timer: end of surah
      if (
        sleepTimerMode === "end_of_surah" &&
        (currentTrack.mode === "chapter" || queue.length === 0)
      ) {
        set({ isPlaying: false, sleepTimerMode: "off", sleepEndsAt: null });
        return;
      }

      // Repeat single verse / track
      if (repeatMode === "verse") {
        el.currentTime = 0;
        void el.play().catch(() => {});
        return;
      }

      // Next track in queue
      if (queue.length > 0) {
        const [nextTrack, ...rest] = queue;
        if (nextTrack) {
          set({
            history: [...state.history.slice(-49), currentTrack],
            currentTrack: nextTrack,
            queue: rest,
            currentTime: 0,
            duration: 0,
            isBuffering: true,
          });
          el.src = nextTrack.audioUrl;
          el.playbackRate = state.playbackRate;
          void el.play().catch(() => {});
          return;
        }
      }

      // Hifz Loop Mode repeat check
      if (loopConfig) {
        const nextDone = loopConfig.repeatsDone + 1;
        if (loopConfig.repeatsTotal === 0 || nextDone < loopConfig.repeatsTotal) {
          const reciterForLoop: ActiveReciter =
            activeReciter.mode === "verse_by_verse" ? activeReciter : DEFAULT_RECITER;
          const loopTracks = buildVerseQueueForSurah(
            reciterForLoop,
            loopConfig.chapter,
            loopConfig.startVerse,
            loopConfig.endVerse,
          );
          const [first, ...rest] = loopTracks;
          if (first) {
            set({
              loopConfig: { ...loopConfig, repeatsDone: nextDone },
              currentTrack: first,
              queue: rest,
              currentTime: 0,
              duration: 0,
              isBuffering: true,
            });
            el.src = first.audioUrl;
            el.playbackRate = state.playbackRate;
            void el.play().catch(() => {});
            return;
          }
        } else {
          set({ loopConfig: null });
        }
      }

      // Repeat surah
      if (repeatMode === "surah") {
        if (currentTrack.mode === "chapter") {
          el.currentTime = 0;
          void el.play().catch(() => {});
          return;
        }
        const tracks = buildVerseQueueForSurah(activeReciter, currentTrack.chapter, 1);
        const [first, ...rest] = tracks;
        if (first) {
          set({ currentTrack: first, queue: rest, currentTime: 0, duration: 0 });
          el.src = first.audioUrl;
          el.playbackRate = state.playbackRate;
          void el.play().catch(() => {});
          return;
        }
      }

      set({ isPlaying: false });
    });

    // Wire OS media keys via MediaSession
    if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
      try {
        navigator.mediaSession.setActionHandler("play", () => get().togglePlayPause(true));
        navigator.mediaSession.setActionHandler("pause", () => get().togglePlayPause(false));
        navigator.mediaSession.setActionHandler("nexttrack", () => get().skipNext());
        navigator.mediaSession.setActionHandler("previoustrack", () => get().skipPrevious());
        navigator.mediaSession.setActionHandler("seekbackward", () => get().seekBy(-10));
        navigator.mediaSession.setActionHandler("seekforward", () => get().seekBy(10));
      } catch {
        // Ignore unsupported handlers
      }
    }
  };

  return {
    activeReciter: DEFAULT_RECITER,
    currentTrack: null,
    queue: [],
    history: [],
    isPlaying: false,
    isBuffering: false,
    currentTime: 0,
    duration: 0,
    playbackRate: 1,
    volume: 1,
    muted: false,
    repeatMode: "off",
    sleepTimerMode: "off",
    sleepEndsAt: null,
    error: null,
    loopConfig: null,
    isAdhanPlaying: false,

    hydrate: async () => {
      const saved = await dbGet<ActiveReciter | null>(RECITER_DB_KEY, null);
      if (saved) set({ activeReciter: saved });
    },

    setActiveReciter: (reciter) => {
      set({ activeReciter: reciter });
      void dbSet(RECITER_DB_KEY, reciter);
    },

    playTrack: (track, nextQueue) => {
      const el = getAudioElement();
      if (!el) return;
      bindAudioEvents(el);
      const prev = get().currentTrack;
      set((state) => ({
        history: prev ? [...state.history.slice(-49), prev] : state.history,
        currentTrack: track,
        queue: nextQueue !== undefined ? nextQueue : state.queue,
        currentTime: 0,
        duration: 0,
        isBuffering: true,
        error: null,
      }));
      el.src = track.audioUrl;
      el.volume = get().muted ? 0 : get().volume;
      el.playbackRate = get().playbackRate;
      void el.play().catch((err) => {
        console.warn("[audio] play failed:", err);
      });
    },

    playSurahFromVerse: (chapter, startVerse = 1) => {
      const reciter = get().activeReciter;
      set({ loopConfig: null });
      if (reciter.mode === "verse_by_verse") {
        const tracks = buildVerseQueueForSurah(reciter, chapter, startVerse);
        const [first, ...rest] = tracks;
        if (first) get().playTrack(first, rest);
      } else {
        const track = buildChapterTrack(reciter, chapter);
        get().playTrack(track, []);
      }
    },

    startLoop: (chapter, startVerse, endVerse, repeatsTotal) => {
      const reciter =
        get().activeReciter.mode === "verse_by_verse"
          ? get().activeReciter
          : DEFAULT_RECITER;
      const tracks = buildVerseQueueForSurah(reciter, chapter, startVerse, endVerse);
      const [first, ...rest] = tracks;
      if (!first) return;
      set({
        loopConfig: {
          chapter,
          startVerse,
          endVerse,
          repeatsTotal,
          repeatsDone: 0,
        },
      });
      get().playTrack(first, rest);
    },

    stopLoop: () => {
      set({ loopConfig: null });
      get().togglePlayPause(false);
    },

    togglePlayPause: (forcePlay) => {
      const el = getAudioElement();
      if (!el || !get().currentTrack) return;
      const shouldPlay = forcePlay ?? el.paused;
      if (shouldPlay) {
        void el.play().catch(() => {});
      } else {
        el.pause();
      }
    },

    seekTo: (seconds) => {
      const el = getAudioElement();
      if (!el) return;
      const clamped = Math.max(0, Math.min(seconds, el.duration || seconds));
      el.currentTime = clamped;
      set({ currentTime: clamped });
    },

    seekBy: (delta) => {
      get().seekTo(get().currentTime + delta);
    },

    skipNext: () => {
      const { queue, currentTrack } = get();
      if (queue.length > 0) {
        const [nextTrack, ...rest] = queue;
        if (nextTrack) {
          const el = getAudioElement();
          if (!el) return;
          bindAudioEvents(el);
          set((state) => ({
            history: currentTrack ? [...state.history.slice(-49), currentTrack] : state.history,
            currentTrack: nextTrack,
            queue: rest,
            currentTime: 0,
            duration: 0,
            isBuffering: true,
            error: null,
          }));
          el.src = nextTrack.audioUrl;
          el.playbackRate = get().playbackRate;
          void el.play().catch(() => {});
          return;
        }
      }
      // If queue is empty, never restart the original surah; seek forward 10s
      get().seekBy(10);
    },

    skipPrevious: () => {
      const { history, currentTrack, currentTime } = get();
      if (currentTime > 4) {
        get().seekTo(0);
        return;
      }
      if (history.length > 0) {
        const prevTrack = history[history.length - 1]!;
        const restHistory = history.slice(0, -1);
        const el = getAudioElement();
        if (!el) return;
        bindAudioEvents(el);
        set((state) => ({
          history: restHistory,
          queue: currentTrack ? [currentTrack, ...state.queue] : state.queue,
          currentTrack: prevTrack,
          currentTime: 0,
          duration: 0,
          isBuffering: true,
          error: null,
        }));
        el.src = prevTrack.audioUrl;
        el.playbackRate = get().playbackRate;
        void el.play().catch(() => {});
        return;
      }
      get().seekBy(-10);
    },

    setPlaybackRate: (rate) => {
      const clamped = Math.max(0.5, Math.min(2, rate));
      set({ playbackRate: clamped });
      const el = getAudioElement();
      if (el) el.playbackRate = clamped;
    },

    setVolume: (vol) => {
      const clamped = Math.max(0, Math.min(1, vol));
      set({ volume: clamped, muted: clamped === 0 });
      const el = getAudioElement();
      if (el) el.volume = clamped;
    },

    toggleMute: () => {
      const nextMuted = !get().muted;
      set({ muted: nextMuted });
      const el = getAudioElement();
      if (el) el.volume = nextMuted ? 0 : get().volume;
    },

    cycleRepeatMode: () => {
      const order: RepeatMode[] = ["off", "surah", "verse"];
      const idx = order.indexOf(get().repeatMode);
      set({ repeatMode: order[(idx + 1) % order.length] ?? "off" });
    },

    setRepeatMode: (mode) => set({ repeatMode: mode }),

    setSleepTimer: (mode) => {
      if (sleepTimeout) {
        clearTimeout(sleepTimeout);
        sleepTimeout = null;
      }
      if (mode === "off" || mode === "end_of_surah") {
        set({ sleepTimerMode: mode, sleepEndsAt: null });
        return;
      }
      const mins = Number(mode);
      const endsAt = Date.now() + mins * 60_000;
      set({ sleepTimerMode: mode, sleepEndsAt: endsAt });
      sleepTimeout = setTimeout(() => {
        get().togglePlayPause(false);
        set({ sleepTimerMode: "off", sleepEndsAt: null });
      }, mins * 60_000);
    },

    addToQueue: (track) => set((state) => ({ queue: [...state.queue, track] })),

    playNextInQueue: (track) => set((state) => ({ queue: [track, ...state.queue] })),

    removeFromQueue: (index) =>
      set((state) => ({ queue: state.queue.filter((_, i) => i !== index) })),

    reorderQueue: (fromIndex, toIndex) =>
      set((state) => {
        const next = [...state.queue];
        const [moved] = next.splice(fromIndex, 1);
        if (moved) next.splice(toIndex, 0, moved);
        return { queue: next };
      }),

    clearQueue: () => set({ queue: [] }),

    closePlayer: () => {
      const el = getAudioElement();
      if (el) {
        el.pause();
        el.removeAttribute("src");
        el.load();
      }
      set({
        currentTrack: null,
        queue: [],
        history: [],
        isPlaying: false,
        isBuffering: false,
        currentTime: 0,
        duration: 0,
        loopConfig: null,
        error: null,
      });
      syncMediaSession(null, false);
    },

    playAdhan: () => {
      const el = getAdhanElement();
      if (!el) return;
      el.currentTime = 0;
      el.onended = () => set({ isAdhanPlaying: false });
      set({ isAdhanPlaying: true });
      void el.play().catch(() => set({ isAdhanPlaying: false }));
    },

    stopAdhan: () => {
      const el = getAdhanElement();
      if (el) {
        el.pause();
        el.currentTime = 0;
      }
      set({ isAdhanPlaying: false });
    },
  };
});
