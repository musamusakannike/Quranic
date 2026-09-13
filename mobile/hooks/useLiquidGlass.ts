import { useEffect, useState } from "react";
import { AccessibilityInfo, Platform } from "react-native";
import { isGlassEffectAPIAvailable, isLiquidGlassAvailable } from "expo-glass-effect";

export function isLiquidGlassSupported(): boolean {
  if (Platform.OS !== "ios") return false;
  try {
    return isLiquidGlassAvailable() && isGlassEffectAPIAvailable();
  } catch {
    return false;
  }
}

/**
 * True when native Liquid Glass can actually be shown (iOS 26+, API present, reduce transparency disabled).
 */
export function useLiquidGlass(): boolean {
  const supported = isLiquidGlassSupported();
  const [reduceTransparency, setReduceTransparency] = useState(false);

  useEffect(() => {
    if (!supported) return;
    AccessibilityInfo.isReduceTransparencyEnabled?.().then(setReduceTransparency);
    const sub = AccessibilityInfo.addEventListener?.(
      "reduceTransparencyChanged",
      setReduceTransparency
    );
    return () => sub?.remove?.();
  }, [supported]);

  return supported && !reduceTransparency;
}
