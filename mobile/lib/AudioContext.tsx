import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import {
  useAudioPlayer,
  useAudioPlayerStatus,
  AudioPlayer,
  AudioStatus,
  setAudioModeAsync,
} from "expo-audio";
import { Command, MediaControl, PlaybackState } from "expo-media-control";

export interface Track {
  id: string; // Unique ID for each queue entry (even with same URL)
  audioUrl: string;
  surahId: string;
  surahName: string;
  reciterName: string;
  reciterId: string;
  server: string;
  mode?: "chapter" | "verse_by_verse";
  verseNumber?: number;
}

interface AudioContextType {
  player: AudioPlayer;
  status: AudioStatus;
  playbackRate: number;
  currentTrack: Track | null;
  playTrack: (track: Track) => void;
  togglePlayback: (forcePlay?: boolean) => void;
  seekTo: (position: number) => void;
  seekBy: (deltaSeconds: number) => void;
  skipToNext: () => void;
  skipToPrevious: () => void;
  setPlaybackRate: (rate: number) => void;
  closePlayer: () => void;
  isMiniPlayerVisible: boolean;
  queue: Track[];
  playNext: (track: Track) => void;
  playNextInQueue: () => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  setQueue: (tracks: Track[]) => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

export const AudioProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const player = useAudioPlayer(currentTrack?.audioUrl || null);
  const status = useAudioPlayerStatus(player);
  const [playbackRate, setPlaybackRateState] = useState(1);
  const [queue, setQueue] = useState<Track[]>([]);

  // To handle auto-play safely after track switch without spamming
  const previousUrlRef = useRef<string | null>(null);
  const lastFinishedIdRef = useRef<string | null>(null);
  const hasStartedPlayingRef = useRef<boolean>(false);
  const historyRef = useRef<Track[]>([]);
  const currentTrackRef = useRef<Track | null>(null);
  const queueRef = useRef<Track[]>([]);
  const statusRef = useRef<AudioStatus>(status);
  const playbackRateRef = useRef(1);
  const isMediaControlEnabledRef = useRef(false);
  const lastPlaybackStateRef = useRef<PlaybackState | null>(null);

  const getLockScreenMetadata = useCallback((track: Track) => ({
    title: track.surahName,
    artist: track.reciterName,
    albumTitle: track.mode === "verse_by_verse" ? "Quranic · Verse by Verse" : "Quranic",
  }), []);

  const getMediaMetadata = useCallback((track: Track) => ({
    title: track.surahName,
    artist: track.reciterName,
    album: track.mode === "verse_by_verse" ? "Quranic · Verse by Verse" : "Quranic",
    duration: statusRef.current.duration > 0 ? statusRef.current.duration : undefined,
    elapsedTime: statusRef.current.currentTime,
  }), []);

  const resolvePlaybackState = useCallback(() => {
    if (!currentTrackRef.current) return PlaybackState.STOPPED;
    if (statusRef.current.isBuffering) return PlaybackState.BUFFERING;
    return statusRef.current.playing ? PlaybackState.PLAYING : PlaybackState.PAUSED;
  }, []);

  const syncSystemPlaybackState = useCallback((force = false) => {
    if (!isMediaControlEnabledRef.current) return;

    const nextState = resolvePlaybackState();
    if (!force && lastPlaybackStateRef.current === nextState) return;

    lastPlaybackStateRef.current = nextState;
    const position = statusRef.current.currentTime || 0;
    const rate = nextState === PlaybackState.PLAYING ? playbackRateRef.current : 0;
    void MediaControl.updatePlaybackState(nextState, position, rate).catch((error) => {
      console.log("[AudioContext] Failed to sync playback state", error);
    });
  }, [resolvePlaybackState]);

  const syncSystemMetadata = useCallback((track: Track) => {
    if (!isMediaControlEnabledRef.current) return;
    void MediaControl.updateMetadata(getMediaMetadata(track)).catch((error) => {
      console.log("[AudioContext] Failed to sync metadata", error);
    });
  }, [getMediaMetadata]);

  const seekToPosition = useCallback((position: number) => {
    const duration = statusRef.current.duration > 0 ? statusRef.current.duration : Infinity;
    const safePosition = Math.max(0, Math.min(position, duration));
    player.seekTo(safePosition);
    syncSystemPlaybackState(true);
  }, [player, syncSystemPlaybackState]);

  const seekByDelta = useCallback((deltaSeconds: number) => {
    seekToPosition(statusRef.current.currentTime + deltaSeconds);
  }, [seekToPosition]);

  const pushCurrentToHistory = useCallback(() => {
    if (!currentTrackRef.current) return;
    historyRef.current = [...historyRef.current.slice(-49), currentTrackRef.current];
  }, []);

  const playPreviousFromHistory = useCallback(() => {
    if (historyRef.current.length === 0) return false;

    const previousTrack = historyRef.current[historyRef.current.length - 1];
    historyRef.current = historyRef.current.slice(0, -1);

    if (currentTrackRef.current) {
      setQueue((prev) => [currentTrackRef.current as Track, ...prev]);
    }

    lastFinishedIdRef.current = null;
    setCurrentTrack(previousTrack);
    previousUrlRef.current = null;
    return true;
  }, []);

  const playQueueNext = useCallback(() => {
    if (queueRef.current.length === 0) return false;

    const nextTrack = queueRef.current[0];
    setQueue((q) => q.slice(1));
    pushCurrentToHistory();
    lastFinishedIdRef.current = null;
    setCurrentTrack(nextTrack);
    previousUrlRef.current = null;
    return true;
  }, [pushCurrentToHistory]);

  const togglePlayPause = useCallback((forcePlay?: boolean) => {
    const shouldPlay = forcePlay ?? !statusRef.current.playing;
    if (shouldPlay) {
      player.play();
    } else {
      player.pause();
    }
    syncSystemPlaybackState(true);
  }, [player, syncSystemPlaybackState]);

  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    // Configure background audio mode
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: "doNotMix",
    }).catch((e) => console.log("Audio mode error", e));

    void MediaControl.enableMediaControls({
      capabilities: [
        Command.PLAY,
        Command.PAUSE,
        Command.STOP,
        Command.NEXT_TRACK,
        Command.PREVIOUS_TRACK,
        Command.SEEK,
        Command.SKIP_FORWARD,
        Command.SKIP_BACKWARD,
      ],
      compactCapabilities: [Command.PREVIOUS_TRACK, Command.PLAY, Command.NEXT_TRACK],
      notification: {
        color: "#056C5C",
      },
      ios: {
        skipInterval: 10,
      },
      android: {
        skipInterval: 10,
      },
    })
      .then(() => {
        isMediaControlEnabledRef.current = true;
      })
      .catch((error) => {
        console.log("[AudioContext] Failed to enable media controls", error);
      });

    const removeMediaListener = MediaControl.addListener((event) => {
      switch (event.command) {
        case Command.PLAY:
          togglePlayPause(true);
          break;
        case Command.PAUSE:
          togglePlayPause(false);
          break;
        case Command.STOP:
          player.pause();
          setCurrentTrack(null);
          break;
        case Command.NEXT_TRACK:
          if (!playQueueNext()) seekByDelta(10);
          break;
        case Command.PREVIOUS_TRACK:
          if (!playPreviousFromHistory()) seekByDelta(-10);
          break;
        case Command.SKIP_FORWARD:
          seekByDelta(event.data?.interval || 10);
          break;
        case Command.SKIP_BACKWARD:
          seekByDelta(-(event.data?.interval || 10));
          break;
        case Command.SEEK: {
          const position = Number(event.data?.position);
          if (!Number.isNaN(position)) seekToPosition(position);
          break;
        }
        default:
          break;
      }
    });

    return () => {
      removeMediaListener();
      isMediaControlEnabledRef.current = false;
      void MediaControl.disableMediaControls().catch((error) => {
        console.log("[AudioContext] Failed to disable media controls", error);
      });
    };
    // Intentionally one-time setup for media control session/event bridge.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (currentTrack) {
      console.log(`[AudioContext] Track changed to: ${currentTrack.surahName} (ID: ${currentTrack.id})`);
      hasStartedPlayingRef.current = false; // Reset lock for new track
      player.replace(currentTrack.audioUrl);
      player.setActiveForLockScreen(true, getLockScreenMetadata(currentTrack));
      syncSystemMetadata(currentTrack);
      player.play();
      syncSystemPlaybackState(true);
    } else {
      player.pause();
      player.clearLockScreenControls();
      syncSystemPlaybackState(true);
      if (isMediaControlEnabledRef.current) {
        void MediaControl.resetControls().catch((error) => {
          console.log("[AudioContext] Failed to reset media controls", error);
        });
      }
    }
  }, [currentTrack, player, getLockScreenMetadata, syncSystemMetadata, syncSystemPlaybackState]);

  useEffect(() => {
    if (!currentTrack) return;
    player.updateLockScreenMetadata(getLockScreenMetadata(currentTrack));
  }, [currentTrack, player, getLockScreenMetadata, status.duration]);

  useEffect(() => {
    syncSystemPlaybackState();
  }, [status.playing, status.isBuffering, currentTrack?.id, syncSystemPlaybackState]);

  useEffect(() => {
    // If the track is playing, mark it as started. This prevents premature transitions.
    if (status.playing) {
      hasStartedPlayingRef.current = true;
    }

    // Auto-advance when finished
    if (status.didJustFinish && currentTrack && lastFinishedIdRef.current !== currentTrack.id && hasStartedPlayingRef.current) {
      console.log(`[AudioContext] Track finished: ${currentTrack.surahName} (ID: ${currentTrack.id})`);
      lastFinishedIdRef.current = currentTrack.id;
      hasStartedPlayingRef.current = false; // Lock until next track starts

      if (queue.length > 0) {
        const nextTrack = queue[0];
        console.log(`[AudioContext] Advancing to next in queue: ${nextTrack.surahName}`);
        setQueue((q) => q.slice(1));
        pushCurrentToHistory();
        setCurrentTrack(nextTrack);
      } else {
        console.log(`[AudioContext] Queue empty, playback finished.`);
        syncSystemPlaybackState(true);
      }
    }
  }, [status.didJustFinish, status.playing, currentTrack, queue, pushCurrentToHistory, syncSystemPlaybackState]);

  const playNext = (track: Track) => {
    setQueue((prev) => [track, ...prev]);
  };

  const playNextInQueue = () => {
    playQueueNext();
  };

  const addToQueue = (track: Track) => {
    setQueue((prev) => [...prev, track]);
  };

  const removeFromQueue = (index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
  };

  const closePlayer = () => {
    player.pause();
    player.clearLockScreenControls();
    setCurrentTrack(null);
    historyRef.current = [];
    previousUrlRef.current = null;
    syncSystemPlaybackState(true);
  };

  const clearQueue = () => {
    setQueue([]);
  };

  const playTrack = (track: Track) => {
    console.log(`[AudioContext] playTrack called for: ${track.surahName}`);
    lastFinishedIdRef.current = null; // Reset to allow this track to finish
    if (currentTrack?.audioUrl === track.audioUrl) {
      player.seekTo(0);
      player.play();
      syncSystemPlaybackState(true);
    } else {
      pushCurrentToHistory();
      setCurrentTrack(track);
      previousUrlRef.current = null;
    }
  };

  const skipToNext = () => {
    if (!playQueueNext()) {
      seekByDelta(10);
    }
  };

  const skipToPrevious = () => {
    if (!playPreviousFromHistory()) {
      seekByDelta(-10);
    }
  };

  const setPlaybackRate = (rate: number) => {
    const normalizedRate = Math.max(0.5, Math.min(2, rate));
    playbackRateRef.current = normalizedRate;
    setPlaybackRateState(normalizedRate);
    player.setPlaybackRate(normalizedRate);
    syncSystemPlaybackState(true);
  };

  return (
    <AudioContext.Provider
      value={{
        player,
        status,
        playbackRate,
        currentTrack,
        playTrack,
        togglePlayback: togglePlayPause,
        seekTo: seekToPosition,
        seekBy: seekByDelta,
        skipToNext,
        skipToPrevious,
        setPlaybackRate,
        closePlayer,
        isMiniPlayerVisible: !!currentTrack,
        queue,
        playNext,
        playNextInQueue,
        addToQueue,
        removeFromQueue,
        clearQueue,
        setQueue: (tracks: Track[]) => setQueue(tracks),
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error("useAudio must be used within AudioProvider");
  return ctx;
};
