import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import {
  useAudioPlayer,
  useAudioPlayerStatus,
  AudioPlayer,
  AudioStatus,
  setAudioModeAsync,
} from "expo-audio";

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
  currentTrack: Track | null;
  playTrack: (track: Track) => void;
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
  const [queue, setQueue] = useState<Track[]>([]);

  // To handle auto-play safely after track switch without spamming
  const previousUrlRef = useRef<string | null>(null);
  const lastFinishedIdRef = useRef<string | null>(null);
  const hasStartedPlayingRef = useRef<boolean>(false);

  useEffect(() => {
    // Configure background audio mode
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: "doNotMix",
    }).catch((e) => console.log("Audio mode error", e));
  }, []);

  useEffect(() => {
    if (currentTrack) {
      console.log(`[AudioContext] Track changed to: ${currentTrack.surahName} (ID: ${currentTrack.id})`);
      hasStartedPlayingRef.current = false; // Reset lock for new track
      player.replace(currentTrack.audioUrl);
      player.play();
    } else {
      player.pause();
    }
  }, [currentTrack?.id]);

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
        setCurrentTrack(nextTrack);
      } else {
        console.log(`[AudioContext] Queue empty, playback finished.`);
      }
    }
  }, [status.didJustFinish, status.playing, currentTrack, queue]);

  const playNext = (track: Track) => {
    setQueue((prev) => [track, ...prev]);
  };

  const playNextInQueue = () => {
    if (queue.length > 0) {
      const nextTrack = queue[0];
      setQueue((q) => q.slice(1));
      lastFinishedIdRef.current = null; // Prepare for new track
      setCurrentTrack(nextTrack);
      previousUrlRef.current = null;
    }
  };

  const addToQueue = (track: Track) => {
    setQueue((prev) => [...prev, track]);
  };

  const removeFromQueue = (index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
  };

  const closePlayer = () => {
    player.pause();
    setCurrentTrack(null);
    previousUrlRef.current = null;
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
    } else {
      setCurrentTrack(track);
      previousUrlRef.current = null;
    }
  };

  return (
    <AudioContext.Provider
      value={{
        player,
        status,
        currentTrack,
        playTrack,
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
