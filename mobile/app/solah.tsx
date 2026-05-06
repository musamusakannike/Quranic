import React, { useState, useEffect, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Pressable,
  Alert,
  Switch,
  ScrollView,
  ImageBackground,
  Platform,
} from "react-native";
import * as Location from "expo-location";
import { ChevronLeft, Bell, BellOff, Clock3 } from "lucide-react-native";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../lib/ThemeContext";
import { useLanguage } from "../lib/LanguageContext";
import { useAppFonts } from "../lib/i18n/useAppFonts";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import {
  getPrayerTimes,
  getNextPrayer,
  formatPrayerTime,
  PrayerKey,
  PrayerListKey,
  getRandomNotificationExtra,
} from "../lib/SolahHelper";

// ── Types ────────────────────────────────────────────────────────────────────

/** Minutes before prayer time to fire the advance notification. 0 = off. */
export type AdvanceMinutes = 0 | 5 | 10 | 15 | 30;

type ReminderItem = {
  enabled: boolean;
  /** ID of the at-time notification */
  notificationId: string | null;
  /** ID of the advance notification (null when advanceMinutes === 0) */
  advanceNotificationId: string | null;
  advanceMinutes: AdvanceMinutes;
};

type PrayerReminderMap = Record<PrayerKey, ReminderItem>;
type PrayerTimesMap = Record<PrayerListKey, Date>;

// ── Constants ────────────────────────────────────────────────────────────────

const REMINDER_STORAGE_KEY = "@solah_daily_reminders_v2";

const ADVANCE_OPTIONS: AdvanceMinutes[] = [0, 5, 10, 15, 30];

const REMINDABLE_PRAYERS: PrayerKey[] = [
  "fajr",
  "dhuhr",
  "asr",
  "maghrib",
  "isha",
];

const DEFAULT_REMINDER_ITEM: ReminderItem = {
  enabled: false,
  notificationId: null,
  advanceNotificationId: null,
  advanceMinutes: 0,
};

const DEFAULT_REMINDERS: PrayerReminderMap = {
  fajr: { ...DEFAULT_REMINDER_ITEM },
  dhuhr: { ...DEFAULT_REMINDER_ITEM },
  asr: { ...DEFAULT_REMINDER_ITEM },
  maghrib: { ...DEFAULT_REMINDER_ITEM },
  isha: { ...DEFAULT_REMINDER_ITEM },
};

// ── Storage helpers ──────────────────────────────────────────────────────────

const parseStoredReminders = (raw: string | null): PrayerReminderMap => {
  if (!raw) return DEFAULT_REMINDERS;
  try {
    const parsed = JSON.parse(raw) as Partial<Record<PrayerKey, Partial<ReminderItem>>>;
    const build = (key: PrayerKey): ReminderItem => ({
      enabled: parsed[key]?.enabled ?? false,
      notificationId: parsed[key]?.notificationId ?? null,
      advanceNotificationId: parsed[key]?.advanceNotificationId ?? null,
      advanceMinutes: (parsed[key]?.advanceMinutes as AdvanceMinutes) ?? 0,
    });
    return {
      fajr: build("fajr"),
      dhuhr: build("dhuhr"),
      asr: build("asr"),
      maghrib: build("maghrib"),
      isha: build("isha"),
    };
  } catch {
    return DEFAULT_REMINDERS;
  }
};

const saveReminders = async (reminders: PrayerReminderMap) => {
  await AsyncStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(reminders));
};

// ── Notification helpers ─────────────────────────────────────────────────────

const requestNotificationPermission = async () => {
  const existing = await Notifications.getPermissionsAsync();
  if (
    existing.granted ||
    existing.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  ) {
    return true;
  }
  const requested = await Notifications.requestPermissionsAsync();
  return (
    requested.granted ||
    requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
};

/** Resolves the correct channel id based on platform. */
const adhanChannelId = () =>
  Platform.OS === "android" ? "adhan-reminders" : undefined;

const scheduleAtTimePrayerNotification = async (
  label: string,
  prayerTime: Date,
): Promise<string> => {
  return Notifications.scheduleNotificationAsync({
    content: {
      title: `${label} — Time to Pray 🕌`,
      body: `It's time for ${label} prayer.\n${getRandomNotificationExtra()}`,
      sound: Platform.OS === "ios" ? "azan.wav" : undefined,
      data: { screen: "solah" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      channelId: adhanChannelId(),
      hour: prayerTime.getHours(),
      minute: prayerTime.getMinutes(),
    } as Notifications.NotificationTriggerInput,
  });
};

const scheduleAdvancePrayerNotification = async (
  label: string,
  prayerTime: Date,
  advanceMinutes: AdvanceMinutes,
): Promise<string> => {
  const advanceTime = new Date(prayerTime.getTime() - advanceMinutes * 60 * 1000);
  return Notifications.scheduleNotificationAsync({
    content: {
      title: `${label} prayer in ${advanceMinutes} minutes ⏳`,
      body: `Prepare for ${label} — time to make wudu.\n${getRandomNotificationExtra()}`,
      sound: true,
      data: { screen: "solah" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      channelId: Platform.OS === "android" ? "daily-reminders" : undefined,
      hour: advanceTime.getHours(),
      minute: advanceTime.getMinutes(),
    } as Notifications.NotificationTriggerInput,
  });
};

const cancelIfExists = async (id: string | null) => {
  if (id) await Notifications.cancelScheduledNotificationAsync(id);
};

// ── Utility ──────────────────────────────────────────────────────────────────

const withOpacity = (hexColor: string, opacity: number) => {
  const sanitized = hexColor.replace("#", "");
  const bigint = Number.parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// ── Component ────────────────────────────────────────────────────────────────

export default function SolahTimesScreen() {
  const { colors, isDark } = useTheme();
  const { t, isRTL } = useLanguage();
  const fonts = useAppFonts();
  const router = useRouter();

  const [prayerTimes, setPrayerTimes] = useState<PrayerTimesMap | null>(null);
  const [nextPrayer, setNextPrayer] = useState<{
    key: PrayerKey;
    label: string;
    time: Date;
  } | null>(null);
  const [reminders, setReminders] = useState<PrayerReminderMap>(DEFAULT_REMINDERS);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [busyPrayer, setBusyPrayer] = useState<PrayerKey | null>(null);
  /** Which prayer's advance-picker is currently expanded */
  const [expandedAdvance, setExpandedAdvance] = useState<PrayerKey | null>(null);

  // Build translated prayer rows (stable reference via useMemo)
  const PRAYER_ROWS = useMemo(
    () => [
      { key: "fajr" as PrayerListKey, label: t("solah.fajr"), remindable: true },
      { key: "sunrise" as PrayerListKey, label: t("solah.sunrise"), remindable: false },
      { key: "dhuhr" as PrayerListKey, label: t("solah.dhuhr"), remindable: true },
      { key: "asr" as PrayerListKey, label: t("solah.asr"), remindable: true },
      { key: "maghrib" as PrayerListKey, label: t("solah.maghrib"), remindable: true },
      { key: "isha" as PrayerListKey, label: t("solah.isha"), remindable: true },
    ],
    [t],
  );

  const activeReminderCount = useMemo(
    () => REMINDABLE_PRAYERS.filter((key) => reminders[key].enabled).length,
    [reminders],
  );

  // Load persisted reminders
  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(REMINDER_STORAGE_KEY);
        setReminders(parseStoredReminders(raw));
      } catch {
        setReminders(DEFAULT_REMINDERS);
      }
    };
    void load();
  }, []);

  // Fetch location + prayer times
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg(t("solah.locationDenied"));
        return;
      }
      try {
        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
        setPrayerTimes(getPrayerTimes(latitude, longitude));
        setNextPrayer(getNextPrayer(latitude, longitude));
      } catch {
        setErrorMsg(t("solah.locationError"));
      }
    })();
  }, [t]);

  // ── Toggle main reminder on/off ──────────────────────────────────────────

  const togglePrayerReminder = async (prayerKey: PrayerKey, nextEnabled: boolean) => {
    if (!prayerTimes) return;
    setBusyPrayer(prayerKey);
    void Haptics.selectionAsync();

    try {
      const current = reminders[prayerKey];

      if (!nextEnabled) {
        await cancelIfExists(current.notificationId);
        await cancelIfExists(current.advanceNotificationId);
        const nextState: PrayerReminderMap = {
          ...reminders,
          [prayerKey]: { ...DEFAULT_REMINDER_ITEM },
        };
        setReminders(nextState);
        setExpandedAdvance(null);
        await saveReminders(nextState);
        return;
      }

      const permissionGranted = await requestNotificationPermission();
      if (!permissionGranted) {
        Alert.alert(t("settings.permissionRequired"), t("solah.notificationPermission"));
        return;
      }

      await cancelIfExists(current.notificationId);
      await cancelIfExists(current.advanceNotificationId);

      const prayerTime = prayerTimes[prayerKey];
      const label = PRAYER_ROWS.find((r) => r.key === prayerKey)?.label ?? "Salah";

      const notificationId = await scheduleAtTimePrayerNotification(label, prayerTime);

      // Keep existing advance setting when re-enabling
      const advanceMinutes = current.advanceMinutes;
      let advanceNotificationId: string | null = null;
      if (advanceMinutes > 0) {
        advanceNotificationId = await scheduleAdvancePrayerNotification(
          label,
          prayerTime,
          advanceMinutes,
        );
      }

      const nextState: PrayerReminderMap = {
        ...reminders,
        [prayerKey]: { enabled: true, notificationId, advanceNotificationId, advanceMinutes },
      };
      setReminders(nextState);
      await saveReminders(nextState);
    } catch {
      Alert.alert(t("solah.error"), t("solah.reminderError"));
    } finally {
      setBusyPrayer(null);
    }
  };

  // ── Change advance minutes for a prayer ─────────────────────────────────

  const setAdvanceMinutes = async (prayerKey: PrayerKey, minutes: AdvanceMinutes) => {
    if (!prayerTimes) return;
    setBusyPrayer(prayerKey);
    void Haptics.selectionAsync();

    try {
      const current = reminders[prayerKey];
      await cancelIfExists(current.advanceNotificationId);

      let advanceNotificationId: string | null = null;

      if (current.enabled && minutes > 0) {
        const prayerTime = prayerTimes[prayerKey];
        const label = PRAYER_ROWS.find((r) => r.key === prayerKey)?.label ?? "Salah";
        advanceNotificationId = await scheduleAdvancePrayerNotification(
          label,
          prayerTime,
          minutes,
        );
      }

      const nextState: PrayerReminderMap = {
        ...reminders,
        [prayerKey]: { ...current, advanceMinutes: minutes, advanceNotificationId },
      };
      setReminders(nextState);
      await saveReminders(nextState);
    } catch {
      Alert.alert(t("solah.error"), t("solah.reminderError"));
    } finally {
      setBusyPrayer(null);
    }
  };

  const reminderSummaryText =
    activeReminderCount === 0
      ? t("solah.noReminders")
      : t(
          activeReminderCount === 1
            ? "solah.remindersActive_one"
            : "solah.remindersActive_other",
          { count: activeReminderCount },
        );

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
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

      {/* ── Header ── */}
      <View style={[styles.header, isRTL && { flexDirection: "row-reverse" }]}>
        <Pressable
          style={[styles.backBtn, { backgroundColor: colors.surface }]}
          onPress={() => router.back()}
        >
          <ChevronLeft color={colors.textMain} size={24} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textMain, fontFamily: fonts.bold }]}>
          {t("solah.title")}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {errorMsg ? (
          <View style={styles.center}>
            <Text style={[styles.errorText, { color: colors.textMuted, fontFamily: fonts.medium }]}>
              {errorMsg}
            </Text>
          </View>
        ) : !prayerTimes ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textMuted, fontFamily: fonts.medium }]}>
              {t("solah.calculating")}
            </Text>
          </View>
        ) : (
          <View style={styles.timesContainer}>

            {/* ── Next prayer hero card ── */}
            {nextPrayer ? (
              <ImageBackground
                source={require("../assets/images/solah-sajda.webp")}
                style={styles.nextPrayerBackground}
                imageStyle={{ borderRadius: 18 }}
              >
                <View style={styles.nextPrayerOverlay}>
                  <Text style={[styles.nextPrayerLabel, { fontFamily: fonts.medium }]}>
                    {t("solah.nextPrayer")}
                  </Text>
                  <View style={[styles.nextPrayerRow, isRTL && { flexDirection: "row-reverse" }]}>
                    <Text style={[styles.nextPrayerName, { fontFamily: fonts.bold }]}>
                      {nextPrayer.label}
                    </Text>
                    <Text style={[styles.nextPrayerTime, { fontFamily: fonts.bold }]}>
                      {formatPrayerTime(nextPrayer.time)}
                    </Text>
                  </View>
                </View>
              </ImageBackground>
            ) : null}

            {/* ── Reminder summary pill ── */}
            <View
              style={[
                styles.summaryCard,
                { backgroundColor: colors.surface, borderColor: withOpacity(colors.border, 0.6) },
              ]}
            >
              <View style={[styles.summaryTopRow, isRTL && { flexDirection: "row-reverse" }]}>
                <Bell size={18} color={colors.primary} />
                <Text style={[styles.summaryTitle, { color: colors.textMain, fontFamily: fonts.bold }]}>
                  {t("solah.reminders")}
                </Text>
              </View>
              <Text
                style={[
                  styles.summaryText,
                  { color: colors.textMuted, fontFamily: fonts.medium, textAlign: isRTL ? "right" : "left" },
                ]}
              >
                {reminderSummaryText}
              </Text>
            </View>

            {/* ── Prayer times card ── */}
            <View
              style={[
                styles.timesCard,
                { backgroundColor: colors.surface, borderColor: withOpacity(colors.border, 0.5) },
              ]}
            >
              <Text
                style={[
                  styles.cardTitle,
                  { color: colors.textMain, fontFamily: fonts.bold, textAlign: isRTL ? "right" : "left" },
                ]}
              >
                {t("solah.todayTimes")}
              </Text>
              <Text
                style={[
                  styles.cardSubtitle,
                  { color: colors.textMuted, fontFamily: fonts.regular, textAlign: isRTL ? "right" : "left" },
                ]}
              >
                {t("solah.todayTimesSubtitle")}
              </Text>

              {PRAYER_ROWS.map((row, index) => {
                const isLast = index === PRAYER_ROWS.length - 1;
                const isBusy = row.remindable && busyPrayer === row.key;
                const prayerKey = row.key as PrayerKey;
                const reminder = row.remindable ? reminders[prayerKey] : null;
                const isEnabled = reminder?.enabled ?? false;
                const isAdvanceExpanded = expandedAdvance === prayerKey;
                const currentAdvance = reminder?.advanceMinutes ?? 0;

                return (
                  <View
                    key={row.key}
                    style={[
                      styles.prayerBlock,
                      { borderBottomWidth: isLast ? 0 : 1, borderBottomColor: withOpacity(colors.border, 0.25) },
                    ]}
                  >
                    {/* Main row */}
                    <View style={[styles.prayerRow, isRTL && { flexDirection: "row-reverse" }]}>
                      <View style={isRTL ? { alignItems: "flex-end" } : undefined}>
                        <Text style={[styles.prayerName, { color: colors.textMain, fontFamily: fonts.bold }]}>
                          {row.label}
                        </Text>
                        <Text style={[styles.prayerTime, { color: colors.textMuted, fontFamily: fonts.regular }]}>
                          {formatPrayerTime(prayerTimes[row.key])}
                        </Text>
                      </View>

                      {row.remindable ? (
                        <View style={[styles.prayerControls, isRTL && { flexDirection: "row-reverse" }]}>
                          {/* Advance reminder chip — only visible when enabled */}
                          {isEnabled && !isBusy && (
                            <Pressable
                              onPress={() => {
                                void Haptics.selectionAsync();
                                setExpandedAdvance(isAdvanceExpanded ? null : prayerKey);
                              }}
                              style={[
                                styles.advanceChip,
                                {
                                  backgroundColor: isAdvanceExpanded
                                    ? withOpacity(colors.primary, 0.18)
                                    : withOpacity(colors.border, isDark ? 0.3 : 0.15),
                                  borderColor: isAdvanceExpanded
                                    ? withOpacity(colors.primary, 0.5)
                                    : withOpacity(colors.border, 0.4),
                                },
                              ]}
                            >
                              <Clock3
                                size={12}
                                color={isAdvanceExpanded ? colors.primary : colors.textMuted}
                              />
                              <Text
                                style={[
                                  styles.advanceChipText,
                                  {
                                    color: isAdvanceExpanded ? colors.primary : colors.textMuted,
                                    fontFamily: fonts.medium,
                                  },
                                ]}
                              >
                                {currentAdvance === 0
                                  ? t("solah.advanceOff")
                                  : t("solah.advanceMin", { count: currentAdvance })}
                              </Text>
                            </Pressable>
                          )}

                          {isBusy ? (
                            <ActivityIndicator color={colors.primary} />
                          ) : (
                            <Switch
                              value={isEnabled}
                              onValueChange={(next) => {
                                void togglePrayerReminder(prayerKey, next);
                              }}
                              disabled={busyPrayer !== null}
                              trackColor={{
                                false: withOpacity(colors.border, 0.8),
                                true: withOpacity(colors.primary, 0.45),
                              }}
                              thumbColor={isEnabled ? colors.primary : "#F4F4F5"}
                            />
                          )}
                        </View>
                      ) : (
                        <Text style={[styles.sunriseLabel, { color: colors.textMuted, fontFamily: fonts.regular }]}>
                          {t("solah.noReminder")}
                        </Text>
                      )}
                    </View>

                    {/* Advance reminder picker — expands inline */}
                    {row.remindable && isEnabled && isAdvanceExpanded && (
                      <View style={styles.advancePicker}>
                        <View style={[styles.advancePickerHeader, isRTL && { flexDirection: "row-reverse" }]}>
                          <BellOff size={14} color={colors.textMuted} />
                          <Text
                            style={[
                              styles.advancePickerLabel,
                              { color: colors.textMuted, fontFamily: fonts.medium },
                            ]}
                          >
                            {t("solah.advanceReminderDesc")}
                          </Text>
                        </View>
                        <View style={[styles.advanceOptionRow, isRTL && { flexDirection: "row-reverse" }]}>
                          {ADVANCE_OPTIONS.map((mins) => {
                            const isSelected = currentAdvance === mins;
                            return (
                              <Pressable
                                key={mins}
                                onPress={() => {
                                  void setAdvanceMinutes(prayerKey, mins);
                                  setExpandedAdvance(null);
                                }}
                                style={[
                                  styles.advanceOption,
                                  {
                                    backgroundColor: isSelected
                                      ? colors.primary
                                      : withOpacity(colors.border, isDark ? 0.3 : 0.15),
                                    borderColor: isSelected
                                      ? colors.primary
                                      : withOpacity(colors.border, 0.4),
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.advanceOptionText,
                                    {
                                      color: isSelected ? "#FFFFFF" : colors.textMuted,
                                      fontFamily: isSelected ? fonts.bold : fonts.medium,
                                    },
                                  ]}
                                >
                                  {mins === 0
                                    ? t("solah.advanceOff")
                                    : t("solah.advanceMin", { count: mins })}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            {/* ── Advance reminder explainer card ── */}
            <View
              style={[
                styles.infoCard,
                { backgroundColor: withOpacity(colors.primary, isDark ? 0.1 : 0.06), borderColor: withOpacity(colors.primary, 0.2) },
              ]}
            >
              <Clock3 size={16} color={colors.primary} style={{ marginTop: 1 }} />
              <Text
                style={[
                  styles.infoText,
                  { color: colors.textMuted, fontFamily: fonts.regular, textAlign: isRTL ? "right" : "left" },
                ]}
              >
                {t("solah.advanceReminderDesc")}
                {" "}
                <Text style={{ color: colors.primary, fontFamily: fonts.medium }}>
                  {t("solah.advanceReminder")}
                </Text>
                {" — "}
                enable a prayer, then tap the clock chip to set 5, 10, 15, or 30 minutes early.
              </Text>
            </View>

          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
  },
  headerRight: {
    width: 44,
  },
  content: {
    paddingBottom: 40,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    paddingTop: 80,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
  },
  timesContainer: {
    gap: 16,
  },
  // ── Next prayer hero ──
  nextPrayerBackground: {
    borderRadius: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  nextPrayerOverlay: {
    backgroundColor: "rgba(0,0,0,0.42)",
    padding: 24,
    borderRadius: 18,
  },
  nextPrayerLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.75)",
    letterSpacing: 1.4,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  nextPrayerRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  nextPrayerName: {
    fontSize: 30,
    color: "#FFFFFF",
  },
  nextPrayerTime: {
    fontSize: 22,
    color: "#FFFFFF",
  },
  // ── Summary card ──
  summaryCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 6,
  },
  summaryTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  summaryTitle: {
    fontSize: 16,
  },
  summaryText: {
    fontSize: 14,
  },
  // ── Times card ──
  timesCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 18,
  },
  cardSubtitle: {
    fontSize: 13,
    marginBottom: 8,
  },
  // ── Prayer block (row + optional advance picker) ──
  prayerBlock: {
    paddingVertical: 2,
  },
  prayerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  prayerName: {
    fontSize: 17,
  },
  prayerTime: {
    fontSize: 14,
    marginTop: 2,
  },
  prayerControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sunriseLabel: {
    fontSize: 12,
  },
  // ── Advance chip (shown next to switch when enabled) ──
  advanceChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  advanceChipText: {
    fontSize: 12,
  },
  // ── Advance picker (inline expansion) ──
  advancePicker: {
    paddingBottom: 14,
    paddingHorizontal: 2,
    gap: 10,
  },
  advancePickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  advancePickerLabel: {
    fontSize: 12,
  },
  advanceOptionRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  advanceOption: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  advanceOptionText: {
    fontSize: 13,
  },
  // ── Info card at bottom ──
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
});
