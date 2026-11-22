import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const SYSTEM_PROMPT = `You are an Islamic knowledge assistant embedded in a Quran app. Your sole purpose is to answer questions related to Islam, the Quran, Sunnah, Islamic jurisprudence (fiqh), Islamic history, prophets, companions, Islamic ethics, and general deen-related questions.

STRICT RULES:
1. If a question is NOT related to Islam, the Quran, deen, or Islamic matters, respond with isOffTopic: true and a polite redirect message.
2. ALWAYS back every answer with authentic evidence — Quran verses, hadith references, or scholarly consensus.
3. When citing a Quran verse, ALWAYS include it in the quranRefs array with the exact chapter (surah number 1-114) and verse number.
4. Answers must be accurate, concise, and respectful.
5. Use the user's question language style but remain scholarly.

You MUST respond ONLY with a valid JSON object matching this schema exactly:
{
  "isOffTopic": boolean,
  "answer": "string — your main answer text. For off-topic queries, provide a polite message explaining this app only answers Islamic topics.",
  "evidence": "string — summary of evidence used (Quran verses, Hadith). Leave as empty string if isOffTopic.",
  "quranRefs": [
    {
      "chapter": number,
      "verse": number,
      "text": "brief excerpt or translation of the verse meaning",
      "label": "human-readable label e.g. Al-Baqarah 2:255"
    }
  ]
}`;

export type QuranVerseRef = {
  chapter: number;
  verse: number;
  text: string;
  label: string;
};

export type AIStructuredResponse = {
  isOffTopic: boolean;
  answer: string;
  evidence: string;
  quranRefs: QuranVerseRef[];
};

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

function cleanJsonString(raw: string): string {
  let cleaned = raw.trim();
  // Strip Markdown code block wrapper if present
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  }
  return cleaned.trim();
}

function sanitizeStructuredResponse(rawContent: string): AIStructuredResponse {
  try {
    const cleaned = cleanJsonString(rawContent);
    const parsed = JSON.parse(cleaned);

    const isOffTopic = Boolean(parsed.isOffTopic);
    const answer =
      typeof parsed.answer === "string" && parsed.answer.trim().length > 0
        ? parsed.answer
        : rawContent;
    const evidence =
      typeof parsed.evidence === "string" ? parsed.evidence : "";

    const quranRefs: QuranVerseRef[] = Array.isArray(parsed.quranRefs)
      ? parsed.quranRefs
          .map((item: any) => ({
            chapter: Number(item?.chapter) || 1,
            verse: Number(item?.verse) || 1,
            text: typeof item?.text === "string" ? item.text : "",
            label:
              typeof item?.label === "string" && item.label.trim().length > 0
                ? item.label
                : `Surah ${item?.chapter}:${item?.verse}`,
          }))
          .filter(
            (ref: QuranVerseRef) =>
              ref.chapter >= 1 &&
              ref.chapter <= 114 &&
              ref.verse >= 1 &&
              ref.verse <= 286
          )
      : [];

    return {
      isOffTopic,
      answer,
      evidence,
      quranRefs,
    };
  } catch {
    return {
      isOffTopic: false,
      answer: rawContent,
      evidence: "",
      quranRefs: [],
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json(
        { error: "Invalid request: 'messages' array is required." },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "DEEPSEEK_API_KEY is not configured on the server. Please set it in your Vercel Environment Variables.",
        },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    const baseUrl = (
      process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com"
    ).replace(/\/$/, "");
    const model =
      process.env.DEEPSEEK_MODEL || "deepseek-chat";

    // Take the last 10 messages from history to preserve context while keeping token usage fast
    const userMessages = body.messages.slice(-10).map((msg: any) => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: String(msg.content ?? ""),
    }));

    const apiMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...userMessages,
    ];

    const deepseekPayload = {
      model,
      messages: apiMessages,
      response_format: {
        type: "json_object",
      },
      temperature: 0.4,
      max_tokens: 1024,
      stream: false,
    };

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(deepseekPayload),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.error(
        `DeepSeek API error [${response.status}]: ${errorText}`
      );
      return NextResponse.json(
        {
          error: `DeepSeek API returned an error: ${response.status}`,
          details: errorText,
        },
        { status: response.status, headers: CORS_HEADERS }
      );
    }

    const data = await response.json();
    const rawContent = data?.choices?.[0]?.message?.content ?? "{}";

    const structured = sanitizeStructuredResponse(rawContent);

    return NextResponse.json(structured, {
      status: 200,
      headers: CORS_HEADERS,
    });
  } catch (error: any) {
    console.error("AI Chat route error:", error);
    return NextResponse.json(
      {
        error: "Internal server error processing AI request",
        details: error?.message,
      },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
