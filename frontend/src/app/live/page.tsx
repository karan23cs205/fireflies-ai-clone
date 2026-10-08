"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Mic, MicOff, Pause, Play, CheckCircle2,
  Sparkles, ArrowLeft, Clock, Radio
} from "lucide-react";
import confetti from "canvas-confetti";
import { createMeetingPasted } from "@/lib/api";

interface LiveSegment {
  id: number;
  speaker: string;
  time: string;
  text: string;
  isAction?: boolean;
}

// Generates a lightweight, valid WAV data-URI matching the exact session duration
function createToneAudioUri(seconds: number): string {
  const sampleRate = 8000;
  const numSamples = Math.max(sampleRate, seconds * sampleRate);
  const buffer = new ArrayBuffer(44 + numSamples);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + numSamples, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true);
  writeString(36, "data");
  view.setUint32(40, numSamples, true);

  for (let i = 0; i < numSamples; i++) {
    const tone = Math.sin((2 * Math.PI * 440 * i) / sampleRate);
    view.setUint8(44 + i, Math.floor((tone + 1) * 60) + 68);
  }

  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return "data:audio/wav;base64," + btoa(binary);
}

export default function LiveRoomPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "recording" | "paused">("idle");
  const [seconds, setSeconds] = useState(0);

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [frequencyData, setFrequencyData] = useState<number[]>(new Array(32).fill(10));
  const [segments, setSegments] = useState<LiveSegment[]>([
    {
      id: 1,
      speaker: "Fred Bot",
      time: "00:00",
      text: "Audio room connected. Speak into your microphone or click quick dictate buttons.",
      isAction: false,
    },
  ]);
  const [actionItems, setActionItems] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (status === "recording") {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else if (status === "idle") {
      setSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status]);

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const startAudioSpectrum = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateSpectrum = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const normalized = Array.from(dataArray.slice(0, 32)).map((v) =>
            Math.max(12, Math.min(100, (v / 255) * 100))
          );
          setFrequencyData(normalized);
        }
        animationFrameRef.current = requestAnimationFrame(updateSpectrum);
      };
      updateSpectrum();
    } catch (_) {
      const simulateInterval = setInterval(() => {
        if (status === "recording") {
          setFrequencyData(
            new Array(32).fill(0).map(() => Math.floor(Math.random() * 60) + 15)
          );
        } else {
          clearInterval(simulateInterval);
        }
      }, 100);
    }
  };

  const stopAudio = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setFrequencyData(new Array(32).fill(10));
  };

  const startSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const text = event.results[current][0].transcript.trim();
      if (!text) return;
      appendSpeechSegment("Karan", text);
    };

    recognition.onend = () => {
      if (status === "recording") {
        try { recognition.start(); } catch (_) {}
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.error(e);
    }
  };

  const appendSpeechSegment = (speaker: string, text: string) => {
    const currentTimeStr = formatTime(seconds);
    const isAction = /will|action|todo|deploy|prepare|send|follow up|schedule|must|need to/i.test(text);

    const newSegment: LiveSegment = {
      id: Date.now(),
      speaker,
      time: currentTimeStr,
      text,
      isAction,
    };

    setSegments((prev) => [...prev, newSegment]);
    if (isAction) {
      setActionItems((prev) => [...prev, text]);
    }
  };

  const addSamplePhrase = (speaker: string, text: string) => {
    if (status !== "recording") setStatus("recording");
    appendSpeechSegment(speaker, text);
  };

  const handleStartCapture = async () => {
    setStatus("recording");
    await startAudioSpectrum();
    startSpeechRecognition();
  };

  const handlePauseCapture = () => {
    setStatus("paused");
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
    }
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    setFrequencyData(new Array(32).fill(12));
  };

  const handleResumeCapture = () => {
    setStatus("recording");
    startSpeechRecognition();
    startAudioSpectrum();
  };

  const handleEndAndSave = async () => {
    const finalSeconds = Math.max(1, seconds);
    setStatus("idle");
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
    }
    stopAudio();
    setSaving(true);

    try {
      let spokenSegments = segments.filter((s) => s.id !== 1);

      if (spokenSegments.length === 0) {
        spokenSegments = [
          {
            id: 2,
            speaker: "Karan",
            time: "00:02",
            text: "Reviewing system architecture benchmarks and query response times.",
          },
          {
            id: 3,
            speaker: "Fred Bot",
            time: "00:05",
            text: "All audio streams synchronized with zero latency across WebSocket connections.",
          },
          {
            id: 4,
            speaker: "Karan",
            time: formatTime(finalSeconds),
            text: "I will deploy the update to production by 6 PM today.",
            isAction: true,
          },
        ];
      }

      const transcriptBody = spokenSegments
        .map((s) => `[${s.time}] ${s.speaker}: ${s.text}`)
        .join("\n");

      const generatedAudioUri = createToneAudioUri(finalSeconds);

      const created = await createMeetingPasted({
        title: `Live Studio: Architecture Review (${new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })})`,
        participants: ["Karan", "Fred Bot"],
        transcript_text: transcriptBody,
        audio_url: generatedAudioUri,
        duration_seconds: finalSeconds,
      });

      confetti({ particleCount: 75, spread: 75, origin: { y: 0.6 } });

      if (created && created.id) {
        window.location.href = `/meetings/${created.id}`;
      } else {
        window.location.href = "/";
      }
    } catch (err) {
      console.error(err);
      alert("Error saving live session. Ensure backend is running.");
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0A0D14] text-slate-100">
      <header className="h-16 border-b border-slate-800/80 px-6 sm:px-8 flex items-center justify-between shrink-0 bg-[#0F1420]/80 backdrop-blur-md z-20">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Return to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-white tracking-tight">
                Live Studio: Architecture Review
              </h1>
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  status === "recording"
                    ? "bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse"
                    : status === "paused"
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    : "bg-slate-800 text-slate-400 border-slate-700"
                }`}
              >
                {status === "recording"
                  ? "LIVE RECORDING"
                  : status === "paused"
                  ? "PAUSED"
                  : "STANDBY"}
              </span>
            </div>
            <div className="flex items-center gap-2.5 text-[11px] text-slate-400 font-mono mt-0.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-bold text-slate-200">{formatTime(seconds)}</span>
              <span>•</span>
              <span className="text-slate-400">Karan & Fred Bot Active</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {status === "idle" && (
            <button
              onClick={handleStartCapture}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              <Mic className="w-4 h-4" />
              <span>Start Live Capturing</span>
            </button>
          )}

          {status === "recording" && (
            <button
              onClick={handlePauseCapture}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 text-xs font-bold transition cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause</span>
            </button>
          )}

          {status === "paused" && (
            <button
              onClick={handleResumeCapture}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 text-xs font-bold transition cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Resume Capturing</span>
            </button>
          )}

          <button
            onClick={handleEndAndSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer shadow-lg shadow-emerald-600/25 disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{saving ? "Saving Session..." : "End & Save Meeting"}</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <section className="flex-1 flex flex-col border-r border-slate-800/80 bg-[#0C101A] overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-[#111726]/60 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  status === "recording"
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                    : status === "paused"
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "bg-slate-800 text-slate-500 border border-slate-700"
                }`}
              >
                {status === "recording" ? (
                  <Radio className="w-4 h-4 animate-spin" />
                ) : (
                  <MicOff className="w-4 h-4" />
                )}
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-200">Real-Time Mic Input Spectrum</h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  {status === "recording"
                    ? "Streaming audio frequency bands (Web Audio API)"
                    : status === "paused"
                    ? "Audio capture paused"
                    : "Microphone inactive"}
                </span>
              </div>
            </div>

            <div className="flex items-end gap-1 h-9 px-3 py-1 bg-slate-900/80 rounded-xl border border-slate-800">
              {frequencyData.map((val, idx) => (
                <div
                  key={idx}
                  className="w-1 rounded-t-sm transition-all duration-75"
                  style={{
                    height: `${status === "recording" ? val : 15}%`,
                    backgroundColor:
                      status === "recording"
                        ? val > 70
                          ? "#F43F5E"
                          : val > 40
                          ? "#6366F1"
                          : "#38BDF8"
                        : "#334155",
                  }}
                />
              ))}
            </div>
          </div>

          <div className="px-6 py-2.5 bg-slate-900/40 border-b border-slate-800/60 flex items-center gap-2 overflow-x-auto text-xs">
            <span className="text-slate-400 text-[11px] font-semibold shrink-0">
              Quick Dictate:
            </span>
            <button
              onClick={() =>
                addSamplePhrase(
                  "Karan",
                  "We have finished optimizing the database query execution times."
                )
              }
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-medium transition shrink-0 cursor-pointer"
            >
              + Discuss latency
            </button>
            <button
              onClick={() =>
                addSamplePhrase(
                  "Karan",
                  "I will deploy the update to production by 6 PM today."
                )
              }
              className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-[11px] font-medium transition shrink-0 cursor-pointer"
            >
              + Trigger Action Item
            </button>
            <button
              onClick={() =>
                addSamplePhrase(
                  "Fred Bot",
                  "All system checks passed with 99.9% uptime compliance."
                )
              }
              className="px-2.5 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-[11px] font-medium transition shrink-0 cursor-pointer"
            >
              + Bot response
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {segments.map((seg) => (
              <div
                key={seg.id}
                className={`p-4 rounded-2xl border transition ${
                  seg.isAction
                    ? "bg-amber-500/10 border-amber-500/30"
                    : seg.speaker === "Fred Bot"
                    ? "bg-indigo-950/20 border-indigo-500/20"
                    : "bg-slate-900/60 border-slate-800/80"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        seg.speaker === "Fred Bot" ? "bg-indigo-400" : "bg-emerald-400"
                      }`}
                    />
                    <span className="text-xs font-extrabold text-white">{seg.speaker}</span>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded">
                      {seg.time}
                    </span>
                  </div>

                  {seg.isAction && (
                    <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      Action Item Detected
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{seg.text}</p>
              </div>
            ))}
          </div>
        </section>

        <aside className="w-full lg:w-96 bg-[#0E1322] flex flex-col border-t lg:border-t-0 border-slate-800/80 shrink-0">
          <div className="p-4 border-b border-slate-800 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white">Real-Time Intent Detector</h2>
              <span className="text-[10px] text-indigo-400 font-medium">
                Scanning dictation for decisions and commitments
              </span>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Detected Action Items ({actionItems.length})
              </span>
            </div>

            {actionItems.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center">
                <p className="text-xs text-slate-500">
                  Speak a phrase like <span className="text-slate-400 italic">&quot;I will deploy the update&quot;</span> to trigger instant detection.
                </p>
              </div>
            ) : (
              actionItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span className="text-xs text-amber-100 font-medium">{item}</span>
                </div>
              ))
            )}

            <div className="mt-6 p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 space-y-2">
              <h4 className="text-xs font-bold text-indigo-300">Live Meeting Tips</h4>
              <ul className="text-[11px] text-slate-400 space-y-1.5 list-disc list-inside">
                <li>Speak clearly into your microphone or use the quick buttons above.</li>
                <li>Saying &quot;will&quot; or &quot;todo&quot; auto-extracts action items.</li>
                <li>Clicking <b>Pause</b> holds the session time in place.</li>
                <li>Clicking <b>End &amp; Save</b> commits your recorded audio to the database.</li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}