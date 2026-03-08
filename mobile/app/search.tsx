import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeIn,
  FadeInDown,
  LinearTransition,
} from "react-native-reanimated";
import { Search, ChevronLeft, X } from "lucide-react-native";
import { FlashList } from "@shopify/flash-list";
import { useTheme } from "../lib/ThemeContext";
import {
  searchQuran,
  getChapterMetadata,
  SearchResult,
} from "../lib/QuranHelper";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const withOpacity = (hexColor: string, opacity: number) => {
  const sanitized = hexColor.replace("#", "");
  const bigint = Number.parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export default function GlobalSearchScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    // Focus automatically when screen mounts
    const timeout = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300); // 300ms debounce
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const results = useMemo(() => {
    if (debouncedQuery.trim().length < 2) return [];
    // Request up to 100 results for global search to keep it fast
    return searchQuran(debouncedQuery, 100);
  }, [debouncedQuery]);

  const renderResult = ({ item }: { item: SearchResult }) => {
    const meta = getChapterMetadata(item.chapter);
    return (
      <AnimatedPressable
        entering={FadeInDown.duration(300)}
        layout={LinearTransition.springify()}
        onPress={() => {
          void Haptics.selectionAsync();
          router.push({
            pathname: "/chapter/[id]",
            params: {
              id: String(item.chapter),
              verse: String(item.verse),
            },
          });
        }}
        style={[
          styles.resultCard,
          {
            backgroundColor: colors.surface,
            borderColor: withOpacity(colors.border, 0.8),
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.chapterInfo, { color: colors.primary }]}>
            Surah {meta?.englishname} • Ayah {item.verse}
          </Text>
          <View
            style={[
              styles.matchBadge,
              { backgroundColor: withOpacity(colors.accent, 0.15) },
            ]}
          >
            <Text
              style={[
                styles.matchText,
                { color: colors.textMain, textTransform: "capitalize" },
              ]}
            >
              {item.matchType}
            </Text>
          </View>
        </View>

        <Text
          style={[styles.arabicText, { color: colors.textMain }]}
          numberOfLines={2}
        >
          {item.text}
        </Text>

        {item.translation && item.matchType !== "arabic" && (
          <Text
            style={[styles.translationText, { color: colors.textMuted }]}
            numberOfLines={2}
          >
            {item.translation}
          </Text>
        )}
      </AnimatedPressable>
    );
  };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
    >
      <StatusBar style={isDark ? "light" : "dark"} />
      <LinearGradient
        colors={[
          colors.background,
          withOpacity(colors.primary, isDark ? 0.12 : 0.05),
          colors.background,
        ]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={[
            styles.backButton,
            {
              backgroundColor: withOpacity(colors.surface, 0.5),
              borderColor: colors.border,
            },
          ]}
        >
          <ChevronLeft size={20} color={colors.textMain} />
        </Pressable>

        <View
          style={[
            styles.searchContainer,
            { backgroundColor: colors.surface, borderColor: colors.primary },
          ]}
        >
          <Search size={18} color={colors.primary} />
          <TextInput
            ref={inputRef}
            style={[styles.searchInput, { color: colors.textMain }]}
            placeholder="Search Quran (Arabic, Translations...)"
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => {
                setSearchQuery("");
                inputRef.current?.focus();
              }}
            >
              <X size={18} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {debouncedQuery.trim().length >= 2 ? (
        // @ts-ignore
        <FlashList
          data={results}
          keyExtractor={(item: SearchResult) => `${item.chapter}-${item.verse}`}
          renderItem={renderResult}
          // @ts-ignore
          estimatedItemSize={120}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyTitle, { color: colors.textMain }]}>
                No results found
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                We couldn&apos;t find anything matching &quot;{debouncedQuery}
                &quot;. Try a different keyword.
              </Text>
            </View>
          }
          ListHeaderComponent={
            results.length > 0 ? (
              <Text style={[styles.resultsCount, { color: colors.textMuted }]}>
                Found {results.length === 100 ? "100+" : results.length} verses
              </Text>
            ) : null
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: withOpacity(colors.primary, 0.1) },
            ]}
          >
            <Search size={40} color={colors.primary} strokeWidth={1.5} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.textMain }]}>
            Global Search
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
            Search across Arabic texts, English translations, and
            transliterations in milliseconds.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    gap: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 999,
    height: 48,
    paddingHorizontal: 16,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: "SatoshiMedium",
    fontSize: 16,
    height: "100%",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  resultsCount: {
    fontFamily: "SatoshiMedium",
    fontSize: 14,
    marginBottom: 12,
  },
  resultCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 10,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chapterInfo: {
    fontFamily: "SatoshiBold",
    fontSize: 14,
  },
  matchBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  matchText: {
    fontFamily: "SatoshiBold",
    fontSize: 10,
  },
  arabicText: {
    fontFamily: "AmiriQuran",
    fontSize: 22,
    lineHeight: 36,
    textAlign: "right",
  },
  translationText: {
    fontFamily: "Satoshi",
    fontSize: 14,
    lineHeight: 21,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontFamily: "SatoshiBold",
    fontSize: 20,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontFamily: "Satoshi",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
});
