import { useCallback, useMemo, useState } from "react";
import { ScrollView, Text, View, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context"
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../lib/ThemeContext";
import { useAppSettings } from "../../lib/AppSettingsContext";
import { getChapterMetadata, getFirstVerseForJuz } from "../../lib/QuranHelper";
import {
  getLastReadProgress,
  type LastReadProgress,
} from "../../lib/ReadingProgress";

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

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
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

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View
          style={[
            styles.greetingCard,
            {
              backgroundColor: colors.surface,
              borderColor: withOpacity(colors.primary, 0.24),
            },
          ]}
        >
          <Text style={[styles.greetingText, { color: colors.textMain }]}>{greetingText}</Text>
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
                { color: reminderEnabled ? colors.success : colors.textMuted },
              ]}
            >
              {reminderText}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => {
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
          style={[
            styles.continueCard,
            {
              backgroundColor: colors.surface,
              borderColor: withOpacity(colors.border, 0.85),
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.textMain }]}>Continue reading</Text>

          {lastRead && lastReadChapter ? (
            <>
              <Text style={[styles.continueTitle, { color: colors.textMain }]}>
                Surah {lastReadChapter.englishname}
              </Text>
              <Text style={[styles.continueMeta, { color: colors.textMuted }]}>
                Ayah {lastRead.verse} • Page {lastRead.page ?? "-"} • Juz {lastRead.juz ?? "-"}
              </Text>
              <Text style={[styles.continueCta, { color: colors.primary }]}>Resume from last read</Text>
            </>
          ) : (
            <>
              <Text style={[styles.continueMeta, { color: colors.textMuted }]}>
                Start from any surah and your reading position will be saved automatically.
              </Text>
              <Text style={[styles.continueCta, { color: colors.primary }]}>Open chapters</Text>
            </>
          )}
        </Pressable>

        <View
          style={[
            styles.juzCard,
            {
              backgroundColor: colors.surface,
              borderColor: withOpacity(colors.border, 0.85),
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.textMain }]}>Quick Juz Navigator</Text>
          <Text style={[styles.juzHint, { color: colors.textMuted }]}>Jump straight into any Juz</Text>

          <View style={styles.juzGrid}>
            {juzItems.map((item) => (
              <Pressable
                key={`juz-${item.juz}`}
                onPress={() => {
                  if (!item.chapter || !item.verse) return;

                  router.push({
                    pathname: "/chapter/[id]",
                    params: {
                      id: String(item.chapter),
                      verse: String(item.verse),
                    },
                  });
                }}
                style={[
                  styles.juzChip,
                  {
                    backgroundColor: withOpacity(colors.primary, isDark ? 0.25 : 0.1),
                    borderColor: withOpacity(colors.primary, isDark ? 0.45 : 0.22),
                  },
                ]}
              >
                <Text style={[styles.juzChipText, { color: colors.primary }]}>Juz {item.juz}</Text>
              </Pressable>
            ))}
          </View>
        </View>
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
  juzGrid: {
    marginTop: 4,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  juzChip: {
    borderWidth: 1,
    minWidth: "22%",
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
