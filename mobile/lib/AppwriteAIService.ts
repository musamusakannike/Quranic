import AsyncStorage from "@react-native-async-storage/async-storage";
import { appwriteFunctions } from "./appwrite";

const CHAT_STORAGE_KEY = "@ai_chat_history";
const AI_FUNCTION_ID = process.env.EXPO_PUBLIC_APPWRITE_AI_FUNCTION_ID ?? "";

export type QuranVerseRef = {
  chapter: number;
  verse: number;
  text: string;
};

export type AIResponseSegment =
  | { type: "text"; content: string }
  | { type: "verse_ref"; ref: QuranVerseRef; label: string };

export type AIMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  segments?: AIResponseSegment[];
  timestamp: number;
  isOffTopic?: boolean;
};

export type ChatSession = {
  id: string;
  title: string;
  messages: AIMessage[];
  createdAt: number;
  updatedAt: number;
};

export type AIStructuredResponse = {
  isOffTopic: boolean;
  answer: string;
  evidence: string;
  quranRefs: {
    chapter: number;
    verse: number;
    text: string;
    label: string;
  }[];
};

function buildSegments(response: AIStructuredResponse): AIResponseSegment[] {
  const segments: AIResponseSegment[] = [];
  segments.push({ type: "text", content: response.answer });
  if (!response.isOffTopic && response.evidence) {
    segments.push({ type: "text", content: `\n\n📚 Evidence: ${response.evidence}` });
  }
  for (const ref of response.quranRefs) {
    segments.push({
      type: "verse_ref",
      ref: { chapter: ref.chapter, verse: ref.verse, text: ref.text },
      label: ref.label,
    });
  }
  return segments;
}

export async function sendMessage(
  userMessage: string,
  conversationHistory: AIMessage[]
): Promise<AIMessage> {
  const messages = conversationHistory.slice(-10).map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));

  messages.push({ role: "user", content: userMessage });

  const execution = await appwriteFunctions.createExecution({
    functionId: AI_FUNCTION_ID,
    body: JSON.stringify({ messages }),
    async: false,
  });

  if (execution.status !== "completed" || !execution.responseBody) {
    throw new Error("AI function execution failed");
  }

  let parsed: AIStructuredResponse;
  try {
    parsed = JSON.parse(execution.responseBody) as AIStructuredResponse;
  } catch {
    parsed = {
      isOffTopic: false,
      answer: execution.responseBody,
      evidence: "",
      quranRefs: [],
    };
  }

  const assistantMessage: AIMessage = {
    id: Date.now().toString(),
    role: "assistant",
    content: parsed.answer,
    segments: buildSegments(parsed),
    timestamp: Date.now(),
    isOffTopic: parsed.isOffTopic,
  };

  return assistantMessage;
}

export async function loadChatSessions(): Promise<ChatSession[]> {
  try {
    const raw = await AsyncStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ChatSession[];
  } catch {
    return [];
  }
}

export async function saveChatSession(session: ChatSession): Promise<void> {
  try {
    const sessions = await loadChatSessions();
    const idx = sessions.findIndex((s) => s.id === session.id);
    if (idx >= 0) {
      sessions[idx] = session;
    } else {
      sessions.unshift(session);
    }
    await AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.error("Failed to save chat session", e);
  }
}

export async function deleteChatSession(sessionId: string): Promise<void> {
  try {
    const sessions = await loadChatSessions();
    const filtered = sessions.filter((s) => s.id !== sessionId);
    await AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error("Failed to delete chat session", e);
  }
}

export function createNewSession(): ChatSession {
  return {
    id: Date.now().toString(),
    title: "New Chat",
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
