import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { useTheme } from "../lib/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PrivacyPolicyScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  const sections = [
    {
      title: "Introduction",
      content:
        "Welcome to Quranic. We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our mobile application and website.",
    },
    {
      title: "Information We Collect",
      content:
        "We collect information that you provide directly to us, such as when you create an account, update your profile, or use certain features of the app. This may include:\n\n• Location Data: We access your location (with your permission) to provide accurate prayer times and Qibla direction based on your current area.\n• Audio Data: We may use audio permissions for features like recording and playback of Quran recitations.\n• Device Information: We collect info about the device you use to access our services to help improve performance.",
    },
    {
      title: "How We Use Your Information",
      content:
        "We use the information we collect to:\n\n• Provide, maintain, and improve our services.\n• Personalize your experience (e.g., local prayer times).\n• Send technical notices, updates, and security alerts.\n• Respond to your comments and questions.",
    },
    {
      title: "Data Storage and Security",
      content:
        "We implement appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, please remember that we cannot guarantee that the internet itself is 100% secure.",
    },
    {
      title: "Third-Party Services",
      content:
        "We may use third-party services for analytics or to provide certain features. These third parties have their own privacy policies regarding how they handle your information.",
    },
    {
      title: "Contact Us",
      content:
        "If you have questions or comments about this policy, you may contact us at support@codiac.online.",
    },
  ];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Privacy Policy",
          headerTitleStyle: {
            fontFamily: "SatoshiBold",
            color: colors.textMain,
          },
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color={colors.textMain} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textMain }]}>
            Privacy Policy
          </Text>
          <Text style={[styles.lastUpdated, { color: colors.textMuted }]}>
            Last updated: March 29, 2024
          </Text>
        </View>

        {sections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>
              {section.title}
            </Text>
            <Text style={[styles.sectionContent, { color: colors.textMain }]}>
              {section.content}
            </Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            © 2024 Codiac. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
    maxWidth: 800,
    alignSelf: "center",
    width: "100%",
  },
  backButton: {
    marginLeft: Platform.OS === "ios" ? 0 : -10,
    padding: 8,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontFamily: "SatoshiBold",
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: 14,
    fontFamily: "Satoshi",
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: "SatoshiBold",
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: "Satoshi",
  },
  footer: {
    marginTop: 40,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    fontFamily: "Satoshi",
  },
});
