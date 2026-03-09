import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, TextInput } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { Play, ArrowLeft, Search, Download, Trash2 } from "lucide-react-native";
import { ActivityIndicator } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  FadeInDown,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { getChapterMetadata } from "../../../lib/QuranHelper";
import { useTheme } from "../../../lib/ThemeContext";
import { useDownloads } from "../../../lib/DownloadsContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
  colors,
  isDark,
}: any) {
  const router = useRouter();
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: withTiming(pressed.value ? 0.985 : 1, { duration: 120 }) },
    ],
  }));

  const { isDownloaded, downloadAudio, deleteAudio, activeDownloads } =
    useDownloads();
  const downloadId = `${reciterId}-${item.id}`;
  const isDownloadedTrack = isDownloaded(downloadId);

  return (
    <AnimatedPressable
      onPressIn={() => {
        pressed.value = 1;
      }}
      onPressOut={() => {
        pressed.value = 0;
      }}
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
          },
        });
      }}
      entering={FadeInDown.delay(Math.min(index * 14, 320)).duration(320)}
      layout={LinearTransition.springify().damping(17)}
      style={animatedStyle}
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
                downloadAudio({
                  reciterId,
                  reciterName,
                  surahId: String(item.id),
                  surahName: item.name,
                  server,
                });
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
        </View>
      </LinearGradient>
    </AnimatedPressable>
  );
}

export default function AudioSurahsScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { reciterId, reciterName, server, surahList } = useLocalSearchParams<{
    reciterId: string;
    reciterName: string;
    server: string;
    surahList: string;
  }>();

  const [searchQuery, setSearchQuery] = useState("");

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
        colors={colors}
        isDark={isDark}
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
          <Animated.View
            entering={FadeIn.duration(280)}
            style={styles.headerWrapper}
          >
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
                Select a Surah to listen to this reciter.
              </Text>
            </LinearGradient>

            <Animated.View
              entering={FadeInDown.delay(80).duration(280)}
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
            </Animated.View>

            <Text style={[styles.resultCount, { color: colors.textMuted }]}>
              {filteredSurahs.length} surah
              {filteredSurahs.length === 1 ? "" : "s"} found
            </Text>
          </Animated.View>
        }
      />
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
});
