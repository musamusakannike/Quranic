import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useAudio } from "../lib/AudioContext";
import { useTheme } from "../lib/ThemeContext";
import { useSegments, useRouter } from "expo-router";
import { Play, Pause, X } from "lucide-react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

const withOpacity = (hexColor: string, opacity: number) => {
  const sanitized = hexColor.replace("#", "");
  const bigint = Number.parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export default function MiniPlayer() {
  const { currentTrack, status, togglePlayback, closePlayer, isMiniPlayerVisible } =
    useAudio();
  const { colors, isDark } = useTheme();
  const segments = useSegments();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Hide it if we are on the full player screen
  const isAudioStack = segments[0] === "audio";
  const isFullPlayer = isAudioStack && segments.length === 3; // e.g., ["audio", "[reciterId]", "[surahId]"]

  const isTabs = segments[0] === "(tabs)";

  if (!isMiniPlayerVisible || !currentTrack || isFullPlayer) {
    return null;
  }

  // Adjust bottom offset dynamically whether we are over the tab bar or full-screen
  let bottomOffset = insets.bottom + 10;
  if (isTabs) {
    bottomOffset = Platform.OS === "ios" ? 105 : 78;
  }

  const handleTogglePlayback = () => {
    void Haptics.selectionAsync();
    togglePlayback();
  };

  const handlePress = () => {
    if (currentTrack) {
      router.push({
        pathname: "/audio/[reciterId]/[surahId]",
        params: {
          reciterId: currentTrack.reciterId,
          surahId: currentTrack.surahId,
          reciterName: currentTrack.reciterName,
          surahName: currentTrack.surahName,
          server: currentTrack.server,
        },
      });
    }
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      exiting={FadeOutDown.duration(300)}
      style={[
        styles.container,
        {
          bottom: bottomOffset,
          paddingHorizontal: Platform.OS === "ios" ? 12 : 12,
        },
      ]}
      pointerEvents="box-none"
    >
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
      >
        <View
          style={[
            styles.playerObj,
            {
              backgroundColor:
                Platform.OS === "android" ? colors.surface : "transparent",
              borderColor: withOpacity(colors.border, 0.8),
            },
          ]}
        >
          {Platform.OS === "ios" && (
            <BlurView
              style={StyleSheet.absoluteFill}
              tint={isDark ? "dark" : "light"}
              intensity={80}
            />
          )}

          {/* Progress bar line at top */}
          <View
            style={[
              styles.progressTrack,
              { backgroundColor: withOpacity(colors.border, 0.5) },
            ]}
          >
            {status.duration > 0 && (
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: colors.primary,
                    width: `${(status.currentTime / status.duration) * 100}%`,
                  },
                ]}
              />
            )}
          </View>

          <View style={styles.content}>
            <View
              style={[
                styles.artwork,
                {
                  backgroundColor: withOpacity(colors.primary, 0.1),
                  borderColor: withOpacity(colors.primary, 0.2),
                  borderWidth: 1,
                },
              ]}
            >
              <Text style={[styles.artworkText, { color: colors.primary }]}>
                {currentTrack.surahId}
              </Text>
            </View>
            <View style={styles.info}>
              <Text
                style={[styles.title, { color: colors.textMain }]}
                numberOfLines={1}
              >
                {currentTrack.surahName}
              </Text>
              <Text
                style={[styles.subtitle, { color: colors.textMuted }]}
                numberOfLines={1}
              >
                {currentTrack.reciterName}
              </Text>
            </View>
            <View style={styles.controls}>
              <Pressable onPress={handleTogglePlayback} style={styles.iconBtn}>
                {!status.isLoaded || status.isBuffering ? (
                  <ActivityIndicator color={colors.primary} size="small" />
                ) : status.playing ? (
                  <Pause
                    color={colors.textMain}
                    fill={colors.textMain}
                    size={22}
                  />
                ) : (
                  <Play
                    color={colors.textMain}
                    fill={colors.textMain}
                    size={22}
                  />
                )}
              </Pressable>
              <Pressable
                onPress={() => {
                  void Haptics.selectionAsync();
                  closePlayer();
                }}
                style={styles.iconBtn}
              >
                <X color={colors.textMuted} size={24} />
              </Pressable>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
  },
  playerObj: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  progressTrack: {
    height: 3,
    width: "100%",
  },
  progressFill: {
    height: "100%",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  artwork: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  artworkText: {
    fontFamily: "AmiriQuran",
    fontSize: 18,
  },
  info: {
    flex: 1,
    gap: 2,
    justifyContent: "center",
  },
  title: {
    fontFamily: "SatoshiBold",
    fontSize: 15,
  },
  subtitle: {
    fontFamily: "SatoshiMedium",
    fontSize: 13,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  iconBtn: {
    padding: 8,
  },
});
