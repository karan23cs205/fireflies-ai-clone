"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mic, Plus, Search, Calendar, Clock, Users,
  CheckCircle2, ArrowRight, Play, Trash2, Filter,
  FileText, Sparkles, CheckSquare, Layers, Activity,
  TrendingUp, BarChart2, Shield, Zap, RefreshCw
} from "lucide-react";
import confetti from "canvas-confetti";
import { fetchMeetings, createMeetingPasted, deleteMeeting } from "@/lib/api";
import { MeetingListItem } from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<MeetingListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"recent" | "oldest" | "duration">("recent");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [participantsText, setParticipantsText] = useState("Karan, Alex Chen");
  const [transcriptText, setTranscriptText] = useState(
    "[00:00] Karan: Team, let's review the API architecture and latency bottlenecks.\n[00:15] Alex Chen: The search endpoint P99 latency spikes during heavy load.\n[00:30] Karan: I will deploy the Redis caching layer and benchmark it by tomorrow."
  );
  const [creating, setCreating] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchMeetings(searchQuery, undefined, sortOrder);
      setMeetings(data || []);
    } catch (err) {
      console.error("Failed to load meetings:", err);
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleDeleteMeeting = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    const previous = [...meetings];
    setMeetings((prev) => prev.filter((m) => m.id !== id));

    try {
      await deleteMeeting(id);
    } catch (err) {
      console.error("Delete failed:", err);
      setMeetings(previous);
      alert("Could not delete meeting from database.");
    }
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !transcriptText.trim()) return;

    setCreating(true);
    try {
      const parts = participantsText
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);

      const created = await createMeetingPasted({
        title: title.trim(),
        participants: parts.length > 0 ? parts : ["Karan"],
        transcript_text: transcriptText,
      });

      confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
      setIsModalOpen(false);
      setTitle("");
      router.push(`/meetings/${created.id}`);
    } catch (err) {
      alert("Failed to process and create meeting.");
      setCreating(false);
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}m ${s < 10 ? "0" : ""}${s}s`;
  };

  const totalAudioHours = (
    meetings.reduce((acc, m) => acc + (m.duration_seconds || 0), 0) / 3600
  ).toFixed(1);

  const totalActions = meetings.reduce(
    (acc, m) => acc + (m.action_items_count || 0),
    0
  );

  const uniqueSpeakers = Array.from(
    new Set(meetings.flatMap((m) => m.participants || []))
  ).length;

  const filteredMeetings = meetings.filter((m) => {
    if (selectedFilter === "all") return true;
    const lower = (m.title + " " + (m.participants || []).join(" ")).toLowerCase();
    return lower.includes(selectedFilter);
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F8FAFC]">
      {/* Sticky SaaS Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-6 sm:px-8 py-4 flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-indigo-500/20">
            K
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-slate-900 tracking-tight">Karan&apos;s Workspace</h1>
              <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-200">
                Enterprise Pro
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Real-time transcripts, automated action items, and conversational Fred AI
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/live"
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition cursor-pointer shadow-xs"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <Mic className="w-3.5 h-3.5 text-indigo-400" />
            <span>Launch Live Studio</span>
          </Link>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-indigo-600/25 transition cursor-pointer hover:scale-[1.02] active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Audio / Transcript</span>
          </button>
        </div>
      </header>

      {/* Fluid Scrollable Dashboard Content */}
      <main className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Total Meetings</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{meetings.length}</div>
              <span className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
                ↗ Active knowledge base
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Audio Analyzed</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{totalAudioHours} hrs</div>
              <span className="text-[11px] font-semibold text-slate-500 mt-1 block">High-fidelity STT model</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Action Items Found</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{totalActions}</div>
              <span className="text-[11px] font-semibold text-emerald-600 mt-1 block">Ready for Jira & Slack</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Collaborators</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{uniqueSpeakers}</div>
              <span className="text-[11px] font-semibold text-slate-500 mt-1 block">Identified speakers</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search transcripts, speakers, or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500 transition"
              />
            </form>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Sort by:
              </span>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="recent">Most Recent First</option>
                <option value="oldest">Oldest First</option>
                <option value="duration">Longest Duration</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 overflow-x-auto text-xs font-bold text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Filter Category:</span>
            {["all", "Product", "Engineering", "Security", "Roadmap"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedFilter(cat.toLowerCase())}
                className={`px-3 py-1 rounded-lg capitalize transition cursor-pointer ${
                  selectedFilter === cat.toLowerCase()
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Meetings Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 space-y-3">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-bold text-slate-500">Retrieving meetings from SQLite database...</span>
          </div>
        ) : filteredMeetings.length === 0 ? (
          <div className="p-16 rounded-2xl border-2 border-dashed border-slate-200 text-center bg-white">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-extrabold text-slate-800">No meeting recordings found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Launch Live Studio to dictate speech in real-time or click &quot;Upload Audio / Transcript&quot; to ingest notes.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredMeetings.map((m) => (
              <div
                key={m.id}
                onClick={() => router.push(`/meetings/${m.id}`)}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 hover:border-indigo-400 hover:shadow-md transition cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 mb-2">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(m.created_at).toLocaleDateString()}
                    </span>
                    <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600 flex items-center gap-1">
                      {formatSeconds(m.duration_seconds)}
                      <Play className="w-2.5 h-2.5 fill-current text-indigo-500" />
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition line-clamp-1">
                    {m.title}
                  </h3>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {(m.participants || []).slice(0, 3).map((p, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600"
                      >
                        {p}
                      </span>
                    ))}
                    {(m.participants || []).length > 3 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-400">
                        +{(m.participants || []).length - 3}
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckSquare className="w-3.5 h-3.5" />
                    {m.action_items_count} Action Items
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleDeleteMeeting(e, m.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Delete meeting"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-bold text-indigo-600 group-hover:translate-x-0.5 transition flex items-center gap-1">
                      Open Details <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Enterprise Bottom Sections */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 border-t border-slate-200">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                Weekly Meeting Velocity
              </h3>
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                +18% efficiency
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your team reduced synchronous meeting overhead by 4.2 hours this week by sharing AI summaries directly to Slack.
            </p>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mt-3">
              <div className="bg-indigo-600 h-full rounded-full" style={{ width: "78%" }} />
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              SOC2 &amp; Enterprise Governance
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              All transcript segments and audio buffers are encrypted at rest with AES-256 and stored locally in your SQLite engine.
            </p>
            <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-600 pt-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Zero third-party data leakage
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Connected Integrations
            </h3>
            <div className="flex flex-wrap gap-2 pt-1">
              {["Slack Webhooks", "Jira Cloud", "Google Calendar (.ICS)", "Fred AI Console"].map((item, i) => (
                <span
                  key={i}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200"
                >
                  ✓ {item}
                </span>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Manual Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden p-6 text-slate-800 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900">Upload Meeting Transcript</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateMeeting} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Session Title</label>
                <input
                  type="text"
                  placeholder="e.g. Sprint Architecture Retrospective"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Participants (comma separated)</label>
                <input
                  type="text"
                  placeholder="Karan, Alex Chen, Devin Vance"
                  value={participantsText}
                  onChange={(e) => setParticipantsText(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Transcript Dialogue</label>
                <textarea
                  rows={5}
                  placeholder="[00:00] Speaker: Content"
                  value={transcriptText}
                  onChange={(e) => setTranscriptText(e.target.value)}
                  className="w-full p-3 font-mono text-[11px] bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md disabled:opacity-50"
                >
                  {creating ? "Processing AI Summary..." : "Ingest & Generate Summary"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}