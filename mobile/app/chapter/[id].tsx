import { StatusBar } from "expo-status-bar";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { ChevronLeft, Copy, Search, Share2 } from "lucide-react-native";
import { useTheme } from "../../lib/ThemeContext";
import {
  getChapterMetadata,
  getChapterVerses,
  getVerseMetadata,
  getVersesCount,
} from "../../lib/QuranHelper";

type VerseItem = {
  key: string;
  verseNumber: number;
  text: string;
  page: number | null;
  juz: number | null;
};

const withOpacity = (hexColor: string, opacity: number) => {
  const sanitized = hexColor.replace("#", "");
  const bigint = Number.parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export default function ChapterDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [searchValue, setSearchValue] = useState("");

  const chapterNumber = useMemo(() => {
    const rawId = Array.isArray(id) ? id[0] : id;
    const parsed = Number(rawId);

    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 114) {
      return null;
    }

    return parsed;
  }, [id]);

  const chapterMeta = useMemo(() => {
    if (!chapterNumber) return null;
    return getChapterMetadata(chapterNumber);
  }, [chapterNumber]);

  const verseCount = useMemo(() => {
    if (!chapterNumber) return 0;
    return getVersesCount(chapterNumber);
  }, [chapterNumber]);

  const chapterVerses = useMemo<VerseItem[]>(() => {
    if (!chapterNumber) return [];

    return getChapterVerses(chapterNumber).map((text, index) => {
      const verseNumber = index + 1;
      const metadata = getVerseMetadata(chapterNumber, verseNumber);

      return {
        key: `${chapterNumber}-${verseNumber}`,
        verseNumber,
        text,
        page: metadata?.page ?? null,
        juz: metadata?.juz ?? null,
      };
    });
  }, [chapterNumber]);

  const filteredVerses = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    if (!normalizedSearch) return chapterVerses;

    return chapterVerses.filter(({ text, verseNumber }) => {
      return (
        text.toLowerCase().includes(normalizedSearch) ||
        String(verseNumber).includes(normalizedSearch)
      );
    });
  }, [chapterVerses, searchValue]);

  const handleCopyVerse = useCallback(async (text: string, verseNumber: number) => {
    await Clipboard.setStringAsync(text);
    void Haptics.selectionAsync();
    Alert.alert("Copied", `Ayah ${verseNumber} copied to clipboard.`);
  }, []);

  const handleShareVerse = useCallback(
    async (text: string, verseNumber: number) => {
      try {
        await Share.share({
          message: `${chapterMeta?.englishname ?? "Surah"} ${verseNumber}\n\n${text}`,
        });
      } catch {
        Alert.alert("Unable to share", "Please try again.");
      }
    },
    [chapterMeta?.englishname],
  );

  const renderVerse = useCallback(
    ({ item }: { item: VerseItem }) => (
      <View
        style={[
          styles.verseCard,
          {
            backgroundColor: colors.surface,
            borderColor: withOpacity(colors.border, 0.88),
          },
        ]}
      >
        <View style={styles.verseHeaderRow}>
          <View
            style={[
              styles.verseBadge,
              { backgroundColor: withOpacity(colors.primary, isDark ? 0.3 : 0.12) },
            ]}
          >
            <Text style={[styles.verseBadgeText, { color: colors.primary }]}>{item.verseNumber}</Text>
          </View>

          <View style={styles.verseMetaRow}>
            {item.juz ? <Text style={[styles.verseMeta, { color: colors.textMuted }]}>Juz {item.juz}</Text> : null}
            {item.page ? (
              <Text style={[styles.verseMeta, { color: colors.textMuted }]}>Page {item.page}</Text>
            ) : null}
          </View>
        </View>

        <Text style={[styles.arabicVerseText, { color: colors.textMain }]}>{item.text}</Text>

        <View style={styles.actionsRow}>
          <Pressable
            onPress={() => {
              void handleCopyVerse(item.text, item.verseNumber);
            }}
            style={styles.actionButton}
          >
            <Copy size={16} color={colors.textMuted} />
            <Text style={[styles.actionText, { color: colors.textMuted }]}>Copy</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              void handleShareVerse(item.text, item.verseNumber);
            }}
            style={styles.actionButton}
          >
            <Share2 size={16} color={colors.textMuted} />
            <Text style={[styles.actionText, { color: colors.textMuted }]}>Share</Text>
          </Pressable>
        </View>
      </View>
    ),
    [colors, handleCopyVerse, handleShareVerse, isDark],
  );

  if (!chapterNumber || !chapterMeta) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <View style={styles.invalidStateContainer}>
          <Text style={[styles.invalidStateTitle, { color: colors.textMain }]}>Chapter not found</Text>
          <Pressable
            onPress={() => router.back()}
            style={[styles.backButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
          >
            <ChevronLeft size={18} color={colors.textMain} />
            <Text style={[styles.backButtonText, { color: colors.textMain }]}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}> 
      <StatusBar style={isDark ? "light" : "dark"} />
      <LinearGradient
        colors={[
          colors.background,
          withOpacity(colors.primary, isDark ? 0.14 : 0.06),
          colors.background,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <FlashList
        data={filteredVerses}
        keyExtractor={(item) => item.key}
        renderItem={renderVerse}
        estimatedItemSize={188}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerSection}>
            <Pressable
              onPress={() => {
                void Haptics.selectionAsync();
                router.back();
              }}
              style={[
                styles.backButton,
                {
                  borderColor: colors.border,
                  backgroundColor: withOpacity(colors.surface, 0.92),
                },
              ]}
            >
              <ChevronLeft size={18} color={colors.textMain} />
              <Text style={[styles.backButtonText, { color: colors.textMain }]}>Chapters</Text>
            </Pressable>

            <View
              style={[
                styles.chapterHeaderCard,
                { backgroundColor: colors.surface, borderColor: withOpacity(colors.primary, 0.22) },
              ]}
            >
              <Text style={[styles.chapterEnglishName, { color: colors.textMain }]}> 
                {chapterNumber}. {chapterMeta.englishname}
              </Text>
              <Text style={[styles.chapterArabicName, { color: colors.textMain }]}>{chapterMeta.arabicname}</Text>
              <Text style={[styles.chapterInfo, { color: colors.textMuted }]}> 
                {chapterMeta.name} • {chapterMeta.revelation} • {verseCount} verses
              </Text>
            </View>

            <View
              style={[
                styles.searchContainer,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Search size={18} color={colors.textMuted} />
              <TextInput
                value={searchValue}
                onChangeText={setSearchValue}
                placeholder="Search verses in this surah"
                placeholderTextColor={colors.textMuted}
                style={[styles.searchInput, { color: colors.textMain }]}
              />
            </View>

            <Text style={[styles.resultsText, { color: colors.textMuted }]}> 
              {filteredVerses.length} verse{filteredVerses.length === 1 ? "" : "s"}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
  },
  headerSection: {
    gap: 12,
    marginBottom: 12,
  },
  chapterHeaderCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 6,
  },
  chapterEnglishName: {
    fontFamily: "SatoshiBold",
    fontSize: 24,
    letterSpacing: -0.2,
  },
  chapterArabicName: {
    fontFamily: "AmiriQuran",
    fontSize: 34,
    lineHeight: 52,
    textAlign: "right",
  },
  chapterInfo: {
    fontFamily: "SatoshiMedium",
    fontSize: 13,
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
  resultsText: {
    fontFamily: "SatoshiMedium",
    fontSize: 13,
  },
  verseCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    gap: 10,
  },
  verseHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  verseBadge: {
    minWidth: 36,
    height: 36,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  verseBadgeText: {
    fontFamily: "SatoshiBold",
    fontSize: 13,
  },
  verseMetaRow: {
    flexDirection: "row",
    gap: 8,
  },
  verseMeta: {
    fontFamily: "SatoshiMedium",
    fontSize: 12,
  },
  arabicVerseText: {
    fontFamily: "AmiriQuran",
    fontSize: 31,
    lineHeight: 50,
    textAlign: "right",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 14,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionText: {
    fontFamily: "SatoshiMedium",
    fontSize: 13,
  },
  backButton: {
    alignSelf: "flex-start",
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  backButtonText: {
    fontFamily: "SatoshiMedium",
    fontSize: 13,
  },
  invalidStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
  },
  invalidStateTitle: {
    fontFamily: "SatoshiBold",
    fontSize: 22,
  },
});
