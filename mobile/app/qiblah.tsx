import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Pressable,
  Animated,
  Image,
} from "react-native";
import * as Location from "expo-location";
import { useTheme } from "../lib/ThemeContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronLeft } from "lucide-react-native";
import { useRouter } from "expo-router";

// Exact coordinates of the Kaaba
const KAABA_LAT = 21.422487;
const KAABA_LNG = 39.826206;

const withOpacity = (hexColor: string, opacity: number) => {
  const sanitized = hexColor.replace("#", "");
  const bigint = Number.parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export default function QiblahScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  const [qiblahBearing, setQiblahBearing] = useState<number | null>(null);
  const [magnetometerHeading, setMagnetometerHeading] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1. Convert degrees to radians
  const toRadians = (degree: number) => {
    return degree * (Math.PI / 180);
  };

  // 2. Convert radians to degrees
  const toDegrees = (radian: number) => {
    return radian * (180 / Math.PI);
  };

  // 3. Calculate Bearing to Qiblah
  const calculateQiblahBearing = (userLat: number, userLng: number) => {
    const lat1 = toRadians(userLat);
    const lng1 = userLng;
    const lat2 = toRadians(KAABA_LAT);
    const lng2 = KAABA_LNG;

    const dLng = toRadians(lng2 - lng1);

    const y = Math.sin(dLng) * Math.cos(lat2);
    const x =
      Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

    let bearing = toDegrees(Math.atan2(y, x));

    // Normalize to 0 - 360
    bearing = (bearing + 360) % 360;
    setQiblahBearing(bearing);
  };

  useEffect(() => {
    let locationSub: Location.LocationSubscription | null = null;
    let headingSub: Location.LocationSubscription | null = null;

    (async () => {
      // Request Location Permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied.");
        return;
      }

      try {
        // High accuracy location for initial fetch
        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
        });
        calculateQiblahBearing(
          location.coords.latitude,
          location.coords.longitude,
        );

        // Watch Location
        locationSub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 10,
          },
          (loc) => {
            calculateQiblahBearing(loc.coords.latitude, loc.coords.longitude);
          }
        );

        // Watch Heading (optimized & accurate compass direction)
        headingSub = await Location.watchHeadingAsync((headingObj) => {
          let heading =
            headingObj.trueHeading >= 0
              ? headingObj.trueHeading
              : headingObj.magHeading;

          if (heading >= 0) {
            setMagnetometerHeading(heading);
          }
        });
      } catch (err) {
        setErrorMsg("Could not fetch location or heading.");
      }
    })();

    return () => {
      if (locationSub) locationSub.remove();
      if (headingSub) headingSub.remove();
    };
  }, []);

  // Calculate how much to rotate the needle
  // We subtract the device heading from the Qiblah bearing
  const needleRotation =
    qiblahBearing !== null ? qiblahBearing - magnetometerHeading : 0;

  let shortestNeedleRotation = needleRotation;
  if (shortestNeedleRotation > 180) {
    shortestNeedleRotation -= 360;
  } else if (shortestNeedleRotation < -180) {
    shortestNeedleRotation += 360;
  }

  const isFacingQiblah = Math.abs(shortestNeedleRotation) < 10;

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
          Qiblah
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
        ) : qiblahBearing === null ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>
              Finding direction...
            </Text>
          </View>
        ) : (
          <View style={styles.compassContainer}>
            {/* Compass Ring */}
            <View
              style={[
                styles.compassRing,
                {
                  borderColor: isFacingQiblah
                    ? colors.success
                    : withOpacity(colors.primary, 0.3),
                  backgroundColor: colors.surface,
                },
              ]}
            >
              {/* North Marker relative to the device */}
              <View
                style={[
                  styles.compassFace,
                  { transform: [{ rotate: `${-magnetometerHeading}deg` }] },
                ]}
              >
                <Text style={[styles.northText, { color: colors.textMain }]}>
                  N
                </Text>
                <Text style={[styles.eastText, { color: colors.textMuted }]}>
                  E
                </Text>
                <Text style={[styles.southText, { color: colors.textMuted }]}>
                  S
                </Text>
                <Text style={[styles.westText, { color: colors.textMuted }]}>
                  W
                </Text>
              </View>

              {/* Kaaba Direction Marker (Protrusion Indicator) */}
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  {
                    alignItems: "center",
                    justifyContent: "flex-start",
                    transform: [{ rotate: `${needleRotation}deg` }],
                    zIndex: 10,
                  },
                ]}
              >
                <Image
                  source={require("../assets/images/kaaba.png")}
                  style={[
                    styles.kaabaIndicator,
                    isFacingQiblah && { tintColor: undefined },
                  ]}
                />
              </View>
            </View>

            <View style={styles.infoContainer}>
              <View
                style={[
                  styles.infoCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: withOpacity(colors.border, 0.5),
                  },
                ]}
              >
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>
                  Your Heading
                </Text>
                <Text style={[styles.infoValue, { color: colors.textMain }]}>
                  {Math.round(magnetometerHeading)}°
                </Text>
              </View>

              <View
                style={[
                  styles.infoCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: withOpacity(colors.border, 0.5),
                  },
                ]}
              >
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>
                  Qiblah
                </Text>
                <Text style={[styles.infoValue, { color: colors.textMain }]}>
                  {Math.round(qiblahBearing)}°
                </Text>
              </View>
            </View>

            {isFacingQiblah ? (
              <Text style={[styles.qiblahFoundText, { color: colors.success }]}>
                You are facing the Qiblah
              </Text>
            ) : (
              <Text
                style={[styles.instructionText, { color: colors.textMuted }]}
              >
                Rotate your device until the arrow points up
              </Text>
            )}
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
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontFamily: "SatoshiMedium",
    fontSize: 16,
  },
  errorText: {
    fontFamily: "SatoshiMedium",
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  compassContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 40,
  },
  compassRing: {
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 8,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  compassFace: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  northText: {
    position: "absolute",
    top: 15,
    fontFamily: "SatoshiBold",
    fontSize: 20,
  },
  southText: {
    position: "absolute",
    bottom: 15,
    fontFamily: "SatoshiBold",
    fontSize: 16,
  },
  eastText: {
    position: "absolute",
    right: 15,
    fontFamily: "SatoshiBold",
    fontSize: 16,
  },
  westText: {
    position: "absolute",
    left: 15,
    fontFamily: "SatoshiBold",
    fontSize: 16,
  },
  kaabaIndicator: {
    width: 60,
    height: 60,
    resizeMode: "contain",
    marginTop: -30, // Protrude exactly half outside the edge
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  infoContainer: {
    flexDirection: "row",
    gap: 16,
    width: "100%",
  },
  infoCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    gap: 4,
  },
  infoLabel: {
    fontFamily: "SatoshiMedium",
    fontSize: 14,
  },
  infoValue: {
    fontFamily: "SatoshiBold",
    fontSize: 24,
  },
  instructionText: {
    fontFamily: "SatoshiMedium",
    fontSize: 16,
    textAlign: "center",
  },
  qiblahFoundText: {
    fontFamily: "SatoshiBold",
    fontSize: 18,
    textAlign: "center",
  },
});
