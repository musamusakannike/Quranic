import AsyncStorage from "@react-native-async-storage/async-storage";

const CHAT_STORAGE_KEY = "@ai_chat_history";

/**
 * The base URL of your deployed Next.js backend on Vercel (or localhost for local development).
 * Configure this in your mobile/.env file or EAS build secrets:
 * EXPO_PUBLIC_API_URL=https://your-app.vercel.app
 */
const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ||
  process.env.EXPO_PUBLIC_VERCEL_URL ||
  ""
).replace(/\/$/, "");

export type QuranVerseRef = {
  chapter: number;
  verse: number;
  text: string;
  label: string;
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
    segments.push({
      type: "text",
      content: `\n\n📚 Evidence: ${response.evidence}`,
    });
  }

  for (const ref of response.quranRefs) {
    segments.push({
      type: "verse_ref",
      ref: {
        chapter: ref.chapter,
        verse: ref.verse,
        text: ref.text,
        label: ref.label,
      },
      label: ref.label,
    });
  }

  return segments;
}

/**
 * Sends the user question and recent chat history to the Next.js /api/ai-chat endpoint
 * powered by DeepSeek on Vercel.
 */
export async function sendMessage(
  userMessage: string,
  conversationHistory: AIMessage[]
): Promise<AIMessage> {
  if (!API_URL) {
    throw new Error(
      "AI API URL is not configured. Please set EXPO_PUBLIC_API_URL in your mobile/.env file or EAS Secrets."
    );
  }

  const messages = conversationHistory.slice(-10).map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));

  messages.push({ role: "user", content: userMessage });

  const endpoint = `${API_URL}/api/ai-chat`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    let errorMessage = `AI request failed with status ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson?.error) {
        errorMessage = errJson.error;
      }
    } catch {
      // Ignore JSON parse failure on error body
    }
    throw new Error(errorMessage);
  }

  const parsed = (await response.json()) as AIStructuredResponse;

  const assistantMessage: AIMessage = {
    id: Date.now().toString(),
    role: "assistant",
    content: parsed.answer || "",
    segments: buildSegments(parsed),
    timestamp: Date.now(),
    isOffTopic: Boolean(parsed.isOffTopic),
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
