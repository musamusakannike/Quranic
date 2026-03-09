import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Bookmark, ChevronRight, BookOpen } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../lib/ThemeContext";
import { useAppSettings } from "../../lib/AppSettingsContext";
import { useBookmarks } from "../../lib/BookmarksContext";
import {
  getChapterMetadata,
  getChapterVerses,
  getVerseTranslation,
} from "../../lib/QuranHelper";

const withOpacity = (hexColor: string, opacity: number) => {
  const sanitized = hexColor.replace("#", "");
  const bigint = Number.parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export default function BookmarksScreen() {
  const { colors, isDark } = useTheme();
  const { bookmarks, removeBookmark } = useBookmarks();
  const { arabicFontSize, translationFontSize } = useAppSettings();
  const router = useRouter();

  if (bookmarks.length === 0) {
    return (
      <SafeAreaView
        style={[styles.screen, { backgroundColor: colors.background }]}
      >
        <StatusBar style={isDark ? "light" : "dark"} />
        <LinearGradient
          colors={[
            colors.background,
            withOpacity(colors.primary, isDark ? 0.1 : 0.05),
            colors.background,
          ]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.emptyContainer}>
          <View
            style={[
              styles.emptyIconCircle,
              { backgroundColor: withOpacity(colors.primary, 0.1) },
            ]}
          >
            <Bookmark size={40} color={colors.primary} strokeWidth={1.5} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.textMain }]}>
            No Bookmarks
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
            Save your favorite ayahs to read them later. Tap the bookmark icon
            on any verse.
          </Text>
          <Pressable
            onPress={() => router.push("/(tabs)/chapters")}
            style={[styles.emptyButton, { backgroundColor: colors.primary }]}
          >
            <BookOpen size={18} color="#FFFFFF" />
            <Text style={styles.emptyButtonText}>Read Quran</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
    >
      <StatusBar style={isDark ? "light" : "dark"} />
      <LinearGradient
        colors={[
          colors.background,
          withOpacity(colors.primary, isDark ? 0.1 : 0.05),
          colors.background,
        ]}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerWrapper}>
          <Text style={[styles.headerTitle, { color: colors.textMain }]}>
            Bookmarks
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            {bookmarks.length} saved verse{bookmarks.length === 1 ? "" : "s"}
          </Text>
        </View>

        {bookmarks.map((bookmark, index) => {
          const meta = getChapterMetadata(bookmark.chapter);
          const verses = getChapterVerses(bookmark.chapter);
          const arabicText = verses[bookmark.verse - 1];
          const translation = getVerseTranslation(
            bookmark.chapter,
            bookmark.verse,
          );

          return (
            <Pressable
              key={bookmark.id}
              onPress={() => {
                void Haptics.selectionAsync();
                router.push({
                  pathname: "/chapter/[id]",
                  params: {
                    id: String(bookmark.chapter),
                    verse: String(bookmark.verse),
                  },
                });
              }}
              style={[
                styles.bookmarkCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: withOpacity(colors.border, 0.8),
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: withOpacity(colors.primary, 0.15) },
                  ]}
                >
                  <Bookmark
                    size={14}
                    color={colors.primary}
                    fill={colors.primary}
                  />
                </View>
                <Text style={[styles.chapterInfo, { color: colors.primary }]}>
                  Surah {meta?.englishname} • Ayah {bookmark.verse}
                </Text>

                <Pressable
                  onPress={async () => {
                    void Haptics.selectionAsync();
                    await removeBookmark(bookmark.id);
                  }}
                  style={styles.removeBtn}
                  hitSlop={15}
                >
                  <Text style={[styles.removeTxt, { color: colors.textMuted }]}>
                    Remove
                  </Text>
                </Pressable>
              </View>

              <Text
                style={[
                  styles.arabicText,
                  {
                    color: colors.textMain,
                    fontSize: arabicFontSize,
                    lineHeight: arabicFontSize * 1.6,
                  },
                ]}
                numberOfLines={2}
              >
                {arabicText}
              </Text>

              {translation && (
                <Text
                  style={[
                    styles.translationText,
                    {
                      color: colors.textMuted,
                      fontSize: translationFontSize,
                      lineHeight: translationFontSize * 1.5,
                    },
                  ]}
                  numberOfLines={2}
                >
                  {translation}
                </Text>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120,
    gap: 12,
  },
  headerWrapper: {
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontFamily: "SatoshiBold",
    fontSize: 28,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontFamily: "SatoshiMedium",
    fontSize: 15,
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontFamily: "SatoshiBold",
    fontSize: 24,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontFamily: "Satoshi",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 999,
    gap: 8,
  },
  emptyButtonText: {
    color: "#FFFFFF",
    fontFamily: "SatoshiBold",
    fontSize: 16,
  },
  bookmarkCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  chapterInfo: {
    fontFamily: "SatoshiBold",
    fontSize: 14,
    flex: 1,
  },
  removeBtn: {
    paddingLeft: 10,
  },
  removeTxt: {
    fontFamily: "SatoshiMedium",
    fontSize: 12,
  },
  arabicText: {
    fontFamily: "AmiriQuran",
    textAlign: "right",
  },
  translationText: {
    fontFamily: "Satoshi",
  },
});
