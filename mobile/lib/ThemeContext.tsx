import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "./theme";

export type ThemeType = "light" | "dark" | "system";

interface ThemeContextProps {
  theme: ThemeType;
  resolvedTheme: "light" | "dark";
  colors: typeof COLORS.light & Omit<typeof COLORS, "light" | "dark">;
  setTheme: (theme: ThemeType) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

const THEME_STORAGE_KEY = "@app_theme";

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeType>("system");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (
          storedTheme === "light" ||
          storedTheme === "dark" ||
          storedTheme === "system"
        ) {
          setThemeState(storedTheme as ThemeType);
        }
      } catch (e) {
        console.error("Failed to load theme correctly", e);
      } finally {
        setIsReady(true);
      }
    };
    loadTheme();
  }, []);

  const setTheme = async (newTheme: ThemeType) => {
    setThemeState(newTheme);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (e) {
      console.error("Failed to save theme", e);
    }
  };

  const resolvedTheme =
    theme === "system" ? systemColorScheme || "light" : theme;
  const isDark = resolvedTheme === "dark";
  // Include common colors from COLORS as well, by spreading them
  const colors = {
    ...COLORS,
    ...(isDark ? COLORS.dark : COLORS.light),
  } as typeof COLORS.dark & typeof COLORS;

  if (!isReady) {
    return null; // Don't render children until we know the theme to avoid flicker
  }

  return (
    <ThemeContext.Provider
      value={{ theme, resolvedTheme, colors, setTheme, isDark }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
