import { useCallback, useMemo, useRef, useState } from "react";
import {
  ScrollView,
  Text,
  View,
  StyleSheet,
  Pressable,
  FlatList,
  Modal,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Search,
  Headphones,
  ChevronRight,
  BookOpen,
  X,
} from "lucide-react-native";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

import { useTheme } from "../../lib/ThemeContext";
import { useAppSettings } from "../../lib/AppSettingsContext";
import {
  getChapterMetadata,
  getFirstVerseForJuz,
  getVersesCount,
  getChapterVerses,
  getVerseTranslation,
} from "../../lib/QuranHelper";
import {
  getLastReadProgress,
  type LastReadProgress,
} from "../../lib/ReadingProgress";

const SCREEN_HEIGHT = Dimensions.get("window").height;

// Hash function to get a consistent random number per day
const getDailyAyah = () => {
  const today = new Date();
  const seed =
    today.getFullYear() * 10000 +
    (today.getMonth() + 1) * 100 +
    today.getDate();
  const random = Math.sin(seed) * 10000;
  const ayahIndex = Math.floor((random - Math.floor(random)) * 6236);

  // Quick lookup across chapters (1 to 114)
  let currentIndex = 0;
  for (let c = 1; c <= 114; c++) {
    const verses = getVersesCount(c);
    if (ayahIndex < currentIndex + verses) {
      return { chapter: c, verse: ayahIndex - currentIndex + 1 };
    }
    currentIndex += verses;
  }
  return { chapter: 2, verse: 255 }; // Fallback to Ayatul Kursi
};

const withOpacity = (hexColor: string, opacity: number) => {
  const sanitized = hexColor.replace("#", "");
  const bigint = Number.parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 5) return "Night recitation";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good evening";
};

const formatReminderTime = (hour: number, minute: number) => {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

export default function Index() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { reminderEnabled, reminderTime } = useAppSettings();
  const [lastRead, setLastRead] = useState<LastReadProgress | null>(null);
  const [juzSheetVisible, setJuzSheetVisible] = useState(false);
  const insets = useSafeAreaInsets();

  const sheetAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const loadLastRead = async () => {
        const progress = await getLastReadProgress();
        if (isActive) setLastRead(progress);
      };
      void loadLastRead();
      return () => {
        isActive = false;
      };
    }, []),
  );

  const openJuzSheet = () => {
    setJuzSheetVisible(true);
    Animated.parallel([
      Animated.spring(sheetAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeJuzSheet = () => {
    Animated.parallel([
      Animated.timing(sheetAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start(() => setJuzSheetVisible(false));
  };

  const greetingText = useMemo(() => getGreeting(), []);

  const reminderText = useMemo(() => {
    if (!reminderEnabled) return "Reminder off";
    return `Reminder at ${formatReminderTime(reminderTime.hour, reminderTime.minute)}`;
  }, [reminderEnabled, reminderTime.hour, reminderTime.minute]);

  const lastReadChapter = useMemo(() => {
    if (!lastRead) return null;
    return getChapterMetadata(lastRead.chapter);
  }, [lastRead]);

  const readingProgress = useMemo(() => {
    if (!lastRead || !lastReadChapter) return null;
    const totalVerses = getVersesCount(lastRead.chapter);
    if (!totalVerses) return null;
    const ratio = Math.min(Math.max(lastRead.verse / totalVerses, 0), 1);
    return { ratio, percentage: Math.round(ratio * 100), totalVerses };
  }, [lastRead, lastReadChapter]);

  const juzItems = useMemo(
    () =>
      Array.from({ length: 30 }, (_, index) => {
        const juz = index + 1;
        const firstVerse = getFirstVerseForJuz(juz);
        return {
          juz,
          chapter: firstVerse?.chapter ?? null,
          verse: firstVerse?.verse ?? null,
        };
      }),
    [],
  );

  const dailyAyah = useMemo(() => {
    const target = getDailyAyah();
    const meta = getChapterMetadata(target.chapter);
    const verses = getChapterVerses(target.chapter);
    return {
      chapterName: meta?.englishname ?? "",
      target,
      text: verses[target.verse - 1] ?? "",
      translation: getVerseTranslation(target.chapter, target.verse) ?? "",
    };
  }, []);

  const navigateToJuz = (item: {
    chapter: number | null;
    verse: number | null;
  }) => {
    if (!item.chapter || !item.verse) return;
    void Haptics.selectionAsync();
    closeJuzSheet();
    setTimeout(() => {
      router.push({
        pathname: "/chapter/[id]",
        params: {
          id: String(item.chapter),
          verse: String(item.verse),
        },
      });
    }, 320);
  };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
    >
      <StatusBar style={isDark ? "light" : "dark"} />
      <LinearGradient
        colors={[
          colors.background,
          withOpacity(colors.primary, isDark ? 0.14 : 0.08),
          colors.background,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Header Row ─── */}
        <View style={styles.headerRow}>
          <View style={styles.headerTextBlock}>
            <Text style={[styles.greetingLabel, { color: colors.textMuted }]}>
              Assalamu alaikum
            </Text>
            <Text style={[styles.greetingHeading, { color: colors.textMain }]}>
              {greetingText} 🌙
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/search")}
            style={[
              styles.searchIconBtn,
              {
                backgroundColor: colors.surface,
                borderColor: withOpacity(colors.border, 0.8),
              },
            ]}
          >
            <Search size={20} color={colors.textMuted} />
          </Pressable>
        </View>

        {/* ─── Reminder pill ─── */}
        <View
          style={[
            styles.reminderPill,
            {
              backgroundColor: withOpacity(
                reminderEnabled ? colors.success : colors.border,
                isDark ? 0.18 : 0.12,
              ),
              alignSelf: "flex-start",
            },
          ]}
        >
          <View
            style={[
              styles.reminderDot,
              {
                backgroundColor: reminderEnabled
                  ? colors.success
                  : colors.textMuted,
              },
            ]}
          />
          <Text
            style={[
              styles.reminderPillText,
              { color: reminderEnabled ? colors.success : colors.textMuted },
            ]}
          >
            {reminderText}
          </Text>
        </View>

        {/* ─── Continue Reading Card ─── */}
        <Pressable
          onPress={() => {
            void Haptics.selectionAsync();
            if (!lastRead) {
              router.push("/(tabs)/chapters");
              return;
            }
            router.push({
              pathname: "/chapter/[id]",
              params: {
                id: String(lastRead.chapter),
                verse: String(lastRead.verse),
              },
            });
          }}
        >
          <LinearGradient
            colors={[
              withOpacity(colors.primary, isDark ? 0.22 : 0.12),
              withOpacity(colors.primary, isDark ? 0.08 : 0.04),
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.continueCard,
              {
                borderColor: withOpacity(colors.primary, isDark ? 0.35 : 0.22),
              },
            ]}
          >
            <View style={styles.continueCardTop}>
              <View style={styles.continueCardLeft}>
                <Text style={[styles.cardLabel, { color: colors.primary }]}>
                  {lastRead ? "Continue reading" : "Start reading"}
                </Text>
                {lastRead && lastReadChapter ? (
                  <>
                    <Text
                      style={[styles.continueTitle, { color: colors.textMain }]}
                    >
                      Surah {lastReadChapter.englishname}
                    </Text>
                    <Text
                      style={[styles.continueMeta, { color: colors.textMuted }]}
                    >
                      Ayah {lastRead.verse} • Juz {lastRead.juz ?? "–"} • Pg{" "}
                      {lastRead.page ?? "–"}
                    </Text>
                  </>
                ) : (
                  <Text
                    style={[styles.continueMeta, { color: colors.textMuted }]}
                  >
                    Your position is saved automatically
                  </Text>
                )}
              </View>
              <View
                style={[
                  styles.continueIconWrap,
                  { backgroundColor: withOpacity(colors.primary, 0.18) },
                ]}
              >
                <BookOpen color={colors.primary} size={22} />
              </View>
            </View>

            {readingProgress ? (
              <View style={styles.progressSection}>
                <View
                  style={[
                    styles.progressTrack,
                    {
                      backgroundColor: withOpacity(
                        colors.border,
                        isDark ? 0.65 : 0.4,
                      ),
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${readingProgress.ratio * 100}%`,
                        backgroundColor: colors.primary,
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[styles.progressLabel, { color: colors.textMuted }]}
                >
                  {readingProgress.percentage}% through surah
                </Text>
              </View>
            ) : null}

            <View style={styles.continueCtaRow}>
              <Text style={[styles.continueCta, { color: colors.primary }]}>
                {lastRead ? "Resume" : "Open chapters"}
              </Text>
              <ChevronRight size={15} color={colors.primary} />
            </View>
          </LinearGradient>
        </Pressable>

        {/* ─── Quick Actions Row ─── */}
        <View style={styles.quickActionsRow}>
          {/* Audio card */}
          <Pressable
            style={{ flex: 1 }}
            onPress={() => {
              void Haptics.selectionAsync();
              router.push("/audio");
            }}
          >
            <LinearGradient
              colors={[
                colors.surface,
                withOpacity(colors.primary, isDark ? 0.12 : 0.05),
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.quickCard,
                { borderColor: withOpacity(colors.border, 0.85) },
              ]}
            >
              <View
                style={[
                  styles.quickIconWrap,
                  { backgroundColor: withOpacity(colors.primary, 0.15) },
                ]}
              >
                <Headphones color={colors.primary} size={20} />
              </View>
              <Text style={[styles.quickCardTitle, { color: colors.textMain }]}>
                Audio
              </Text>
              <Text
                style={[styles.quickCardSubtitle, { color: colors.textMuted }]}
              >
                Listen to reciters
              </Text>
            </LinearGradient>
          </Pressable>

          {/* Chapters card */}
          <Pressable
            style={{ flex: 1 }}
            onPress={() => {
              void Haptics.selectionAsync();
              router.push("/(tabs)/chapters");
            }}
          >
            <LinearGradient
              colors={[
                colors.surface,
                withOpacity(colors.primary, isDark ? 0.12 : 0.05),
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.quickCard,
                { borderColor: withOpacity(colors.border, 0.85) },
              ]}
            >
              <View
                style={[
                  styles.quickIconWrap,
                  { backgroundColor: withOpacity(colors.primary, 0.15) },
                ]}
              >
                <BookOpen color={colors.primary} size={20} />
              </View>
              <Text style={[styles.quickCardTitle, { color: colors.textMain }]}>
                Chapters
              </Text>
              <Text
                style={[styles.quickCardSubtitle, { color: colors.textMuted }]}
              >
                Browse all surahs
              </Text>
            </LinearGradient>
          </Pressable>
        </View>

        {/* ─── Juz Navigator ─── */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.textMain }]}>
              Quick Juz
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
              Jump to any part of the Quran
            </Text>
          </View>
          <Pressable onPress={openJuzSheet} style={styles.seeAllBtn}>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>
              See all
            </Text>
            <ChevronRight size={14} color={colors.primary} />
          </Pressable>
        </View>

        <FlatList
          data={juzItems}
          keyExtractor={(item) => `juz-${item.juz}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.juzHScroll}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                if (!item.chapter || !item.verse) return;
                void Haptics.selectionAsync();
                router.push({
                  pathname: "/chapter/[id]",
                  params: {
                    id: String(item.chapter),
                    verse: String(item.verse),
                  },
                });
              }}
            >
              <LinearGradient
                colors={[
                  withOpacity(colors.primary, isDark ? 0.28 : 0.13),
                  withOpacity(colors.primary, isDark ? 0.16 : 0.06),
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.juzScrollChip,
                  {
                    borderColor: withOpacity(
                      colors.primary,
                      isDark ? 0.42 : 0.22,
                    ),
                  },
                ]}
              >
                <Text
                  style={[styles.juzScrollNumber, { color: colors.primary }]}
                >
                  {item.juz}
                </Text>
                <Text
                  style={[
                    styles.juzScrollLabel,
                    { color: withOpacity(colors.primary, 0.75) },
                  ]}
                >
                  Juz
                </Text>
              </LinearGradient>
            </Pressable>
          )}
          scrollEventThrottle={16}
        />

        {/* ─── Ayah of the Day ─── */}
        <LinearGradient
          colors={[
            colors.surface,
            withOpacity(colors.primary, isDark ? 0.1 : 0.04),
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.ayahCard,
            { borderColor: withOpacity(colors.border, 0.85) },
          ]}
        >
          <View style={styles.ayahCardTop}>
            <View style={{ gap: 2, flex: 1 }}>
              <Text style={[styles.sectionTitle, { color: colors.textMain }]}>
                Ayah of the Day
              </Text>
              <Text
                style={[styles.sectionSubtitle, { color: colors.textMuted }]}
              >
                Surah {dailyAyah.chapterName} · Ayah {dailyAyah.target.verse}
              </Text>
            </View>
            <View
              style={[
                styles.dailyPill,
                { backgroundColor: withOpacity(colors.primary, 0.15) },
              ]}
            >
              <Text style={[styles.dailyPillText, { color: colors.primary }]}>
                Daily
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.ayahDivider,
              { backgroundColor: withOpacity(colors.primary, 0.15) },
            ]}
          />

          <Text
            style={[styles.arabicDailyText, { color: colors.textMain }]}
            numberOfLines={4}
          >
            {dailyAyah.text}
          </Text>

          <Text
            style={[styles.translationDailyText, { color: colors.textMuted }]}
            numberOfLines={3}
          >
            {dailyAyah.translation}
          </Text>

          <Pressable
            onPress={() => {
              void Haptics.selectionAsync();
              router.push({
                pathname: "/chapter/[id]",
                params: {
                  id: String(dailyAyah.target.chapter),
                  verse: String(dailyAyah.target.verse),
                },
              });
            }}
            style={[styles.readAyahBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.readAyahBtnText}>Read Ayah</Text>
            <ChevronRight size={14} color="#fff" />
          </Pressable>
        </LinearGradient>
      </ScrollView>

      {/* ─── Juz Bottom Sheet ─── */}
      {juzSheetVisible && (
        <Modal
          transparent
          visible={juzSheetVisible}
          animationType="none"
          onRequestClose={closeJuzSheet}
          statusBarTranslucent
        >
          <TouchableWithoutFeedback onPress={closeJuzSheet}>
            <Animated.View
              style={[
                StyleSheet.absoluteFillObject,
                styles.sheetBackdrop,
                { opacity: backdropOpacity },
              ]}
            />
          </TouchableWithoutFeedback>

          <Animated.View
            style={[
              styles.sheetContainer,
              {
                backgroundColor: colors.background,
                paddingBottom: insets.bottom + 16,
                transform: [{ translateY: sheetAnim }],
              },
            ]}
          >
            {/* Handle */}
            <View style={styles.sheetHandleWrap}>
              <View
                style={[
                  styles.sheetHandle,
                  { backgroundColor: withOpacity(colors.border, 0.7) },
                ]}
              />
            </View>

            <View style={styles.sheetHeader}>
              <View>
                <Text style={[styles.sheetTitle, { color: colors.textMain }]}>
                  All Juz
                </Text>
                <Text
                  style={[styles.sheetSubtitle, { color: colors.textMuted }]}
                >
                  30 parts of the Holy Quran
                </Text>
              </View>
              <TouchableOpacity
                onPress={closeJuzSheet}
                style={[
                  styles.sheetCloseBtn,
                  { backgroundColor: withOpacity(colors.border, 0.4) },
                ]}
              >
                <X size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={juzItems}
              keyExtractor={(item) => `sheet-juz-${item.juz}`}
              numColumns={3}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.sheetGrid}
              columnWrapperStyle={styles.sheetGridRow}
              renderItem={({ item }) => (
                <Pressable
                  style={{ flex: 1 }}
                  onPress={() => navigateToJuz(item)}
                >
                  <LinearGradient
                    colors={[
                      withOpacity(colors.primary, isDark ? 0.28 : 0.12),
                      withOpacity(colors.primary, isDark ? 0.14 : 0.05),
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                      styles.sheetJuzTile,
                      {
                        borderColor: withOpacity(
                          colors.primary,
                          isDark ? 0.4 : 0.2,
                        ),
                      },
                    ]}
                  >
                    <Text
                      style={[styles.sheetJuzNumber, { color: colors.primary }]}
                    >
                      {item.juz}
                    </Text>
                    <Text
                      style={[
                        styles.sheetJuzLabel,
                        { color: withOpacity(colors.primary, 0.65) },
                      ]}
                    >
                      Juz
                    </Text>
                  </LinearGradient>
                </Pressable>
              )}
            />
          </Animated.View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 140,
    gap: 16,
  },

  // Header
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  headerTextBlock: {
    gap: 2,
    flex: 1,
  },
  greetingLabel: {
    fontFamily: "SatoshiMedium",
    fontSize: 13,
    letterSpacing: 0.3,
  },
  greetingHeading: {
    fontFamily: "SatoshiBold",
    fontSize: 26,
    letterSpacing: -0.3,
  },
  searchIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },

  // Reminder
  reminderPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  reminderDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  reminderPillText: {
    fontFamily: "SatoshiMedium",
    fontSize: 12,
  },

  // Continue Reading
  continueCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    gap: 10,
  },
  continueCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  continueCardLeft: {
    flex: 1,
    gap: 4,
  },
  cardLabel: {
    fontFamily: "SatoshiBold",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  continueTitle: {
    fontFamily: "SatoshiBold",
    fontSize: 20,
    letterSpacing: -0.2,
  },
  continueMeta: {
    fontFamily: "SatoshiMedium",
    fontSize: 13,
    lineHeight: 20,
  },
  continueIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
    flexShrink: 0,
  },
  progressSection: {
    gap: 5,
  },
  progressTrack: {
    width: "100%",
    height: 6,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  progressLabel: {
    fontFamily: "SatoshiMedium",
    fontSize: 11,
  },
  continueCtaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 2,
  },
  continueCta: {
    fontFamily: "SatoshiBold",
    fontSize: 13,
  },

  // Quick Actions
  quickActionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  quickCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 8,
  },
  quickIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  quickCardTitle: {
    fontFamily: "SatoshiBold",
    fontSize: 15,
  },
  quickCardSubtitle: {
    fontFamily: "Satoshi",
    fontSize: 12,
    lineHeight: 18,
  },

  // Section Header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: -4,
  },
  sectionTitle: {
    fontFamily: "SatoshiBold",
    fontSize: 18,
  },
  sectionSubtitle: {
    fontFamily: "Satoshi",
    fontSize: 12.5,
    marginTop: 1,
  },
  seeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  seeAllText: {
    fontFamily: "SatoshiBold",
    fontSize: 13,
  },

  // Juz Horizontal Scroll
  juzHScroll: {
    paddingHorizontal: 0,
    gap: 10,
  },
  juzScrollChip: {
    width: 64,
    height: 72,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  juzScrollNumber: {
    fontFamily: "SatoshiBold",
    fontSize: 22,
    letterSpacing: -0.5,
  },
  juzScrollLabel: {
    fontFamily: "SatoshiMedium",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Ayah of the Day
  ayahCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    gap: 12,
  },
  ayahCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  dailyPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    marginLeft: 12,
  },
  dailyPillText: {
    fontFamily: "SatoshiBold",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  ayahDivider: {
    height: 1,
    borderRadius: 1,
  },
  arabicDailyText: {
    fontFamily: "AmiriQuran",
    fontSize: 24,
    lineHeight: 42,
    textAlign: "right",
  },
  translationDailyText: {
    fontFamily: "SatoshiMedium",
    fontSize: 14,
    lineHeight: 22,
  },
  readAyahBtn: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    marginTop: 2,
  },
  readAyahBtnText: {
    fontFamily: "SatoshiBold",
    fontSize: 13,
    color: "#FFFFFF",
  },

  // --- Bottom Sheet ---
  sheetBackdrop: {
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheetContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 10,
    maxHeight: SCREEN_HEIGHT * 0.82,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 24,
  },
  sheetHandleWrap: {
    alignItems: "center",
    paddingBottom: 8,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  sheetTitle: {
    fontFamily: "SatoshiBold",
    fontSize: 20,
  },
  sheetSubtitle: {
    fontFamily: "Satoshi",
    fontSize: 13,
    marginTop: 2,
  },
  sheetCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetGrid: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 10,
  },
  sheetGridRow: {
    gap: 10,
  },
  sheetJuzTile: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  sheetJuzNumber: {
    fontFamily: "SatoshiBold",
    fontSize: 24,
    letterSpacing: -0.5,
  },
  sheetJuzLabel: {
    fontFamily: "SatoshiMedium",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
