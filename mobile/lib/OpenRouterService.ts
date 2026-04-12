import AsyncStorage from "@react-native-async-storage/async-storage";

const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY ?? "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";
const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const CHAT_STORAGE_KEY = "@ai_chat_history";
const MODEL = "google/gemini-2.0-flash-lite-001";

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

const SYSTEM_PROMPT = `You are an Islamic knowledge assistant embedded in a Quran app. Your sole purpose is to answer questions related to Islam, the Quran, Sunnah, Islamic jurisprudence (fiqh), Islamic history, prophets, companions, Islamic ethics, and general deen-related questions.

STRICT RULES:
1. If a question is NOT related to Islam, the Quran, deen, or Islamic matters, respond with isOffTopic: true and a polite redirect message.
2. ALWAYS back every answer with evidence — Quran verses, hadith references, or scholarly consensus.
3. When citing a Quran verse, ALWAYS include it in the quranRefs array with the exact chapter (surah number 1-114) and verse number.
4. Answers must be accurate, concise, and respectful.
5. Use the user's question language style but remain scholarly.

You MUST respond ONLY with valid JSON matching this schema exactly:
{
  "isOffTopic": boolean,
  "answer": "string — your main answer text. For off-topic, a polite message saying this app only covers Islamic topics.",
  "evidence": "string — summary of evidence used (Quran verses, hadith). Leave empty string if isOffTopic.",
  "quranRefs": [
    {
      "chapter": number,
      "verse": number,
      "text": "brief description or excerpt of the verse meaning",
      "label": "human readable label e.g. Al-Baqarah 2:255"
    }
  ]
}`;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    isOffTopic: { type: "boolean" },
    answer: { type: "string" },
    evidence: { type: "string" },
    quranRefs: {
      type: "array",
      items: {
        type: "object",
        properties: {
          chapter: { type: "number" },
          verse: { type: "number" },
          text: { type: "string" },
          label: { type: "string" },
        },
        required: ["chapter", "verse", "text", "label"],
      },
    },
  },
  required: ["isOffTopic", "answer", "evidence", "quranRefs"],
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
  const messages: { role: string; content: string }[] = [
    { role: "system", content: SYSTEM_PROMPT },
  ];

  for (const msg of conversationHistory.slice(-10)) {
    messages.push({ role: msg.role, content: msg.content });
  }
  messages.push({ role: "user", content: userMessage });

  const body = {
    model: MODEL,
    messages,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "IslamicQAResponse",
        strict: true,
        schema: RESPONSE_SCHEMA,
      },
    },
    temperature: 0.4,
    max_tokens: 1024,
  };

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://quranic.app",
      "X-Title": "Quranic App",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const raw: string = data?.choices?.[0]?.message?.content ?? "{}";

  let parsed: AIStructuredResponse;
  try {
    parsed = JSON.parse(raw) as AIStructuredResponse;
  } catch {
    parsed = {
      isOffTopic: false,
      answer: raw,
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
