import { loadPassages, scorePassage, type Passage } from "../gita-search/route";

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

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  const length = Math.min(a.length, b.length);
  for (let i = 0; i < length; i += 1) {
    const av = a[i];
    const bv = b[i];
    dot += av * bv;
    normA += av * av;
    normB += bv * bv;
  }
  if (normA === 0 || normB === 0) {
    return 0;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function pickPassagesWithEmbeddings(
  question: string,
  candidates: Passage[]
): Promise<Passage[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || candidates.length === 0) {
    return candidates.slice(0, 3);
  }

  const model = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";

  const input = [question, ...candidates.map((p) => p.text)];

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input,
    }),
  });

  if (!res.ok) {
    return candidates.slice(0, 3);
  }

  const data = (await res.json()) as {
    data?: { embedding: number[] }[];
  };

  if (!data.data || data.data.length < 2) {
    return candidates.slice(0, 3);
  }

  const [questionEmbedding, ...passageEmbeddings] = data.data;

  const scored = passageEmbeddings.map((item, index) => {
    const similarity = cosineSimilarity(
      questionEmbedding.embedding,
      item.embedding
    );
    return {
      index,
      similarity,
    };
  });

  scored.sort((a, b) => b.similarity - a.similarity);

  const top = scored.slice(0, 3);

  return top.map((t) => candidates[t.index]);
}

async function buildContextPassages(
  question: string
): Promise<Passage[] | null> {
  try {
    const passages = await loadPassages();
    const scored = passages
      .map((p, index) => ({
        passage: p,
        score: scorePassage(p, question),
        index,
      }))
      .filter((item) => item.score > 0);

    let candidates: Passage[];
    if (scored.length === 0) {
      candidates = passages.slice(0, 30);
    } else {
      scored.sort((a, b) => b.score - a.score);
      candidates = scored.slice(0, 30).map((item) => item.passage);
    }

    const topWithEmbeddings = await pickPassagesWithEmbeddings(
      question,
      candidates
    );
    return topWithEmbeddings;
  } catch {
    return null;
  }
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

  const contextPassages = await buildContextPassages(message);
  const passageTexts =
    contextPassages && contextPassages.length > 0
      ? contextPassages.map((p) => p.text)
      : [];

  let result: GuideLlmResponse | null = null;

  result = await callAnthropicLlm({ message }, passageTexts);
  if (!result) {
    result = await callOpenAiLlm({ message }, passageTexts);
  }

  if (!result) {
    return new Response("No LLM configured", { status: 500 });
  }

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
