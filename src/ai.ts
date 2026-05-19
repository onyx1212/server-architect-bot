import OpenAI from "openai";

const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env["OPENROUTER_API_KEY"],
});

const groq = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env["GROQ_API_KEY"],
});

const OPENROUTER_MODEL = "openai/gpt-4o-mini";
const GROQ_CHAT_MODEL = "llama-3.3-70b-versatile";
const GROQ_MOD_MODEL = "llama-3.1-8b-instant";

export async function chat(
  messages: OpenAI.ChatCompletionMessageParam[],
  useGroq = false
): Promise<string> {
  const client = useGroq ? groq : openrouter;
  const model = useGroq ? GROQ_CHAT_MODEL : OPENROUTER_MODEL;
  try {
    const res = await client.chat.completions.create({ model, messages });
    return res.choices[0]?.message?.content ?? "";
  } catch (err) {
    if (!useGroq) {
      console.warn("OpenRouter failed, falling back to Groq:", err);
      return chat(messages, true);
    }
    throw err;
  }
}

export async function moderate(
  content: string
): Promise<{ toxic: boolean; reason?: string }> {
  try {
    const res = await groq.chat.completions.create({
      model: GROQ_MOD_MODEL,
      messages: [
        {
          role: "system",
          content:
            'You are a strict content moderation AI. Reply ONLY with valid JSON like {"toxic":true,"reason":"..."} or {"toxic":false}. Flag: profanity, hate speech, harassment, threats, extreme insults.',
        },
        {
          role: "user",
          content: `Evaluate this Discord message: "${content.slice(0, 500)}"`,
        },
      ],
      max_tokens: 80,
    });
    const text = res.choices[0]?.message?.content?.trim() ?? '{"toxic":false}';
    const jsonMatch = text.match(/\{.*\}/s);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return { toxic: false };
  } catch {
    return { toxic: false };
  }
}
