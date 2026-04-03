import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  SlidersHorizontal,
} from "lucide-react-native";
import Slider from "@react-native-community/slider";
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
  const insets = useSafeAreaInsets();
  const {
    showTranslations,
    showTransliterations,
    arabicFontSize,
    translationFontSize,
    readingView,
    setShowTranslations,
    setShowTransliterations,
    setArabicFontSize,
    setTranslationFontSize,
    setReadingView,
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
  const [isReaderSettingsOpen, setIsReaderSettingsOpen] = useState(false);

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
          entry.isViewable && entry.item.verseNumber === verseCount,
      );
      if (isLastVerseVisible && !surahFinishedRef.current) {
        surahFinishedRef.current = true;
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
    [persistReadingProgress, verseCount],
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

  // const toArabicNumber = (num: number) => {
  //   const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  //   return String(num)
  //     .split("")
  //     .map((char) => arabicDigits[Number(char)])
  //     .join("");
  // };

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
                lineHeight: arabicFontSize * 2.0,
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
      <View
        style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}
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
      </View>
    );
  }

  const renderHeader = () => {
    return (
      <View style={[styles.headerSection, { paddingTop: readingView === "list" ? 0 : insets.top }]}>
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

        <Pressable
          onPress={() => setIsReaderSettingsOpen(true)}
          style={[
            styles.readerSettingsButton,
            {
              backgroundColor: colors.surface,
              borderColor: withOpacity(colors.border, 0.86),
            },
          ]}
        >
          <SlidersHorizontal size={16} color={colors.textMain} />
          <Text style={[styles.readerSettingsButtonText, { color: colors.textMain }]}> 
            Reading settings
          </Text>
        </Pressable>
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
                        filteredVerses[newIndex].verseNumber === verseCount &&
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
              const juz =
                chapterVerses.find((v) => v.page === page)?.juz ?? null;

              // Check for Sajda ayahs on this page
              const pageVerses = chapterVerses.filter((v) => v.page === page);
              pageVerses.forEach((v) => {
                if (v.hasSajda && !seenSajdaRef.current.has(v.key)) {
                  seenSajdaRef.current.add(v.key);
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
              });

              // Check if it's the last page
              if (
                page === chapterPages[chapterPages.length - 1] &&
                !surahFinishedRef.current
              ) {
                surahFinishedRef.current = true;
                void Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success,
                );
              }

              void saveLastReadProgress({
                chapter: chapterNumber,
                verse: pageVerses[0]?.verseNumber ?? 1,
                page,
                juz,
              });
            }}
          />

          <View style={[styles.mushafOverlayHeader, { top: insets.top + 8 }]}>
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

            <Pressable
              onPress={() => setIsReaderSettingsOpen(true)}
              style={[
                styles.mushafBackButtonClean,
                { backgroundColor: "rgba(255,255,255,0.12)" },
              ]}
            >
              <SlidersHorizontal size={20} color="#FFF" />
            </Pressable>
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
    <View
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
              paddingTop: insets.top + 8,
            },
          ]}
        >
          <View style={styles.stickyHeaderRow}>
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

            <Pressable
              onPress={() => setIsReaderSettingsOpen(true)}
              style={[
                styles.headerSettingsIconButton,
                {
                  borderColor: colors.border,
                  backgroundColor: withOpacity(colors.surface, 0.92),
                },
              ]}
            >
              <SlidersHorizontal size={18} color={colors.textMain} />
            </Pressable>
          </View>
        </View>
      )}

      {renderContent()}

      <Modal
        visible={isReaderSettingsOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsReaderSettingsOpen(false)}
      >
        <View style={styles.settingsModalOverlay}>
          <Pressable
            onPress={() => setIsReaderSettingsOpen(false)}
            style={StyleSheet.absoluteFill}
          />

          <View
            style={[
              styles.settingsSheet,
              {
                backgroundColor: colors.surface,
                borderColor: withOpacity(colors.border, 0.86),
                paddingBottom: insets.bottom + 16,
              },
            ]}
          >
            <View
              style={[
                styles.settingsSheetGrabber,
                { backgroundColor: withOpacity(colors.border, 0.9) },
              ]}
            />

            <View style={styles.settingsSheetHeader}>
              <Text style={[styles.settingsSheetTitle, { color: colors.textMain }]}>
                Reading settings
              </Text>
              <Pressable
                onPress={() => setIsReaderSettingsOpen(false)}
                style={[
                  styles.settingsDoneButton,
                  {
                    backgroundColor: withOpacity(colors.primary, isDark ? 0.28 : 0.14),
                  },
                ]}
              >
                <Text style={[styles.settingsDoneButtonText, { color: colors.primary }]}> 
                  Done
                </Text>
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={styles.settingsSheetContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={[styles.settingGroupLabel, { color: colors.textMuted }]}> 
                Reading mode
              </Text>
              <View style={styles.modeSelectorRow}>
                {[
                  { key: "list", label: "List" },
                  { key: "verse_by_verse", label: "Verse" },
                  { key: "mushaf", label: "Mushaf" },
                ].map((option) => {
                  const selected = readingView === option.key;
                  return (
                    <Pressable
                      key={option.key}
                      onPress={() => {
                        void setReadingView(option.key as "list" | "verse_by_verse" | "mushaf");
                      }}
                      style={[
                        styles.modeOption,
                        {
                          borderColor: selected
                            ? withOpacity(colors.primary, 0.6)
                            : withOpacity(colors.border, 0.86),
                          backgroundColor: selected
                            ? withOpacity(colors.primary, isDark ? 0.26 : 0.12)
                            : withOpacity(colors.background, 0.65),
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.modeOptionText,
                          { color: selected ? colors.primary : colors.textMuted },
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.settingsRow}> 
                <View style={styles.settingsRowTextWrap}>
                  <Text style={[styles.settingsRowTitle, { color: colors.textMain }]}> 
                    Show translations
                  </Text>
                  <Text style={[styles.settingsRowSubtitle, { color: colors.textMuted }]}> 
                    English translation under ayah
                  </Text>
                </View>
                <Switch
                  value={showTranslations}
                  onValueChange={(nextValue) => {
                    void setShowTranslations(nextValue);
                  }}
                  trackColor={{
                    false: withOpacity(colors.border, 0.8),
                    true: withOpacity(colors.primary, 0.45),
                  }}
                  thumbColor={showTranslations ? colors.primary : "#F4F4F5"}
                />
              </View>

              <View style={styles.settingsRow}> 
                <View style={styles.settingsRowTextWrap}>
                  <Text style={[styles.settingsRowTitle, { color: colors.textMain }]}> 
                    Show transliterations
                  </Text>
                  <Text style={[styles.settingsRowSubtitle, { color: colors.textMuted }]}> 
                    Latin transliteration under ayah
                  </Text>
                </View>
                <Switch
                  value={showTransliterations}
                  onValueChange={(nextValue) => {
                    void setShowTransliterations(nextValue);
                  }}
                  trackColor={{
                    false: withOpacity(colors.border, 0.8),
                    true: withOpacity(colors.primary, 0.45),
                  }}
                  thumbColor={showTransliterations ? colors.primary : "#F4F4F5"}
                />
              </View>

              <View style={styles.sliderGroup}> 
                <View style={styles.sliderHeaderRow}>
                  <Text style={[styles.settingsRowTitle, { color: colors.textMain }]}> 
                    Arabic text size
                  </Text>
                  <Text style={[styles.settingsSliderValue, { color: colors.textMuted }]}> 
                    {Math.round(arabicFontSize)}px
                  </Text>
                </View>
                <Slider
                  style={styles.slider}
                  minimumValue={22}
                  maximumValue={50}
                  step={1}
                  value={arabicFontSize}
                  onSlidingComplete={(next) => {
                    void setArabicFontSize(next);
                  }}
                  minimumTrackTintColor={colors.primary}
                  maximumTrackTintColor={withOpacity(colors.border, 0.8)}
                  thumbTintColor={colors.primary}
                />
              </View>

              <View style={styles.sliderGroup}> 
                <View style={styles.sliderHeaderRow}>
                  <Text style={[styles.settingsRowTitle, { color: colors.textMain }]}> 
                    Translation text size
                  </Text>
                  <Text style={[styles.settingsSliderValue, { color: colors.textMuted }]}> 
                    {Math.round(translationFontSize)}px
                  </Text>
                </View>
                <Slider
                  style={styles.slider}
                  minimumValue={12}
                  maximumValue={24}
                  step={1}
                  value={translationFontSize}
                  onSlidingComplete={(next) => {
                    void setTranslationFontSize(next);
                  }}
                  minimumTrackTintColor={colors.primary}
                  maximumTrackTintColor={withOpacity(colors.border, 0.8)}
                  thumbTintColor={colors.primary}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ShareVerseModal
        visible={shareVerseData !== null}
        onClose={() => setShareVerseData(null)}
        verse={shareVerseData}
        arabicFontSize={arabicFontSize}
        translationFontSize={translationFontSize}
      />
    </View>
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
    paddingVertical: 8,
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
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  stickyHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerSettingsIconButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  readerSettingsButton: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
  },
  readerSettingsButtonText: {
    fontFamily: "SatoshiMedium",
    fontSize: 13,
  },
  settingsModalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  settingsSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    maxHeight: "82%",
    overflow: "hidden",
  },
  settingsSheetGrabber: {
    width: 44,
    height: 4,
    borderRadius: 999,
    alignSelf: "center",
    marginTop: 10,
  },
  settingsSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  settingsSheetTitle: {
    fontFamily: "SatoshiBold",
    fontSize: 19,
  },
  settingsDoneButton: {
    borderRadius: 999,
    paddingHorizontal: 12,
    minHeight: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsDoneButtonText: {
    fontFamily: "SatoshiBold",
    fontSize: 13,
  },
  settingsSheetContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  settingGroupLabel: {
    fontFamily: "SatoshiMedium",
    fontSize: 12,
  },
  modeSelectorRow: {
    flexDirection: "row",
    gap: 8,
  },
  modeOption: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  modeOptionText: {
    fontFamily: "SatoshiMedium",
    fontSize: 13,
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  settingsRowTextWrap: {
    flex: 1,
    paddingRight: 12,
    gap: 2,
  },
  settingsRowTitle: {
    fontFamily: "SatoshiBold",
    fontSize: 14,
  },
  settingsRowSubtitle: {
    fontFamily: "Satoshi",
    fontSize: 12,
    lineHeight: 18,
  },
  sliderGroup: {
    gap: 2,
  },
  sliderHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  settingsSliderValue: {
    fontFamily: "SatoshiMedium",
    fontSize: 13,
  },
  slider: {
    width: "100%",
    height: 40,
  },
});
