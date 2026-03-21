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
} from "react-native";
import * as Location from "expo-location";
import { ChevronLeft, Bell } from "lucide-react-native";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../lib/ThemeContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import {
  getPrayerTimes,
  getNextPrayer,
  formatPrayerTime,
  PrayerKey,
  PrayerListKey,
} from "../lib/SolahHelper";

type ReminderItem = {
  enabled: boolean;
  notificationId: string | null;
};

type PrayerReminderMap = Record<PrayerKey, ReminderItem>;
type PrayerTimesMap = Record<PrayerListKey, Date>;


const REMINDER_STORAGE_KEY = "@solah_daily_reminders_v1";

const PRAYER_ROWS: { key: PrayerListKey; label: string; remindable: boolean }[] = [
  { key: "fajr", label: "Fajr", remindable: true },
  { key: "sunrise", label: "Sunrise", remindable: false },
  { key: "dhuhr", label: "Dhuhr", remindable: true },
  { key: "asr", label: "Asr", remindable: true },
  { key: "maghrib", label: "Maghrib", remindable: true },
  { key: "isha", label: "Isha", remindable: true },
];

const REMINDABLE_PRAYERS: PrayerKey[] = [
  "fajr",
  "dhuhr",
  "asr",
  "maghrib",
  "isha",
];

const DEFAULT_REMINDERS: PrayerReminderMap = {
  fajr: { enabled: false, notificationId: null },
  dhuhr: { enabled: false, notificationId: null },
  asr: { enabled: false, notificationId: null },
  maghrib: { enabled: false, notificationId: null },
  isha: { enabled: false, notificationId: null },
};

const parseStoredReminders = (raw: string | null): PrayerReminderMap => {
  if (!raw) return DEFAULT_REMINDERS;

  try {
    const parsed = JSON.parse(raw) as Partial<PrayerReminderMap>;
    return {
      fajr: {
        enabled: parsed.fajr?.enabled ?? false,
        notificationId: parsed.fajr?.notificationId ?? null,
      },
      dhuhr: {
        enabled: parsed.dhuhr?.enabled ?? false,
        notificationId: parsed.dhuhr?.notificationId ?? null,
      },
      asr: {
        enabled: parsed.asr?.enabled ?? false,
        notificationId: parsed.asr?.notificationId ?? null,
      },
      maghrib: {
        enabled: parsed.maghrib?.enabled ?? false,
        notificationId: parsed.maghrib?.notificationId ?? null,
      },
      isha: {
        enabled: parsed.isha?.enabled ?? false,
        notificationId: parsed.isha?.notificationId ?? null,
      },
    };
  } catch {
    return DEFAULT_REMINDERS;
  }
};

const saveReminders = async (reminders: PrayerReminderMap) => {
  await AsyncStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(reminders));
};

const formatTime = (dateObj: Date) =>
  dateObj.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

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

const withOpacity = (hexColor: string, opacity: number) => {
  const sanitized = hexColor.replace("#", "");
  const bigint = Number.parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export default function SolahTimesScreen() {
  const { colors, isDark } = useTheme();
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

  const activeReminderCount = useMemo(
    () => REMINDABLE_PRAYERS.filter((key) => reminders[key].enabled).length,
    [reminders],
  );

  useEffect(() => {
    const loadReminders = async () => {
      try {
        const raw = await AsyncStorage.getItem(REMINDER_STORAGE_KEY);
        setReminders(parseStoredReminders(raw));
      } catch {
        setReminders(DEFAULT_REMINDERS);
      }
    };

    void loadReminders();
  }, []);

  useEffect(() => {
    (async () => {
      // Request Location Permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      try {
        let location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;

        const times = getPrayerTimes(latitude, longitude);
        setPrayerTimes(times);

        const nextP = getNextPrayer(latitude, longitude);
        setNextPrayer(nextP);
      } catch (err) {
        setErrorMsg("Could not fetch location.");
      }
    })();
  }, []);

  const togglePrayerReminder = async (
    prayerKey: PrayerKey,
    nextEnabled: boolean,
  ) => {
    if (!prayerTimes) return;

    setBusyPrayer(prayerKey);

    try {
      const current = reminders[prayerKey];

      if (!nextEnabled) {
        if (current.notificationId) {
          await Notifications.cancelScheduledNotificationAsync(
            current.notificationId,
          );
        }

        const nextState = {
          ...reminders,
          [prayerKey]: { enabled: false, notificationId: null },
        };
        setReminders(nextState);
        await saveReminders(nextState);
        return;
      }

      const permissionGranted = await requestNotificationPermission();
      if (!permissionGranted) {
        Alert.alert(
          "Permission required",
          "Please enable notifications to set daily salah reminders.",
        );
        return;
      }

      if (current.notificationId) {
        await Notifications.cancelScheduledNotificationAsync(current.notificationId);
      }

      const prayerTime = prayerTimes[prayerKey];
      const label = PRAYER_ROWS.find((row) => row.key === prayerKey)?.label ?? "Salah";
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `${label} Salah Reminder`,
          body: `It's time for ${label} prayer.`,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          channelId: "daily-reminders",
          hour: prayerTime.getHours(),
          minute: prayerTime.getMinutes(),
        } as Notifications.NotificationTriggerInput,
      });

      const nextState = {
        ...reminders,
        [prayerKey]: { enabled: true, notificationId },
      };
      setReminders(nextState);
      await saveReminders(nextState);
    } catch {
      Alert.alert("Error", "Could not update this reminder right now.");
    } finally {
      setBusyPrayer(null);
    }
  };

  const reminderSummaryText =
    activeReminderCount === 0
      ? "No daily reminders active"
      : `${activeReminderCount} daily reminder${activeReminderCount > 1 ? "s" : ""} active`;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
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

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={[styles.backBtn, { backgroundColor: colors.surface }]}
          onPress={() => router.back()}
        >
          <ChevronLeft color={colors.textMain} size={24} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textMain }]}>Solat Times</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {errorMsg ? (
          <View style={styles.center}>
            <Text style={[styles.errorText, { color: colors.textMuted }]}> 
              {errorMsg}
            </Text>
          </View>
        ) : !prayerTimes ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}> 
              Calculating times...
            </Text>
          </View>
        ) : (
          <View style={styles.timesContainer}>
            {nextPrayer ? (
              <ImageBackground
                source={require("../assets/images/solah-sajda.webp")}
                style={styles.nextPrayerBackground}
                imageStyle={{ borderRadius: 18 }}
              >
                <View style={styles.nextPrayerOverlay}>
                  <Text style={styles.nextPrayerLabel}>NEXT PRAYER</Text>
                  <View style={styles.nextPrayerRow}>
                    <Text style={styles.nextPrayerName}>{nextPrayer.label}</Text>
                    <Text style={styles.nextPrayerTime}>{formatTime(nextPrayer.time)}</Text>
                  </View>
                </View>
              </ImageBackground>
            ) : null}

            <View
              style={[
                styles.summaryCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: withOpacity(colors.border, 0.6),
                },
              ]}
            >
              <View style={styles.summaryTopRow}>
                <Bell size={18} color={colors.primary} />
                <Text style={[styles.summaryTitle, { color: colors.textMain }]}> 
                  Solah reminders
                </Text>
              </View>
              <Text style={[styles.summaryText, { color: colors.textMuted }]}> 
                {reminderSummaryText}
              </Text>
            </View>

            <View
              style={[
                styles.timesCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: withOpacity(colors.border, 0.5),
                },
              ]}
            >
              <Text style={[styles.cardTitle, { color: colors.textMain }]}> 
                Today&apos;s prayer times
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}> 
                Toggle any solah to receive a daily local reminder at that time.
              </Text>

              {PRAYER_ROWS.map((row, index) => {
                const isLast = index === PRAYER_ROWS.length - 1;
                const isBusy = row.remindable && busyPrayer === row.key;
                const isEnabled = row.remindable
                  ? reminders[row.key as PrayerKey].enabled
                  : false;

                return (
                  <View
                    key={row.key}
                    style={[
                      styles.prayerRow,
                      {
                        borderBottomWidth: isLast ? 0 : 1,
                        borderBottomColor: withOpacity(colors.border, 0.3),
                      },
                    ]}
                  >
                    <View>
                      <Text style={[styles.prayerName, { color: colors.textMain }]}> 
                        {row.label}
                      </Text>
                      <Text style={[styles.prayerTime, { color: colors.textMuted }]}> 
                        {formatPrayerTime(prayerTimes[row.key])}
                      </Text>
                    </View>

                    {row.remindable ? (
                      isBusy ? (
                        <ActivityIndicator color={colors.primary} />
                      ) : (
                        <Switch
                          value={isEnabled}
                          onValueChange={(nextValue) => {
                            void togglePrayerReminder(
                              row.key as PrayerKey,
                              nextValue,
                            );
                          }}
                          disabled={busyPrayer !== null}
                          trackColor={{
                            false: withOpacity(colors.border, 0.8),
                            true: withOpacity(colors.primary, 0.45),
                          }}
                          thumbColor={isEnabled ? colors.primary : "#F4F4F5"}
                        />
                      )
                    ) : (
                      <Text style={[styles.sunriseLabel, { color: colors.textMuted }]}> 
                        No reminder
                      </Text>
                    )}
                  </View>
                );
              })}
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
    fontFamily: "SatoshiBold",
    fontSize: 20,
  },
  headerRight: {
    width: 44,
  },
  content: {
    paddingBottom: 24,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  errorText: {
    fontFamily: "SatoshiMedium",
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  loadingText: {
    fontFamily: "SatoshiMedium",
    fontSize: 16,
  },
  timesContainer: {
    gap: 16,
  },
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
    fontFamily: "SatoshiBold",
    fontSize: 16,
  },
  summaryText: {
    fontFamily: "SatoshiMedium",
    fontSize: 14,
  },
  nextPrayerBackground: {
    borderRadius: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  nextPrayerOverlay: {
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    padding: 24,
    borderRadius: 18,
    justifyContent: "space-between",
  },
  nextPrayerLabel: {
    fontFamily: "SatoshiMedium",
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  nextPrayerRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  nextPrayerName: {
    fontFamily: "SatoshiBold",
    fontSize: 28,
    color: "#FFFFFF",
  },
  nextPrayerTime: {
    fontFamily: "SatoshiBold",
    fontSize: 22,
    color: "#FFFFFF",
  },
  timesCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    width: "100%",
    gap: 4,
  },
  cardTitle: {
    fontFamily: "SatoshiBold",
    fontSize: 18,
  },
  cardSubtitle: {
    fontFamily: "SatoshiMedium",
    fontSize: 13,
    marginBottom: 8,
  },
  prayerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  prayerName: {
    fontFamily: "SatoshiBold",
    fontSize: 17,
  },
  prayerTime: {
    fontFamily: "SatoshiMedium",
    fontSize: 14,
  },
  sunriseLabel: {
    fontFamily: "SatoshiMedium",
    fontSize: 12,
  },
});
