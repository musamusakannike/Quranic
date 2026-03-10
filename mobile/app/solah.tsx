import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Pressable,
} from "react-native";
import * as Location from "expo-location";
import { Coordinates, CalculationMethod, PrayerTimes } from "adhan";
import { useTheme } from "../lib/ThemeContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronLeft } from "lucide-react-native";
import { useRouter } from "expo-router";

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

  const [prayerTimes, setPrayerTimes] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

        const coordinates = new Coordinates(
          location.coords.latitude,
          location.coords.longitude,
        );
        const date = new Date();
        const params = CalculationMethod.MuslimWorldLeague();

        const times = new PrayerTimes(coordinates, date, params);

        const formatTime = (dateObj: Date) =>
          dateObj.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });

        setPrayerTimes({
          fajr: formatTime(times.fajr),
          sunrise: formatTime(times.sunrise),
          dhuhr: formatTime(times.dhuhr),
          asr: formatTime(times.asr),
          maghrib: formatTime(times.maghrib),
          isha: formatTime(times.isha),
        });
      } catch (err) {
        setErrorMsg("Could not fetch location.");
      }
    })();
  }, []);

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
        <Text style={[styles.headerTitle, { color: colors.textMain }]}>
          Solat Times
        </Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.content}>
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
            <Text style={[styles.title, { color: colors.textMain }]}>
              Today's Prayer Times
            </Text>

            <View
              style={[
                styles.timesCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: withOpacity(colors.border, 0.5),
                },
              ]}
            >
              <View
                style={[
                  styles.prayerRow,
                  { borderBottomColor: withOpacity(colors.border, 0.3) },
                ]}
              >
                <Text style={[styles.prayerName, { color: colors.textMuted }]}>
                  Fajr
                </Text>
                <Text style={[styles.prayerTime, { color: colors.textMain }]}>
                  {prayerTimes.fajr}
                </Text>
              </View>
              <View
                style={[
                  styles.prayerRow,
                  { borderBottomColor: withOpacity(colors.border, 0.3) },
                ]}
              >
                <Text style={[styles.prayerName, { color: colors.textMuted }]}>
                  Sunrise
                </Text>
                <Text style={[styles.prayerTime, { color: colors.textMain }]}>
                  {prayerTimes.sunrise}
                </Text>
              </View>
              <View
                style={[
                  styles.prayerRow,
                  { borderBottomColor: withOpacity(colors.border, 0.3) },
                ]}
              >
                <Text style={[styles.prayerName, { color: colors.textMuted }]}>
                  Dhuhr
                </Text>
                <Text style={[styles.prayerTime, { color: colors.textMain }]}>
                  {prayerTimes.dhuhr}
                </Text>
              </View>
              <View
                style={[
                  styles.prayerRow,
                  { borderBottomColor: withOpacity(colors.border, 0.3) },
                ]}
              >
                <Text style={[styles.prayerName, { color: colors.textMuted }]}>
                  Asr
                </Text>
                <Text style={[styles.prayerTime, { color: colors.textMain }]}>
                  {prayerTimes.asr}
                </Text>
              </View>
              <View
                style={[
                  styles.prayerRow,
                  { borderBottomColor: withOpacity(colors.border, 0.3) },
                ]}
              >
                <Text style={[styles.prayerName, { color: colors.textMuted }]}>
                  Maghrib
                </Text>
                <Text style={[styles.prayerTime, { color: colors.textMain }]}>
                  {prayerTimes.maghrib}
                </Text>
              </View>
              <View style={[styles.prayerRow, { borderBottomWidth: 0 }]}>
                <Text style={[styles.prayerName, { color: colors.textMuted }]}>
                  Isha
                </Text>
                <Text style={[styles.prayerTime, { color: colors.textMain }]}>
                  {prayerTimes.isha}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
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
    flex: 1,
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
    alignItems: "center",
    paddingTop: 20,
  },
  title: {
    fontFamily: "SatoshiBold",
    fontSize: 24,
    marginBottom: 30,
  },
  timesCard: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    width: "100%",
  },
  prayerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  prayerName: {
    fontFamily: "SatoshiMedium",
    fontSize: 18,
  },
  prayerTime: {
    fontFamily: "SatoshiBold",
    fontSize: 18,
  },
});
