import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Dimensions,
} from "react-native";
import { X, Share2 } from "lucide-react-native";
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../lib/ThemeContext";

const { width } = Dimensions.get("window");

const withOpacity = (hexColor: string, opacity: number) => {
  const sanitized = hexColor.replace("#", "");
  const bigint = Number.parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

interface ShareVerseModalProps {
  visible: boolean;
  onClose: () => void;
  verse: {
    text: string;
    translation: string | null;
    verseNumber: number;
    chapterName: string;
    chapterNumber: number;
  } | null;
  arabicFontSize: number;
  translationFontSize: number;
}

export default function ShareVerseModal({
  visible,
  onClose,
  verse,
  arabicFontSize,
  translationFontSize,
}: ShareVerseModalProps) {
  const { colors, isDark } = useTheme();
  const viewShotRef = useRef<ViewShot>(null);
  const [isSharing, setIsSharing] = useState(false);

  if (!verse) return null;

  // Dynamically scale font size based on verse length for better fit
  const verseLength = verse.text.length;
  const dynamicArabicSize = (() => {
    if (verseLength <= 80) return Math.min(arabicFontSize + 6, 42);
    if (verseLength <= 160) return Math.min(arabicFontSize + 2, 36);
    if (verseLength <= 280) return Math.min(arabicFontSize - 2, 30);
    return Math.min(arabicFontSize - 6, 24);
  })();
  const dynamicLineHeight = dynamicArabicSize * 2.0;

  const translationLength = verse.translation?.length ?? 0;
  const dynamicTranslationSize = (() => {
    if (translationLength <= 100) return translationFontSize + 2;
    if (translationLength <= 200) return translationFontSize;
    return Math.max(translationFontSize - 2, 12);
  })();
  const dynamicTranslationLineHeight = dynamicTranslationSize * 1.8;

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);
    void Haptics.selectionAsync();

    try {
      const uri = await viewShotRef.current?.capture?.();

      if (uri) {
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(uri, {
            mimeType: "image/png",
            dialogTitle: `Share Ayah ${verse.verseNumber} from Surah ${verse.chapterName}`,
          });
        }
      }
    } catch (error) {
      console.error("Oops, snapshot failed", error);
    } finally {
      setIsSharing(false);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.overlay,
          { backgroundColor: withOpacity(colors.background, 0.95) },
        ]}
      >
        <View style={styles.header}>
          <Pressable
            onPress={onClose}
            style={[styles.closeButton, { backgroundColor: colors.surface }]}
          >
            <X size={24} color={colors.textMain} />
          </Pressable>
          <Text style={[styles.title, { color: colors.textMain }]}>
            Share Ayah
          </Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.previewContainer}>
          <ViewShot
            ref={viewShotRef}
            options={{
              format: "png",
              quality: 1,
            }}
            style={{ width: width - 48 }}
          >
            {/* The Beautiful Share Card */}
            <LinearGradient
              colors={[
                isDark ? "#121212" : "#FFFFFF",
                withOpacity(colors.primary, isDark ? 0.15 : 0.08),
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.card,
                {
                  borderColor: withOpacity(colors.primary, 0.3),
                },
              ]}
            >
              <Text
                style={[
                  styles.arabicText,
                  {
                    color: colors.textMain,
                    fontSize: dynamicArabicSize,
                    lineHeight: dynamicLineHeight,
                  },
                ]}
              >
                {verse.text}
              </Text>

              {verse.translation && (
                <Text
                  style={[
                    styles.translationText,
                    {
                      color: colors.textMuted,
                      fontSize: dynamicTranslationSize,
                      lineHeight: dynamicTranslationLineHeight,
                    },
                  ]}
                >
                  &quot;{verse.translation}&quot;
                </Text>
              )}

              <View
                style={[
                  styles.divider,
                  { backgroundColor: withOpacity(colors.border, 0.5) },
                ]}
              />

              <View style={styles.footer}>
                <View>
                  <Text style={[styles.surahName, { color: colors.primary }]}>
                    Surah {verse.chapterName}
                  </Text>
                  <Text
                    style={[styles.ayahNumber, { color: colors.textMuted }]}
                  >
                    Ayah {verse.verseNumber}
                  </Text>
                </View>

                <View style={styles.brandingBadge}>
                  <Text
                    style={[styles.brandingText, { color: colors.primary }]}
                  >
                    Quranic
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </ViewShot>
        </View>

        <Pressable
          onPress={handleShare}
          style={[styles.shareButton, { backgroundColor: colors.primary }]}
          disabled={isSharing}
        >
          <Share2 size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.shareButtonText}>
            {isSharing ? "Preparing..." : "Share Image"}
          </Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 40,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "SatoshiBold",
    fontSize: 20,
  },
  previewContainer: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingBottom: 40,
  },
  card: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 28,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  arabicText: {
    fontFamily: "AmiriQuran",
    textAlign: "center",
    marginBottom: 24,
  },
  translationText: {
    fontFamily: "SatoshiMedium",
    textAlign: "center",
    marginBottom: 24,
  },
  divider: {
    height: 1,
    width: "100%",
    marginBottom: 20,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  surahName: {
    fontFamily: "SatoshiBold",
    fontSize: 16,
    marginBottom: 2,
  },
  ayahNumber: {
    fontFamily: "SatoshiMedium",
    fontSize: 14,
  },
  brandingBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  brandingText: {
    fontFamily: "SatoshiBold",
    fontSize: 12,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    borderRadius: 28,
    marginBottom: 50,
  },
  shareButtonText: {
    fontFamily: "SatoshiBold",
    fontSize: 18,
    color: "#FFFFFF",
  },
});
