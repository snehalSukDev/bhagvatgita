import fs from "fs";
import path from "path";

export type Passage = {
  text: string;
};

let cachedPassages: Passage[] | null = null;

export async function loadPassages(): Promise<Passage[]> {
  if (cachedPassages) {
    return cachedPassages;
  }

  const pdfPath = path.join(
    process.cwd(),
    "src",
    "app",
    "Bhagavad-Gita-Hindi.pdf"
  );

  const fileBuffer = fs.readFileSync(pdfPath);
  const pdfModule: unknown = await import("pdf-parse");
  const moduleWithDefault = pdfModule as { default?: unknown };
  const maybeDefault = moduleWithDefault.default ?? pdfModule;
  const pdfParse = typeof maybeDefault === "function" ? maybeDefault : null;

  if (!pdfParse) {
    throw new Error("PDF parser not available");
  }

  const parsed = await pdfParse(fileBuffer);
  const raw = parsed.text || "";

  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const passages: Passage[] = [];
  let current = "";

  for (const line of lines) {
    const next = current ? current + " " + line : line;
    if (next.length > 400) {
      passages.push({ text: current });
      current = line;
    } else {
      current = next;
    }
  }

  if (current) {
    passages.push({ text: current });
  }

  cachedPassages = passages;
  return passages;
}

export function scorePassage(passage: Passage, query: string): number {
  const text = passage.text.toLowerCase();
  const tokens = query
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);

  let score = 0;
  for (const token of tokens) {
    if (text.includes(token)) {
      score += 1;
    }
  }
  return score;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const question =
    body && typeof body.question === "string" ? body.question : "";

  if (!question.trim()) {
    return new Response(
      JSON.stringify({ passages: [], message: "No question provided" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  let passages: Passage[];
  try {
    passages = await loadPassages();
  } catch {
    return new Response(
      JSON.stringify({
        passages: [],
        message: "Unable to read Gita PDF, using fallback guidance only",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const scored = passages
    .map((p, index) => ({
      passage: p,
      score: scorePassage(p, question),
      index,
    }))
    .filter((item) => item.score > 0);

  let top;
  if (scored.length === 0) {
    top = passages.slice(0, 3);
  } else {
    scored.sort((a, b) => b.score - a.score);
    top = scored.slice(0, 3).map((item) => item.passage);
  }

  return new Response(
    JSON.stringify({
      passages: top.map((p) => p.text),
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
