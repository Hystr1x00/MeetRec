"use client";

import { useEffect, useState, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { Video, Search, Clock, Download, ExternalLink, Bot as BotIcon, Play } from "lucide-react";
import { Bot, BotStatusCode, getMeetingUrl } from "@/types";

function getLatestStatus(bot: Bot): BotStatusCode {
    const changes = bot.status_changes;
    if (!changes || changes.length === 0) return "ready" as BotStatusCode;
    return changes[changes.length - 1].code;
}

function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
}

export default function RecordingsPage() {
    const [bots, setBots] = useState<Bot[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetch("/api/bots")
            .then((r) => r.json())
            .then((d) => { setBots(d.bots ?? []); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    // Only show bots that are done and have a video download URL
    const doneBots = useMemo(() => {
        return bots.filter((b) => {
            const status = getLatestStatus(b);
            return ["done", "analysis_done"].includes(status);
        });
    }, [bots]);

    const filtered = useMemo(() => {
        if (!search) return doneBots;
        const q = search.toLowerCase();
        return doneBots.filter((b) => getMeetingUrl(b).toLowerCase().includes(q) || b.bot_name?.toLowerCase().includes(q));
    }, [doneBots, search]);

    return (
        <div style={{ padding: "36px 40px", maxWidth: "1100px" }}>
            {/* Header */}
            <div className="page-header fade-in">
                <div>
                    <h1 className="page-title">Recordings</h1>
                    <p className="page-subtitle">View and download recordings from completed bot sessions.</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "white", border: "1px solid var(--border)", borderRadius: "10px", padding: "8px 14px", boxShadow: "0 1px 3px rgba(15,23,42,0.06)" }}>
                    <Search size={15} color="var(--text-muted)" />
                    <input
                        placeholder="Search recordings..."
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
                    { label: "With Recordings", value: loading ? "—" : doneBots.filter(b => b.recordings?.some(r => r.media_shortcuts?.video_mixed?.data?.download_url)).length, color: "#6366f1" },
                ].map(({ label, value, color }) => (
                    <div key={label} className="stat-card" style={{ flex: 1 }}>
                        <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>{value}</div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{label}</div>
                        <div style={{ height: "2px", background: color, borderRadius: "1px", marginTop: "10px", width: "40px", opacity: 0.5 }} />
                    </div>
                ))}
            </div>

            {/* Recordings list */}
            {loading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: "88px", borderRadius: "14px" }} />)}
                </div>
            ) : filtered.length === 0 ? (
                <div className="card fade-in" style={{ padding: "60px", textAlign: "center" }}>
                    <div style={{ width: "64px", height: "64px", borderRadius: "18px", background: "rgba(99,102,241,0.08)", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Video size={28} color="#6366f1" />
                    </div>
                    <div style={{ fontSize: "17px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px" }}>
                        {search ? "No recordings match your search" : "No recordings yet"}
                    </div>
                    <div style={{ fontSize: "13px", color: "var(--text-muted)", maxWidth: "400px", margin: "0 auto" }}>
                        Recordings appear here after a bot completes a meeting session. Send a bot from the Bots page to get started.
                    </div>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {filtered.map((bot) => {
                        // Recall.ai v2 returns `recordings` array. Find the latest "done" mixed video.
                        const recordings = bot.recordings || [];
                        const latestRec = [...recordings]
                            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                            .find(r => r.media_shortcuts?.video_mixed?.data?.download_url || r.media_shortcuts?.audio_mixed?.data?.download_url);

                        const videoUrl = latestRec?.media_shortcuts?.video_mixed?.data?.download_url;
                        const audioUrl = latestRec?.media_shortcuts?.audio_mixed?.data?.download_url;

                        const duration = latestRec?.completed_at && latestRec?.started_at
                            ? Math.round((new Date(latestRec.completed_at).getTime() - new Date(latestRec.started_at).getTime()) / 1000)
                            : null;

                        return (
                            <div key={bot.id} className="card fade-in" style={{ padding: "20px 24px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                    {/* Icon */}
                                    <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                        <Video size={20} color="#6366f1" />
                                    </div>

                                    {/* Info */}
                                    <div style={{ flex: 1, overflow: "hidden" }}>
                                        <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "5px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {getMeetingUrl(bot)}
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
                                            {bot.created_at && (
                                                <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--text-muted)" }}>
                                                    <Clock size={11} />
                                                    {format(parseISO(bot.created_at), "MMM d, yyyy · h:mm a")}
                                                </span>
                                            )}
                                            {bot.bot_name && (
                                                <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--text-muted)" }}>
                                                    <BotIcon size={11} /> {bot.bot_name}
                                                </span>
                                            )}
                                            {duration !== null && (
                                                <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--text-muted)" }}>
                                                    <Play size={11} /> {formatDuration(duration)}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                                        {videoUrl ? (
                                            <>
                                                <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ fontSize: "13px", padding: "8px 14px", textDecoration: "none" }}>
                                                    <Play size={13} /> Watch
                                                </a>
                                                <a href={videoUrl} download className="btn-ghost" style={{ fontSize: "13px", padding: "8px 14px", textDecoration: "none" }}>
                                                    <Download size={13} />
                                                </a>
                                            </>
                                        ) : audioUrl ? (
                                            <a href={audioUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ fontSize: "13px", padding: "8px 14px", textDecoration: "none" }}>
                                                <ExternalLink size={13} /> Audio
                                            </a>
                                        ) : (
                                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
                                                <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>
                                                    {getLatestStatus(bot) === "done" ? "Processing recording..." : "Still in meeting"}
                                                </span>
                                                {getLatestStatus(bot) === "done" && (
                                                    <span style={{ fontSize: "10px", color: "var(--text-muted)", opacity: 0.7 }}>
                                                        Finalizing media files
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
