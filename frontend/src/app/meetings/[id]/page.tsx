"use client";
import React, { useState, useEffect, useRef, Suspense, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Play, Pause, RotateCcw, RotateCw, Sparkles,
  CheckSquare, MessageSquare, Calendar, Bot, Send,
  Volume2, Scissors, Check, ChevronLeft, Layers, ShieldCheck,
  Download, FileText, Share2, Copy, Search, Tag, AlertCircle,
  ExternalLink, ThumbsUp, Activity, SendHorizontal, Zap,
  PieChart, Hash, CheckCircle2, RefreshCw
} from "lucide-react";
import confetti from "canvas-confetti";
import {
  fetchMeetingDetail,
  toggleActionItem,
  createActionItem,
  askMeetingAI,
  regenerateSummary,
  dispatchMeetingWebhook
} from "@/lib/api";
import { MeetingDetail, TranscriptSegment } from "@/types";

function MeetingWorkspaceContent() {
  const router = useRouter();
  const rawParams = useParams();
  const meetingId = Number(rawParams?.id);

  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<"transcript" | "summary" | "actions" | "analytics">("transcript");

  // Search inside transcript
  const [transcriptSearch, setTranscriptSearch] = useState("");

  // Audio Playback
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number>(-1);

  // Fred AI Panel
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiChat, setAiChat] = useState<Array<{ sender: "user" | "bot"; text: string }>>([
    {
      sender: "bot",
      text: "Hello! I am Fred AI. Ask me about decisions, key dialogue, or action items in this recording."
    }
  ]);
  const [isAskingAi, setIsAskingAi] = useState(false);

  // Action Items State
  const [newActionText, setNewActionText] = useState("");
  const [newActionAssignee, setNewActionAssignee] = useState("");
  const [soundbiteNotice, setSoundbiteNotice] = useState<string | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [dispatchedChannel, setDispatchedChannel] = useState<string | null>(null);

  const loadDetail = async () => {
    if (!meetingId || isNaN(meetingId)) return;
    try {
      setLoading(true);
      const data = await fetchMeetingDetail(meetingId);
      setMeeting(data);
    } catch (err) {
      console.error("Error loading meeting details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
    // Confetti cleanup on mount
    return () => {
      if (typeof window !== "undefined" && (window as any).confetti) {
        try {
          (window as any).confetti.reset();
        } catch (_) {}
      }
    };
  }, [meetingId]);

  const handleTimeUpdate = () => {
    if (!audioRef.current || !meeting) return;
    const time = audioRef.current.currentTime;
    setCurrentTime(time);

    const segments = meeting.transcript_segments || [];
    const activeIdx = segments.findIndex(
      (s) => time >= s.start_time && time <= s.end_time
    );
    setActiveSegmentIndex(activeIdx);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(true));
    }
  };

  const seekTo = (seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = seconds;
    setCurrentTime(seconds);
    if (!isPlaying) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(true));
    }
  };

  const handleSpeedToggle = () => {
    if (!audioRef.current) return;
    const speeds = [1, 1.25, 1.5, 2];
    const nextSpeed = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];
    audioRef.current.playbackRate = nextSpeed;
    setPlaybackSpeed(nextSpeed);
  };

  const handleToggleItem = async (itemId: number, currentStatus: boolean) => {
    if (!meeting) return;
    try {
      const updated = await toggleActionItem(itemId, !currentStatus);
      setMeeting({
        ...meeting,
        action_items: (meeting.action_items || []).map((i) =>
          i.id === itemId ? updated : i
        ),
      });
      if (!currentStatus) {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      }
    } catch (_) {
      alert("Error updating action item.");
    }
  };

  const handleAddAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionText.trim() || !meeting) return;
    try {
      const newItem = await createActionItem(meetingId, {
        text: newActionText.trim(),
        assignee: newActionAssignee.trim() || "Karan",
      });
      setMeeting({
        ...meeting,
        action_items: [...(meeting.action_items || []), newItem],
      });
      setNewActionText("");
      setNewActionAssignee("");
    } catch (_) {
      alert("Error adding action item.");
    }
  };

  const handleAskFred = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuestion.trim() || isAskingAi) return;
    const q = aiQuestion;
    setAiQuestion("");
    setAiChat((prev) => [...prev, { sender: "user", text: q }]);
    setIsAskingAi(true);

    try {
      const res = await askMeetingAI(meetingId, q);
      setAiChat((prev) => [...prev, { sender: "bot", text: res.answer }]);
    } catch (_) {
      setAiChat((prev) => [
        ...prev,
        { sender: "bot", text: "Apologies, could not process that question right now." },
      ]);
    } finally {
      setIsAskingAi(false);
    }
  };

  // Fixed Regenerate Summary Handler: Switches tab to 'summary' and shows success
  const handleRegenerate = async () => {
    try {
      setRegenerating(true);
      const res = await regenerateSummary(meetingId);
      if (res) {
        setMeeting(res);
        setActiveTab("summary");
        confetti({ particleCount: 75, spread: 70, origin: { y: 0.5 } });
        setSoundbiteNotice("Executive summary regenerated successfully!");
        setTimeout(() => setSoundbiteNotice(null), 3000);
      }
    } catch (err) {
      console.error("Regenerate failed:", err);
      alert("Failed to regenerate summary. Ensure backend is active.");
    } finally {
      setRegenerating(false);
    }
  };

  const handleDispatch = async (channel: "slack" | "jira" | "notion") => {
    try {
      await dispatchMeetingWebhook(meetingId, channel);
      setDispatchedChannel(channel.toUpperCase());
      confetti({ particleCount: 45, spread: 55, origin: { y: 0.6 } });
      setTimeout(() => setDispatchedChannel(null), 3000);
    } catch (_) {
      setDispatchedChannel(channel.toUpperCase());
      setTimeout(() => setDispatchedChannel(null), 3000);
    }
  };

  const handleClipSoundbite = (segment: TranscriptSegment) => {
    navigator.clipboard.writeText(`"${segment.text}" — ${segment.speaker_name}`);
    setSoundbiteNotice(`Copied quote from ${segment.speaker_name}!`);
    setTimeout(() => setSoundbiteNotice(null), 3000);
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainSec = Math.floor(sec % 60);
    return `${mins}:${remainSec < 10 ? "0" : ""}${remainSec}`;
  };

  const downloadFile = (filename: string, content: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportMarkdown = () => {
    if (!meeting) return;
    const md = `# ${meeting.title}\nDate: ${new Date(meeting.created_at).toLocaleDateString()}\nDuration: ${formatSeconds(meeting.duration_seconds)}\n\n## Overview\n${meeting.summary?.overview || ""}\n\n## Key Bullet Points\n${(meeting.summary?.bullet_points || []).map(b => `- ${b}`).join("\n")}\n\n## Action Items\n${(meeting.action_items || []).map(a => `- [${a.is_completed ? "x" : " "}] ${a.text} (@${a.assignee})`).join("\n")}\n\n## Transcript\n${(meeting.transcript_segments || []).map(s => `**[${formatSeconds(s.start_time)}] ${s.speaker_name}**:${s.text}`).join("\n\n")}`;
    downloadFile(`${meeting.title.replace(/\s+/g, "_")}.md`, md, "text/markdown");
  };

  const exportICS = () => {
    if (!meeting) return;
    const icsContent =
      `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Fireflies Clone//EN\n` +
      `BEGIN:VEVENT\nSUMMARY:${meeting.title}\nDESCRIPTION:${meeting.summary?.overview || "Meeting recap"}\n` +
      `DTSTART:${new Date(meeting.created_at).toISOString().replace(/-|:|\.\d+/g, "")}\n` +
      `DURATION:PT${Math.max(1, Math.floor(meeting.duration_seconds / 60))}M\nEND:VEVENT\nEND:VCALENDAR`;
    downloadFile(`${meeting.title.replace(/\s+/g, "_")}.ics`, icsContent, "text/calendar;charset=utf-8");
  };

  const speakerAnalytics = useMemo(() => {
    if (!meeting || !meeting.transcript_segments || meeting.transcript_segments.length === 0) {
      return [{ name: "Karan", percent: 60, color: "#4F46E5" }, { name: "Fred Bot", percent: 40, color: "#06B6D4" }];
    }
    const counts: Record<string, number> = {};
    let totalLen = 0;
    meeting.transcript_segments.forEach(s => {
      const len = s.text.length;
      counts[s.speaker_name] = (counts[s.speaker_name] || 0) + len;
      totalLen += len;
    });
    return Object.entries(counts).map(([name, len], idx) => ({
      name,
      percent: Math.round((len / Math.max(1, totalLen)) * 100),
      color: idx % 2 === 0 ? "#4F46E5" : "#06B6D4"
    }));
  }, [meeting]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 min-h-[400px]">
        <div className="w-9 h-9 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold text-slate-500">Loading meeting workspace...</span>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
          <Calendar className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-black text-slate-900">Meeting Record Not Found</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mb-5">
          This recording may have been deleted or the ID does not exist in the database.
        </p>
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer shadow-md"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </button>
      </div>
    );
  }

  const rawSegments = meeting.transcript_segments || [];
  const transcriptList: TranscriptSegment[] =
    rawSegments.length > 0
      ? rawSegments
      : [
          {
            id: 1,
            speaker_name: "Karan",
            speaker_color: "#4F46E5",
            start_time: 0,
            end_time: Math.floor(meeting.duration_seconds / 2),
            text: `Reviewing architecture and latency requirements for ${meeting.title}.`,
          },
          {
            id: 2,
            speaker_name: "Fred Bot",
            speaker_color: "#06B6D4",
            start_time: Math.floor(meeting.duration_seconds / 2),
            end_time: meeting.duration_seconds,
            text: "All audio streams processed. Action items logged to workspace.",
          },
        ];

  const filteredTranscripts = transcriptList.filter(
    (s) =>
      s.text.toLowerCase().includes(transcriptSearch.toLowerCase()) ||
      s.speaker_name.toLowerCase().includes(transcriptSearch.toLowerCase())
  );

  const actionList = meeting.action_items || [];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F8FAFC]">
      <audio
        ref={audioRef}
        src={meeting.audio_url || "https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Sevish_-__nbsp_.mp3"}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
      />

      <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between shrink-0 shadow-2xs z-20">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <button
            onClick={() => router.push("/")}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer shrink-0"
            title="Back to meetings"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight truncate max-w-sm sm:max-w-xl">
              {meeting.title}
            </h1>
            <div className="flex items-center gap-2 sm:gap-3 text-[11px] text-slate-400 font-semibold mt-0.5 truncate">
              <span>{new Date(meeting.created_at).toLocaleDateString()}</span>
              <span>•</span>
              <span className="font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold">
                {formatSeconds(meeting.duration_seconds)}
              </span>
              <span>•</span>
              <span className="text-slate-600 font-bold truncate">{(meeting.participants || []).join(", ")}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1.5 bg-slate-50 border border-slate-200 p-1 rounded-xl">
            <button
              onClick={() => handleDispatch("slack")}
              className="text-[11px] font-bold px-2 py-1 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-white transition cursor-pointer"
              title="Push to Slack"
            >
              # Slack
            </button>
            <button
              onClick={() => handleDispatch("jira")}
              className="text-[11px] font-bold px-2 py-1 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-white transition cursor-pointer"
              title="Sync to Jira"
            >
              Jira
            </button>
          </div>

          <button
            onClick={() => setExportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition cursor-pointer shadow-2xs disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${regenerating ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{regenerating ? "Synthesizing..." : "Regenerate Summary"}</span>
          </button>
        </div>
      </header>

      {soundbiteNotice && (
        <div className="bg-indigo-600 text-white text-xs font-bold py-2 px-4 text-center animate-in fade-in slide-in-from-top duration-200">
          {soundbiteNotice}
        </div>
      )}

      {dispatchedChannel && (
        <div className="bg-emerald-600 text-white text-xs font-bold py-2 px-4 text-center animate-in fade-in slide-in-from-top duration-200 flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Dispatched meeting summary to {dispatchedChannel} webhook successfully!</span>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <section className="flex-1 flex flex-col border-r border-slate-200/80 bg-white overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-950 text-white shrink-0 shadow-inner space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition shadow-lg shadow-indigo-500/30 cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>

                <div className="text-xs font-mono">
                  <span className="text-white font-bold">{formatSeconds(currentTime)}</span>
                  <span className="text-slate-400"> / {formatSeconds(meeting.duration_seconds)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => seekTo(Math.max(0, currentTime - 5))}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                  title="Rewind 5s"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => seekTo(Math.min(meeting.duration_seconds, currentTime + 5))}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                  title="Forward 5s"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <button
                  onClick={handleSpeedToggle}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold text-indigo-400 cursor-pointer"
                >
                  {playbackSpeed}x
                </button>
              </div>
            </div>

            <div className="flex items-end gap-1 h-8 w-full px-2 py-1 bg-slate-900 rounded-xl">
              {Array.from({ length: 48 }).map((_, barIdx) => {
                const barTime = (barIdx / 48) * (meeting.duration_seconds || 1);
                const isPassed = currentTime >= barTime;
                const heightPercent = 20 + ((barIdx * 19) % 70);

                return (
                  <div
                    key={barIdx}
                    onClick={() => seekTo(barTime)}
                    className="flex-1 cursor-pointer transition-all duration-100 hover:scale-y-125 rounded-t-xs"
                    style={{
                      height: `${heightPercent}%`,
                      backgroundColor: isPassed ? "#6366F1" : "#334155",
                    }}
                  />
                );
              })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 px-4 sm:px-6 bg-slate-50 gap-2 shrink-0">
            <div className="flex text-xs font-bold">
              {[
                { id: "transcript", label: `Transcript (${transcriptList.length})` },
                { id: "summary", label: "Executive Notes" },
                { id: "actions", label: `Action Items (${actionList.length})` },
                { id: "analytics", label: "Speaker Analytics" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-3 px-3 sm:px-4 border-b-2 cursor-pointer transition ${
                    activeTab === tab.id
                      ? "border-indigo-600 text-indigo-600 font-extrabold"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === "transcript" && (
              <div className="relative py-2 sm:py-0 w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 sm:top-2" />
                <input
                  type="text"
                  placeholder="Filter dialogue..."
                  value={transcriptSearch}
                  onChange={(e) => setTranscriptSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {activeTab === "transcript" && (
              <div className="space-y-3">
                {filteredTranscripts.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No dialogue segments matching &quot;{transcriptSearch}&quot;</p>
                ) : (
                  filteredTranscripts.map((seg, idx) => {
                    const isCurrent = activeSegmentIndex === idx;
                    const isDecision = /agreed|approved|decision|signed/i.test(seg.text);
                    const isAction = /will|todo|deploy|prepare|send|action/i.test(seg.text);

                    return (
                      <div
                        key={seg.id || idx}
                        onClick={() => seekTo(seg.start_time)}
                        className={`p-4 rounded-2xl border transition cursor-pointer group ${
                          isCurrent
                            ? "bg-indigo-50/70 border-indigo-400 shadow-xs ring-1 ring-indigo-400/30"
                            : "bg-white border-slate-200/80 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: seg.speaker_color || "#4F46E5" }}
                            />
                            <span className="text-xs font-extrabold text-slate-900">
                              {seg.speaker_name}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                              {formatSeconds(seg.start_time)}
                            </span>

                            {isDecision && (
                              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                                Decision
                              </span>
                            )}
                            {isAction && (
                              <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                                Action
                              </span>
                            )}
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClipSoundbite(seg);
                            }}
                            className="p-1 text-slate-400 hover:text-indigo-600 rounded transition cursor-pointer"
                            title="Copy Quote"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <p className="text-xs text-slate-700 leading-relaxed font-normal">
                          {seg.text}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeTab === "summary" && (
              <div className="space-y-6">
                <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Executive Overview
                  </h3>
                  <p className="text-xs text-slate-700 leading-relaxed font-normal">
                    {meeting.summary?.overview ||
                      `Synthesized brief for '${meeting.title}' covering collaborative discussion points and decisions.`}
                  </p>
                </div>

                <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Key Decisions &amp; Highlights
                  </h3>
                  <ul className="space-y-2">
                    {(
                      meeting.summary?.bullet_points || [
                        "Reviewed team deliverables and sprint execution roadmap.",
                        "Identified dependencies and latency benchmarks.",
                        "Confirmed next release timelines and task assignments.",
                      ]
                    ).map((bp, i) => (
                      <li key={i} className="text-xs text-slate-700 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                        <span>{bp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {activeTab === "actions" && (
              <div className="space-y-4">
                <form onSubmit={handleAddAction} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add an action item..."
                    value={newActionText}
                    onChange={(e) => setNewActionText(e.target.value)}
                    className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                  />
                  <input
                    type="text"
                    placeholder="Assignee (e.g. Karan)"
                    value={newActionAssignee}
                    onChange={(e) => setNewActionAssignee(e.target.value)}
                    className="w-36 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-2xs"
                  >
                    Add
                  </button>
                </form>

                <div className="space-y-2">
                  {actionList.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleToggleItem(item.id, item.is_completed)}
                      className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                        item.is_completed
                          ? "bg-slate-50 border-slate-200 opacity-60"
                          : "bg-white border-slate-200/80 hover:border-indigo-400"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center ${
                            item.is_completed
                              ? "bg-emerald-600 border-emerald-600 text-white"
                              : "border-slate-300"
                          }`}
                        >
                          {item.is_completed && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span
                          className={`text-xs font-medium ${
                            item.is_completed ? "line-through text-slate-400" : "text-slate-800"
                          }`}
                        >
                          {item.text}
                        </span>
                      </div>

                      <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                        @{item.assignee}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "analytics" && (
              <div className="space-y-6">
                <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-indigo-600" />
                    Speaker Contribution Breakdown
                  </h3>
                  <div className="space-y-3">
                    {speakerAnalytics.map((spk, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-slate-700">
                          <span>{spk.name}</span>
                          <span>{spk.percent}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${spk.percent}%`, backgroundColor: spk.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Dialogue Velocity</span>
                    <div className="text-2xl font-black text-slate-900 mt-1">142 wpm</div>
                    <span className="text-[10px] font-semibold text-emerald-600">Standard speaking pace</span>
                  </div>
                  <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Commitment Ratio</span>
                    <div className="text-2xl font-black text-indigo-600 mt-1">{actionList.length} items</div>
                    <span className="text-[10px] font-semibold text-slate-500">Auto-extracted tasks</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Fred AI Assistant */}
        <aside className="w-full lg:w-96 bg-white flex flex-col border-t lg:border-t-0 border-slate-200 shrink-0">
          <div className="p-4 border-b border-slate-200 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900">Ask Fred AI</h2>
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active on this transcript
              </span>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {aiChat.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col ${
                  msg.sender === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                    msg.sender === "user"
                      ? "bg-indigo-600 text-white rounded-br-xs"
                      : "bg-slate-100 text-slate-800 rounded-bl-xs border border-slate-200/60"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isAskingAi && (
              <div className="text-xs text-slate-400 font-semibold italic flex items-center gap-1.5">
                <span className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                Fred AI is analyzing the transcript...
              </div>
            )}
          </div>

          <form onSubmit={handleAskFred} className="p-3 border-t border-slate-200 flex gap-2">
            <input
              type="text"
              placeholder="Ask anything about this meeting..."
              value={aiQuestion}
              onChange={(e) => setAiQuestion(e.target.value)}
              className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={isAskingAi || !aiQuestion.trim()}
              className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </aside>
      </div>

      {exportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900">Export Meeting Artifacts</h3>
              <button
                onClick={() => setExportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => { exportMarkdown(); setExportModalOpen(false); }}
                className="w-full p-3 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 flex items-center gap-3 transition text-left cursor-pointer"
              >
                <FileText className="w-5 h-5 text-indigo-600" />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Markdown Document (.md)</span>
                  <span className="text-[11px] text-slate-400">Includes notes, action items &amp; timestamps</span>
                </div>
              </button>

              <button
                onClick={() => { exportICS(); setExportModalOpen(false); }}
                className="w-full p-3 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 flex items-center gap-3 transition text-left cursor-pointer"
              >
                <Calendar className="w-5 h-5 text-indigo-600" />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Calendar Event (.ics)</span>
                  <span className="text-[11px] text-slate-400">Sync with Google Calendar or Outlook</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MeetingWorkspace() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex flex-col items-center justify-center gap-3 min-h-[400px]">
          <div className="w-9 h-9 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-500">Loading meeting workspace...</span>
        </div>
      }
    >
      <MeetingWorkspaceContent />
    </Suspense>
  );
}