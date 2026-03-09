import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
} from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { WifiOff, AlertCircle, CheckCircle } from "lucide-react-native";
import { useTheme } from "./ThemeContext";

type ToastType = "offline" | "error" | "success" | "info";

interface ToastContextData {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextData | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { colors, isDark } = useTheme();
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
  } | null>(null);
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<NodeJS.Timeout>(undefined);

  const showToast = (message: string, type: ToastType = "info") => {
    setToast({ message, type });

    // Reset animations
    translateY.setValue(-100);
    opacity.setValue(0);

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Animate in
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 50,
        useNativeDriver: true,
        bounciness: 8,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto hide
    timeoutRef.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => setToast(null));
    }, 4000);
  };

  const getIcon = () => {
    if (!toast) return null;
    switch (toast.type) {
      case "offline":
        return <WifiOff size={20} color="#fff" />;
      case "error":
        return <AlertCircle size={20} color="#fff" />;
      case "success":
        return <CheckCircle size={20} color="#fff" />;
      default:
        return <AlertCircle size={20} color="#fff" />;
    }
  };

  const getBgColor = () => {
    if (!toast) return "#333";
    switch (toast.type) {
      case "offline":
        return "#6B7280"; // gray
      case "error":
        return "#EF4444"; // red
      case "success":
        return "#10B981"; // green
      default:
        return "#3B82F6"; // blue
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              backgroundColor: isDark ? "#222" : "#fff",
              transform: [{ translateY }],
              opacity,
              shadowColor: colors.textMain,
            },
          ]}
        >
          <View
            style={[styles.iconContainer, { backgroundColor: getBgColor() }]}
          >
            {getIcon()}
          </View>
          <Text style={[styles.message, { color: colors.textMain }]}>
            {toast.message}
          </Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
};

const styles = StyleSheet.create({
  toastContainer: {
    position: "absolute",
    top: 0,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 9999,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontFamily: "SatoshiMedium",
    fontSize: 14,
  },
});
