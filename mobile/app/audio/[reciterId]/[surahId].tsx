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
  Download,
  Trash2,
  CheckCircle2,
  ListMusic,
  X,
} from "lucide-react-native";
import Slider from "@react-native-community/slider";
import { Modal, FlatList, Dimensions } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "../../../lib/ThemeContext";

import { useAudio } from "../../../lib/AudioContext";
import { useDownloads } from "../../../lib/DownloadsContext";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
  const { reciterId, surahId, reciterName, server, surahName } =
    useLocalSearchParams<{
      reciterId: string;
      surahId: string;
      reciterName: string;
      server: string;
      surahName: string;
    }>();

  // URL format for mp3quran full surah is serverURL+001.mp3
  const formattedSurahId = surahId.padStart(3, "0");
  const defaultAudioUrl = `${server}${formattedSurahId}.mp3`;
  const downloadId = `${reciterId}-${surahId}`;

  const {
    isDownloaded,
    downloadAudio,
    deleteAudio,
    activeDownloads,
    downloads,
  } = useDownloads();
  const isDownloadedTrack = isDownloaded(downloadId);
  const audioUrl = isDownloadedTrack
    ? downloads.find((d) => d.id === downloadId)?.localUri || defaultAudioUrl
    : defaultAudioUrl;

  const { player, status, currentTrack, playTrack, queue, removeFromQueue } = useAudio();
  const [isSeeking, setIsSeeking] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);
  const [isQueueVisible, setIsQueueVisible] = useState(false);

  const playPressed = useSharedValue(0);
  const skipBackPressed = useSharedValue(0);
  const skipForwardPressed = useSharedValue(0);

  useEffect(() => {
    if (currentTrack?.audioUrl !== audioUrl) {
      playTrack({
        audioUrl,
        surahId,
        surahName,
        reciterName,
        reciterId,
        server,
      });
    }
  }, [audioUrl, surahId, surahName, reciterName, reciterId, server]);

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

  const playAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: withTiming(playPressed.value ? 0.9 : 1, { duration: 100 }) },
    ],
  }));

  const skipBackAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: withTiming(skipBackPressed.value ? 0.8 : 1, { duration: 100 }) },
    ],
  }));

  const skipForwardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: withTiming(skipForwardPressed.value ? 0.8 : 1, {
          duration: 100,
        }),
      },
    ],
  }));

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar style={isDark ? "light" : "dark"} />
      <LinearGradient
        colors={[
          colors.background,
          withOpacity(colors.primary, isDark ? 0.12 : 0.06),
          colors.background,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

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
        <Pressable
          onPress={() => setIsQueueVisible(true)}
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
          <ListMusic color={colors.textMain} size={22} />
        </Pressable>
      </View>

      <View style={{ position: "absolute", top: 16, right: 16, zIndex: 10 }}>
        {isDownloadedTrack ? (
          <Pressable
            onPress={() => deleteAudio(downloadId)}
            style={styles.downloadButton}
          >
            <Trash2 color={colors.primary} size={22} />
          </Pressable>
        ) : activeDownloads[downloadId] !== undefined ? (
          <View style={styles.downloadButton}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={{ fontSize: 10, color: colors.primary, marginTop: 4 }}>
              {Math.round(activeDownloads[downloadId] * 100)}%
            </Text>
          </View>
        ) : (
          <Pressable
            onPress={() =>
              downloadAudio({
                reciterId,
                reciterName,
                surahId,
                surahName,
                server,
              })
            }
            style={styles.downloadButton}
          >
            <Download color={colors.textMain} size={24} />
          </Pressable>
        )}
      </View>

      <View style={styles.artworkContainer}>
        <LinearGradient
          colors={[
            colors.surface,
            withOpacity(colors.primary, isDark ? 0.08 : 0.04),
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.artwork,
            {
              borderColor: withOpacity(colors.primary, 0.2),
            },
          ]}
        >
          <View
            style={[
              styles.artworkInnerContainer,
              {
                backgroundColor: withOpacity(
                  colors.primary,
                  isDark ? 0.2 : 0.1,
                ),
              },
            ]}
          >
            <Text style={[styles.artworkText, { color: colors.primary }]}>
              {surahId}
            </Text>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.infoContainer}>
        <Text
          style={[styles.surahName, { color: colors.textMain }]}
          numberOfLines={1}
        >
          {surahName}
        </Text>
        <Text
          style={[styles.reciterName, { color: colors.textMuted }]}
          numberOfLines={1}
        >
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
        <AnimatedPressable
          onPressIn={() => {
            skipBackPressed.value = 1;
          }}
          onPressOut={() => {
            skipBackPressed.value = 0;
          }}
          onPress={seekBackward}
          style={[{ padding: 12 }, skipBackAnimatedStyle]}
        >
          <SkipBack size={32} color={colors.textMain} fill={colors.textMain} />
        </AnimatedPressable>

        <AnimatedPressable
          onPressIn={() => {
            playPressed.value = 1;
          }}
          onPressOut={() => {
            playPressed.value = 0;
          }}
          onPress={togglePlayback}
          style={[
            styles.playButton,
            {
              backgroundColor: colors.primary,
            },
            playAnimatedStyle,
          ]}
        >
          {!status.isLoaded || status.isBuffering ? (
            <ActivityIndicator color="#fff" size="large" />
          ) : status.playing ? (
            <Pause size={36} color="#ffffff" fill="#ffffff" />
          ) : (
            <Play size={36} color="#ffffff" fill="#ffffff" />
          )}
        </AnimatedPressable>

        <AnimatedPressable
          onPressIn={() => {
            skipForwardPressed.value = 1;
          }}
          onPressOut={() => {
            skipForwardPressed.value = 0;
          }}
          onPress={seekForward}
          style={[{ padding: 12 }, skipForwardAnimatedStyle]}
        >
          <SkipForward
            size={32}
            color={colors.textMain}
            fill={colors.textMain}
          />
        </AnimatedPressable>
      </View>

      <Modal
        visible={isQueueVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsQueueVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsQueueVisible(false)}
        >
          <Pressable
            style={[
              styles.modalContent,
              { backgroundColor: colors.background, height: Dimensions.get('window').height * 0.55 },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textMain }]}>
                Up Next
              </Text>
              <Pressable
                onPress={() => setIsQueueVisible(false)}
                style={styles.closeButton}
              >
                <X size={24} color={colors.textMain} />
              </Pressable>
            </View>

            {queue.length === 0 ? (
              <View style={styles.emptyQueue}>
                <ListMusic size={48} color={colors.textMuted} />
                <Text style={[styles.emptyQueueText, { color: colors.textMuted }]}>
                  Queue is empty
                </Text>
              </View>
            ) : (
              <FlatList
                data={queue}
                keyExtractor={(_, idx) => String(idx)}
                contentContainerStyle={styles.queueList}
                showsVerticalScrollIndicator={false}
                renderItem={({ item, index }) => (
                  <View style={[styles.queueItem, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                    <View style={styles.queueItemInfo}>
                      <Text style={[styles.queueItemTitle, { color: colors.textMain }]} numberOfLines={1}>
                        {item.surahName}
                      </Text>
                      <Text style={[styles.queueItemSubtitle, { color: colors.textMuted }]} numberOfLines={1}>
                        {item.reciterName}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => removeFromQueue(index)}
                      style={styles.queueItemDelete}
                    >
                      <Trash2 size={20} color="#EF4444" />
                    </Pressable>
                  </View>
                )}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>
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
  downloadButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
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
    borderRadius: 32,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    maxWidth: 340,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 10,
  },
  artworkInnerContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: "center",
    alignItems: "center",
  },
  artworkText: {
    fontFamily: "AmiriQuran",
    fontSize: 64,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: "SatoshiBold",
    fontSize: 20,
  },
  closeButton: {
    padding: 8,
  },
  emptyQueue: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  emptyQueueText: {
    fontFamily: "SatoshiMedium",
    fontSize: 16,
  },
  queueList: {
    gap: 12,
    paddingBottom: 24,
  },
  queueItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  queueItemInfo: {
    flex: 1,
  },
  queueItemTitle: {
    fontFamily: "SatoshiBold",
    fontSize: 16,
    marginBottom: 4,
  },
  queueItemSubtitle: {
    fontFamily: "SatoshiMedium",
    fontSize: 14,
  },
  queueItemDelete: {
    padding: 8,
  },
});
