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
  const hasFinishedRef = useRef<boolean>(false);

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
      // Logic to trigger replace and play when track changes
      player.replace(currentTrack.audioUrl);
      hasFinishedRef.current = false;
      // Some players auto-play on replace if already playing, 
      // but explicit play is safer
      player.play();
    } else {
      player.pause();
    }
  }, [currentTrack?.id]);

  useEffect(() => {
    // Auto-advance when finished
    if (status.didJustFinish && !hasFinishedRef.current) {
      hasFinishedRef.current = true;
      if (queue.length > 0) {
        const nextTrack = queue[0];
        setQueue((q) => q.slice(1));
        setCurrentTrack(nextTrack);
      }
    }
  }, [status.didJustFinish, queue]);

  const playNext = (track: Track) => {
    setQueue((prev) => [track, ...prev]);
  };

  const playNextInQueue = () => {
    if (queue.length > 0) {
      const nextTrack = queue[0];
      setQueue((q) => q.slice(1));
      hasFinishedRef.current = true;
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
    // If playing the same track, we still want to re-trigger loading/play if it's a manual play call
    // This allows replaying the same verse in loop mode
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
