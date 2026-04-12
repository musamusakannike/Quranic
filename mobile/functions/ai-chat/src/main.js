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

export default async ({ req, res, log, error }) => {
  log("AI Chat function invoked");

  if (req.method !== "POST") {
    return res.json({ error: "Method not allowed" }, 405);
  }

  const { messages } = req.bodyJson || {};

  if (!messages || !Array.isArray(messages)) {
    error("Invalid request: messages array required");
    return res.json({ error: "messages array is required" }, 400);
  }

  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  const MODEL = process.env.AI_MODEL || "google/gemini-2.0-flash-lite-001";

  if (!OPENROUTER_API_KEY) {
    error("OPENROUTER_API_KEY not configured");
    return res.json({ error: "AI service not configured" }, 500);
  }

  const apiMessages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages,
  ];

  const body = {
    model: MODEL,
    messages: apiMessages,
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

  try {
    log("Calling OpenRouter API...");
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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
      error(`OpenRouter error ${response.status}: ${errText}`);
      return res.json({ error: "AI service error" }, 500);
    }

    const data = await response.json();
    const rawContent = data?.choices?.[0]?.message?.content ?? "{}";

    let parsed;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      parsed = {
        isOffTopic: false,
        answer: rawContent,
        evidence: "",
        quranRefs: [],
      };
    }

    log("AI response generated successfully");
    return res.json(parsed);
  } catch (err) {
    error("Exception in AI function: " + err.message);
    return res.json({ error: "Internal server error" }, 500);
  }
};
