import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Modal,
  FlatList,
  Dimensions,
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
  ListMusic,
  X,
} from "lucide-react-native";
import Slider from "@react-native-community/slider";
import * as Haptics from "expo-haptics";
import { FlashList } from "@shopify/flash-list";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "../../../lib/ThemeContext";
import {
  getChapterVerses,
  getGlobalVerseNumber,
  getVersesCount,
} from "../../../lib/QuranHelper";

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
  const { reciterId, surahId, reciterName, server, surahName, mode } =
    useLocalSearchParams<{
      reciterId: string;
      surahId: string;
      reciterName: string;
      server: string;
      surahName: string;
      mode?: "chapter" | "verse_by_verse";
    }>();

  const formattedSurahId = surahId.padStart(3, "0");
  const defaultAudioUrl = `${server}${formattedSurahId}.mp3`;
  const isVerseMode = mode === "verse_by_verse";

  const {
    isDownloaded,
    downloadAudio,
    downloadVerseByVerseChapter,
    deleteAudio,
    activeDownloads,
    downloads,
    buildDownloadId,
  } = useDownloads();
  const downloadId = buildDownloadId(
    reciterId,
    surahId,
    isVerseMode ? "verse_by_verse" : "chapter",
  );
  const isDownloadedTrack = isDownloaded(downloadId);
  const matchedDownload = downloads.find((d) => d.id === downloadId);
  const audioUrl = isDownloadedTrack
    ? matchedDownload?.localUri || defaultAudioUrl
    : defaultAudioUrl;

  const {
    player,
    status,
    currentTrack,
    playTrack,
    queue,
    removeFromQueue,
    playNextInQueue,
    clearQueue,
    setQueue,
  } = useAudio();
  const [isSeeking, setIsSeeking] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);
  const [isQueueVisible, setIsQueueVisible] = useState(false);
  const verseListRef = useRef<any>(null);

  const verses = useMemo(() => {
    if (!isVerseMode) return [];
    const chapterNumber = Number(surahId);
    return getChapterVerses(chapterNumber).map((text, index) => ({
      verseNumber: index + 1,
      text,
    }));
  }, [isVerseMode, surahId]);

  const currentVerseNumber =
    currentTrack?.mode === "verse_by_verse" &&
    currentTrack?.surahId === surahId &&
    currentTrack?.reciterId === reciterId
      ? currentTrack.verseNumber ?? 1
      : 1;

  const verseTracks = useMemo(() => {
    if (!isVerseMode) return [];

    const chapterNumber = Number(surahId);
    const totalVerses = getVersesCount(chapterNumber);
    const isOfflineVersePackage =
      !!matchedDownload &&
      matchedDownload.format === "verse_by_verse" &&
      typeof matchedDownload.localUri === "string";

    return Array.from({ length: totalVerses }, (_, index) => {
      const verseNumber = index + 1;
      const globalVerse = getGlobalVerseNumber(chapterNumber, verseNumber);
      const remoteUrl = `${server}${globalVerse}.mp3`;
      const localUrl = isOfflineVersePackage
        ? `${matchedDownload.localUri}${String(verseNumber).padStart(3, "0")}.mp3`
        : remoteUrl;

      return {
        id: `${reciterId}-${surahId}-v${verseNumber}`,
        audioUrl: localUrl,
        surahId,
        surahName: `${surahName} · Ayah ${verseNumber}`,
        reciterName,
        reciterId,
        server,
        mode: "verse_by_verse" as const,
        verseNumber,
      };
    });
  }, [isVerseMode, surahId, matchedDownload, server, reciterId, surahName, reciterName]);

  const playPressed = useSharedValue(0);
  const skipBackPressed = useSharedValue(0);
  const skipForwardPressed = useSharedValue(0);

  useEffect(() => {
    if (isVerseMode) {
      if (verseTracks.length === 0) return;

      const firstTrack = verseTracks[0];
      const shouldInitializeQueue =
        !currentTrack ||
        currentTrack.surahId !== surahId ||
        currentTrack.reciterId !== reciterId ||
        currentTrack.mode !== "verse_by_verse";

      if (shouldInitializeQueue) {
        clearQueue();
        setQueue(verseTracks.slice(1));
        playTrack(firstTrack);
      }
      return;
    }

    if (currentTrack?.audioUrl !== audioUrl) {
      playTrack({
        id: `${reciterId}-${surahId}-${Date.now()}`,
        audioUrl,
        surahId,
        surahName,
        reciterName,
        reciterId,
        server,
        mode: "chapter",
      });
    }
  }, [
    isVerseMode,
    verseTracks,
    currentTrack,
    surahId,
    reciterId,
    clearQueue,
    setQueue,
    playTrack,
    audioUrl,
    surahName,
    reciterName,
    server,
  ]);

  useEffect(() => {
    if (!isVerseMode || !verseListRef.current || currentVerseNumber < 2) return;
    verseListRef.current.scrollToIndex({
      index: currentVerseNumber - 1,
      viewPosition: 0.4,
      animated: true,
    });
  }, [isVerseMode, currentVerseNumber]);

  const togglePlayback = () => {
    void Haptics.selectionAsync();
    if (status.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  const seekBackward = () => {
    void Haptics.selectionAsync();
    player.seekTo(Math.max(0, status.currentTime - 10));
  };

  const handleNextTrack = () => {
    void Haptics.selectionAsync();
    if (queue.length > 0) {
      playNextInQueue();
    } else {
      player.seekTo(status.currentTime + 10);
    }
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

      {/* ── Header ── */}
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
          {isVerseMode ? "Read Along" : "Now Playing"}
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

      {/* ── Download button ── */}
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
            onPress={() => {
              if (isVerseMode) {
                void downloadVerseByVerseChapter({
                  reciterId,
                  reciterName,
                  surahId,
                  surahName,
                  server,
                });
                return;
              }
              void downloadAudio({
                reciterId,
                reciterName,
                surahId,
                surahName,
                server,
                format: "chapter",
              });
            }}
            style={styles.downloadButton}
          >
            <Download color={colors.textMain} size={24} />
          </Pressable>
        )}
      </View>

      {/* ── Chapter mode: artwork + info ── */}
      {!isVerseMode && (
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
              { borderColor: withOpacity(colors.primary, 0.2) },
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
      )}

      {!isVerseMode && (
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
      )}

      {/* ── Verse mode: compact info bar + read-along panel ── */}
      {isVerseMode && (
        <>
          {/* Compact surah / reciter pill */}
          <View
            style={[
              styles.verseModeInfoBar,
              {
                backgroundColor: withOpacity(colors.surface, 0.88),
                borderColor: withOpacity(colors.border, 0.5),
              },
            ]}
          >
            {/* Ayah number badge */}
            <View
              style={[
                styles.verseModeAyahBadge,
                { backgroundColor: withOpacity(colors.primary, 0.15) },
              ]}
            >
              <Text
                style={[
                  styles.verseModeAyahBadgeText,
                  { color: colors.primary },
                ]}
              >
                {currentVerseNumber}
              </Text>
            </View>

            <View style={styles.verseModeInfoText}>
              <Text
                style={[styles.verseModeInfoSurah, { color: colors.textMain }]}
                numberOfLines={1}
              >
                {surahName}
              </Text>
              <Text
                style={[
                  styles.verseModeInfoReciter,
                  { color: colors.textMuted },
                ]}
                numberOfLines={1}
              >
                {reciterName}
              </Text>
            </View>

            {/* "Verse by verse" tag */}
            <View
              style={[
                styles.verseModeTag,
                { backgroundColor: withOpacity(colors.primary, 0.1) },
              ]}
            >
              <Text
                style={[styles.verseModeTagText, { color: colors.primary }]}
              >
                Verse by verse
              </Text>
            </View>
          </View>

          {/* Read-along verse list */}
          <View
            style={[
              styles.readAlongContainer,
              {
                borderColor: withOpacity(colors.border, 0.4),
                backgroundColor: withOpacity(colors.surface, 0.45),
              },
            ]}
          >
            <FlashList
              ref={verseListRef}
              data={verses}
              // estimatedItemSize={100}
              keyExtractor={(item) => String(item.verseNumber)}
              showsVerticalScrollIndicator={false}
              style={styles.readAlongList}
              contentContainerStyle={styles.readAlongListContent}
              ListEmptyComponent={
                <View style={styles.readAlongEmptyWrap}>
                  <Text
                    style={[
                      styles.readAlongEmptyText,
                      { color: colors.textMuted },
                    ]}
                  >
                    Loading verses…
                  </Text>
                </View>
              }
              renderItem={({ item }) => {
                const isActive = item.verseNumber === currentVerseNumber;
                return (
                  <View
                    style={[
                      styles.readAlongVerseRow,
                      {
                        borderColor: isActive
                          ? withOpacity(colors.primary, 0.5)
                          : "transparent",
                        backgroundColor: isActive
                          ? withOpacity(
                              colors.primary,
                              isDark ? 0.12 : 0.07,
                            )
                          : "transparent",
                        // subtle glow on active
                        shadowColor: colors.primary,
                        shadowOpacity: isActive ? 0.15 : 0,
                        shadowRadius: 10,
                        shadowOffset: { width: 0, height: 2 },
                        elevation: isActive ? 3 : 0,
                      },
                    ]}
                  >
                    {/* Verse number pill */}
                    <View
                      style={[
                        styles.readAlongVerseNumPill,
                        {
                          backgroundColor: isActive
                            ? withOpacity(colors.primary, 0.18)
                            : withOpacity(colors.border, 0.25),
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.readAlongVerseNum,
                          {
                            color: isActive
                              ? colors.primary
                              : colors.textMuted,
                          },
                        ]}
                      >
                        {item.verseNumber}
                      </Text>
                    </View>

                    {/* Arabic text */}
                    <Text
                      style={[
                        styles.readAlongVerseText,
                        {
                          color: isActive
                            ? colors.textMain
                            : withOpacity(colors.textMuted, 0.55),
                          fontSize: isActive ? 26 : 21,
                          lineHeight: isActive ? 44 : 34,
                        },
                      ]}
                    >
                      {item.text}
                    </Text>
                  </View>
                );
              }}
            />
          </View>
        </>
      )}

      {/* ── Progress slider ── */}
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

      {/* ── Playback controls ── */}
      <View style={styles.controlsContainer}>
        <AnimatedPressable
          onPressIn={() => { skipBackPressed.value = 1; }}
          onPressOut={() => { skipBackPressed.value = 0; }}
          onPress={seekBackward}
          style={[{ padding: 12 }, skipBackAnimatedStyle]}
        >
          <SkipBack size={32} color={colors.textMain} fill={colors.textMain} />
        </AnimatedPressable>

        <AnimatedPressable
          onPressIn={() => { playPressed.value = 1; }}
          onPressOut={() => { playPressed.value = 0; }}
          onPress={togglePlayback}
          style={[
            styles.playButton,
            { backgroundColor: colors.primary },
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
          onPressIn={() => { skipForwardPressed.value = 1; }}
          onPressOut={() => { skipForwardPressed.value = 0; }}
          onPress={handleNextTrack}
          style={[{ padding: 12 }, skipForwardAnimatedStyle]}
        >
          <SkipForward
            size={32}
            color={colors.textMain}
            fill={colors.textMain}
          />
        </AnimatedPressable>
      </View>

      {/* ── Queue modal ── */}
      <Modal
        visible={isQueueVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsQueueVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => setIsQueueVisible(false)}
          />
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.background,
                height: Dimensions.get("window").height * 0.55,
              },
            ]}
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
                <Text
                  style={[styles.emptyQueueText, { color: colors.textMuted }]}
                >
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
                  <View
                    style={[
                      styles.queueItem,
                      {
                        borderColor: colors.border,
                        backgroundColor: colors.surface,
                      },
                    ]}
                  >
                    <View style={styles.queueItemInfo}>
                      <Text
                        style={[
                          styles.queueItemTitle,
                          { color: colors.textMain },
                        ]}
                        numberOfLines={1}
                      >
                        {item.surahName}
                      </Text>
                      <Text
                        style={[
                          styles.queueItemSubtitle,
                          { color: colors.textMuted },
                        ]}
                        numberOfLines={1}
                      >
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
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // ── Header ──────────────────────────────────────────────
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
  downloadButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },

  // ── Chapter mode: artwork ────────────────────────────────
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

  // ── Chapter mode: info ───────────────────────────────────
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

  // ── Verse mode: compact info bar ────────────────────────
  verseModeInfoBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 18,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  verseModeAyahBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  verseModeAyahBadgeText: {
    fontFamily: "SatoshiBold",
    fontSize: 16,
  },
  verseModeInfoText: {
    flex: 1,
    gap: 2,
  },
  verseModeInfoSurah: {
    fontFamily: "SatoshiBold",
    fontSize: 15,
  },
  verseModeInfoReciter: {
    fontFamily: "SatoshiMedium",
    fontSize: 12,
  },
  verseModeTag: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    flexShrink: 0,
  },
  verseModeTagText: {
    fontFamily: "SatoshiBold",
    fontSize: 11,
  },

  // ── Read-along panel ────────────────────────────────────
  readAlongContainer: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    marginHorizontal: 18,
    marginBottom: 14,
    overflow: "hidden",
  },
  readAlongList: {
    flex: 1,
  },
  readAlongListContent: {
    paddingHorizontal: 10,
    paddingVertical: 12,
    gap: 6,
  },
  readAlongEmptyWrap: {
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  readAlongEmptyText: {
    fontFamily: "SatoshiMedium",
    fontSize: 13,
  },
  readAlongVerseRow: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  readAlongVerseNumPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 2,
  },
  readAlongVerseNum: {
    fontFamily: "SatoshiBold",
    fontSize: 11,
  },
  readAlongVerseText: {
    fontFamily: "AmiriQuran",
    textAlign: "right",
  },

  // ── Progress ────────────────────────────────────────────
  progressContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
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

  // ── Controls ────────────────────────────────────────────
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

  // ── Queue modal ─────────────────────────────────────────
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