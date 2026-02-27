"use client";

import { useEffect, useState, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { FileText, Search, Clock, Copy, ChevronDown, ChevronUp, AlertCircle, CheckCheck, Bot as BotIcon } from "lucide-react";
import { Bot, BotStatusCode, TranscriptEntry, getMeetingUrl } from "@/types";

function getLatestStatus(bot: Bot): BotStatusCode {
    const changes = bot.status_changes;
    if (!changes || changes.length === 0) return "ready" as BotStatusCode;
    return changes[changes.length - 1].code;
}

function formatSecs(secs: number): string {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function TranscriptsPage() {
    const [bots, setBots] = useState<Bot[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [expanded, setExpanded] = useState<string | null>(null);
    const [entries, setEntries] = useState<Record<string, TranscriptEntry[]>>({});
    const [loadingEntries, setLoadingEntries] = useState<string | null>(null);
    const [copied, setCopied] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/bots")
            .then((r) => r.json())
            .then((d) => { setBots(d.bots ?? []); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const doneBots = useMemo(() => {
        return bots.filter((b) => ["done", "analysis_done"].includes(getLatestStatus(b)));
    }, [bots]);

    const filtered = useMemo(() => {
        if (!search) return doneBots;
        const q = search.toLowerCase();
        return doneBots.filter((b) => getMeetingUrl(b).toLowerCase().includes(q) || b.bot_name?.toLowerCase().includes(q));
    }, [doneBots, search]);

    const loadEntries = async (botId: string) => {
        if (entries[botId]) { setExpanded(botId); return; }
        setLoadingEntries(botId);
        setExpanded(botId);
        try {
            const res = await fetch(`/api/bots/${botId}/transcript`);
            const d = await res.json();
            setEntries((prev) => ({ ...prev, [botId]: d.entries ?? [] }));
        } finally {
            setLoadingEntries(null);
        }
    };

    const toggleExpand = (botId: string) => {
        if (expanded === botId) { setExpanded(null); return; }
        loadEntries(botId);
    };

    const copyTranscript = (botId: string) => {
        const e = entries[botId] ?? [];
        const text = e.map((entry) => {
            const ts = typeof entry.start_timestamp === "number"
                ? entry.start_timestamp
                : (entry.start_timestamp as any)?.relative ?? 0;
            const content = entry.words.map(w => w.text).join(" ");
            return `[${formatSecs(ts)}] ${entry.speaker}: ${content}`;
        }).join("\n");
        navigator.clipboard.writeText(text);
        setCopied(botId);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div style={{ padding: "36px 40px", maxWidth: "1100px" }}>
            <div className="page-header fade-in">
                <div>
                    <h1 className="page-title">Transcripts</h1>
                    <p className="page-subtitle">Speaker-attributed transcripts from your Recall.ai bot sessions.</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "white", border: "1px solid var(--border)", borderRadius: "10px", padding: "8px 14px", boxShadow: "0 1px 3px rgba(15,23,42,0.06)" }}>
                    <Search size={15} color="var(--text-muted)" />
                    <input
                        placeholder="Search transcripts..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ background: "none", border: "none", outline: "none", color: "var(--text-primary)", fontSize: "14px", width: "200px" }}
                    />
                </div>
            </div>

            {/* Stats */}
            <div className="fade-in" style={{ display: "flex", gap: "16px", marginBottom: "28px" }}>
                {[
                    { label: "Total Bots", value: loading ? "—" : bots.length, color: "#3b82f6" },
                    { label: "Completed", value: loading ? "—" : doneBots.length, color: "#10b981" },
                    { label: "Showing", value: loading ? "—" : filtered.length, color: "#6366f1" },
                ].map(({ label, value, color }) => (
                    <div key={label} className="stat-card" style={{ flex: 1 }}>
                        <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>{value}</div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{label}</div>
                        <div style={{ height: "2px", background: color, borderRadius: "1px", marginTop: "10px", width: "40px", opacity: 0.5 }} />
                    </div>
                ))}
            </div>

            {loading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: "88px", borderRadius: "14px" }} />)}
                </div>
            ) : filtered.length === 0 ? (
                <div className="card fade-in" style={{ padding: "60px", textAlign: "center" }}>
                    <div style={{ width: "64px", height: "64px", borderRadius: "18px", background: "rgba(16,185,129,0.08)", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <FileText size={28} color="#10b981" />
                    </div>
                    <div style={{ fontSize: "17px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px" }}>
                        {search ? "No transcripts match your search" : "No transcripts yet"}
                    </div>
                    <div style={{ fontSize: "13px", color: "var(--text-muted)", maxWidth: "400px", margin: "0 auto" }}>
                        Transcripts appear here once a bot completes a session. Make sure transcription is enabled when you send a bot.
                    </div>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {filtered.map((bot) => {
                        const isOpen = expanded === bot.id;
                        const botEntries = entries[bot.id] ?? [];
                        return (
                            <div key={bot.id} className="card fade-in" style={{ overflow: "hidden" }}>
                                {/* Header row */}
                                <div style={{ padding: "18px 22px", display: "flex", alignItems: "center", gap: "14px" }}>
                                    <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                        <FileText size={19} color="#10b981" />
                                    </div>
                                    <div style={{ flex: 1, overflow: "hidden" }}>
                                        <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {getMeetingUrl(bot)}
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--text-muted)" }}>
                                                <BotIcon size={11} /> {bot.bot_name}
                                            </span>
                                            {bot.created_at && (
                                                <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--text-muted)" }}>
                                                    <Clock size={11} /> {format(parseISO(bot.created_at), "MMM d, yyyy · h:mm a")}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => toggleExpand(bot.id)}
                                        className="btn-ghost"
                                        style={{ fontSize: "13px", padding: "8px 14px", display: "flex", alignItems: "center", gap: "6px" }}
                                    >
                                        {isOpen ? <><ChevronUp size={14} /> Collapse</> : <><ChevronDown size={14} /> View Transcript</>}
                                    </button>
                                </div>

                                {/* Transcript entries */}
                                {isOpen && (
                                    <div style={{ borderTop: "1px solid var(--border)", padding: "16px 22px" }}>
                                        {loadingEntries === bot.id ? (
                                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                                {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: "44px", borderRadius: "8px" }} />)}
                                            </div>
                                        ) : botEntries.length === 0 ? (
                                            <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                                                <AlertCircle size={15} /> No transcript entries available.
                                            </div>
                                        ) : (
                                            <>
                                                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
                                                    <button onClick={() => copyTranscript(bot.id)} className="btn-ghost" style={{ fontSize: "12px", padding: "6px 12px" }}>
                                                        {copied === bot.id ? <><CheckCheck size={12} /> Copied!</> : <><Copy size={12} /> Copy All</>}
                                                    </button>
                                                </div>
                                                <div style={{ maxHeight: "420px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
                                                    {botEntries.map((entry, idx) => {
                                                        const ts = typeof entry.start_timestamp === "number"
                                                            ? entry.start_timestamp
                                                            : (entry.start_timestamp as any)?.relative ?? 0;
                                                        return (
                                                            <div
                                                                key={idx}
                                                                style={{ display: "flex", gap: "12px", padding: "10px 14px", background: "var(--bg-secondary)", borderRadius: "8px", borderLeft: "2px solid rgba(59,130,246,0.3)" }}
                                                            >
                                                                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "monospace", flexShrink: 0, paddingTop: "2px", minWidth: "40px" }}>
                                                                    {formatSecs(ts)}
                                                                </span>
                                                                <div>
                                                                    {entry.speaker && (
                                                                        <div style={{ fontSize: "11px", fontWeight: 600, color: "#3b82f6", marginBottom: "3px" }}>
                                                                            {entry.speaker}
                                                                        </div>
                                                                    )}
                                                                    <div style={{ fontSize: "13px", color: "var(--text-primary)", lineHeight: 1.6 }}>
                                                                        {entry.words.map(w => w.text).join(" ")}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
