export type Passage = {
  text: string;
};

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

  return new Response(
    JSON.stringify({
      passages: [],
      message: "Local Gita PDF content is disabled; using LLM-only guidance.",
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
