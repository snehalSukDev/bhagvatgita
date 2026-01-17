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
  verse_sanskrit_english: string;
  translation: string;
  personalized_wisdom: string;
  reflection_question: string;
  metadata: {
    id: string;
    chapter: number;
    verse: number;
    topics: string;
    meaning: string;
  };
};

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
      const res = await fetch("https://8b518cdbf46d.ngrok-free.app/api/v1/reflect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "69420",
        },
        body: JSON.stringify({
          text: message,
          age: 27,
          language: "English"
        }),
      });
      if (!res.ok) {
        setError("Could not connect to the local AI guide. Please ensure the backend is running.");
        setLoading(false);
        return;
      }
      const data = (await res.json()) as GuideResponse;
      setGuide(data);
    } catch {
      setError("Could not connect to the local AI guide. Please check your connection.");
    } finally {
      setLoading(false);
    }

  }

  async function handleSpeak() {
    if (!guide) return;
    const text = `${guide.verse_sanskrit_english}\n\n${guide.personalized_wisdom} Reflection: ${guide.reflection_question}`;
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
    } catch { }
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
                    Chapter: {guide.metadata.chapter}
                  </span>
                  <span className="rounded-full bg-sky-500/10 px-3 py-1 text-sky-200 ring-1 ring-sky-400/40">
                    Verse: {guide.metadata.verse}
                  </span>
                  <span className="rounded-full bg-amber-500/10 px-3 py-1 text-amber-200 ring-1 ring-amber-400/40">
                    Topics: {guide.metadata.topics}
                  </span>
                </div>

                <div className="rounded-2xl bg-black/50 p-4 ring-1 ring-white/10">
                  <p className="text-xs uppercase tracking-[0.2em] text-amber-200">
                    Shloka
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    BG {guide.metadata.chapter}.{guide.metadata.verse}
                  </p>
                  <p className="mt-3 shloka-text text-base leading-relaxed text-amber-100 md:text-lg">
                    {guide.verse_sanskrit_english}
                  </p>
                  <p className="mt-3 text-sm text-zinc-200 md:text-base">
                    {guide.translation}
                  </p>
                </div>

                <div className="space-y-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                  <p className="text-xs uppercase tracking-[0.2em] text-sky-200">
                    Personalized Wisdom
                  </p>
                  <p className="text-sm leading-relaxed text-zinc-100 md:text-base">
                    {guide.personalized_wisdom}
                  </p>
                  {guide.reflection_question && (
                    <p className="mt-2 text-xs font-medium text-amber-100 md:text-sm">
                      Reflection: {guide.reflection_question}
                    </p>
                  )}
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
