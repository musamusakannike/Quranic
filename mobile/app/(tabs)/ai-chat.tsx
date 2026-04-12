import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import {
  Send,
  Trash2,
  Plus,
  BookOpen,
  Sparkles,
  ChevronRight,
  AlertCircle,
  MessageSquare,
} from "lucide-react-native";
import { useTheme } from "../../lib/ThemeContext";
import {
  sendMessage,
  loadChatSessions,
  saveChatSession,
  deleteChatSession,
  createNewSession,
  type AIMessage,
  type AIResponseSegment,
  type ChatSession,
} from "../../lib/AppwriteAIService";

const withOpacity = (hex: string, opacity: number) => {
  const s = hex.replace("#", "");
  const n = Number.parseInt(s, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${opacity})`;
};

function VerseRefChip({
  label,
  verseText,
  chapter,
  verse,
  colors,
  onPress,
}: {
  label: string;
  verseText: string;
  chapter: number;
  verse: number;
  colors: ReturnType<typeof useTheme>["colors"];
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.verseChip,
        {
          backgroundColor: withOpacity(colors.primary, 0.1),
          borderColor: withOpacity(colors.primary, 0.3),
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View style={styles.verseChipLeft}>
        <BookOpen size={13} color={colors.primary} strokeWidth={2.4} />
        <Text style={[styles.verseChipLabel, { color: colors.primary }]}>
          {label}
        </Text>
      </View>
      <View style={styles.verseChipRight}>
        <Text
          style={[styles.verseChipText, { color: colors.textMuted }]}
          numberOfLines={2}
        >
          {verseText}
        </Text>
        <ChevronRight size={13} color={colors.primary} strokeWidth={2.4} />
      </View>
    </Pressable>
  );
}

function MessageBubble({
  message,
  colors,
  isDark,
  onVersePress,
}: {
  message: AIMessage;
  colors: ReturnType<typeof useTheme>["colors"];
  isDark: boolean;
  onVersePress: (chapter: number, verse: number) => void;
}) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <View style={[styles.bubbleRow, styles.bubbleRowUser]}>
        <View
          style={[
            styles.bubble,
            styles.bubbleUser,
            { backgroundColor: colors.primary },
          ]}
        >
          <Text style={[styles.bubbleText, styles.bubbleTextUser]}>
            {message.content}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.bubbleRow, styles.bubbleRowAssistant]}>
      <View
        style={[
          styles.aiAvatar,
          { backgroundColor: withOpacity(colors.primary, 0.15) },
        ]}
      >
        <Sparkles size={14} color={colors.primary} strokeWidth={2.2} />
      </View>
      <View style={styles.bubbleAssistantContent}>
        {message.isOffTopic && (
          <View
            style={[
              styles.offTopicBanner,
              {
                backgroundColor: withOpacity(colors.warning, 0.12),
                borderColor: withOpacity(colors.warning, 0.35),
              },
            ]}
          >
            <AlertCircle size={13} color={colors.warning} strokeWidth={2.2} />
            <Text style={[styles.offTopicText, { color: colors.warning }]}>
              Outside scope
            </Text>
          </View>
        )}
        {message.segments ? (
          message.segments.map((seg, idx) => {
            if (seg.type === "text") {
              return (
                <Text
                  key={idx}
                  style={[
                    styles.bubbleText,
                    styles.bubbleTextAssistant,
                    { color: colors.textMain },
                  ]}
                >
                  {seg.content}
                </Text>
              );
            }
            if (seg.type === "verse_ref") {
              return (
                <VerseRefChip
                  key={idx}
                  label={seg.label}
                  verseText={seg.ref.text}
                  chapter={seg.ref.chapter}
                  verse={seg.ref.verse}
                  colors={colors}
                  onPress={() => onVersePress(seg.ref.chapter, seg.ref.verse)}
                />
              );
            }
            return null;
          })
        ) : (
          <Text
            style={[
              styles.bubbleText,
              styles.bubbleTextAssistant,
              { color: colors.textMain },
            ]}
          >
            {message.content}
          </Text>
        )}
        <Text style={[styles.timestamp, { color: colors.textMuted }]}>
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    </View>
  );
}

function TypingIndicator({ colors }: { colors: ReturnType<typeof useTheme>["colors"] }) {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ])
      ).start();

    animate(dot1, 0);
    animate(dot2, 150);
    animate(dot3, 300);
  }, []);

  return (
    <View style={[styles.bubbleRow, styles.bubbleRowAssistant]}>
      <View
        style={[
          styles.aiAvatar,
          { backgroundColor: withOpacity(colors.primary, 0.15) },
        ]}
      >
        <Sparkles size={14} color={colors.primary} strokeWidth={2.2} />
      </View>
      <View
        style={[
          styles.typingBubble,
          { backgroundColor: withOpacity(colors.surface, 1), borderColor: withOpacity(colors.border, 0.6) },
        ]}
      >
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View
            key={i}
            style={[
              styles.typingDot,
              { backgroundColor: colors.primary, opacity: dot },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const SUGGESTED_QUESTIONS = [
  "What does the Quran say about patience?",
  "How do I perform Salah correctly?",
  "What are the pillars of Islam?",
  "Tell me about Surah Al-Fatiha",
];

export default function AIChatScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  const [session, setSession] = useState<ChatSession>(createNewSession);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  useEffect(() => {
    loadChatSessions().then(setSessions);
  }, []);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isLoading) return;

    void Haptics.selectionAsync();
    setInputText("");

    const userMsg: AIMessage = {
      id: `u_${Date.now()}`,
      role: "user",
      content: text,
      timestamp: Date.now(),
    };

    const updatedSession: ChatSession = {
      ...session,
      messages: [...session.messages, userMsg],
      title:
        session.messages.length === 0
          ? text.slice(0, 40)
          : session.title,
      updatedAt: Date.now(),
    };

    setSession(updatedSession);
    scrollToBottom();
    setIsLoading(true);

    try {
      const aiMsg = await sendMessage(text, updatedSession.messages);
      const finalSession: ChatSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, aiMsg],
        updatedAt: Date.now(),
      };
      setSession(finalSession);
      await saveChatSession(finalSession);
      setSessions((prev) => {
        const idx = prev.findIndex((s) => s.id === finalSession.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = finalSession;
          return next;
        }
        return [finalSession, ...prev];
      });
      scrollToBottom();
    } catch (e) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error("ERROR: ", e)
      Alert.alert(
        "Connection Error",
        "Failed to get a response. Please check your internet connection and try again."
      );
    } finally {
      setIsLoading(false);
    }
  }, [inputText, isLoading, session, scrollToBottom]);

  const handleVersePress = useCallback(
    (chapter: number, verse: number) => {
      void Haptics.selectionAsync();
      router.push(`/chapter/${chapter}?verse=${verse}`);
    },
    [router]
  );

  const handleNewChat = useCallback(() => {
    void Haptics.selectionAsync();
    setSession(createNewSession());
    setInputText("");
    setShowHistory(false);
  }, []);

  const handleLoadSession = useCallback((s: ChatSession) => {
    setSession(s);
    setShowHistory(false);
    setTimeout(() => scrollToBottom(), 200);
  }, [scrollToBottom]);

  const handleDeleteSession = useCallback(
    async (sessionId: string) => {
      await deleteChatSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (session.id === sessionId) {
        setSession(createNewSession());
      }
    },
    [session.id]
  );

  const handleSuggestedQuestion = useCallback((q: string) => {
    setInputText(q);
    inputRef.current?.focus();
  }, []);

  const isEmpty = session.messages.length === 0;

  if (showHistory) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: colors.background }]}
        edges={["top", "left", "right"]}
      >
        <View style={[styles.header, { borderBottomColor: withOpacity(colors.border, 0.5) }]}>
          <Pressable
            onPress={() => setShowHistory(false)}
            style={[styles.headerBtn, { backgroundColor: withOpacity(colors.surface, 0.8) }]}
          >
            <ChevronRight
              size={20}
              color={colors.textMain}
              strokeWidth={2.2}
              style={{ transform: [{ rotate: "180deg" }] }}
            />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.textMain }]}>Chat History</Text>
          <Pressable
            onPress={handleNewChat}
            style={[styles.headerBtn, { backgroundColor: withOpacity(colors.primary, 0.12) }]}
          >
            <Plus size={20} color={colors.primary} strokeWidth={2.4} />
          </Pressable>
        </View>
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.historyList}
          ListEmptyComponent={
            <View style={styles.emptyCenterContainer}>
              <MessageSquare size={36} color={colors.textMuted} strokeWidth={1.5} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No chat history yet
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handleLoadSession(item)}
              style={({ pressed }) => [
                styles.historyItem,
                {
                  backgroundColor: pressed
                    ? withOpacity(colors.primary, 0.08)
                    : colors.surface,
                  borderColor: withOpacity(colors.border, 0.5),
                },
              ]}
            >
              <View style={styles.historyItemContent}>
                <Text
                  style={[styles.historyItemTitle, { color: colors.textMain }]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Text style={[styles.historyItemMeta, { color: colors.textMuted }]}>
                  {item.messages.length} messages ·{" "}
                  {new Date(item.updatedAt).toLocaleDateString()}
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  Alert.alert("Delete Chat", "Remove this conversation?", [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Delete",
                      style: "destructive",
                      onPress: () => handleDeleteSession(item.id),
                    },
                  ]);
                }}
                style={styles.deleteBtn}
                hitSlop={8}
              >
                <Trash2 size={16} color={colors.error} strokeWidth={2} />
              </Pressable>
            </Pressable>
          )}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top", "left", "right"]}
    >
      <View style={[styles.header, { borderBottomColor: withOpacity(colors.border, 0.5) }]}>
        <Pressable
          onPress={() => {
            setShowHistory(true);
            loadChatSessions().then(setSessions);
          }}
          style={[styles.headerBtn, { backgroundColor: withOpacity(colors.surface, 0.8) }]}
        >
          <MessageSquare size={18} color={colors.textMain} strokeWidth={2.2} />
        </Pressable>
        <View style={styles.headerCenter}>
          <View
            style={[
              styles.headerAiDot,
              { backgroundColor: withOpacity(colors.primary, 0.15) },
            ]}
          >
            <Sparkles size={14} color={colors.primary} strokeWidth={2.3} />
          </View>
          <Text style={[styles.headerTitle, { color: colors.textMain }]}>
            Islamic AI
          </Text>
        </View>
        <Pressable
          onPress={handleNewChat}
          style={[styles.headerBtn, { backgroundColor: withOpacity(colors.primary, 0.12) }]}
        >
          <Plus size={20} color={colors.primary} strokeWidth={2.4} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {isEmpty ? (
          <View style={styles.emptyState}>
            <View
              style={[
                styles.emptyIcon,
                { backgroundColor: withOpacity(colors.primary, 0.12) },
              ]}
            >
              <Sparkles size={32} color={colors.primary} strokeWidth={1.8} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textMain }]}>
              Ask about the Deen
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              Ask anything about Islam, Quran, Sunnah, or Islamic guidance. Every answer is backed by evidence.
            </Text>
            <View style={styles.suggestions}>
              {SUGGESTED_QUESTIONS.map((q) => (
                <Pressable
                  key={q}
                  onPress={() => handleSuggestedQuestion(q)}
                  style={({ pressed }) => [
                    styles.suggestionChip,
                    {
                      backgroundColor: pressed
                        ? withOpacity(colors.primary, 0.15)
                        : withOpacity(colors.surface, 1),
                      borderColor: withOpacity(colors.border, 0.7),
                    },
                  ]}
                >
                  <Text
                    style={[styles.suggestionText, { color: colors.textMuted }]}
                  >
                    {q}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={session.messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={scrollToBottom}
            renderItem={({ item }) => (
              <MessageBubble
                message={item}
                colors={colors}
                isDark={isDark}
                onVersePress={handleVersePress}
              />
            )}
            ListFooterComponent={isLoading ? <TypingIndicator colors={colors} /> : null}
          />
        )}

        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: colors.background,
              borderTopColor: withOpacity(colors.border, 0.4),
            },
          ]}
        >
          <View
            style={[
              styles.inputRow,
              {
                backgroundColor: colors.surface,
                borderColor: withOpacity(colors.border, 0.6),
              },
            ]}
          >
            <TextInput
              ref={inputRef}
              style={[styles.input, { color: colors.textMain }]}
              placeholder="Ask an Islamic question..."
              placeholderTextColor={colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
              editable={!isLoading}
            />
            <Pressable
              onPress={handleSend}
              disabled={!inputText.trim() || isLoading}
              style={({ pressed }) => [
                styles.sendBtn,
                {
                  backgroundColor:
                    inputText.trim() && !isLoading
                      ? colors.primary
                      : withOpacity(colors.primary, 0.3),
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Send size={18} color="#fff" strokeWidth={2.2} />
              )}
            </Pressable>
          </View>
          <Text style={[styles.disclaimer, { color: colors.textMuted }]}>
            AI responses may contain errors — always verify with a scholar.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerAiDot: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "SatoshiBold",
    fontSize: 17,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontFamily: "SatoshiBold",
    fontSize: 22,
    marginBottom: 10,
    textAlign: "center",
  },
  emptySubtitle: {
    fontFamily: "Satoshi",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  suggestions: {
    width: "100%",
    gap: 10,
  },
  suggestionChip: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  suggestionText: {
    fontFamily: "Satoshi",
    fontSize: 14,
    lineHeight: 20,
  },
  messageList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 16,
  },
  bubbleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  bubbleRowUser: {
    justifyContent: "flex-end",
  },
  bubbleRowAssistant: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "78%",
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  bubbleUser: {
    borderBottomRightRadius: 4,
  },
  aiAvatar: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginBottom: 4,
  },
  bubbleAssistantContent: {
    maxWidth: "82%",
    gap: 6,
  },
  bubbleText: {
    fontFamily: "Satoshi",
    fontSize: 15,
    lineHeight: 22,
  },
  bubbleTextUser: {
    color: "#fff",
  },
  bubbleTextAssistant: {},
  offTopicBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  offTopicText: {
    fontFamily: "SatoshiMedium",
    fontSize: 12,
  },
  verseChip: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    gap: 6,
  },
  verseChipLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  verseChipLabel: {
    fontFamily: "SatoshiBold",
    fontSize: 13,
  },
  verseChipRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  verseChipText: {
    fontFamily: "Satoshi",
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  timestamp: {
    fontFamily: "Satoshi",
    fontSize: 11,
    marginTop: 2,
  },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  inputContainer: {
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 20 : 12,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderWidth: 1,
    borderRadius: 18,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 8,
  },
  input: {
    flex: 1,
    fontFamily: "Satoshi",
    fontSize: 15,
    maxHeight: 120,
    paddingTop: Platform.OS === "ios" ? 6 : 4,
    paddingBottom: Platform.OS === "ios" ? 6 : 4,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  disclaimer: {
    fontFamily: "Satoshi",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
  },
  historyList: {
    padding: 16,
    gap: 10,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    marginBottom: 10,
  },
  historyItemContent: {
    flex: 1,
    gap: 4,
  },
  historyItemTitle: {
    fontFamily: "SatoshiMedium",
    fontSize: 15,
  },
  historyItemMeta: {
    fontFamily: "Satoshi",
    fontSize: 12,
  },
  deleteBtn: {
    padding: 4,
  },
  emptyCenterContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    fontFamily: "Satoshi",
    fontSize: 15,
  },
});
