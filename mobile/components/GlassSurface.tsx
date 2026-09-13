import React, { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useTheme } from "../lib/ThemeContext";

// ---------------------------------------------------------------------------
// Optional native dependencies. Both are loaded defensively so this file
// doesn't crash a project that hasn't installed one of them yet — it just
// drops down a tier (glass -> blur -> solid).
//
//   npx expo install expo-glass-effect expo-blur
//
// expo-glass-effect renders a REAL iOS 26 Liquid Glass surface
// (UIVisualEffectView + UIGlassEffect). It only exists on iOS 26+; on every
// older OS it exports nothing useful, which is exactly why we feature-detect
// it instead of assuming it's there.
// ---------------------------------------------------------------------------

type GlassEffectModule = {
  GlassView: React.ComponentType<any>;
  isLiquidGlassAvailable?: boolean | (() => boolean);
  isGlassEffectAPIAvailable?: () => boolean;
};

type BlurModule = {
  BlurView: React.ComponentType<any>;
};

let glassEffect: GlassEffectModule | null = null;
let blurModule: BlurModule | null = null;

if (Platform.OS === "ios") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    glassEffect = require("expo-glass-effect");
  } catch {
    glassEffect = null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    blurModule = require("expo-blur");
  } catch {
    blurModule = null;
  }
}

const resolveBoolean = (value: boolean | (() => boolean) | undefined) => {
  if (typeof value === "function") {
    try {
      return value();
    } catch {
      return false;
    }
  }
  return Boolean(value);
};

export type GlassTier = "glass" | "blur" | "solid";

/**
 * Picks the best available "material" tier for the current device:
 *  - "glass": iOS 26+, Liquid Glass API present, reduce-transparency off.
 *  - "blur":  older iOS, or reduce-transparency unavailable to check.
 *  - "solid": Android/web, or the user has Reduce Transparency turned on.
 *
 * Reduce Transparency is respected because Apple's HIG treats it as a hard
 * requirement, not a suggestion — glass/blur surfaces must have an opaque
 * fallback for anyone who has that accessibility setting enabled.
 */
export function useGlassTier(): GlassTier {
  const [reduceTransparency, setReduceTransparency] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "ios") return;
    let mounted = true;

    AccessibilityInfo.isReduceTransparencyEnabled?.()
      .then((enabled) => {
        if (mounted) setReduceTransparency(enabled);
      })
      .catch(() => {});

    const subscription = AccessibilityInfo.addEventListener(
      "reduceTransparencyChanged",
      (enabled: boolean) => setReduceTransparency(enabled),
    );

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  if (reduceTransparency) return "solid";

  if (
    Platform.OS === "ios" &&
    glassEffect?.GlassView &&
    resolveBoolean(glassEffect.isGlassEffectAPIAvailable?.()) &&
    resolveBoolean(glassEffect.isLiquidGlassAvailable)
  ) {
    return "glass";
  }

  if (Platform.OS === "ios" && blurModule?.BlurView) {
    return "blur";
  }

  return "solid";
}

function useSafeTheme() {
  try {
    return useTheme();
  } catch {
    return { isDark: false, colors: undefined };
  }
}

export interface GlassSurfaceProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Opaque color used on Android/web and whenever we fall back to "solid". */
  solidColor: string;
  /** Tint forwarded to the native glass effect on iOS 26+. Optional. */
  glassTint?: string;
  /** Lets the glass surface react to touches with the native shimmer. */
  isInteractive?: boolean;
  borderRadius?: number;
  /** Overrides the color scheme appearance ('dark' | 'light' | 'auto'). Defaults to app's active theme. */
  colorScheme?: "auto" | "light" | "dark";
  /** Glass style for iOS 26 Liquid Glass ('regular' | 'clear' | 'none'). Defaults to 'regular'. */
  glassEffectStyle?: "regular" | "clear" | "none";
  /** Blur intensity for the blur fallback (1-100). */
  blurIntensity?: number;
  /** Blur tint override for expo-blur. Defaults to 'systemChromeMaterialDark' in dark mode. */
  blurTint?: string;
}

/**
 * A card/pill surface that renders as real Liquid Glass on iOS 26+, a
 * blurred material on older iOS, and a flat tinted surface everywhere else.
 * Fully optimized for both light and dark mode appearances.
 */
export function GlassSurface({
  children,
  style,
  solidColor,
  glassTint,
  isInteractive = false,
  borderRadius = 20,
  colorScheme,
  glassEffectStyle = "regular",
  blurIntensity,
  blurTint,
}: GlassSurfaceProps) {
  const tier = useGlassTier();
  const { isDark, colors } = useSafeTheme();
  const activeColorScheme = colorScheme ?? (isDark ? "dark" : "light");

  const shapeStyle: ViewStyle = {
    borderRadius,
    // "continuous" gives the Apple squircle corner instead of a plain
    // circular arc — iOS only, silently ignored elsewhere.
    ...(Platform.OS === "ios" ? { borderCurve: "continuous" as const } : null),
    overflow: "hidden",
  };

  if (tier === "glass" && glassEffect?.GlassView) {
    const { GlassView } = glassEffect;
    // In dark mode, if no custom glassTint is provided, supply a refined emerald surface tint
    // so the Liquid Glass surface has rich organic refraction rather than flat background darkness.
    const resolvedGlassTint =
      glassTint ?? (isDark && colors?.surface ? withOpacity(colors.surface, 0.42) : undefined);

    return (
      <GlassView
        style={[shapeStyle, style]}
        glassEffectStyle={glassEffectStyle}
        tintColor={resolvedGlassTint}
        isInteractive={isInteractive}
        colorScheme={activeColorScheme}
      >
        {children}
      </GlassView>
    );
  }

  if (tier === "blur" && blurModule?.BlurView) {
    const { BlurView } = blurModule;
    const resolvedBlurTint =
      blurTint ??
      (isDark ? "systemChromeMaterialDark" : "systemChromeMaterialLight");

    return (
      <View style={[shapeStyle, style]}>
        <BlurView
          intensity={blurIntensity ?? (isDark ? 55 : 70)}
          tint={resolvedBlurTint as any}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: withOpacity(
                glassTint ?? solidColor,
                isDark ? 0.38 : 0.16,
              ),
            },
          ]}
        />
        {/* Subtle luminous frosted edge highlight in dark mode */}
        {isDark ? (
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              {
                borderRadius,
                ...(Platform.OS === "ios" ? { borderCurve: "continuous" as const } : null),
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: "rgba(255, 255, 255, 0.12)",
              },
            ]}
          />
        ) : null}
        {children}
      </View>
    );
  }

  return (
    <View
      style={[
        shapeStyle,
        {
          backgroundColor: solidColor,
          borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : undefined,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

function withOpacity(hexColor: string, opacity: number) {
  const sanitized = hexColor.replace("#", "");
  const bigint = Number.parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}