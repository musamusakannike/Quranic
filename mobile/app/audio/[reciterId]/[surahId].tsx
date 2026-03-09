import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronDown,
} from "lucide-react-native";
import Slider from "@react-native-community/slider";
import * as Haptics from "expo-haptics";
import { useTheme } from "../../../lib/ThemeContext";

import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";

const withOpacity = (hexColor: string, opacity: number) => {
  const sanitized = hexColor.replace("#", "");
  const bigint = Number.parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const formatTime = (seconds: number) => {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const numSecs = Math.max(0, Math.floor(seconds));
  const m = Math.floor(numSecs / 60)
    .toString()
    .padStart(2, "0");
  const s = (numSecs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

export default function AudioPlayerScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { surahId, reciterName, server, surahName } = useLocalSearchParams<{
    surahId: string;
    reciterName: string;
    server: string;
    surahName: string;
  }>();

  // URL format for mp3quran full surah is serverURL+001.mp3
  const formattedSurahId = surahId.padStart(3, "0");
  const audioUrl = `${server}${formattedSurahId}.mp3`;

  const player = useAudioPlayer(audioUrl);
  const status = useAudioPlayerStatus(player);
  const [isSeeking, setIsSeeking] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);

  useEffect(() => {
    // Automatically start playing when loaded or buffering mostly finishes
    if (status.isLoaded && !status.playing) {
      player.play();
    }
  }, [player, status.isLoaded, status.playing]);

  const togglePlayback = () => {
    void Haptics.selectionAsync();
    if (status.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  const seekForward = () => {
    void Haptics.selectionAsync();
    player.seekTo(status.currentTime + 10);
  };

  const seekBackward = () => {
    void Haptics.selectionAsync();
    player.seekTo(Math.max(0, status.currentTime - 10));
  };

  const onSliderValueChange = (val: number) => {
    setIsSeeking(true);
    setSliderValue(val);
  };

  const onSliderSlidingComplete = (val: number) => {
    player.seekTo(val);
    setIsSeeking(false);
  };

  const currentDisplayTime = isSeeking ? sliderValue : status.currentTime;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            void Haptics.selectionAsync();
            router.back();
          }}
          style={({ pressed }) => [
            styles.headerButton,
            {
              opacity: pressed ? 0.6 : 1,
              backgroundColor: isDark
                ? "rgba(255,255,255,0.05)"
                : "rgba(0,0,0,0.05)",
            },
          ]}
        >
          <ChevronDown color={colors.textMain} size={24} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textMain }]}>
          Now Playing
        </Text>
        <View style={styles.headerSpacing} />
      </View>

      <View style={styles.artworkContainer}>
        {/* Placeholder for artwork/beautiful calligraphy */}
        <View
          style={[
            styles.artwork,
            {
              backgroundColor: withOpacity(colors.primary, 0.1),
              borderColor: withOpacity(colors.primary, 0.2),
            },
          ]}
        >
          <Text style={[styles.artworkText, { color: colors.primary }]}>
            {surahId}
          </Text>
        </View>
      </View>

      <View style={styles.infoContainer}>
        <Text style={[styles.surahName, { color: colors.textMain }]}>
          {surahName}
        </Text>
        <Text style={[styles.reciterName, { color: colors.textMuted }]}>
          {reciterName}
        </Text>
      </View>

      <View style={styles.progressContainer}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={status.duration > 0 ? status.duration : 1}
          value={currentDisplayTime}
          onValueChange={onSliderValueChange}
          onSlidingComplete={onSliderSlidingComplete}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={withOpacity(colors.border, 0.8)}
          thumbTintColor={colors.primary}
          disabled={!status.isLoaded || status.duration === 0}
        />
        <View style={styles.timeRow}>
          <Text style={[styles.timeText, { color: colors.textMuted }]}>
            {formatTime(currentDisplayTime)}
          </Text>
          <Text style={[styles.timeText, { color: colors.textMuted }]}>
            {status.duration > 0 ? formatTime(status.duration) : "--:--"}
          </Text>
        </View>
      </View>

      <View style={styles.controlsContainer}>
        <Pressable
          onPress={seekBackward}
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, padding: 12 }]}
        >
          <SkipBack size={32} color={colors.textMain} />
        </Pressable>

        <Pressable
          onPress={togglePlayback}
          style={({ pressed }) => [
            styles.playButton,
            {
              backgroundColor: colors.primary,
              transform: [{ scale: pressed ? 0.95 : 1 }],
            },
          ]}
        >
          {!status.isLoaded || status.isBuffering ? (
            <ActivityIndicator color="#fff" size="large" />
          ) : status.playing ? (
            <Pause size={36} color="#ffffff" fill="#ffffff" />
          ) : (
            <Play size={36} color="#ffffff" fill="#ffffff" />
          )}
        </Pressable>

        <Pressable
          onPress={seekForward}
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, padding: 12 }]}
        >
          <SkipForward size={32} color={colors.textMain} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontFamily: "SatoshiBold",
    fontSize: 16,
  },
  headerSpacing: {
    width: 44,
  },
  artworkContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  artwork: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    maxWidth: 340,
  },
  artworkText: {
    fontFamily: "AmiriQuran",
    fontSize: 96,
  },
  infoContainer: {
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 8,
    marginBottom: 32,
  },
  surahName: {
    fontFamily: "SatoshiBold",
    fontSize: 28,
    textAlign: "center",
  },
  reciterName: {
    fontFamily: "SatoshiMedium",
    fontSize: 18,
    textAlign: "center",
  },
  progressContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  timeText: {
    fontFamily: "SatoshiMedium",
    fontSize: 13,
  },
  controlsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
    paddingBottom: 48,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
});
