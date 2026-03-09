import { useCallback, useMemo, useState } from "react";
import { ScrollView, Text, View, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Search, Headphones } from "lucide-react-native";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 5) return "Night recitation";
  if (hour < 12) return "Assalamu alaikum, good morning";
  if (hour < 17) return "Assalamu alaikum, good afternoon";
  if (hour < 21) return "Assalamu alaikum, good evening";
  return "Assalamu alaikum";
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
  const continuePressed = useSharedValue(0);

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

  const greetingText = useMemo(() => getGreeting(), []);

  const reminderText = useMemo(() => {
    if (!reminderEnabled) return "Reminder is off";
    return `Daily reminder at ${formatReminderTime(reminderTime.hour, reminderTime.minute)}`;
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

    return {
      ratio,
      percentage: Math.round(ratio * 100),
      totalVerses,
    };
  }, [lastRead, lastReadChapter]);

  const continueAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: withTiming(continuePressed.value ? 0.986 : 1, { duration: 120 }),
      },
    ],
  }));

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
        <Animated.View entering={FadeInDown.delay(30).duration(280)}>
          <Pressable
            onPress={() => router.push("/search")}
            style={[
              styles.fakeSearchBar,
              {
                backgroundColor: colors.surface,
                borderColor: withOpacity(colors.border, 0.8),
              },
            ]}
          >
            <Search size={18} color={colors.textMuted} />
            <Text style={[styles.fakeSearchText, { color: colors.textMuted }]}>
              Search Quran globally...
            </Text>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeIn.duration(280)}>
          <LinearGradient
            colors={[
              colors.surface,
              withOpacity(colors.primary, isDark ? 0.16 : 0.08),
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.greetingCard,
              {
                borderColor: withOpacity(colors.primary, 0.24),
              },
            ]}
          >
            <Text style={[styles.greetingText, { color: colors.textMain }]}>
              {greetingText}
            </Text>
            <Text style={[styles.greetingSubtext, { color: colors.textMuted }]}>
              Keep your recitation steady, even if it is just a few ayat.
            </Text>

            <View
              style={[
                styles.reminderPill,
                {
                  backgroundColor: withOpacity(
                    reminderEnabled ? colors.success : colors.border,
                    isDark ? 0.24 : 0.15,
                  ),
                },
              ]}
            >
              <Text
                style={[
                  styles.reminderPillText,
                  {
                    color: reminderEnabled ? colors.success : colors.textMuted,
                  },
                ]}
              >
                {reminderText}
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        <AnimatedPressable
          entering={FadeInDown.delay(70).duration(300)}
          onPressIn={() => {
            continuePressed.value = 1;
          }}
          onPressOut={() => {
            continuePressed.value = 0;
          }}
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
          style={continueAnimatedStyle}
        >
          <LinearGradient
            colors={[
              colors.surface,
              withOpacity(colors.primary, isDark ? 0.12 : 0.06),
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.continueCard,
              {
                borderColor: withOpacity(colors.border, 0.85),
              },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.textMain }]}>
              Continue reading
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
                  Ayah {lastRead.verse} • Page {lastRead.page ?? "-"} • Juz{" "}
                  {lastRead.juz ?? "-"}
                </Text>
                {readingProgress ? (
                  <>
                    <View
                      style={[
                        styles.progressTrack,
                        {
                          backgroundColor: withOpacity(
                            colors.border,
                            isDark ? 0.75 : 0.5,
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
                      style={[
                        styles.progressLabel,
                        { color: colors.textMuted },
                      ]}
                    >
                      {readingProgress.percentage}% through this surah
                    </Text>
                  </>
                ) : null}
                <Text style={[styles.continueCta, { color: colors.primary }]}>
                  Resume from last read
                </Text>
              </>
            ) : (
              <>
                <Text
                  style={[styles.continueMeta, { color: colors.textMuted }]}
                >
                  Start from any surah and your reading position will be saved
                  automatically.
                </Text>
                <Text style={[styles.continueCta, { color: colors.primary }]}>
                  Open chapters
                </Text>
              </>
            )}
          </LinearGradient>
        </AnimatedPressable>

        <AnimatedPressable
          entering={FadeInDown.delay(95).duration(300)}
          onPress={() => {
            void Haptics.selectionAsync();
            router.push("/audio");
          }}
          style={({ pressed }) => [
            { transform: [{ scale: pressed ? 0.986 : 1 }] },
          ]}
        >
          <LinearGradient
            colors={[
              colors.surface,
              withOpacity(colors.primary, isDark ? 0.12 : 0.06),
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.continueCard,
              {
                borderColor: withOpacity(colors.border, 0.85),
                marginTop: 4,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              },
            ]}
          >
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[styles.sectionTitle, { color: colors.textMain }]}>
                Audio Recitations
              </Text>
              <Text style={[styles.continueMeta, { color: colors.textMuted }]}>
                Listen to beautiful recitations from world-renowned Qaris.
              </Text>
            </View>
            <View
              style={{
                padding: 12,
                backgroundColor: withOpacity(colors.primary, 0.15),
                borderRadius: 999,
                marginLeft: 16,
              }}
            >
              <Headphones color={colors.primary} size={24} />
            </View>
          </LinearGradient>
        </AnimatedPressable>

        <Animated.View entering={FadeInDown.delay(120).duration(320)}>
          <LinearGradient
            colors={[
              colors.surface,
              withOpacity(colors.primary, isDark ? 0.1 : 0.05),
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.juzCard,
              {
                borderColor: withOpacity(colors.border, 0.85),
              },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.textMain }]}>
              Quick Juz Navigator
            </Text>
            <Text style={[styles.juzHint, { color: colors.textMuted }]}>
              Jump straight into any Juz
            </Text>

            <View style={styles.juzGrid}>
              {juzItems.map((item, index) => (
                <Animated.View
                  key={`juz-wrap-${item.juz}`}
                  entering={FadeInDown.delay(170 + index * 16).duration(280)}
                >
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
                    style={styles.juzChip}
                  >
                    <LinearGradient
                      colors={[
                        withOpacity(colors.primary, isDark ? 0.3 : 0.14),
                        withOpacity(colors.primary, isDark ? 0.2 : 0.06),
                      ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[
                        styles.juzChipInner,
                        {
                          borderColor: withOpacity(
                            colors.primary,
                            isDark ? 0.45 : 0.22,
                          ),
                        },
                      ]}
                    >
                      <Text
                        style={[styles.juzChipText, { color: colors.primary }]}
                      >
                        Juz {item.juz}
                      </Text>
                    </LinearGradient>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(160).duration(320)}>
          <LinearGradient
            colors={[
              colors.surface,
              withOpacity(colors.primary, isDark ? 0.1 : 0.04),
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.juzCard,
              {
                borderColor: withOpacity(colors.border, 0.85),
                padding: 18,
                marginTop: 4,
              },
            ]}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <View style={{ gap: 2 }}>
                <Text style={[styles.sectionTitle, { color: colors.textMain }]}>
                  Ayah of the Day
                </Text>
                <Text style={[styles.juzHint, { color: colors.textMuted }]}>
                  Surah {dailyAyah.chapterName} • Ayah {dailyAyah.target.verse}
                </Text>
              </View>
              <View
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor: withOpacity(colors.primary, 0.15),
                }}
              >
                <Text
                  style={{
                    fontFamily: "SatoshiBold",
                    fontSize: 12,
                    color: colors.primary,
                  }}
                >
                  Daily
                </Text>
              </View>
            </View>

            <Text
              style={[styles.arabicDailyText, { color: colors.textMain }]}
              numberOfLines={3}
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
              style={{
                marginTop: 10,
                alignSelf: "flex-start",
                paddingVertical: 8,
                paddingHorizontal: 16,
                backgroundColor: colors.primary,
                borderRadius: 999,
              }}
            >
              <Text
                style={{
                  fontFamily: "SatoshiBold",
                  fontSize: 13,
                  color: "#FFFFFF",
                }}
              >
                Read Ayah
              </Text>
            </Pressable>
          </LinearGradient>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120,
    gap: 14,
  },
  fakeSearchBar: {
    borderWidth: 1,
    borderRadius: 999,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 2,
  },
  fakeSearchText: {
    fontFamily: "SatoshiMedium",
    fontSize: 15,
  },
  greetingCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 8,
  },
  greetingText: {
    fontFamily: "SatoshiBold",
    fontSize: 24,
    letterSpacing: -0.2,
  },
  greetingSubtext: {
    fontFamily: "Satoshi",
    fontSize: 14,
    lineHeight: 21,
  },
  reminderPill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
    marginTop: 4,
  },
  reminderPillText: {
    fontFamily: "SatoshiMedium",
    fontSize: 12,
  },
  continueCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 7,
  },
  progressTrack: {
    width: "100%",
    height: 7,
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 4,
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  progressLabel: {
    fontFamily: "SatoshiMedium",
    fontSize: 12,
    marginTop: 2,
  },
  sectionTitle: {
    fontFamily: "SatoshiBold",
    fontSize: 18,
  },
  continueTitle: {
    fontFamily: "SatoshiMedium",
    fontSize: 16,
  },
  continueMeta: {
    fontFamily: "SatoshiMedium",
    fontSize: 13,
    lineHeight: 20,
  },
  continueCta: {
    marginTop: 2,
    fontFamily: "SatoshiBold",
    fontSize: 13,
  },
  juzCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 8,
  },
  juzHint: {
    fontFamily: "Satoshi",
    fontSize: 13,
  },
  arabicDailyText: {
    fontFamily: "AmiriQuran",
    fontSize: 25,
    lineHeight: 40,
    textAlign: "right",
    marginBottom: 8,
  },
  translationDailyText: {
    fontFamily: "SatoshiMedium",
    fontSize: 14,
    lineHeight: 22,
  },
  juzGrid: {
    marginTop: 4,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  juzChip: {
    minWidth: "22%",
    borderRadius: 999,
  },
  juzChipInner: {
    borderWidth: 1,
    alignItems: "center",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  juzChipText: {
    fontFamily: "SatoshiMedium",
    fontSize: 12,
  },
});
