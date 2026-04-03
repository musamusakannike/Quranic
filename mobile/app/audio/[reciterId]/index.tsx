import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { Play, ArrowLeft, Search, Download, Trash2, MoreVertical } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { getChapterMetadata } from "../../../lib/QuranHelper";
import { useTheme } from "../../../lib/ThemeContext";
import { useDownloads } from "../../../lib/DownloadsContext";
import { useAudio } from "../../../lib/AudioContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";

const withOpacity = (hexColor: string, opacity: number) => {
  const sanitized = hexColor.replace("#", "");
  const bigint = Number.parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

function SurahCard({
  item,
  index,
  reciterId,
  reciterName,
  server,
  mode,
  colors,
  isDark,
  onOptionsPress,
}: any) {
  const router = useRouter();

  const {
    isDownloaded,
    downloadAudio,
    downloadVerseByVerseChapter,
    deleteAudio,
    activeDownloads,
    buildDownloadId,
  } =
    useDownloads();
  const isVerseMode = mode === "verse_by_verse";
  const downloadId = buildDownloadId(
    reciterId,
    String(item.id),
    isVerseMode ? "verse_by_verse" : "chapter",
  );
  const isDownloadedTrack = isDownloaded(downloadId);

  return (
    <Pressable
      onPress={() => {
        void Haptics.selectionAsync();
        router.push({
          pathname: "/audio/[reciterId]/[surahId]",
          params: {
            reciterId,
            surahId: String(item.id),
            reciterName,
            server,
            surahName: item.name,
            mode,
          },
        });
      }}
    >
      <LinearGradient
        colors={[
          colors.surface,
          withOpacity(colors.primary, isDark ? 0.08 : 0.04),
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.surahCard, { borderColor: colors.border }]}
      >
        <View
          style={[
            styles.numberCircle,
            {
              backgroundColor: withOpacity(
                colors.primary,
                isDark ? 0.35 : 0.14,
              ),
            },
          ]}
        >
          <Text style={[styles.numberText, { color: colors.primary }]}>
            {item.id}
          </Text>
        </View>
        <View style={styles.surahInfo}>
          <Text
            style={[styles.surahName, { color: colors.textMain }]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <Text
            style={[styles.surahArabic, { color: colors.textMuted }]}
            numberOfLines={1}
          >
            {item.arabicName}
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          {isDownloadedTrack ? (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                deleteAudio(downloadId);
              }}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: withOpacity(colors.primary, 0.1),
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Trash2 size={16} color={colors.primary} />
            </Pressable>
          ) : activeDownloads[downloadId] !== undefined ? (
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: withOpacity(colors.primary, 0.1),
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                if (isVerseMode) {
                  void downloadVerseByVerseChapter({
                    reciterId,
                    reciterName,
                    surahId: String(item.id),
                    surahName: item.name,
                    server,
                  });
                } else {
                  void downloadAudio({
                    reciterId,
                    reciterName,
                    surahId: String(item.id),
                    surahName: item.name,
                    server,
                    format: "chapter",
                  });
                }
              }}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: withOpacity(colors.border, 0.5),
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Download size={16} color={colors.textMain} />
            </Pressable>
          )}

          <View
            style={{
              padding: 8,
              backgroundColor: withOpacity(colors.primary, 0.1),
              borderRadius: 999,
            }}
          >
            <Play size={18} color={colors.primary} />
          </View>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onOptionsPress(item);
            }}
            style={{ padding: 4 }}
          >
            <MoreVertical size={20} color={colors.textMain} />
          </Pressable>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

export default function AudioSurahsScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const {
    reciterId,
    reciterName,
    reciterNativeName,
    server,
    surahList,
    mode,
  } = useLocalSearchParams<{
    reciterId: string;
    reciterName: string;
    reciterNativeName?: string;
    server: string;
    surahList: string;
    mode?: "chapter" | "verse_by_verse";
  }>();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSurah, setSelectedSurah] = useState<any>(null);
  const { playNext } = useAudio();
  const { isDownloaded, downloads, buildDownloadId } = useDownloads();
  const isVerseMode = mode === "verse_by_verse";

  const handlePlayNext = () => {
    if (!selectedSurah) return;
    const surahIdStr = String(selectedSurah.id);

    if (isVerseMode) {
      router.push({
        pathname: "/audio/[reciterId]/[surahId]",
        params: {
          reciterId,
          surahId: surahIdStr,
          reciterName,
          server,
          surahName: selectedSurah.name,
          mode: "verse_by_verse",
        },
      });
      setSelectedSurah(null);
      return;
    }

    const formattedSurahId = surahIdStr.padStart(3, "0");
    const downloadId = buildDownloadId(
      reciterId,
      surahIdStr,
      "chapter",
    );
    const defaultAudioUrl = `${server}${formattedSurahId}.mp3`;
    const audioUrl = isDownloaded(downloadId)
      ? downloads.find((d) => d.id === downloadId)?.localUri || defaultAudioUrl
      : defaultAudioUrl;

    playNext({
      id: `${reciterId}-${surahIdStr}-${Date.now()}-next`,
      audioUrl,
      surahId: surahIdStr,
      surahName: selectedSurah.name,
      reciterName,
      reciterId,
      server,
      mode: "chapter",
    });
    setSelectedSurah(null);
  };

  const surahs = useMemo(() => {
    if (!surahList) return [];
    return surahList.split(",").map((idStr) => {
      const id = parseInt(idStr, 10);
      const meta = getChapterMetadata(id);
      return {
        id,
        name: meta?.englishname || `Surah ${id}`,
        arabicName: meta?.arabicname || "",
      };
    });
  }, [surahList]);

  const filteredSurahs = useMemo(() => {
    if (!searchQuery.trim()) return surahs;
    const lowerQuery = searchQuery.toLowerCase();
    return surahs.filter(
      (s) =>
        s.name.toLowerCase().includes(lowerQuery) ||
        s.arabicName.includes(lowerQuery),
    );
  }, [surahs, searchQuery]);

  const renderItem = ({
    item,
    index,
  }: {
    item: { id: number; name: string; arabicName: string };
    index: number;
  }) => {
    return (
      <SurahCard
        item={item}
        index={index}
        reciterId={reciterId}
        reciterName={reciterName}
        server={server}
        mode={isVerseMode ? "verse_by_verse" : "chapter"}
        colors={colors}
        isDark={isDark}
        onOptionsPress={(surah: any) => setSelectedSurah(surah)}
      />
    );
  };

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
          <ArrowLeft color={colors.textMain} size={24} />
        </Pressable>
      </View>

      <FlashList
        data={filteredSurahs}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.headerWrapper}>
            <LinearGradient
              colors={[
                colors.surface,
                withOpacity(colors.primary, isDark ? 0.16 : 0.08),
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.heroCard,
                {
                  borderColor: withOpacity(colors.primary, 0.2),
                },
              ]}
            >
              <Text style={[styles.heroTitle, { color: colors.textMain }]}>
                {reciterName}
              </Text>
              <Text style={[styles.heroSubtitle, { color: colors.textMuted }]}> 
                {isVerseMode
                  ? "Select a Surah to listen verse-by-verse with read-along."
                  : "Select a Surah to listen to this reciter."}
              </Text>
              {!!reciterNativeName && (
                <Text style={[styles.heroNativeName, { color: colors.textMuted }]}>
                  {reciterNativeName}
                </Text>
              )}
            </LinearGradient>

            <View
              style={[
                styles.searchContainer,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Search size={18} color={colors.textMuted} strokeWidth={2.5} />
              <TextInput
                style={[styles.searchInput, { color: colors.textMain }]}
                placeholder="Search Surahs..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <Text style={[styles.resultCount, { color: colors.textMuted }]}>
              {filteredSurahs.length} surah
              {filteredSurahs.length === 1 ? "" : "s"} found
            </Text>
          </View>
        }
      />

      <Modal
        visible={!!selectedSurah}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedSurah(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelectedSurah(null)}
        >
          <Pressable
            style={[
              styles.modalContent,
              { backgroundColor: colors.background },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.textMain }]}>
              {selectedSurah?.name}
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.modalOption,
                {
                  backgroundColor: pressed
                    ? withOpacity(colors.primary, 0.1)
                    : "transparent",
                },
              ]}
              onPress={handlePlayNext}
            >
              <Play size={24} color={colors.primary} />
              <Text style={[styles.modalOptionText, { color: colors.textMain }]}>
                Play Next
              </Text>
            </Pressable>
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
    paddingBottom: 8,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  headerWrapper: {
    marginBottom: 6,
    gap: 14,
  },
  heroCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    gap: 8,
  },
  heroTitle: {
    fontFamily: "SatoshiBold",
    fontSize: 24,
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontFamily: "Satoshi",
    fontSize: 14,
    lineHeight: 20,
  },
  heroNativeName: {
    fontFamily: "AmiriQuran",
    fontSize: 20,
    marginTop: 2,
  },
  searchContainer: {
    borderWidth: 1,
    borderRadius: 14,
    minHeight: 52,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Satoshi",
    fontSize: 14,
  },
  resultCount: {
    fontFamily: "SatoshiMedium",
    fontSize: 13,
    marginBottom: 2,
  },
  surahCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
  },
  numberCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  numberText: {
    fontFamily: "SatoshiBold",
    fontSize: 16,
  },
  surahInfo: {
    flex: 1,
    gap: 4,
  },
  surahName: {
    fontFamily: "SatoshiMedium",
    fontSize: 16,
  },
  surahArabic: {
    fontFamily: "AmiriQuran",
    fontSize: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 48,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#ccc",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: "SatoshiBold",
    fontSize: 18,
    marginBottom: 16,
    textAlign: "center",
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    gap: 16,
  },
  modalOptionText: {
    fontFamily: "SatoshiMedium",
    fontSize: 16,
  },
});
