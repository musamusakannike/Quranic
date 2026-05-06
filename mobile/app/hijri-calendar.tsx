import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import momentHijri from "moment-hijri";
// moment-hijri has a type conflict with the bundled moment types; cast to any to work around it
const moment = momentHijri as any;
import { ChevronLeft, ChevronRight, Dot } from "lucide-react-native";

import { useTheme } from "../lib/ThemeContext";
import { useLanguage } from "../lib/LanguageContext";
import { useAppFonts } from "../lib/i18n/useAppFonts";

const withOpacity = (hexColor: string, opacity: number) => {
  const sanitized = hexColor.replace("#", "");
  const bigint = Number.parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

type DayCell = {
  id: string;
  hijriDay: string;
  gregorianDay: string;
  inCurrentMonth: boolean;
  isToday: boolean;
};

export default function HijriCalendarScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { t, isRTL } = useLanguage();
  const fonts = useAppFonts();

  const [monthCursor, setMonthCursor] = useState(() =>
    moment().startOf("iMonth").format("iYYYY-iMM-iDD"),
  );

  const todayKey = moment().format("iYYYY-iMM-iDD");

  const monthMoment = useMemo(
    () => moment(monthCursor, "iYYYY-iMM-iDD").startOf("iMonth"),
    [monthCursor],
  );

  const headerTitle = useMemo(
    () => monthMoment.format("iMMMM iYYYY"),
    [monthMoment],
  );

  const todayHijriLabel = useMemo(() => moment().format("iD iMMMM iYYYY"), []);
  const todayGregorianLabel = useMemo(
    () => moment().format("dddd, D MMMM YYYY"),
    [],
  );

  // Translated week day abbreviations
  const weekDays = t("hijriCalendar.weekDays") as unknown as string[];

  const dayCells = useMemo<DayCell[]>(() => {
    const start = monthMoment.clone().startOf("iMonth");
    const daysInMonth = start.iDaysInMonth();
    const startWeekday = start.day();
    const cells: DayCell[] = [];

    for (let index = 0; index < 42; index += 1) {
      const offset = index - startWeekday;
      const date = start.clone().add(offset, "day");
      const key = date.format("iYYYY-iMM-iDD");
      cells.push({
        id: `${key}-${index}`,
        hijriDay: date.format("iD"),
        gregorianDay: date.format("D"),
        inCurrentMonth: offset >= 0 && offset < daysInMonth,
        isToday: key === todayKey,
      });
    }

    return cells;
  }, [monthMoment, todayKey]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "left", "right"]}
    >
      <StatusBar style={isDark ? "light" : "dark"} />

      <LinearGradient
        colors={[
          colors.background,
          withOpacity(colors.primary, isDark ? 0.16 : 0.1),
          colors.background,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* ── Header ── */}
      <View style={[styles.headerRow, isRTL && { flexDirection: "row-reverse" }]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.iconButton, { backgroundColor: colors.surface }]}
        >
          <ChevronLeft size={22} color={colors.textMain} />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.textMain, fontFamily: fonts.bold }]}>
            {t("hijriCalendar.title")}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted, fontFamily: fonts.regular }]}>
            {t("hijriCalendar.subtitle")}
          </Text>
        </View>

        <View style={styles.iconButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ── Today card ── */}
        <LinearGradient
          colors={[
            withOpacity(colors.primary, isDark ? 0.22 : 0.12),
            withOpacity(colors.primary, isDark ? 0.14 : 0.06),
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.todayCard,
            { borderColor: withOpacity(colors.primary, isDark ? 0.44 : 0.24) },
          ]}
        >
          <Text style={[styles.todayLabel, { color: colors.primary, fontFamily: fonts.bold }]}>
            {t("hijriCalendar.today")}
          </Text>
          <Text style={[styles.todayHijriText, { color: colors.textMain, fontFamily: fonts.bold }]}>
            {todayHijriLabel}
          </Text>
          <View style={[styles.gregorianWrap, isRTL && { flexDirection: "row-reverse" }]}>
            <Dot size={16} color={colors.textMuted} />
            <Text style={[styles.todayGregorianText, { color: colors.textMuted, fontFamily: fonts.medium }]}>
              {todayGregorianLabel}
            </Text>
          </View>
        </LinearGradient>

        {/* ── Calendar card ── */}
        <View
          style={[
            styles.calendarCard,
            { backgroundColor: colors.surface, borderColor: withOpacity(colors.border, 0.8) },
          ]}
        >
          {/* Month navigation */}
          <View style={[styles.monthNavRow, isRTL && { flexDirection: "row-reverse" }]}>
            <Pressable
              onPress={() =>
                setMonthCursor(
                  monthMoment.clone().subtract(1, "iMonth").format("iYYYY-iMM-iDD"),
                )
              }
              style={[
                styles.monthNavBtn,
                {
                  borderColor: withOpacity(colors.border, 0.8),
                  backgroundColor: withOpacity(colors.background, 0.6),
                },
              ]}
            >
              <ChevronLeft size={18} color={colors.textMain} />
            </Pressable>

            <Text style={[styles.monthTitle, { color: colors.textMain, fontFamily: fonts.bold }]}>
              {headerTitle}
            </Text>

            <Pressable
              onPress={() =>
                setMonthCursor(
                  monthMoment.clone().add(1, "iMonth").format("iYYYY-iMM-iDD"),
                )
              }
              style={[
                styles.monthNavBtn,
                {
                  borderColor: withOpacity(colors.border, 0.8),
                  backgroundColor: withOpacity(colors.background, 0.6),
                },
              ]}
            >
              <ChevronRight size={18} color={colors.textMain} />
            </Pressable>
          </View>

          {/* Week day headers */}
          <View style={[styles.weekHeaderRow, isRTL && { flexDirection: "row-reverse" }]}>
            {weekDays.map((day, i) => (
              <View key={i} style={styles.weekDayWrapper}>
                <Text style={[styles.weekDayLabel, { color: colors.textMuted, fontFamily: fonts.medium }]}>
                  {day}
                </Text>
              </View>
            ))}
          </View>

          {/* Day grid */}
          <View style={styles.grid}>
            {dayCells.map((cell) => {
              const textColor = cell.inCurrentMonth
                ? colors.textMain
                : withOpacity(colors.textMuted, 0.45);

              return (
                <View key={cell.id} style={styles.dayCellWrapper}>
                  <View
                    style={[
                      styles.dayCell,
                      {
                        backgroundColor: cell.isToday
                          ? withOpacity(colors.primary, isDark ? 0.32 : 0.14)
                          : "transparent",
                        borderColor: cell.isToday
                          ? withOpacity(colors.primary, 0.55)
                          : "transparent",
                      },
                    ]}
                  >
                    <Text style={[styles.hijriDayNumber, { color: textColor, fontFamily: fonts.bold }]}>
                      {cell.hijriDay}
                    </Text>
                    <Text
                      style={[
                        styles.gregorianDayNumber,
                        { color: withOpacity(textColor, 0.55), fontFamily: fonts.regular },
                      ]}
                    >
                      {cell.gregorianDay}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  headerTitle: {
    fontSize: 20,
  },
  headerSubtitle: {
    fontSize: 12,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
    gap: 14,
  },
  todayCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 5,
  },
  todayLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  todayHijriText: {
    fontSize: 24,
    letterSpacing: -0.3,
  },
  gregorianWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: -3,
  },
  todayGregorianText: {
    fontSize: 13,
  },
  calendarCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  monthNavRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  monthTitle: {
    fontSize: 19,
    letterSpacing: -0.2,
  },
  monthNavBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  weekHeaderRow: {
    flexDirection: "row",
    paddingTop: 10,
    paddingBottom: 6,
  },
  weekDayWrapper: {
    width: "14.28%",
    alignItems: "center",
  },
  weekDayLabel: {
    fontSize: 13,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 4,
  },
  dayCellWrapper: {
    width: "14.28%",
    alignItems: "center",
    padding: 2,
  },
  dayCell: {
    width: "100%",
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  hijriDayNumber: {
    fontSize: 16,
    lineHeight: 20,
  },
  gregorianDayNumber: {
    fontSize: 10,
    lineHeight: 12,
  },
});
