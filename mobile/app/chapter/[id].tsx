import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Search,
  Share2,
  Bookmark,
  BookOpen,
} from "lucide-react-native";
import { useTheme } from "../../lib/ThemeContext";
import { useAppSettings } from "../../lib/AppSettingsContext";
import { useBookmarks } from "../../lib/BookmarksContext";
import {
  getChapterMetadata,
  getChapterVerses,
  getVerseTranslation,
  getVerseMetadata,
  getVerseTransliteration,
  getVersesCount,
  getChapterPages,
} from "../../lib/QuranHelper";
import { saveLastReadProgress } from "../../lib/ReadingProgress";
import ShareVerseModal from "../../components/ShareVerseModal";
import MushafPager from "../../components/MushafPager";

type VerseItem = {
  key: string;
  verseNumber: number;
  text: string;
  translation: string | null;
  transliteration: string | null;
  page: number | null;
  juz: number | null;
  hasSajda: boolean;
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
  const { id, verse } = useLocalSearchParams<{
    id?: string | string[];
    verse?: string | string[];
  }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const {
    showTranslations,
    showTransliterations,
    arabicFontSize,
    translationFontSize,
    readingView,
  } = useAppSettings();
  const { isBookmarked, addBookmark, removeBookmark } = useBookmarks();
  const [searchValue, setSearchValue] = useState("");
  const flashListRef = useRef<any>(null);
  const latestSavedRef = useRef<{ chapter: number; verse: number } | null>(
    null,
  );
  const lastSaveAtRef = useRef(0);
  const seenSajdaRef = useRef<Set<string>>(new Set());
  const surahFinishedRef = useRef(false);
  const [shareVerseData, setShareVerseData] = useState<{
    text: string;
    translation: string | null;
    verseNumber: number;
    chapterName: string;
    chapterNumber: number;
  } | null>(null);

  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);

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

  const targetVerse = useMemo(() => {
    const rawVerse = Array.isArray(verse) ? verse[0] : verse;
    const parsed = Number(rawVerse);

    if (!Number.isInteger(parsed) || parsed < 1) return null;
    return parsed;
  }, [verse]);

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
        translation: getVerseTranslation(chapterNumber, verseNumber),
        transliteration: getVerseTransliteration(chapterNumber, verseNumber),
        page: metadata?.page ?? null,
        juz: metadata?.juz ?? null,
        hasSajda: Boolean(metadata?.sajda),
      };
    });
  }, [chapterNumber]);

  const filteredVerses = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    if (!normalizedSearch) return chapterVerses;

    return chapterVerses.filter(
      ({ text, verseNumber, transliteration, translation }) => {
        return (
          text.toLowerCase().includes(normalizedSearch) ||
          String(verseNumber).includes(normalizedSearch) ||
          transliteration?.toLowerCase().includes(normalizedSearch) ||
          translation?.toLowerCase().includes(normalizedSearch)
        );
      },
    );
  }, [chapterVerses, searchValue]);

  useEffect(() => {
    if (!chapterNumber || !targetVerse || searchValue.trim()) return;

    const targetIndex = chapterVerses.findIndex(
      (item) => item.verseNumber === targetVerse,
    );
    if (targetIndex < 0) return;

    const timeout = setTimeout(() => {
      if (readingView === "list") {
        flashListRef.current?.scrollToIndex({
          index: targetIndex,
          animated: false,
        });
      } else {
        setCurrentVerseIndex(targetIndex);
      }
    }, 180);

    return () => {
      clearTimeout(timeout);
    };
  }, [chapterNumber, chapterVerses, searchValue, targetVerse, readingView]);

  const persistReadingProgress = useCallback(
    (item: VerseItem) => {
      if (!chapterNumber) return;

      const previous = latestSavedRef.current;
      const now = Date.now();
      const isSameVerse =
        previous &&
        previous.chapter === chapterNumber &&
        previous.verse === item.verseNumber;

      if (isSameVerse || now - lastSaveAtRef.current < 1200) return;

      latestSavedRef.current = {
        chapter: chapterNumber,
        verse: item.verseNumber,
      };
      lastSaveAtRef.current = now;

      void saveLastReadProgress({
        chapter: chapterNumber,
        verse: item.verseNumber,
        page: item.page,
        juz: item.juz,
      });
    },
    [chapterNumber],
  );

  const onViewableItemsChanged = useCallback(
    ({
      viewableItems,
    }: {
      viewableItems: { isViewable: boolean; item: VerseItem }[];
    }) => {
      const firstVisible = viewableItems.find((entry) => entry.isViewable)?.item;
      if (!firstVisible) return;

      persistReadingProgress(firstVisible);

      // Sajda ayah haptic feedback
      viewableItems.forEach((entry) => {
        if (entry.isViewable && entry.item.hasSajda) {
          if (!seenSajdaRef.current.has(entry.item.key)) {
            seenSajdaRef.current.add(entry.item.key);
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
        }
      });

      // Finish surah haptic feedback
      const isLastVerseVisible = viewableItems.some(
        (entry) =>
          entry.isViewable && entry.item.verseNumber === filteredVerses.length,
      );
      if (isLastVerseVisible && !surahFinishedRef.current) {
        surahFinishedRef.current = true;
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
    [persistReadingProgress, filteredVerses.length],
  );

  const handleCopyVerse = useCallback(
    async (text: string, verseNumber: number) => {
      await Clipboard.setStringAsync(text);
      void Haptics.selectionAsync();
      Alert.alert("Copied", `Ayah ${verseNumber} copied to clipboard.`);
    },
    [],
  );

  const handleShareVerse = useCallback(
    (item: VerseItem) => {
      void Haptics.selectionAsync();
      setShareVerseData({
        text: item.text,
        translation: item.translation,
        verseNumber: item.verseNumber,
        chapterName: chapterMeta?.englishname ?? "Unknown",
        chapterNumber: chapterNumber ?? 0,
      });
    },
    [chapterMeta?.englishname, chapterNumber],
  );

  const toArabicNumber = (num: number) => {
    const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
    return String(num)
      .split("")
      .map((char) => arabicDigits[Number(char)])
      .join("");
  };

  const renderVerse = useCallback(
    ({ item }: { item: VerseItem }) => {
      const verseId = `${chapterNumber}-${item.verseNumber}`;
      const bookmarked = isBookmarked(verseId);

      const handleToggleBookmark = async () => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (bookmarked) {
          await removeBookmark(verseId);
        } else {
          if (chapterNumber) {
            await addBookmark(chapterNumber, item.verseNumber);
          }
        }
      };

      return (
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
                {
                  backgroundColor: withOpacity(
                    colors.primary,
                    isDark ? 0.3 : 0.12,
                  ),
                },
              ]}
            >
              <Text style={[styles.verseBadgeText, { color: colors.primary }]}>
                {item.verseNumber}
              </Text>
            </View>

            <View style={styles.verseMetaRow}>
              {item.hasSajda ? (
                <View
                  style={[
                    styles.sajdaBadge,
                    {
                      backgroundColor: withOpacity(
                        colors.accent,
                        isDark ? 0.28 : 0.18,
                      ),
                    },
                  ]}
                >
                  <Text
                    style={[styles.sajdaBadgeText, { color: colors.textMain }]}
                  >
                    Sajda
                  </Text>
                </View>
              ) : null}
              {item.juz ? (
                <Text style={[styles.verseMeta, { color: colors.textMuted }]}>
                  Juz {item.juz}
                </Text>
              ) : null}
              {item.page ? (
                <Text style={[styles.verseMeta, { color: colors.textMuted }]}>
                  Page {item.page}
                </Text>
              ) : null}
            </View>
          </View>

          <Text
            style={[
              styles.arabicVerseText,
              {
                color: colors.textMain,
                fontSize: arabicFontSize,
                lineHeight: arabicFontSize * 1.6,
              },
            ]}
          >
            {item.text}
          </Text>

          {showTransliterations ? (
            <Text
              style={[styles.transliterationText, { color: colors.textMuted }]}
            >
              {item.transliteration ?? "Transliteration unavailable."}
            </Text>
          ) : null}

          {showTranslations ? (
            <Text
              style={[
                styles.translationText,
                {
                  color: colors.textMain,
                  fontSize: translationFontSize,
                  lineHeight: translationFontSize * 1.5,
                },
              ]}
            >
              {item.translation ??
                "Translation is not available yet for this ayah."}
            </Text>
          ) : null}

          <View style={styles.actionsRow}>
            <Pressable
              onPress={handleToggleBookmark}
              style={styles.actionButton}
            >
              <Bookmark
                size={16}
                color={bookmarked ? colors.primary : colors.textMuted}
                fill={bookmarked ? colors.primary : "transparent"}
              />
              <Text
                style={[
                  styles.actionText,
                  { color: bookmarked ? colors.primary : colors.textMuted },
                ]}
              >
                {bookmarked ? "Bookmarked" : "Bookmark"}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                void handleCopyVerse(item.text, item.verseNumber);
              }}
              style={styles.actionButton}
            >
              <Copy size={16} color={colors.textMuted} />
              <Text style={[styles.actionText, { color: colors.textMuted }]}>
                Copy
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                handleShareVerse(item);
              }}
              style={styles.actionButton}
            >
              <Share2 size={16} color={colors.textMuted} />
              <Text style={[styles.actionText, { color: colors.textMuted }]}>
                Share
              </Text>
            </Pressable>
          </View>
        </View>
      );
    },
    [
      colors,
      handleCopyVerse,
      handleShareVerse,
      isDark,
      showTransliterations,
      showTranslations,
      isBookmarked,
      addBookmark,
      removeBookmark,
      chapterNumber,
      arabicFontSize,
      translationFontSize,
    ],
  );


  const chapterPages = useMemo(() => {
    if (!chapterNumber) return [];
    return getChapterPages(chapterNumber);
  }, [chapterNumber]);

  const initialMushafPage = useMemo(() => {
    if (targetVerse && chapterNumber) {
      const v = getVerseMetadata(chapterNumber, targetVerse);
      if (v?.page) return v.page;
    }
    return chapterPages[0] || 1;
  }, [chapterPages, targetVerse, chapterNumber]);

  const [activeMushafPage, setActiveMushafPage] = useState(initialMushafPage);

  useEffect(() => {
    setActiveMushafPage(initialMushafPage);
  }, [initialMushafPage]);



  if (!chapterNumber || !chapterMeta) {
    return (
      <SafeAreaView
        style={[styles.screen, { backgroundColor: colors.background }]}
      >
        <StatusBar style={isDark ? "light" : "dark"} />
        <View style={styles.invalidStateContainer}>
          <Text style={[styles.invalidStateTitle, { color: colors.textMain }]}>
            Chapter not found
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={[
              styles.backButton,
              { borderColor: colors.border, backgroundColor: colors.surface },
            ]}
          >
            <ChevronLeft size={18} color={colors.textMain} />
            <Text style={[styles.backButtonText, { color: colors.textMain }]}>
              Go back
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const renderHeader = () => {
    return (
      <View style={styles.headerSection}>
        {readingView === "list" ? (
          <View style={{ height: 48 }} />
        ) : (
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
            <Text style={[styles.backButtonText, { color: colors.textMain }]}>
              Chapters
            </Text>
          </Pressable>
        )}

        <View
          style={[
            styles.chapterHeaderCard,
            {
              backgroundColor: colors.surface,
              borderColor: withOpacity(colors.primary, 0.22),
            },
          ]}
        >
          <Text style={[styles.chapterEnglishName, { color: colors.textMain }]}>
            {chapterNumber}. {chapterMeta.englishname}
          </Text>
          <Text style={[styles.chapterArabicName, { color: colors.textMain }]}>
            {chapterMeta.arabicname}
          </Text>
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
          {filteredVerses.length} verse
          {filteredVerses.length === 1 ? "" : "s"}
        </Text>
      </View>
    );
  };

  const renderContent = () => {
    if (readingView === "verse_by_verse") {
      const currentItem = filteredVerses[currentVerseIndex];
      return (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {renderHeader()}
          {currentItem ? (
            <View>
              {renderVerse({ item: currentItem })}
              <View
                style={[
                  styles.actionsRow,
                  { justifyContent: "space-between", marginTop: 16 },
                ]}
              >
                <Pressable
                  disabled={currentVerseIndex === 0}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setCurrentVerseIndex((p) => Math.max(0, p - 1));
                  }}
                  style={[
                    styles.backButton,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.surface,
                      opacity: currentVerseIndex === 0 ? 0.5 : 1,
                    },
                  ]}
                >
                  <ChevronLeft size={18} color={colors.textMain} />
                  <Text
                    style={[styles.backButtonText, { color: colors.textMain }]}
                  >
                    Previous
                  </Text>
                </Pressable>
                <Pressable
                  disabled={currentVerseIndex === filteredVerses.length - 1}
                  onPress={() => {
                    setCurrentVerseIndex((p) => {
                      const newIndex = Math.min(filteredVerses.length - 1, p + 1);
                      if (
                        newIndex === filteredVerses.length - 1 &&
                        !surahFinishedRef.current
                      ) {
                        surahFinishedRef.current = true;
                        void Haptics.notificationAsync(
                          Haptics.NotificationFeedbackType.Success,
                        );
                      }
                      return newIndex;
                    });
                  }}
                  style={[
                    styles.backButton,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.surface,
                      opacity:
                        currentVerseIndex === filteredVerses.length - 1
                          ? 0.5
                          : 1,
                    },
                  ]}
                >
                  <Text
                    style={[styles.backButtonText, { color: colors.textMain }]}
                  >
                    Next
                  </Text>
                  <ChevronRight size={18} color={colors.textMain} />
                </Pressable>
              </View>
            </View>
          ) : (
            <Text
              style={{
                color: colors.textMain,
                textAlign: "center",
                marginTop: 24,
              }}
            >
              No verses found.
            </Text>
          )}
        </ScrollView>
      );
    }



    if (readingView === "mushaf") {
      return (
        <View style={StyleSheet.absoluteFill}>
          <MushafPager
            initialPage={initialMushafPage}
            chapterPages={chapterPages}
            onPageChange={(page) => {
              setActiveMushafPage(page);
              const juz = chapterVerses.find((v) => v.page === page)?.juz ?? null;
              void saveLastReadProgress({
                chapter: chapterNumber,
                verse: 1, // Simplified for Mushaf mode
                page,
                juz,
              });
            }}
          />

          <View style={styles.mushafOverlayHeader}>
            <Pressable
              onPress={() => router.back()}
              style={[
                styles.mushafBackButtonClean,
                { backgroundColor: "rgba(255,255,255,0.1)" },
              ]}
            >
              <ChevronLeft size={22} color="#FFF" />
            </Pressable>

            <View
              style={[
                styles.mushafPageBadge,
                { backgroundColor: "rgba(255,255,255,0.12)" },
              ]}
            >
              <Text style={styles.mushafPageBadgeText}>
                Page {activeMushafPage}
              </Text>
            </View>
          </View>
        </View>
      );
    }

    return (
      <FlashList
        ref={flashListRef}
        data={filteredVerses}
        keyExtractor={(item: VerseItem) => item.key}
        renderItem={renderVerse}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 55,
          minimumViewTime: 200,
        }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader()}
      />
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
          withOpacity(colors.primary, isDark ? 0.14 : 0.06),
          colors.background,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {readingView === "list" && (
        <View
          style={[
            styles.stickyHeader,
            {
              backgroundColor: withOpacity(colors.background, 0.85),
              borderBottomColor: withOpacity(colors.border, 0.5),
            },
          ]}
        >
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
            <Text style={[styles.backButtonText, { color: colors.textMain }]}>
              Chapters
            </Text>
          </Pressable>
        </View>
      )}

      {renderContent()}

      <ShareVerseModal
        visible={shareVerseData !== null}
        onClose={() => setShareVerseData(null)}
        verse={shareVerseData}
        arabicFontSize={arabicFontSize}
        translationFontSize={translationFontSize}
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
    alignItems: "center",
  },
  sajdaBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  sajdaBadgeText: {
    fontFamily: "SatoshiBold",
    fontSize: 11,
    letterSpacing: 0.2,
  },
  verseMeta: {
    fontFamily: "SatoshiMedium",
    fontSize: 12,
  },
  arabicVerseText: {
    fontFamily: "AmiriQuran",
    textAlign: "right",
  },
  transliterationText: {
    fontFamily: "Satoshi",
    fontSize: 13,
    lineHeight: 20,
  },
  translationText: {
    fontFamily: "Satoshi",
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
  mushafOverlayHeader: {
    position: "absolute",
    top: 50,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
  },
  mushafBackButtonClean: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  mushafPageBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  mushafPageBadgeText: {
    color: "#FFF",
    fontFamily: "SatoshiBold",
    fontSize: 14,
  },
  stickyHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 4 : 12,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
