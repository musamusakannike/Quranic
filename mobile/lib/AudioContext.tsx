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
    // Removed player.setActiveForLockScreen, unsupported on this version
  }, [currentTrack, player]);

  useEffect(() => {
    if (
      currentTrack?.audioUrl &&
      currentTrack.audioUrl !== previousUrlRef.current
    ) {
      // We have a new track loaded in useAudioPlayer.
      // Once it's loaded, play it.
      if (status.isLoaded) {
        player.play();
        previousUrlRef.current = currentTrack.audioUrl;
        
        // Prevents premature queue popping right after loading due to stale status matching
        setTimeout(() => {
          hasFinishedRef.current = false;
        }, 1000);
      }
    }

    // Auto-advance to next track in queue when finished
    if (
      status.isLoaded &&
      status.duration > 0 &&
      status.currentTime >= status.duration - 0.5 &&
      !status.playing &&
      !hasFinishedRef.current
    ) {
      hasFinishedRef.current = true;
      if (queue.length > 0) {
        const nextTrack = queue[0];
        setQueue((q) => q.slice(1));
        
        setCurrentTrack(nextTrack);
        previousUrlRef.current = null;
      }
    }
  }, [currentTrack, status, player, queue]);

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

  const playTrack = (track: Track) => {
    // If playing the same track, ensure it's playing
    if (currentTrack?.audioUrl === track.audioUrl) {
      if (!status.playing && status.isLoaded) {
        player.play();
      }
    } else {
      // It will load the new track automatically via useAudioPlayer hook prop refresh
      setCurrentTrack(track);
      previousUrlRef.current = null; // Reset ref so it catches auto-play
    }
  };

  const closePlayer = () => {
    player.pause();
    setCurrentTrack(null);
    previousUrlRef.current = null;
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
