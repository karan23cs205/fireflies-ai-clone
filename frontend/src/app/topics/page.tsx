"use client";
import React, { useState } from "react";
import Link from "next/link";
import { 
  Hash, Search, Plus, ArrowUpRight, TrendingUp, Sparkles, 
  MessageSquare, Users, ExternalLink, X, Check, Filter, 
  Volume2, ChevronRight, BarChart3, AlertCircle
} from "lucide-react";

interface TopicEvidence {
  meetingTitle: string;
  meetingId: number;
  speaker: string;
  timestamp: string;
  quote: string;
  sentiment: "positive" | "critical" | "action";
}

interface TopicItem {
  id: string;
  title: string;
  category: string;
  keywords: string[];
  mentions: number;
  trend: string;
  topSpeaker: string;
  color: string;
  weeklyDistribution: number[]; // 7 days of frequency
  evidence: TopicEvidence[];
}

export default function AdvancedTopicsTaxonomyPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedTopic, setSelectedTopic] = useState<TopicItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Topic Form State
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Engineering");
  const [newKeywords, setNewKeywords] = useState("");

  const [topics, setTopics] = useState<TopicItem[]>([
    {
      id: "sso-auth",
      title: "Authentication & Enterprise SSO",
      category: "Security",
      keywords: ["okta", "saml", "jwt", "oauth2", "audit logs", "session"],
      mentions: 34,
      trend: "+28%",
      topSpeaker: "Elena Rostova",
      color: "from-blue-500 to-indigo-600",
      weeklyDistribution: [4, 7, 3, 9, 5, 2, 4],
      evidence: [
        {
          meetingTitle: "Customer Discovery: Enterprise Security & SSO",
          meetingId: 1,
          speaker: "Elena Rostova",
          timestamp: "01:15",
          quote: "We need SAML 2.0 and SCIM directory syncing ready before closing the enterprise tier accounts.",
          sentiment: "action",
        },
        {
          meetingTitle: "Q4 Engineering Roadmap & Latency",
          meetingId: 2,
          speaker: "Alex Chen",
          timestamp: "02:40",
          quote: "Session refresh tokens are incurring extra DB lookups; Okta SSO will centralize token invalidation.",
          sentiment: "positive",
        },
        {
          meetingTitle: "Customer Discovery: Enterprise Security & SSO",
          meetingId: 1,
          speaker: "Markus Bauer",
          timestamp: "03:10",
          quote: "Compliance auditors mandate SOC2 Type II certs with strict SSO enforcement.",
          sentiment: "critical",
        },
      ],
    },
    {
      id: "perf-latency",
      title: "Query Latency & DB Caching",
      category: "Engineering",
      keywords: ["redis", "indexes", "p99", "postgres", "connection pool", "slow query"],
      mentions: 26,
      trend: "+19%",
      topSpeaker: "Alex Chen",
      color: "from-amber-500 to-orange-600",
      weeklyDistribution: [2, 5, 8, 4, 3, 2, 2],
      evidence: [
        {
          meetingTitle: "Q4 Engineering Roadmap & Latency",
          meetingId: 2,
          speaker: "Alex Chen",
          timestamp: "00:45",
          quote: "P99 latency spiked past 380ms on the /api/meetings endpoint under concurrent full-text searches.",
          sentiment: "critical",
        },
        {
          meetingTitle: "Q4 Engineering Roadmap & Latency",
          meetingId: 2,
          speaker: "Karan",
          timestamp: "01:50",
          quote: "Introducing a 60-second Redis read-through cache will absorb 80% of repetitive summary requests.",
          sentiment: "action",
        },
      ],
    },
    {
      id: "q4-targets",
      title: "Q4 Deliverables & Launch Targets",
      category: "Product",
      keywords: ["deadline", "milestone", "ga release", "beta test", "sprint velocity"],
      mentions: 48,
      trend: "+42%",
      topSpeaker: "Karan",
      color: "from-emerald-500 to-teal-600",
      weeklyDistribution: [6, 8, 10, 7, 9, 5, 3],
      evidence: [
        {
          meetingTitle: "Q4 Engineering Roadmap & Latency",
          meetingId: 2,
          speaker: "Karan",
          timestamp: "00:10",
          quote: "Our target is freeze-by-November with full cross-platform audio playback and AI chaptering.",
          sentiment: "positive",
        },
        {
          meetingTitle: "Customer Discovery: Enterprise Security & SSO",
          meetingId: 1,
          speaker: "Sarah Jenkins",
          timestamp: "02:05",
          quote: "Product marketing collateral needs the final feature list locked by next Thursday.",
          sentiment: "action",
        },
      ],
    },
    {
      id: "client-ux",
      title: "Client Onboarding & Trial Drop-off",
      category: "Growth",
      keywords: ["sign up", "activation", "drop-off", "wizard", "analytics"],
      mentions: 18,
      trend: "+7%",
      topSpeaker: "Sarah Jenkins",
      color: "from-purple-500 to-pink-600",
      weeklyDistribution: [3, 2, 4, 3, 2, 3, 1],
      evidence: [
        {
          meetingTitle: "Customer Discovery: Enterprise Security & SSO",
          meetingId: 1,
          speaker: "Sarah Jenkins",
          timestamp: "03:45",
          quote: "Users drop off at step 3 when invited to paste 1,000+ line VTT files manually.",
          sentiment: "critical",
        },
      ],
    },
    {
      id: "pricing-tier",
      title: "Pricing Packaging & Seat Licenses",
      category: "Commercial",
      keywords: ["seats", "per-user", "billing", "invoice", "annual discount"],
      mentions: 15,
      trend: "+14%",
      topSpeaker: "Markus Bauer",
      color: "from-cyan-500 to-blue-600",
      weeklyDistribution: [1, 3, 2, 4, 3, 1, 1],
      evidence: [
        {
          meetingTitle: "Customer Discovery: Enterprise Security & SSO",
          meetingId: 1,
          speaker: "Markus Bauer",
          timestamp: "04:12",
          quote: "Enterprise buyers prefer annualized seat buckets rather than per-minute transcription metered bills.",
          sentiment: "positive",
        },
      ],
    },
  ]);

  // Handle creating a tracker
  const handleCreateTracker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const kwArray = newKeywords.split(",").map((k) => k.trim()).filter(Boolean);
    const newTopic: TopicItem = {
      id: `topic-${Date.now()}`,
      title: newTitle,
      category: newCategory,
      keywords: kwArray.length ? kwArray : ["custom", "tracker", "metric"],
      mentions: 1,
      trend: "+100%",
      topSpeaker: "Karan",
      color: "from-indigo-500 to-purple-600",
      weeklyDistribution: [0, 0, 0, 0, 0, 1, 1],
      evidence: [
        {
          meetingTitle: "Recently Analyzed Meeting",
          meetingId: 2,
          speaker: "Karan",
          timestamp: "00:30",
          quote: `Tracking initialized for keyword category: ${newTitle}`,
          sentiment: "action",
        },
      ],
    };

    setTopics([newTopic, ...topics]);
    setIsCreateModalOpen(false);
    setNewTitle("");
    setNewKeywords("");
  };

  const categories = ["All", "Security", "Engineering", "Product", "Growth", "Commercial"];

  const filteredTopics = topics.filter((t) => {
    const matchesCat = selectedCategory === "All" || t.category === selectedCategory;
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.keywords.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  // Calculate totals
  const totalMentions = topics.reduce((acc, t) => acc + t.mentions, 0);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F8FAFC]">
      {/* Top Header */}
      <header className="h-16 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between shrink-0 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">AI Topic Trackers & Taxonomy</h1>
            <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-200">
              {topics.length} Trackers Active
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Automated semantic clustering, trigger keywords, and cross-meeting evidence extraction
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-indigo-600/25 transition cursor-pointer hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>New Topic Tracker</span>
        </button>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Topic Trackers List & KPI */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          
          {/* KPI Banner */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Keyword Hits</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{totalMentions}</div>
              <div className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +24% across transcripts
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Top Theme</div>
              <div className="text-base font-bold text-slate-900 mt-1 truncate">Q4 Deliverables</div>
              <div className="text-[10px] text-indigo-600 font-bold mt-1">48 detected mentions</div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Primary Contributor</div>
              <div className="text-base font-bold text-slate-900 mt-1">Elena Rostova</div>
              <div className="text-[10px] text-slate-500 font-semibold mt-1">Security & Infrastructure</div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tracker Coverage</div>
              <div className="text-2xl font-black text-slate-900 mt-1">96.4%</div>
              <div className="text-[10px] text-emerald-600 font-bold mt-1">High semantic match</div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search topics or trigger keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                    selectedCategory === cat
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Topic Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredTopics.map((topic) => {
              const isSelected = selectedTopic?.id === topic.id;
              const maxWeekly = Math.max(...topic.weeklyDistribution, 1);

              return (
                <div
                  key={topic.id}
                  onClick={() => setSelectedTopic(topic)}
                  className={`group p-5 bg-white rounded-2xl border transition-all cursor-pointer relative shadow-xs hover:shadow-md ${
                    isSelected
                      ? "border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/10"
                      : "border-slate-200/80 hover:border-indigo-300"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                          {topic.category}
                        </span>
                        <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5">
                          <ArrowUpRight className="w-3 h-3" /> {topic.trend}
                        </span>
                      </div>
                      <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {topic.title}
                      </h3>
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-black text-slate-900">{topic.mentions}</div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Hits</div>
                    </div>
                  </div>

                  {/* Trigger Keywords Pills */}
                  <div className="flex flex-wrap gap-1.5 my-3">
                    {topic.keywords.map((kw) => (
                      <span
                        key={kw}
                        className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md group-hover:bg-slate-200/70 transition"
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>

                  {/* Frequency Sparkline Bars & Speaker Metadata */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[11px]">Primary: <strong className="text-slate-800">{topic.topSpeaker}</strong></span>
                    </div>

                    {/* 7-day mini frequency graph */}
                    <div className="flex items-end gap-1 h-5">
                      {topic.weeklyDistribution.map((val, idx) => (
                        <div
                          key={idx}
                          className="w-1.5 rounded-xs bg-indigo-200 group-hover:bg-indigo-600 transition-all"
                          style={{ height: `${(val / maxWeekly) * 100}%` }}
                          title={`Day ${idx + 1}: ${val} mentions`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Deep Evidence & Quote Explorer Drawer */}
        <div className="w-96 lg:w-[440px] bg-white border-l border-slate-200 flex flex-col shrink-0 overflow-hidden shadow-xs">
          {selectedTopic ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-6 border-b border-slate-200 bg-slate-50/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                    {selectedTopic.category}
                  </span>
                  <button
                    onClick={() => setSelectedTopic(null)}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <h2 className="text-base font-extrabold text-slate-900 leading-tight">
                  {selectedTopic.title}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Recorded in {selectedTopic.evidence.length} separate conversations with {selectedTopic.mentions} total key phrase occurrences.
                </p>
              </div>

              {/* Quotes / Evidence List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Verbatim Transcript Evidence ({selectedTopic.evidence.length})
                </div>

                {selectedTopic.evidence.map((ev, i) => (
                  <div
                    key={i}
                    className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 hover:bg-white hover:border-indigo-300 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center">
                          {ev.speaker[0]}
                        </div>
                        <span className="text-xs font-bold text-slate-900">{ev.speaker}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 font-semibold">{ev.timestamp}</span>
                    </div>

                    <p className="text-xs text-slate-700 italic leading-relaxed">
                      &quot;{ev.quote}&quot;
                    </p>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium truncate max-w-[200px]">
                        {ev.meetingTitle}
                      </span>
                      <Link
                        href={`/meetings/${ev.meetingId}`}
                        className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 transition"
                      >
                        Open <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                <Hash className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Select a Topic Tracker</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                Click any topic card on the left to inspect exact transcript quotations, speaker breakdown, and timestamped audio links.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Topic Tracker */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">New Topic Tracker</h3>
                <p className="text-xs text-slate-500">Configure keyword rules for Fred AI to detect</p>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTracker} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tracker Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Competitor Mentions (Gong / Otter)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Security">Security</option>
                  <option value="Product">Product</option>
                  <option value="Growth">Growth</option>
                  <option value="Commercial">Commercial</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Keywords / Triggers (comma-separated)</label>
                <input
                  type="text"
                  placeholder="gong, otter, rival, alternative, pricing comparison"
                  value={newKeywords}
                  onChange={(e) => setNewKeywords(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <p className="text-[10px] text-slate-400 mt-1">Fred will scan meeting audio and text whenever any of these terms occur.</p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md shadow-indigo-600/20"
                >
                  Create Tracker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}