"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import gitaBackground from "@/assests/images/ai-generated-9210397_1920.jpg";

type Verse = {
  reference: string;
  sanskrit: string;
  translation: string;
};

type GuideResponse = {
  emotion: string;
  topic: string;
  verse: Verse;
  response: string;
  reflectionQuestion: string;
  isCrisis: boolean;
};

const CRISIS_KEYWORDS: string[] = [
  "suicide",
  "kill myself",
  "end my life",
  "self-harm",
  "self harm",
  "cut myself",
  "die",
];

function detectCrisis(text: string): boolean {
  const lowered = text.toLowerCase();
  return CRISIS_KEYWORDS.some((keyword) => lowered.includes(keyword));
}

function basicEmotionAndTopic(text: string): {
  emotion: string;
  topic: string;
} {
  const lowered = text.toLowerCase();
  if (
    ["worthless", "ashamed", "shame", "embarrassed"].some((w) =>
      lowered.includes(w)
    )
  ) {
    return {
      emotion: "Shame / Low self-worth",
      topic: "Failure and self-worth",
    };
  }
  if (
    ["failed", "exam", "results", "marks", "score"].some((w) =>
      lowered.includes(w)
    )
  ) {
    return {
      emotion: "Disappointment",
      topic: "Failure and attachment to results",
    };
  }
  if (
    ["anxious", "anxiety", "stressed", "pressure"].some((w) =>
      lowered.includes(w)
    )
  ) {
    return {
      emotion: "Anxiety",
      topic: "Overthinking outcomes",
    };
  }
  if (
    ["breakup", "relationship", "heartbroken", "alone"].some((w) =>
      lowered.includes(w)
    )
  ) {
    return {
      emotion: "Grief / Loneliness",
      topic: "Attachment and relationships",
    };
  }
  if (
    ["tired", "giving up", "give up", "exhausted"].some((w) =>
      lowered.includes(w)
    )
  ) {
    return {
      emotion: "Exhaustion / Hopelessness",
      topic: "Perseverance and purpose",
    };
  }
  return {
    emotion: "Unclear / Mixed",
    topic: "Understanding your situation",
  };
}

const VERSE_KARMA_YOGA: Verse = {
  reference: "Chapter 2, Verse 47",
  sanskrit:
    "karmaṇy evādhikāras te\nmā phaleṣu kadācana\nmā karma-phala-hetur bhūr\nmā te saṅgo 'stv akarmaṇi",
  translation:
    "You have a right to perform your prescribed duties, but you are not entitled to the fruits of your actions. Never consider yourself the cause of the results of your activities, and never be attached to not doing your duty.",
};

const VERSE_STEADY_MIND: Verse = {
  reference: "Chapter 2, Verse 48",
  sanskrit:
    "yoga-sthaḥ kuru karmāṇi\nsaṅgaṁ tyaktvā dhanañjaya\nsiddhy-asiddhyoḥ samo bhūtvā\nsamatvaṁ yoga ucyate",
  translation:
    "Perform your duties, O Arjuna, being steadfast in yoga, abandoning attachment, and remaining even-minded in success and failure. Such equanimity is called yoga.",
};

const VERSE_GENERAL_CONSOLATION: Verse = {
  reference: "Chapter 18, Verse 66",
  sanskrit:
    "sarva-dharmān parityajya\nmām ekaṁ śaraṇaṁ vraja\nahaṁ tvāṁ sarva-pāpebhyo\nmokṣayiṣyāmi mā śucaḥ",
  translation:
    "Abandon all varieties of duty and simply surrender unto Me. I shall deliver you from all sinful reactions. Do not fear.",
};

function chooseVerse(text: string): Verse {
  const lowered = text.toLowerCase();
  if (
    [
      "results",
      "marks",
      "score",
      "promotion",
      "job",
      "interview",
      "hard work",
      "failed",
    ].some((w) => lowered.includes(w))
  ) {
    return VERSE_KARMA_YOGA;
  }
  if (
    [
      "anxious",
      "anxiety",
      "stress",
      "stressed",
      "pressure",
      "overthinking",
    ].some((w) => lowered.includes(w))
  ) {
    return VERSE_STEADY_MIND;
  }
  return VERSE_GENERAL_CONSOLATION;
}

function buildExplanation(message: string): GuideResponse {
  if (detectCrisis(message)) {
    const crisisText =
      "Your life is precious, and the pain you are feeling right now is very real. " +
      "I am a spiritual companion, not a doctor or emergency service, so I cannot safely guide you alone through thoughts of self-harm or suicide.\n\n" +
      "In the spirit of the Bhagavad Gita, your life is a sacred journey, even when the path feels unbearably dark. Please reach out right now to someone who can hold you in this moment:\n\n" +
      "• If you are in immediate danger, contact your local emergency number.\n" +
      "• Call a trusted mental health helpline in your country.\n" +
      "• Speak to a therapist, counselor, or a trusted person in your life.\n\n" +
      "You do not have to carry this alone. Reaching out is an act of courage, not weakness.";

    return {
      emotion: "Crisis / Self-harm risk",
      topic: "Immediate safety and support",
      verse: VERSE_GENERAL_CONSOLATION,
      response: crisisText,
      reflectionQuestion:
        "Who is one safe, caring person or service you can reach out to right now?",
      isCrisis: true,
    };
  }

  const { emotion, topic } = basicEmotionAndTopic(message);
  const verse = chooseVerse(message);

  let responseText: string;
  let reflection: string;

  if (verse.reference === VERSE_KARMA_YOGA.reference) {
    responseText =
      "It sounds like you have been pouring your heart into your efforts and the outcome has left you feeling defeated. " +
      "In modern life, this often looks like studying hard for an exam, giving everything to a project, or trying sincerely in a job or relationship, only to see results that feel unfair.\n\n" +
      "In this verse, Krishna gently reminds Arjuna that our true power lies in the sincerity and integrity of our actions, not in the final scoreboard of success or failure. " +
      "Imagine someone training for months for a race. On the day of the event, unexpected rain slows them down and they do not win. From the world's perspective, they 'lost'. " +
      "But from the Gita's perspective, every disciplined morning, every moment of honest effort, and every bit of growth in character was already a deep success.\n\n" +
      "This verse invites you to loosen the tight knot between your self-worth and your latest result. Your effort, courage, and sincerity are meaningful, even when the outcome does not match your hopes.";
    reflection =
      "If you gently separated your value as a person from this one result, what would you allow yourself to see and appreciate about your effort?";
  } else if (verse.reference === VERSE_STEADY_MIND.reference) {
    responseText =
      "You seem to be carrying a mind that keeps swinging between hope and fear, success and failure in your imagination. " +
      "In modern terms, it is like refreshing exam results, email, or messages again and again, living in a storm of 'what if'.\n\n" +
      "Krishna describes yoga here as a steady inner state where you still act with care, but you are not constantly tossed around by the fear of failure or the hunger for praise. " +
      "Picture yourself working on a long-term project: instead of obsessing over how others will judge the final outcome, you bring your attention back to doing the next small step well, with calm breathing and a quieter heart.\n\n" +
      "The verse is not asking you to stop caring; it is inviting you to care from a grounded, centered place rather than from panic.";
    reflection =
      "What is one small action you can take today with a steadier mind, focusing on the step itself rather than the outcome?";
  } else {
    responseText =
      "You may be feeling lost, guilty, or unsure about where your life is heading. " +
      "When everything feels heavy, it is easy to think you must solve everything alone.\n\n" +
      "In this verse, Krishna offers a deep reassurance: you do not have to carry the entire universe on your shoulders. " +
      "Just as a child can rest when held by someone they trust, you are invited to lean into something higher than your present confusion—whether you call it God, the universe, or a quiet, guiding wisdom within.\n\n" +
      "This is not an instruction to run away from responsibilities. It is a reminder that you are supported, even when you cannot see the full picture yet.";
    reflection =
      "If you allowed yourself to be gently supported for a moment, what burden would you admit is too heavy to carry alone?";
  }

  return {
    emotion,
    topic,
    verse,
    response: responseText,
    reflectionQuestion: reflection,
    isCrisis: false,
  };
}

export default function Home() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [guide, setGuide] = useState<GuideResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceId, setVoiceId] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fluteRef = useRef<HTMLAudioElement | null>(null);

  const canSpeak = useMemo(
    () => typeof window !== "undefined" && "speechSynthesis" in window,
    []
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    return () => {
      window.speechSynthesis.cancel();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
      if (fluteRef.current) {
        fluteRef.current.pause();
        fluteRef.current.src = "";
        fluteRef.current = null;
      }
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    setError(null);
    setGuide(null);
    try {
      const base = buildExplanation(message);
      let enriched = base;

      try {
        const res = await fetch("/api/gita-search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ question: message }),
        });
        if (res.ok) {
          const payload: { passages?: string[] } = await res.json();
          const first = payload.passages && payload.passages[0];
          if (first) {
            enriched = {
              ...base,
              verse: {
                ...base.verse,
                sanskrit: first,
              },
            };
          }
        }
      } catch {}

      try {
        const res = await fetch("/api/guide-llm", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message }),
        });
        if (res.ok) {
          const llm = (await res.json()) as {
            emotion?: string;
            topic?: string;
            response?: string;
            reflectionQuestion?: string;
            passages?: string[];
          };
          enriched = {
            ...enriched,
            emotion: llm.emotion || enriched.emotion,
            topic: llm.topic || enriched.topic,
            response: llm.response || enriched.response,
            reflectionQuestion:
              llm.reflectionQuestion || enriched.reflectionQuestion,
            verse: {
              ...enriched.verse,
              sanskrit:
                (llm.passages && llm.passages[0]) || enriched.verse.sanskrit,
            },
          };
        }
      } catch {}

      setGuide(enriched);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to reach your spiritual guide right now."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSpeak() {
    if (!guide) return;
    const text = `${guide.verse.sanskrit}\n\n${guide.response} Reflection: ${guide.reflectionQuestion}`;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    setIsSpeaking(true);
    if (!fluteRef.current) {
      fluteRef.current = new Audio("/assests/audio/krishna-flute.mp3");
      fluteRef.current.loop = true;
      fluteRef.current.volume = 0.25;
    }
    try {
      fluteRef.current.currentTime = 0;
      void fluteRef.current.play();
    } catch {}
    try {
      const payload: { text: string; voiceId?: string } = { text };
      if (voiceId.trim().length > 0) {
        payload.voiceId = voiceId.trim();
      }
      const res = await fetch("/api/voice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error("tts_failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.playbackRate = 0.8;
      audioRef.current = audio;
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(url);
        audioRef.current = null;
        if (fluteRef.current) {
          fluteRef.current.pause();
        }
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(url);
        audioRef.current = null;
        if (fluteRef.current) {
          fluteRef.current.pause();
        }
      };
      await audio.play();
    } catch {
      if (!canSpeak || typeof window === "undefined") {
        setIsSpeaking(false);
        return;
      }
      const synthesis = window.speechSynthesis;
      synthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = synthesis.getVoices();
      const hindiVoice =
        voices.find((v) => v.lang.toLowerCase().startsWith("hi")) ||
        voices.find((v) => v.name.toLowerCase().includes("hindi"));
      if (hindiVoice) {
        utterance.voice = hindiVoice;
        utterance.lang = hindiVoice.lang;
      } else {
        utterance.lang = "hi-IN";
      }
      utterance.rate = 0.7;
      utterance.pitch = 0.75;
      utterance.onend = () => {
        setIsSpeaking(false);
        if (fluteRef.current) {
          fluteRef.current.pause();
        }
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        if (fluteRef.current) {
          fluteRef.current.pause();
        }
      };
      synthesis.speak(utterance);
    }
  }

  function stopSpeaking() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (canSpeak) {
      window.speechSynthesis.cancel();
    }
    if (fluteRef.current) {
      fluteRef.current.pause();
      fluteRef.current.currentTime = 0;
    }
    setIsSpeaking(false);
  }

  return (
    <div className="sacred-background flex min-h-screen items-center justify-center px-4 py-8 text-zinc-50">
      <Image
        src={gitaBackground}
        alt=""
        fill
        priority
        className="pointer-events-none -z-10 object-cover opacity-40"
      />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 rounded-3xl bg-white/10 p-6 shadow-[0_0_40px_rgba(15,23,42,0.9)] backdrop-blur-3xl ring-1 ring-white/10 md:p-10">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-300">
              Bhagavad Gita Companion
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-50 md:text-4xl">
              A compassionate translator for your heart
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-300 md:text-base">
              Share how you feel in everyday language. The app will listen like
              a psychologist, search the Gita like a librarian, and respond like
              a gentle guide.
            </p>
          </div>
          <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-amber-200 ring-1 ring-amber-200/40">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
            Live reflection space
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 rounded-2xl bg-black/40 p-4 ring-1 ring-white/10 md:p-6"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-zinc-50 md:text-base">
                  What is your heart carrying today?
                </h2>
                <p className="text-xs text-zinc-400 md:text-sm">
                  Be honest and specific. Your words become the bridge to the
                  right verse.
                </p>
              </div>
              <span className="rounded-full bg-amber-500/10 px-3 py-1 text-[10px] font-medium uppercase tracking-wide text-amber-200 ring-1 ring-amber-500/40">
                Private & local
              </span>
            </div>
            <textarea
              className="min-h-[140px] resize-none rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-zinc-50 outline-none ring-1 ring-transparent placeholder:text-zinc-500 focus:border-amber-400/60 focus:ring-amber-400/40 md:px-4 md:py-4 md:text-base"
              placeholder='For example: "I feel like giving up. I worked so hard and still failed."'
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            {error && (
              <p className="text-xs font-medium text-rose-300 md:text-sm">
                {error}
              </p>
            )}
            <div className="flex flex-col gap-3 pt-1 md:flex-row md:items-center md:justify-between">
              <p className="text-[11px] text-zinc-400 md:text-xs">
                This is not medical advice. If you feel unsafe, contact a
                professional or helpline immediately.
              </p>
              <div className="flex flex-col items-stretch gap-2 md:flex-row md:items-center">
                <input
                  className="w-full rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-zinc-100 outline-none ring-1 ring-transparent placeholder:text-zinc-500 focus:border-amber-400/60 focus:ring-amber-400/40 md:w-48"
                  placeholder="Optional: ElevenLabs voice id"
                  value={voiceId}
                  onChange={(e) => setVoiceId(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-400 px-4 py-2 text-xs font-semibold text-zinc-950 shadow-[0_12px_30px_rgba(251,191,36,0.45)] transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-zinc-600 disabled:shadow-none md:px-6 md:py-2.5 md:text-sm"
                >
                  {loading && (
                    <span className="h-2 w-2 animate-ping rounded-full bg-zinc-900" />
                  )}
                  {loading ? "Listening to your heart..." : "Seek guidance"}
                </button>
              </div>
            </div>
          </form>

          <div className="flex flex-col gap-4 rounded-2xl bg-white/5 p-4 ring-1 ring-white/15 md:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-zinc-50 md:text-base">
                The Gita&apos;s reflection for you
              </h2>
              <div className="inline-flex items-center gap-2 rounded-full bg-black/40 px-3 py-1 text-[11px] text-zinc-300 ring-1 ring-white/10">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.9)]" />
                Emotion-aware guidance
              </div>
            </div>

            {!guide && !loading && (
              <div className="rounded-xl border border-dashed border-white/15 bg-black/30 px-4 py-5 text-sm text-zinc-300">
                <p>
                  Your space is ready. When you share, the app will gently name
                  your emotion, bring a verse from the Bhagavad Gita, and offer
                  a modern explanation with a question to sit with.
                </p>
              </div>
            )}

            {guide && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-2 text-[11px] md:text-xs">
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-200 ring-1 ring-emerald-400/40">
                    Emotion: {guide.emotion}
                  </span>
                  <span className="rounded-full bg-sky-500/10 px-3 py-1 text-sky-200 ring-1 ring-sky-400/40">
                    Theme: {guide.topic}
                  </span>
                  {guide.isCrisis && (
                    <span className="rounded-full bg-rose-500/15 px-3 py-1 text-rose-100 ring-1 ring-rose-500/60">
                      Safety first
                    </span>
                  )}
                </div>

                <div className="rounded-2xl bg-black/50 p-4 ring-1 ring-white/10">
                  <p className="text-xs uppercase tracking-[0.2em] text-amber-200">
                    Shloka
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    {guide.verse.reference}
                  </p>
                  <p className="mt-3 shloka-text text-base leading-relaxed text-amber-100 md:text-lg">
                    {guide.verse.sanskrit}
                  </p>
                  <p className="mt-3 text-sm text-zinc-200 md:text-base">
                    {guide.verse.translation}
                  </p>
                </div>

                <div className="space-y-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                  <p className="text-xs uppercase tracking-[0.2em] text-sky-200">
                    Gentle explanation
                  </p>
                  <p className="text-sm leading-relaxed text-zinc-100 md:text-base">
                    {guide.response}
                  </p>
                  <p className="mt-2 text-xs font-medium text-amber-100 md:text-sm">
                    Reflection: {guide.reflectionQuestion}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={isSpeaking ? stopSpeaking : handleSpeak}
                    disabled={!canSpeak}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-zinc-50 ring-1 ring-white/30 transition hover:bg-white/20 disabled:cursor-not-allowed disabled:bg-zinc-600/60 md:px-5 md:py-2.5 md:text-sm"
                  >
                    <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
                    {canSpeak
                      ? isSpeaking
                        ? "Pause the divine voice"
                        : "Listen in a soothing Hindi AI voice"
                      : "Voice not available in this browser"}
                  </button>
                  <p className="text-[11px] text-zinc-400 md:text-xs">
                    Close your eyes, breathe slowly, and let the words sink in.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        <footer className="mt-2 flex flex-col items-start justify-between gap-3 text-[11px] text-zinc-400 md:flex-row md:items-center md:text-xs">
          <p>
            Built for gentle, high-quality reflection at the intersection of
            mental health and spiritual wisdom.
          </p>
          <p className="text-[10px] md:text-[11px]">
            Morning idea: send yourself a 6:00 AM verse and reflection to start
            the day grounded.
          </p>
        </footer>
      </main>
    </div>
  );
}
