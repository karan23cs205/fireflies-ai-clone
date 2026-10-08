"use client";
import React, { useState, Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Sparkles, Mic, Scissors, Tags, Settings,
  X, Check, Copy, Sliders, Play
} from "lucide-react";
import confetti from "canvas-confetti";

interface Soundbite {
  id: number;
  title: string;
  speaker: string;
  timestamp: string;
  tag: string;
  url: string;
}

function SidebarContent() {
  const pathname = usePathname();

  const [showSettings, setShowSettings] = useState(false);
  const [showSoundbites, setShowSoundbites] = useState(false);

  const [summaryFormat, setSummaryFormat] = useState<"bullets" | "technical">("technical");
  const [apiKey, setApiKey] = useState("sk-fireflies-prod-89230198421049281");
  const [savedSettingsFeedback, setSavedSettingsFeedback] = useState(false);

  const [copiedClipId, setCopiedClipId] = useState<number | null>(null);
  const [soundbites] = useState<Soundbite[]>([
    {
      id: 1,
      title: "Latency bottleneck decision",
      speaker: "Alex Chen",
      timestamp: "0:14",
      tag: "Performance",
      url: typeof window !== "undefined" ? `${window.location.origin}/meetings/1?t=14` : "https://fireflies.ai/clip/1"
    },
    {
      id: 2,
      title: "SSO Security compliance sign-off",
      speaker: "Elena Rostova",
      timestamp: "0:28",
      tag: "Enterprise",
      url: typeof window !== "undefined" ? `${window.location.origin}/meetings/2?t=28` : "https://fireflies.ai/clip/2"
    },
    {
      id: 3,
      title: "Q4 release timeline freeze",
      speaker: "Sarah Jenkins",
      timestamp: "0:19",
      tag: "Roadmap",
      url: typeof window !== "undefined" ? `${window.location.origin}/meetings/3?t=19` : "https://fireflies.ai/clip/3"
    }
  ]);

  const navItems = [
    { name: "Meetings", href: "/", icon: LayoutDashboard },
    { name: "Intelligence", href: "/analytics", icon: Sparkles },
    { name: "Live Assistant", href: "/live", icon: Mic, badge: "Live Studio" },
    { name: "Soundbites", onClick: () => setShowSoundbites(true), icon: Scissors, badge: "3 Clips" },
    { name: "Topics & Tags", href: "/analytics", icon: Tags },
    { name: "Settings", onClick: () => setShowSettings(true), icon: Settings },
  ];

  const handleCopyLink = async (clip: Soundbite) => {
    try {
      await navigator.clipboard.writeText(clip.url);
      setCopiedClipId(clip.id);
      setTimeout(() => setCopiedClipId(null), 2500);
    } catch (_) {
      setCopiedClipId(clip.id);
      setTimeout(() => setCopiedClipId(null), 2500);
    }
  };

  const handleSaveSettings = () => {
    setSavedSettingsFeedback(true);
    confetti({ particleCount: 35, spread: 50, origin: { y: 0.6 } });
    setTimeout(() => {
      setSavedSettingsFeedback(false);
      setShowSettings(false);
    }, 1200);
  };

  return (
    <>
      <aside className="w-64 bg-[#0B0F19] text-slate-300 flex flex-col justify-between border-r border-slate-800/80 shrink-0 select-none">
        <div>
          <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800/80">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-white tracking-tight text-base">Fireflies</span>
                <span className="text-[11px] font-extrabold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">.ai</span>
              </div>
              <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold block">PRO INTELLIGENCE</span>
            </div>
          </div>

          <nav className="p-4 space-y-1">
            {navItems.map((item, idx) => {
              const Icon = item.icon;
              const isActive = item.href ? pathname === item.href : false;

              if (item.href) {
                return (
                  <Link
                    key={idx}
                    href={item.href}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition group ${
                      isActive
                        ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/20 font-bold"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 transition ${isActive ? "text-indigo-400" : "text-slate-400 group-hover:text-white"}`} />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              }

              return (
                <button
                  key={idx}
                  onClick={item.onClick}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/50 transition cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-slate-400 group-hover:text-white transition" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Profile Card positioned with padding to avoid devtools overlap */}
        <div className="p-4 space-y-3 pb-8">
          <div className="p-3.5 rounded-2xl bg-[#111726] border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-slate-400">AI Transcription Quota</span>
              <span className="text-indigo-400 font-mono">8.4 / 15 hrs</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 w-[56%] rounded-full" />
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xs">
              K
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold text-white block truncate">Karan</span>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Available
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-[#0F1422] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 text-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">Workspace Configuration</h3>
                  <p className="text-[11px] text-slate-400">Manage AI formatting rules and API keys</p>
                </div>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">Executive Summary Format</label>
              <div className="grid grid-cols-2 gap-2 bg-[#090C14] p-1.5 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setSummaryFormat("bullets")}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    summaryFormat === "bullets"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {summaryFormat === "bullets" && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  <span>Executive Bullet Points</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSummaryFormat("technical")}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    summaryFormat === "technical"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {summaryFormat === "technical" && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  <span>Detailed Technical Breakdown</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">OpenAI / Claude API Connection</label>
              <div className="relative">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full bg-[#090C14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500 transition"
                />
                <span className="absolute right-3 top-2.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Connected
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSaveSettings}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-indigo-600/25 cursor-pointer"
              >
                {savedSettingsFeedback ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <span>Save Configuration</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Soundbites Modal */}
      {showSoundbites && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-[#0F1422] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 text-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                  <Scissors className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">Soundbites &amp; Clips Hub</h3>
                  <p className="text-[11px] text-slate-400">Curated short moments extracted for Slack or Jira sharing</p>
                </div>
              </div>
              <button
                onClick={() => setShowSoundbites(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {soundbites.map((clip) => {
                const isCopied = copiedClipId === clip.id;

                return (
                  <div
                    key={clip.id}
                    className="p-3.5 bg-[#090C14] border border-slate-800 hover:border-slate-700 rounded-xl transition flex items-center justify-between"
                  >
                    <div className="space-y-1 min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate">{clip.title}</span>
                        <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 shrink-0">
                          #{clip.tag}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                        <span className="text-slate-300 font-sans">{clip.speaker}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-indigo-300">
                          <Play className="w-2.5 h-2.5 fill-current" /> {clip.timestamp}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyLink(clip)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                        isCopied
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : "bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30"
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-400" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-800">
              <span className="text-[11px] text-slate-400">
                Click any clip to copy its direct timestamp link.
              </span>
              <button
                type="button"
                onClick={() => setShowSoundbites(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function Sidebar() {
  return (
    <Suspense fallback={<aside className="w-64 bg-[#0B0F19] shrink-0" />}>
      <SidebarContent />
    </Suspense>
  );
}