import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { ArrowUpDown, Search } from "lucide-react-native";

import { useTheme } from "../../lib/ThemeContext";
import { useLanguage } from "../../lib/LanguageContext";
import { useAppFonts } from "../../lib/i18n/useAppFonts";
import { getChapterMetadata, getVersesCount } from "../../lib/QuranHelper";

type FilterType = "all" | "mecca" | "madina";
type SortDirection = "top-to-bottom" | "bottom-to-top";

interface ChapterListItem {
  id: number;
  name: string;
  englishName: string;
  arabicName: string;
  revelation: string;
  versesCount: number;
}

interface ChapterCardProps {
  chapter: ChapterListItem;
  colors: {
    primary: string;
    border: string;
    textMain: string;
    textMuted: string;
    surface: string;
  };
  isDark: boolean;
  isRTL: boolean;
  fonts: ReturnType<typeof useAppFonts>;
  versesLabel: string;
  onPress: (chapterId: number) => void;
}

const withOpacity = (hexColor: string, opacity: number) => {
  const sanitized = hexColor.replace("#", "");
  const bigint = Number.parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

function ChapterCard({
  chapter,
  colors,
  isDark,
  isRTL,
  fonts,
  versesLabel,
  onPress,
}: ChapterCardProps) {
  return (
    <Pressable
      onPress={() => {
        void Haptics.selectionAsync();
        onPress(chapter.id);
      }}
    >
      <LinearGradient
        colors={[
          colors.surface,
          withOpacity(colors.primary, isDark ? 0.08 : 0.04),
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.chapterCard,
          {
            borderColor: colors.border,
            flexDirection: isRTL ? "row-reverse" : "row",
          },
        ]}
      >
        <View
          style={[
            styles.numberBadge,
            {
              backgroundColor: withOpacity(
                colors.primary,
                isDark ? 0.35 : 0.14,
              ),
            },
          ]}
        >
          <Text
            style={[
              styles.numberText,
              { color: colors.primary, fontFamily: fonts.bold },
            ]}
          >
            {chapter.id}
          </Text>
        </View>

        <View style={styles.chapterBody}>
          <Text
            style={[
              styles.chapterEnglishName,
              {
                color: colors.textMain,
                fontFamily: fonts.medium,
                textAlign: isRTL ? "right" : "left",
              },
            ]}
          >
            {chapter.englishName}
          </Text>
          <Text
            style={[
              styles.chapterTranslitName,
              {
                color: colors.textMuted,
                fontFamily: fonts.regular,
                textAlign: isRTL ? "right" : "left",
              },
            ]}
          >
            {chapter.name}
          </Text>
        </View>

        <View
          style={[
            styles.metaColumn,
            isRTL && { alignItems: "flex-start" },
          ]}
        >
          <Text
            style={[styles.chapterArabicName, { color: colors.textMain }]}
          >
            {chapter.arabicName}
          </Text>
          <Text
            style={[
              styles.chapterMeta,
              { color: colors.textMuted, fontFamily: fonts.medium },
            ]}
          >
            {versesLabel} • {chapter.revelation}
          </Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

export default function ChaptersScreen() {
  const { colors, isDark } = useTheme();
  const { t, isRTL } = useLanguage();
  const fonts = useAppFonts();
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sortDirection, setSortDirection] =
    useState<SortDirection>("top-to-bottom");

  const chapters = useMemo(() => {
    const list: ChapterListItem[] = [];
    for (let chapterNumber = 1; chapterNumber <= 114; chapterNumber += 1) {
      const chapterMeta = getChapterMetadata(chapterNumber);
      if (!chapterMeta) continue;
      list.push({
        id: chapterNumber,
        name: chapterMeta.name,
        englishName: chapterMeta.englishname,
        arabicName: chapterMeta.arabicname,
        revelation: chapterMeta.revelation,
        versesCount: getVersesCount(chapterNumber),
      });
    }
    return list;
  }, []);

  const chapterStats = useMemo(() => {
    const mecca = chapters.filter(
      ({ revelation }) => revelation === "Mecca",
    ).length;
    const madina = chapters.filter(
      ({ revelation }) => revelation === "Madina",
    ).length;
    return { total: chapters.length, mecca, madina };
  }, [chapters]);

  const filteredChapters = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();
    return chapters.filter((chapter) => {
      const chapterRevelation = chapter.revelation.toLowerCase();
      const matchesFilter =
        filter === "all" ||
        (filter === "mecca" && chapterRevelation === "mecca") ||
        (filter === "madina" && chapterRevelation === "madina");
      if (!matchesFilter) return false;
      if (!normalizedSearch) return true;
      return (
        chapter.name.toLowerCase().includes(normalizedSearch) ||
        chapter.englishName.toLowerCase().includes(normalizedSearch) ||
        chapter.arabicName.includes(searchValue)
      );
    });
  }, [chapters, filter, searchValue]);

  const displayedChapters = useMemo(() => {
    if (sortDirection === "top-to-bottom") return filteredChapters;
    return [...filteredChapters].reverse();
  }, [filteredChapters, sortDirection]);

  const filterOptions: { key: FilterType; label: string; count: number }[] = [
    { key: "all", label: t("chapters.all"), count: chapterStats.total },
    { key: "mecca", label: t("chapters.mecca"), count: chapterStats.mecca },
    { key: "madina", label: t("chapters.madina"), count: chapterStats.madina },
  ];

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
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

      <FlatList
        data={displayedChapters}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerWrapper}>
            {/* ── Hero card ── */}
            <LinearGradient
              colors={[
                colors.surface,
                withOpacity(colors.primary, isDark ? 0.16 : 0.08),
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.heroCard,
                { borderColor: withOpacity(colors.primary, 0.2) },
              ]}
            >
              <Text
                style={[
                  styles.heroTitle,
                  {
                    color: colors.textMain,
                    fontFamily: fonts.bold,
                    textAlign: isRTL ? "right" : "left",
                  },
                ]}
              >
                {t("chapters.title")}
              </Text>
              <Text
                style={[
                  styles.heroSubtitle,
                  {
                    color: colors.textMuted,
                    fontFamily: fonts.regular,
                    textAlign: isRTL ? "right" : "left",
                  },
                ]}
              >
                {t("chapters.subtitle")}
              </Text>

              <View
                style={[
                  styles.statsRow,
                  isRTL && { flexDirection: "row-reverse" },
                ]}
              >
                <View
                  style={[
                    styles.statPill,
                    {
                      backgroundColor: withOpacity(
                        colors.primary,
                        isDark ? 0.2 : 0.1,
                      ),
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statPillLabel,
                      { color: colors.textMuted, fontFamily: fonts.medium },
                    ]}
                  >
                    {t("chapters.total")}
                  </Text>
                  <Text
                    style={[
                      styles.statPillValue,
                      { color: colors.primary, fontFamily: fonts.bold },
                    ]}
                  >
                    {chapterStats.total}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statPill,
                    {
                      backgroundColor: withOpacity(
                        colors.accent,
                        isDark ? 0.22 : 0.14,
                      ),
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statPillLabel,
                      { color: colors.textMuted, fontFamily: fonts.medium },
                    ]}
                  >
                    {t("chapters.mecca")}
                  </Text>
                  <Text
                    style={[
                      styles.statPillValue,
                      { color: colors.textMain, fontFamily: fonts.bold },
                    ]}
                  >
                    {chapterStats.mecca}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statPill,
                    {
                      backgroundColor: withOpacity(
                        colors.success,
                        isDark ? 0.22 : 0.14,
                      ),
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statPillLabel,
                      { color: colors.textMuted, fontFamily: fonts.medium },
                    ]}
                  >
                    {t("chapters.madina")}
                  </Text>
                  <Text
                    style={[
                      styles.statPillValue,
                      { color: colors.textMain, fontFamily: fonts.bold },
                    ]}
                  >
                    {chapterStats.madina}
                  </Text>
                </View>
              </View>
            </LinearGradient>

            {/* ── Search ── */}
            <View
              style={[
                styles.searchContainer,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  flexDirection: isRTL ? "row-reverse" : "row",
                },
              ]}
            >
              <Search size={18} color={colors.textMuted} strokeWidth={2.5} />
              <TextInput
                value={searchValue}
                onChangeText={setSearchValue}
                placeholder={t("chapters.searchPlaceholder")}
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.searchInput,
                  {
                    color: colors.textMain,
                    fontFamily: fonts.regular,
                    textAlign: isRTL ? "right" : "left",
                  },
                ]}
              />
            </View>

            {/* ── Filters ── */}
            <View
              style={[
                styles.filtersRow,
                isRTL && { flexDirection: "row-reverse" },
              ]}
            >
              {filterOptions.map((option) => {
                const isActive = filter === option.key;
                return (
                  <View key={option.key}>
                    <Pressable
                      onPress={() => {
                        if (!isActive) {
                          void Haptics.selectionAsync();
                          setFilter(option.key);
                        }
                      }}
                      style={[
                        styles.filterChip,
                        {
                          backgroundColor: isActive
                            ? colors.primary
                            : withOpacity(colors.surface, 0.5),
                          borderColor: isActive
                            ? colors.primary
                            : withOpacity(colors.border, 0.8),
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterText,
                          {
                            color: isActive ? "#FFFFFF" : colors.textMain,
                            fontFamily: fonts.medium,
                          },
                        ]}
                      >
                        {option.label} ({option.count})
                      </Text>
                    </Pressable>
                  </View>
                );
              })}

              <View>
                <Pressable
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setSortDirection((prev) =>
                      prev === "top-to-bottom"
                        ? "bottom-to-top"
                        : "top-to-bottom",
                    );
                  }}
                  style={[
                    styles.sortChip,
                    {
                      backgroundColor: withOpacity(colors.surface, 0.5),
                      borderColor: withOpacity(colors.border, 0.8),
                    },
                  ]}
                >
                  <ArrowUpDown
                    size={14}
                    color={colors.textMain}
                    strokeWidth={2.4}
                  />
                </Pressable>
              </View>
            </View>

            {/* ── Result count ── */}
            <Text
              style={[
                styles.resultCount,
                {
                  color: colors.textMuted,
                  fontFamily: fonts.medium,
                  textAlign: isRTL ? "right" : "left",
                },
              ]}
            >
              {t(
                filteredChapters.length === 1
                  ? "chapters.chaptersFound_one"
                  : "chapters.chaptersFound_other",
                { count: filteredChapters.length },
              )}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <ChapterCard
            chapter={item}
            colors={colors}
            isDark={isDark}
            isRTL={isRTL}
            fonts={fonts}
            versesLabel={t(
              item.versesCount === 1
                ? "chapters.verses_one"
                : "chapters.verses_other",
              { count: item.versesCount },
            )}
            onPress={(chapterId) => {
              router.push({
                pathname: "/chapter/[id]",
                params: { id: String(chapterId) },
              });
            }}
          />
        )}
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
    paddingTop: 18,
    paddingBottom: 120,
    gap: 12,
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
    fontSize: 30,
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  statsRow: {
    marginTop: 6,
    flexDirection: "row",
    gap: 8,
  },
  statPill: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 3,
  },
  statPillLabel: {
    fontSize: 12,
  },
  statPillValue: {
    fontSize: 18,
  },
  searchContainer: {
    borderWidth: 1,
    borderRadius: 14,
    minHeight: 52,
    paddingHorizontal: 14,
    alignItems: "center",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  filtersRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  filterChip: {
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  sortChip: {
    marginLeft: "auto",
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  filterText: {
    fontSize: 13,
  },
  resultCount: {
    fontSize: 13,
    marginBottom: 2,
  },
  chapterCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
    gap: 12,
  },
  numberBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  numberText: {
    fontSize: 16,
  },
  chapterBody: {
    flex: 1,
    gap: 2,
  },
  chapterEnglishName: {
    fontSize: 16,
  },
  chapterTranslitName: {
    fontSize: 13,
  },
  metaColumn: {
    alignItems: "flex-end",
    gap: 2,
  },
  chapterArabicName: {
    fontFamily: "AmiriQuran",
    fontSize: 22,
    lineHeight: 40,
    paddingVertical: 2,
  },
  chapterMeta: {
    fontSize: 12,
  },
});
