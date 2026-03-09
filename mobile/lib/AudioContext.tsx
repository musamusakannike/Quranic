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
}

const AudioContext = createContext<AudioContextType | null>(null);

export const AudioProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const player = useAudioPlayer(currentTrack?.audioUrl || null);
  const status = useAudioPlayerStatus(player);

  // To handle auto-play safely after track switch without spamming
  const previousUrlRef = useRef<string | null>(null);

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
      }
    }
  }, [currentTrack, status.isLoaded, player]);

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
