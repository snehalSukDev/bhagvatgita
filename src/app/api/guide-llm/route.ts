export const runtime = "nodejs";

type GuideLlmRequest = {
  message: string;
};

type GuideLlmResponse = {
  emotion: string;
  topic: string;
  response: string;
  reflectionQuestion: string;
  passages: string[];
};

async function callOllamaLlm(
  payload: GuideLlmRequest,
  passages: string[]
): Promise<GuideLlmResponse | null> {
  const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  const model = process.env.OLLAMA_LLM_MODEL || "llama3.2";

  const system =
    "You are a deeply empathetic counselor who blends modern mental health understanding with the wisdom of the Bhagavad Gita. " +
    "You must reply almost entirely in Hindi, using very simple, soothing, everyday Hindi words, like a caring elder or close friend. Avoid English sentences; only occasional single English terms or Sanskrit words are allowed when natural. " +
    "You occasionally weave in short Sanskrit lines from the shlokas in a respectful way. " +
    "Your task is to respond to the user in a way that feels calm, grounding, and non-judgmental. " +
    "Keep your response short and focused: 2–4 chhote, saaf paragraphs. " +
    "Always end with one gentle reflection question that the user can sit with. " +
    "You must respond strictly in JSON as described by the user message.";

  const contextBlock =
    passages.length > 0
      ? `Yah kuchh sambandhit Gita ke bhaag hain:\n\n${passages
          .map((p, index) => `(${index + 1}) ${p}`)
          .join("\n\n")}\n\n`
      : "";

  const userPrompt =
    `${contextBlock}` +
    `Upyogakarta ka sandesh (Hindi ya mix language ho sakta hai):\n"${payload.message}"\n\n` +
    "1. Pehle, unki bhavna ko bahut dhyaan se samjho aur seedhi, naram, thodi desi Hindi mein shabd do (jaise roz-ba-roz baat-cheet).\n" +
    "2. Phir, Gita ki drishti se, unki sthiti ko samjhaane ki koshish karo, jaise koi dayaalu mitra ya bada bhai/behna aaram se samjha raha ho.\n" +
    "3. Bhasha bahut hi naram, dhairya-poorn, dheemi aur tasalli dene wali ho. English vaakya mat likho.\n" +
    "4. Jawaab lamba mat banao: bas 2–4 chhote, saaf paragraphs rakho, taaki padhna halka lage.\n" +
    "5. Ant mein sirf ek reflection question do, jo unhe dheere se andar jhaankne mein madad kare, aur yeh question bhi seedhi Hindi mein ho.\n\n" +
    "Apna uttar sirf is JSON format mein do (koi extra text nahi):\n" +
    '{\n  "emotion": "string (Hindi)",\n  "topic": "string (Hindi)",\n  "response": "string (Hindi explanation)",\n  "reflectionQuestion": "string (Hindi question)"\n}';

  let res: Response;
  try {
    res = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        stream: false,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userPrompt },
        ],
      }),
    });
  } catch (err) {
    console.error("Ollama LLM network error:", err);
    return null;
  }

  if (!res.ok) {
    try {
      const errorBody = await res.text();
      console.error("Ollama LLM error:", res.status, errorBody);
    } catch {
      console.error("Ollama LLM error with unknown body", res.status);
    }
    return null;
  }

  const data = (await res.json()) as {
    message?: { content?: string };
  };

  const text =
    data.message && data.message.content ? data.message.content : null;

  if (!text) {
    return null;
  }

  let parsed: {
    emotion?: string;
    topic?: string;
    response?: string;
    reflectionQuestion?: string;
  };

  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }

  if (!parsed.response || !parsed.reflectionQuestion) {
    return null;
  }

  return {
    emotion: parsed.emotion || "Mixed",
    topic: parsed.topic || "Understanding your situation",
    response: parsed.response,
    reflectionQuestion: parsed.reflectionQuestion,
    passages,
  };
}

async function callOpenAiLlm(
  payload: GuideLlmRequest,
  passages: string[]
): Promise<GuideLlmResponse | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const model = process.env.OPENAI_LLM_MODEL || "gpt-4o";

  const system =
    "You are a deeply empathetic counselor who blends modern mental health understanding with the wisdom of the Bhagavad Gita. " +
    "You must reply almost entirely in Hindi, using very simple, soothing, everyday Hindi words, like a caring elder or close friend. Avoid English sentences; only occasional single English terms or Sanskrit words are allowed when natural. " +
    "You occasionally weave in short Sanskrit lines from the shlokas in a respectful way. " +
    "Your task is to respond to the user in a way that feels calm, grounding, and non-judgmental. " +
    "Keep your response short and focused: 2–4 chhote, saaf paragraphs. " +
    "Always end with one gentle reflection question that the user can sit with.";

  const contextBlock =
    passages.length > 0
      ? `Yah kuchh sambandhit Gita ke bhaag hain:\n\n${passages
          .map((p, index) => `(${index + 1}) ${p}`)
          .join("\n\n")}\n\n`
      : "";

  const userPrompt =
    `${contextBlock}` +
    `Upyogakarta ka sandesh (Hindi ya mix language ho sakta hai):\n"${payload.message}"\n\n` +
    "1. Pehle, unki bhavna ko bahut dhyaan se samjho aur seedhi, naram, thodi desi Hindi mein shabd do (jaise roz-ba-roz baat-cheet).\n" +
    "2. Phir, Gita ki drishti se, unki sthiti ko samjhaane ki koshish karo, jaise koi dayaalu mitra ya bada bhai/behna aaram se samjha raha ho.\n" +
    "3. Bhasha bahut hi naram, dhairya-poorn, dheemi aur tasalli dene wali ho. English vaakya mat likho.\n" +
    "4. Jawaab lamba mat banao: bas 2–4 chhote, saaf paragraphs rakho, taaki padhna halka lage.\n" +
    "5. Ant mein sirf ek reflection question do, jo unhe dheere se andar jhaankne mein madad kare, aur yeh question bhi seedhi Hindi mein ho.\n\n" +
    "Apna uttar sirf is JSON format mein do (koi extra text nahi):\n" +
    '{\n  "emotion": "string (Hindi)",\n  "topic": "string (Hindi)",\n  "response": "string (Hindi explanation)",\n  "reflectionQuestion": "string (Hindi question)"\n}';

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    try {
      const errorBody = await res.text();
      console.error("OpenAI LLM error:", res.status, errorBody);
    } catch {
      console.error("OpenAI LLM error with unknown body", res.status);
    }
    return null;
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  const content =
    data.choices &&
    data.choices[0] &&
    data.choices[0].message &&
    data.choices[0].message.content
      ? data.choices[0].message.content
      : null;

  if (!content) {
    return null;
  }

  let parsed: {
    emotion?: string;
    topic?: string;
    response?: string;
    reflectionQuestion?: string;
  };

  try {
    parsed = JSON.parse(content);
  } catch {
    return null;
  }

  if (!parsed.response || !parsed.reflectionQuestion) {
    return null;
  }

  return {
    emotion: parsed.emotion || "Mixed",
    topic: parsed.topic || "Understanding your situation",
    response: parsed.response,
    reflectionQuestion: parsed.reflectionQuestion,
    passages,
  };
}

async function callAnthropicLlm(
  payload: GuideLlmRequest,
  passages: string[]
): Promise<GuideLlmResponse | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return null;
  }

  const model = process.env.ANTHROPIC_LLM_MODEL || "claude-3-5-sonnet-20241022";

  const system =
    "You are a deeply empathetic counselor who blends modern mental health understanding with the wisdom of the Bhagavad Gita. " +
    "You must reply almost entirely in Hindi, using very simple, soothing, everyday Hindi words, like a caring elder or close friend. Avoid English sentences; only occasional single English terms or Sanskrit words are allowed when natural. " +
    "You occasionally weave in short Sanskrit lines from the shlokas in a respectful way. " +
    "Your task is to respond to the user in a way that feels calm, grounding, and non-judgmental. " +
    "Keep your response short and focused: 2–4 chhote, saaf paragraphs. " +
    "Always end with one gentle reflection question that the user can sit with. " +
    "You must respond strictly in JSON as described by the user message.";

  const contextBlock =
    passages.length > 0
      ? `Yah kuchh sambandhit Gita ke bhaag hain:\n\n${passages
          .map((p, index) => `(${index + 1}) ${p}`)
          .join("\n\n")}\n\n`
      : "";

  const userPrompt =
    `${contextBlock}` +
    `Upyogakarta ka sandesh (Hindi ya mix language ho sakta hai):\n"${payload.message}"\n\n` +
    "1. Pehle, unki bhavna ko bahut dhyaan se samjho aur seedhi, naram, thodi desi Hindi mein shabd do (jaise roz-ba-roz baat-cheet).\n" +
    "2. Phir, Gita ki drishti se, unki sthiti ko samjhaane ki koshish karo, jaise koi dayaalu mitra ya bada bhai/behna aaram se samjha raha ho.\n" +
    "3. Bhasha bahut hi naram, dhairya-poorn, dheemi aur tasalli dene wali ho. English vaakya mat likho.\n" +
    "4. Jawaab lamba mat banao: bas 2–4 chhote, saaf paragraphs rakho, taaki padhna halka lage.\n" +
    "5. Ant mein sirf ek reflection question do, jo unhe dheere se andar jhaankne mein madad kare, aur yeh question bhi seedhi Hindi mein ho.\n\n" +
    "Apna uttar sirf is JSON format mein do (koi extra text nahi):\n" +
    '{\n  "emotion": "string (Hindi)",\n  "topic": "string (Hindi)",\n  "response": "string (Hindi explanation)",\n  "reflectionQuestion": "string (Hindi question)"\n}';

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 800,
      system,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: userPrompt,
            },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    try {
      const errorBody = await res.text();
      console.error("Anthropic LLM error:", res.status, errorBody);
    } catch {
      console.error("Anthropic LLM error with unknown body", res.status);
    }
    return null;
  }

  const data = (await res.json()) as {
    content?: { type: string; text?: string }[];
  };

  const first =
    data.content && data.content.length > 0 ? data.content[0] : null;
  const text = first && first.type === "text" ? first.text : null;

  if (!text) {
    return null;
  }

  let parsed: {
    emotion?: string;
    topic?: string;
    response?: string;
    reflectionQuestion?: string;
  };

  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }

  if (!parsed.response || !parsed.reflectionQuestion) {
    return null;
  }

  return {
    emotion: parsed.emotion || "Mixed",
    topic: parsed.topic || "Understanding your situation",
    response: parsed.response,
    reflectionQuestion: parsed.reflectionQuestion,
    passages,
  };
}

export async function POST(request: Request) {
  const body = (await request
    .json()
    .catch(() => null)) as GuideLlmRequest | null;

  const message =
    body && typeof body.message === "string" ? body.message.trim() : "";

  if (!message) {
    return new Response("No message provided", { status: 400 });
  }

  const passageTexts: string[] = [];

  let result: GuideLlmResponse | null = null;

  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  const hasOpenAi = !!process.env.OPENAI_API_KEY;

  if (hasOpenAi) {
    result = await callOpenAiLlm({ message }, passageTexts);
  }
  if (!result) {
    result = await callOllamaLlm({ message }, passageTexts);
  }
  if (!result && hasAnthropic) {
    result = await callAnthropicLlm({ message }, passageTexts);
  }

  if (!result) {
    return new Response(
      JSON.stringify({
        error: "LLM_CALL_FAILED",
        message:
          "Tried contacting the LLM providers, but the calls failed. Please check API keys and network.",
      }),
      {
        status: 502,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
