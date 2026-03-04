export const COLORS = {
  primary: "#056C5C",
  primaryLight: "#0A8F7A",
  primaryDark: "#034036",
  accent: "#D4AF37",

  light: {
    background: "#F9FAFB",
    surface: "#FFFFFF",
    textMain: "#111827",
    textMuted: "#6B7280",
    border: "#E5E7EB",
    icon: "#374151",
  },

  dark: {
    background: "#0B1914",
    surface: "#142D24",
    textMain: "#F9FAFB",
    textMuted: "#9CA3AF",
    border: "#1F3C31",
    icon: "#D1D5DB",
  },

  success: "#10B981",
  error: "#EF4444",
  warning: "#F59E0B",
};

export const FONTS = {
  arabic: "AmiriQuran",
  primaryRegular: "Inter-Regular",
  primaryMedium: "Inter-Medium",
  primaryBold: "Inter-Bold",
};

export const SIZES = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  arabicBase: 28,
  arabicLg: 36,

  xs_space: 4,
  sm_space: 8,
  md_space: 16,
  lg_space: 24,
  xl_space: 32,
  xxl_space: 48,

  radius_sm: 8,
  radius_md: 12,
  radius_lg: 16,
  radius_xl: 24,
  round: 999,
};

export const SHADOWS = {
  light: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
};

export const theme = {
  COLORS,
  FONTS,
  SIZES,
  SHADOWS,
};
