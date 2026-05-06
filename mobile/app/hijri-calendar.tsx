import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import momentHijri from "moment-hijri";
// moment-hijri has a type conflict with the bundled moment types; cast to any to work around it
const moment = momentHijri as any;
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Star,
  ArrowUpToLine,
} from "lucide-react-native";

import { useTheme } from "../lib/ThemeContext";
import { useLanguage } from "../lib/LanguageContext";
import { useAppFonts } from "../lib/i18n/useAppFonts";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const withOpacity = (hexColor: string, opacity: number) => {
  const sanitized = hexColor.replace("#", "");
  const bigint = Number.parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// ─── Islamic events: { iMonth (1-based), iDay } ──────────────────────────────
// These are fixed Hijri dates for recurring Islamic events.
type IslamicEvent = {
  iMonth: number;
  iDay: number;
  key: string;
  color: string;
};

const ISLAMIC_EVENTS: IslamicEvent[] = [
  { iMonth: 1, iDay: 1, key: "newYear", color: "#D4AF37" },
  { iMonth: 1, iDay: 10, key: "ashura", color: "#8B5CF6" },
  { iMonth: 3, iDay: 12, key: "mawlid", color: "#10B981" },
  { iMonth: 7, iDay: 27, key: "israMiraj", color: "#3B82F6" },
  { iMonth: 8, iDay: 15, key: "shaabanMiddle", color: "#F59E0B" },
  { iMonth: 9, iDay: 1, key: "ramadanStart", color: "#EF4444" },
  { iMonth: 9, iDay: 27, key: "laylatAlQadr", color: "#D4AF37" },
  { iMonth: 10, iDay: 1, key: "eidAlFitr", color: "#10B981" },
  { iMonth: 12, iDay: 9, key: "arafah", color: "#F59E0B" },
  { iMonth: 12, iDay: 10, key: "eidAlAdha", color: "#10B981" },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type DayCell =
  | { type: "empty"; id: string }
  | {
      type: "day";
      id: string;
      hijriDay: number;
      gregorianDay: string;
      gregorianMonth: string;
      inCurrentMonth: boolean;
      isToday: boolean;
      isFriday: boolean;
      events: IslamicEvent[];
      dateKey: string; // "iYYYY-iMM-iDD"
    };

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HijriCalendarScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { t, isRTL } = useLanguage();
  const fonts = useAppFonts();

  // monthCursor stores the first day of the displayed Hijri month
  const [monthCursor, setMonthCursor] = useState(() =>
    moment().startOf("iMonth").format("iYYYY-iMM-iDD"),
  );

  // Selected day key for detail panel
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const todayKey = useMemo(() => moment().format("iYYYY-iMM-iDD"), []);

  const monthMoment = useMemo(
    () => moment(monthCursor, "iYYYY-iMM-iDD").startOf("iMonth"),
    [monthCursor],
  );

  // Hijri month name + year
  const headerTitle = useMemo(
    () => monthMoment.format("iMMMM iYYYY"),
    [monthMoment],
  );

  // Gregorian month + year for the same period
  const gregorianMonthLabel = useMemo(
    () => monthMoment.format("MMMM YYYY"),
    [monthMoment],
  );

  const todayHijriLabel = useMemo(() => moment().format("iD iMMMM iYYYY"), []);
  const todayGregorianLabel = useMemo(
    () => moment().format("dddd, D MMMM YYYY"),
    [],
  );

  // Translated week day abbreviations
  const weekDays = t("hijriCalendar.weekDays") as unknown as string[];

  // ── Build day cells ──────────────────────────────────────────────────────
  // We produce exactly 7 * rows cells: leading empty cells + actual days.
  const { dayCells, currentMonthEvents } = useMemo(() => {
    const start = monthMoment.clone().startOf("iMonth");
    const daysInMonth: number = start.iDaysInMonth();
    const startWeekday: number = start.day(); // 0 = Sunday
    const currentIMonth: number = start.iMonth() + 1; // moment-hijri is 0-based

    const cells: DayCell[] = [];

    // Leading empty cells so day 1 lands under the correct weekday header
    for (let e = 0; e < startWeekday; e++) {
      cells.push({ type: "empty", id: `empty-${e}` });
    }

    // Actual day cells
    for (let d = 1; d <= daysInMonth; d++) {
      const date = start.clone().add(d - 1, "day");
      const key = date.format("iYYYY-iMM-iDD");
      const iMonth: number = date.iMonth() + 1;
      const iDay: number = date.iDate();
      const weekday: number = date.day(); // 0=Sun … 6=Sat

      const events = ISLAMIC_EVENTS.filter(
        (ev) => ev.iMonth === iMonth && ev.iDay === iDay,
      );

      cells.push({
        type: "day",
        id: key,
        hijriDay: iDay,
        gregorianDay: date.format("D"),
        gregorianMonth: date.format("MMM"),
        inCurrentMonth: iMonth === currentIMonth,
        isToday: key === todayKey,
        isFriday: weekday === 5,
        events,
        dateKey: key,
      });
    }

    // Pad to complete the last row (multiple of 7)
    while (cells.length % 7 !== 0) {
      cells.push({ type: "empty", id: `empty-trail-${cells.length}` });
    }

    // Events in this month for the events list
    const monthEvents = ISLAMIC_EVENTS.filter(
      (ev) => ev.iMonth === currentIMonth,
    );

    return { dayCells: cells, currentMonthEvents: monthEvents };
  }, [monthMoment, todayKey]);

  // ── Selected day details ─────────────────────────────────────────────────
  const selectedCell = useMemo(() => {
    if (!selectedKey) return null;
    return dayCells.find(
      (c) => c.type === "day" && c.dateKey === selectedKey,
    ) as Extract<DayCell, { type: "day" }> | undefined;
  }, [selectedKey, dayCells]);

  const selectedMoment = useMemo(() => {
    if (!selectedKey) return null;
    return moment(selectedKey, "iYYYY-iMM-iDD");
  }, [selectedKey]);

  // ── Navigation helpers ───────────────────────────────────────────────────
  const goToPrevMonth = () =>
    setMonthCursor(
      monthMoment.clone().subtract(1, "iMonth").format("iYYYY-iMM-iDD"),
    );

  const goToNextMonth = () =>
    setMonthCursor(
      monthMoment.clone().add(1, "iMonth").format("iYYYY-iMM-iDD"),
    );

  const jumpToToday = () => {
    setMonthCursor(moment().startOf("iMonth").format("iYYYY-iMM-iDD"));
    setSelectedKey(todayKey);
  };

  const isCurrentMonth =
    monthMoment.format("iYYYY-iMM") === moment().format("iYYYY-iMM");

  // ── Render ───────────────────────────────────────────────────────────────
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
      <View
        style={[
          styles.headerRow,
          isRTL && { flexDirection: "row-reverse" },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={[styles.iconButton, { backgroundColor: colors.surface }]}
        >
          <ChevronLeft size={22} color={colors.textMain} />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text
            style={[
              styles.headerTitle,
              { color: colors.textMain, fontFamily: fonts.bold },
            ]}
          >
            {t("hijriCalendar.title")}
          </Text>
          <Text
            style={[
              styles.headerSubtitle,
              { color: colors.textMuted, fontFamily: fonts.regular },
            ]}
          >
            {t("hijriCalendar.subtitle")}
          </Text>
        </View>

        {/* Jump-to-today button — only visible when not on current month */}
        {!isCurrentMonth ? (
          <Pressable
            onPress={jumpToToday}
            style={[
              styles.iconButton,
              {
                backgroundColor: withOpacity(colors.primary, 0.15),
                borderWidth: 1,
                borderColor: withOpacity(colors.primary, 0.35),
              },
            ]}
          >
            <ArrowUpToLine size={18} color={colors.primary} />
          </Pressable>
        ) : (
          <View style={styles.iconButton} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
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
            {
              borderColor: withOpacity(
                colors.primary,
                isDark ? 0.44 : 0.24,
              ),
            },
          ]}
        >
          <View
            style={[
              styles.todayCardRow,
              isRTL && { flexDirection: "row-reverse" },
            ]}
          >
            <View style={styles.todayCardLeft}>
              <Text
                style={[
                  styles.todayLabel,
                  { color: colors.primary, fontFamily: fonts.bold },
                ]}
              >
                {t("hijriCalendar.today")}
              </Text>
              <Text
                style={[
                  styles.todayHijriText,
                  { color: colors.textMain, fontFamily: fonts.bold },
                ]}
              >
                {todayHijriLabel}
              </Text>
              <Text
                style={[
                  styles.todayGregorianText,
                  { color: colors.textMuted, fontFamily: fonts.medium },
                ]}
              >
                {todayGregorianLabel}
              </Text>
            </View>

            <View
              style={[
                styles.todayIconWrap,
                {
                  backgroundColor: withOpacity(
                    colors.primary,
                    isDark ? 0.25 : 0.12,
                  ),
                },
              ]}
            >
              <CalendarDays size={28} color={colors.primary} />
            </View>
          </View>
        </LinearGradient>

        {/* ── Calendar card ── */}
        <View
          style={[
            styles.calendarCard,
            {
              backgroundColor: colors.surface,
              borderColor: withOpacity(colors.border, 0.8),
            },
          ]}
        >
          {/* Month navigation */}
          <View
            style={[
              styles.monthNavRow,
              isRTL && { flexDirection: "row-reverse" },
            ]}
          >
            <Pressable
              onPress={goToPrevMonth}
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

            <View style={styles.monthTitleBlock}>
              <Text
                style={[
                  styles.monthTitle,
                  { color: colors.textMain, fontFamily: fonts.bold },
                ]}
              >
                {headerTitle}
              </Text>
              <Text
                style={[
                  styles.monthSubtitle,
                  { color: colors.textMuted, fontFamily: fonts.regular },
                ]}
              >
                {gregorianMonthLabel}
              </Text>
            </View>

            <Pressable
              onPress={goToNextMonth}
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

          {/* Divider */}
          <View
            style={[
              styles.divider,
              { backgroundColor: withOpacity(colors.border, 0.6) },
            ]}
          />

          {/* Week day headers */}
          <View
            style={[
              styles.weekHeaderRow,
              isRTL && { flexDirection: "row-reverse" },
            ]}
          >
            {weekDays.map((day, i) => {
              const isFri = i === 5;
              return (
                <View key={i} style={styles.weekDayWrapper}>
                  <Text
                    style={[
                      styles.weekDayLabel,
                      {
                        color: isFri ? colors.primary : colors.textMuted,
                        fontFamily: fonts.medium,
                      },
                    ]}
                  >
                    {day}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Day grid — rows of 7 */}
          {Array.from({ length: dayCells.length / 7 }).map((_, rowIdx) => (
            <View
              key={rowIdx}
              style={[
                styles.gridRow,
                isRTL && { flexDirection: "row-reverse" },
              ]}
            >
              {dayCells.slice(rowIdx * 7, rowIdx * 7 + 7).map((cell) => {
                if (cell.type === "empty") {
                  return <View key={cell.id} style={styles.dayCellWrapper} />;
                }

                const isSelected = cell.dateKey === selectedKey;
                const textColor = cell.inCurrentMonth
                  ? cell.isFriday
                    ? colors.primary
                    : colors.textMain
                  : withOpacity(colors.textMuted, 0.35);

                let cellBg = "transparent";
                let cellBorder = "transparent";

                if (isSelected) {
                  cellBg = withOpacity(colors.primary, isDark ? 0.45 : 0.18);
                  cellBorder = colors.primary;
                } else if (cell.isToday) {
                  cellBg = withOpacity(
                    colors.primary,
                    isDark ? 0.28 : 0.12,
                  );
                  cellBorder = withOpacity(colors.primary, 0.55);
                }

                return (
                  <Pressable
                    key={cell.id}
                    style={styles.dayCellWrapper}
                    onPress={() =>
                      setSelectedKey(
                        isSelected ? null : cell.dateKey,
                      )
                    }
                  >
                    <View
                      style={[
                        styles.dayCell,
                        {
                          backgroundColor: cellBg,
                          borderColor: cellBorder,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.hijriDayNumber,
                          {
                            color: isSelected
                              ? colors.primary
                              : textColor,
                            fontFamily: fonts.bold,
                          },
                        ]}
                      >
                        {cell.hijriDay}
                      </Text>
                      <Text
                        style={[
                          styles.gregorianDayNumber,
                          {
                            color: withOpacity(
                              isSelected ? colors.primary : textColor,
                              0.6,
                            ),
                            fontFamily: fonts.regular,
                          },
                        ]}
                      >
                        {cell.gregorianDay}
                      </Text>

                      {/* Event dots */}
                      {cell.events.length > 0 && (
                        <View style={styles.eventDotsRow}>
                          {cell.events.slice(0, 3).map((ev) => (
                            <View
                              key={ev.key}
                              style={[
                                styles.eventDot,
                                { backgroundColor: ev.color },
                              ]}
                            />
                          ))}
                        </View>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        {/* ── Selected day detail panel ── */}
        {selectedCell && selectedMoment && (
          <View
            style={[
              styles.detailCard,
              {
                backgroundColor: colors.surface,
                borderColor: withOpacity(colors.primary, 0.35),
              },
            ]}
          >
            <View
              style={[
                styles.detailHeader,
                isRTL && { flexDirection: "row-reverse" },
              ]}
            >
              <Text
                style={[
                  styles.detailTitle,
                  { color: colors.primary, fontFamily: fonts.bold },
                ]}
              >
                {t("hijriCalendar.selectedDate")}
              </Text>
              {selectedCell.isToday && (
                <View
                  style={[
                    styles.todayBadge,
                    {
                      backgroundColor: withOpacity(
                        colors.primary,
                        0.15,
                      ),
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.todayBadgeText,
                      { color: colors.primary, fontFamily: fonts.bold },
                    ]}
                  >
                    {t("hijriCalendar.today")}
                  </Text>
                </View>
              )}
            </View>

            <View
              style={[
                styles.detailDatesRow,
                isRTL && { flexDirection: "row-reverse" },
              ]}
            >
              {/* Hijri date */}
              <View
                style={[
                  styles.detailDateBlock,
                  {
                    backgroundColor: withOpacity(
                      colors.primary,
                      isDark ? 0.14 : 0.07,
                    ),
                    borderColor: withOpacity(colors.primary, 0.2),
                  },
                ]}
              >
                <Text
                  style={[
                    styles.detailDateLabel,
                    { color: colors.textMuted, fontFamily: fonts.medium },
                  ]}
                >
                  {t("hijriCalendar.hijriDate")}
                </Text>
                <Text
                  style={[
                    styles.detailDateValue,
                    { color: colors.textMain, fontFamily: fonts.bold },
                  ]}
                >
                  {selectedMoment.format("iD iMMMM iYYYY")}
                </Text>
              </View>

              {/* Gregorian date */}
              <View
                style={[
                  styles.detailDateBlock,
                  {
                    backgroundColor: withOpacity(
                      colors.border,
                      isDark ? 0.3 : 0.15,
                    ),
                    borderColor: withOpacity(colors.border, 0.5),
                  },
                ]}
              >
                <Text
                  style={[
                    styles.detailDateLabel,
                    { color: colors.textMuted, fontFamily: fonts.medium },
                  ]}
                >
                  {t("hijriCalendar.gregorianDate")}
                </Text>
                <Text
                  style={[
                    styles.detailDateValue,
                    { color: colors.textMain, fontFamily: fonts.bold },
                  ]}
                >
                  {selectedMoment.format("D MMMM YYYY")}
                </Text>
              </View>
            </View>

            {/* Events on this day */}
            {selectedCell.events.length > 0 && (
              <View style={styles.detailEventsWrap}>
                {selectedCell.events.map((ev) => (
                  <View
                    key={ev.key}
                    style={[
                      styles.detailEventRow,
                      isRTL && { flexDirection: "row-reverse" },
                      { borderColor: withOpacity(ev.color, 0.35) },
                    ]}
                  >
                    <View
                      style={[
                        styles.detailEventDot,
                        { backgroundColor: ev.color },
                      ]}
                    />
                    <Text
                      style={[
                        styles.detailEventText,
                        { color: colors.textMain, fontFamily: fonts.medium },
                      ]}
                    >
                      {t(`hijriCalendar.events.${ev.key}`)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ── Islamic events this month ── */}
        <View
          style={[
            styles.eventsCard,
            {
              backgroundColor: colors.surface,
              borderColor: withOpacity(colors.border, 0.8),
            },
          ]}
        >
          <View
            style={[
              styles.eventsCardHeader,
              isRTL && { flexDirection: "row-reverse" },
            ]}
          >
            <Star
              size={16}
              color={colors.accent ?? "#D4AF37"}
              fill={colors.accent ?? "#D4AF37"}
            />
            <Text
              style={[
                styles.eventsCardTitle,
                { color: colors.textMain, fontFamily: fonts.bold },
              ]}
            >
              {t("hijriCalendar.islamicEvents")}
            </Text>
          </View>

          {currentMonthEvents.length === 0 ? (
            <Text
              style={[
                styles.noEventsText,
                { color: colors.textMuted, fontFamily: fonts.regular },
              ]}
            >
              {t("hijriCalendar.noEventsThisMonth")}
            </Text>
          ) : (
            currentMonthEvents.map((ev) => (
              <Pressable
                key={ev.key}
                onPress={() => {
                  // Find the cell for this event and select it
                  const cell = dayCells.find(
                    (c) =>
                      c.type === "day" &&
                      c.events.some((e) => e.key === ev.key),
                  ) as Extract<DayCell, { type: "day" }> | undefined;
                  if (cell) setSelectedKey(cell.dateKey);
                }}
                style={[
                  styles.eventListRow,
                  isRTL && { flexDirection: "row-reverse" },
                  { borderColor: withOpacity(colors.border, 0.5) },
                ]}
              >
                <View
                  style={[
                    styles.eventListDotWrap,
                    { backgroundColor: withOpacity(ev.color, 0.15) },
                  ]}
                >
                  <View
                    style={[
                      styles.eventListDot,
                      { backgroundColor: ev.color },
                    ]}
                  />
                </View>
                <View style={styles.eventListTextWrap}>
                  <Text
                    style={[
                      styles.eventListName,
                      { color: colors.textMain, fontFamily: fonts.medium },
                    ]}
                  >
                    {t(`hijriCalendar.events.${ev.key}`)}
                  </Text>
                  <Text
                    style={[
                      styles.eventListDate,
                      { color: colors.textMuted, fontFamily: fonts.regular },
                    ]}
                  >
                    {`${ev.iDay} ${monthMoment.format("iMMMM iYYYY")}`}
                  </Text>
                </View>
                <ChevronRight size={14} color={colors.textMuted} />
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
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

  // Scroll content
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 36,
    gap: 14,
  },

  // Today card
  todayCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  todayCardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  todayCardLeft: {
    flex: 1,
    gap: 4,
  },
  todayLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  todayHijriText: {
    fontSize: 22,
    letterSpacing: -0.3,
  },
  todayGregorianText: {
    fontSize: 13,
  },
  todayIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },

  // Calendar card
  calendarCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 0,
  },
  monthNavRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  monthTitleBlock: {
    alignItems: "center",
    gap: 2,
  },
  monthTitle: {
    fontSize: 18,
    letterSpacing: -0.2,
  },
  monthSubtitle: {
    fontSize: 12,
  },
  monthNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    height: 1,
    marginVertical: 10,
    marginHorizontal: 4,
  },
  weekHeaderRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  weekDayWrapper: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 4,
  },
  weekDayLabel: {
    fontSize: 12,
  },

  // Grid
  gridRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  dayCellWrapper: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 1,
  },
  dayCell: {
    width: "100%",
    minHeight: 54,
    borderRadius: 13,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    gap: 1,
  },
  hijriDayNumber: {
    fontSize: 15,
    lineHeight: 19,
  },
  gregorianDayNumber: {
    fontSize: 10,
    lineHeight: 13,
  },
  eventDotsRow: {
    flexDirection: "row",
    gap: 2,
    marginTop: 2,
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },

  // Selected day detail card
  detailCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 14,
    gap: 12,
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailTitle: {
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  todayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  todayBadgeText: {
    fontSize: 11,
  },
  detailDatesRow: {
    flexDirection: "row",
    gap: 10,
  },
  detailDateBlock: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    gap: 3,
  },
  detailDateLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailDateValue: {
    fontSize: 14,
    lineHeight: 20,
  },
  detailEventsWrap: {
    gap: 6,
  },
  detailEventRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  detailEventDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  detailEventText: {
    fontSize: 14,
    flex: 1,
  },

  // Events list card
  eventsCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  eventsCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 2,
  },
  eventsCardTitle: {
    fontSize: 15,
  },
  noEventsText: {
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 8,
  },
  eventListRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  eventListDotWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  eventListDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  eventListTextWrap: {
    flex: 1,
    gap: 2,
  },
  eventListName: {
    fontSize: 14,
  },
  eventListDate: {
    fontSize: 12,
  },
});
