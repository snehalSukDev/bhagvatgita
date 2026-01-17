export const runtime = "nodejs";

type VoiceRequest = {
  text: string;
  voiceId?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as VoiceRequest | null;

  const text = body && typeof body.text === "string" ? body.text.trim() : "";

  if (!text) {
    return new Response("No text provided", { status: 400 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  const bodyVoiceId =
    body && typeof body.voiceId === "string" && body.voiceId.trim().length > 0
      ? body.voiceId.trim()
      : undefined;
  const envVoiceId = process.env.ELEVENLABS_VOICE_ID;
  const voiceId = bodyVoiceId || envVoiceId || "qDuRKMlYmrm8trt5QyBn";

  if (!apiKey) {
    return new Response("TTS service not configured", { status: 500 });
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_turbo_v2_5",
        voice_settings: {
          stability: 0.9,
          similarity_boost: 0.9,
          style: 0.05,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!response.ok) {
    return new Response("TTS request failed", { status: 502 });
  }

  const audioBuffer = await response.arrayBuffer();

  return new Response(Buffer.from(audioBuffer), {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
