"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { Bot as BotIcon, CheckCircle2, Loader2, AlertCircle, Video, Clock, ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import { Bot, BotStatusCode, getMeetingUrl } from "@/types";

function getStatusMeta(code: BotStatusCode) {
    switch (code) {
        case "done":
        case "analysis_done":
            return { label: "Done", color: "#10b981", bg: "rgba(16,185,129,0.08)", icon: CheckCircle2, badge: "badge-success" };
        case "in_call_recording":
        case "in_call_not_recording":
            return { label: "In Call", color: "#3b82f6", bg: "rgba(59,130,246,0.08)", icon: Video, badge: "badge-info" };
        case "joining_call":
        case "in_waiting_room":
            return { label: "Joining", color: "#f59e0b", bg: "rgba(245,158,11,0.08)", icon: Loader2, badge: "badge-warning" };
        case "fatal":
            return { label: "Failed", color: "#ef4444", bg: "rgba(239,68,68,0.08)", icon: AlertCircle, badge: "badge-muted" };
        default:
            return { label: code, color: "#94a3b8", bg: "rgba(148,163,184,0.08)", icon: BotIcon, badge: "badge-muted" };
    }
}

function getLatestStatus(bot: Bot): BotStatusCode {
    const changes = bot.status_changes;
    if (!changes || changes.length === 0) return "ready" as BotStatusCode;
    return changes[changes.length - 1].code;
}

export default function DashboardPage() {
    const [bots, setBots] = useState<Bot[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/bots")
            .then((r) => r.json())
            .then((d) => { setBots(d.bots ?? []); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const done = bots.filter((b) => ["done", "analysis_done"].includes(getLatestStatus(b))).length;
    const active = bots.filter((b) => ["in_call_recording", "in_call_not_recording", "joining_call", "in_waiting_room"].includes(getLatestStatus(b))).length;

    return (
        <div style={{ padding: "36px 40px", maxWidth: "1100px" }}>
            {/* Header */}
            <div className="page-header fade-in">
                <div>
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-subtitle">Overview of your Recall.ai meeting bots.</p>
                </div>
                <Link href="/bots" className="btn-primary">
                    <Plus size={16} />
                    Send Bot
                </Link>
            </div>

            {/* Stats */}
            <div className="fade-in" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "32px" }}>
                {[
                    { label: "Total Bots", value: loading ? "—" : bots.length, color: "#3b82f6", bg: "rgba(59,130,246,0.08)", icon: BotIcon },
                    { label: "Active Now", value: loading ? "—" : active, color: "#f59e0b", bg: "rgba(245,158,11,0.08)", icon: Loader2 },
                    { label: "Completed", value: loading ? "—" : done, color: "#10b981", bg: "rgba(16,185,129,0.08)", icon: CheckCircle2 },
                ].map(({ label, value, color, bg, icon: Icon }) => (
                    <div key={label} className="stat-card">
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                            <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{label}</span>
                            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Icon size={17} color={color} />
                            </div>
                        </div>
                        <div style={{ fontSize: "28px", fontWeight: 700, color: "var(--text-primary)" }}>{value}</div>
                    </div>
                ))}
            </div>

            {/* Quick Access */}
            <div style={{ marginBottom: "32px" }}>
                <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "14px" }}>Quick Access</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
                    {[
                        { href: "/jitsi", icon: Video, label: "Jitsi Meet", desc: "Host Internal Meetings", color: "#f59e0b" },
                        { href: "/bots", icon: BotIcon, label: "Send a Bot", desc: "Record any meeting via URL", color: "#3b82f6" },
                        { href: "/recordings", icon: Video, label: "View Recordings", desc: "Watch your past meetings", color: "#6366f1" },
                        { href: "/transcripts", icon: Clock, label: "Browse Transcripts", desc: "Read timestamped transcripts", color: "#10b981" },
                    ].map(({ href, icon: Icon, label, desc, color }) => (
                        <Link key={href} href={href} className="card" style={{ padding: "20px", textDecoration: "none", display: "flex", flexDirection: "column", gap: "12px" }}>
                            <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: `${color}14`, border: `1px solid ${color}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Icon size={18} color={color} />
                            </div>
                            <div>
                                <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>{label}</div>
                                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{desc}</div>
                            </div>
                            <ArrowRight size={14} color="var(--text-muted)" style={{ alignSelf: "flex-end" }} />
                        </Link>
                    ))}
                </div>
            </div>

            {/* Recent Bots */}
            <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                    <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)" }}>Recent Bots</h2>
                    <Link href="/bots" style={{ fontSize: "13px", color: "#3b82f6", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
                        View all <ArrowRight size={12} />
                    </Link>
                </div>

                {loading ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: "72px", borderRadius: "12px" }} />)}
                    </div>
                ) : bots.length === 0 ? (
                    <div className="card" style={{ padding: "40px", textAlign: "center" }}>
                        <BotIcon size={36} color="var(--text-muted)" style={{ margin: "0 auto 12px" }} />
                        <div style={{ fontSize: "15px", fontWeight: 500, color: "var(--text-secondary)" }}>No bots yet</div>
                        <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "6px" }}>
                            Send your first bot to start recording meetings
                        </div>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {bots.slice(0, 5).map((bot) => {
                            const statusCode = getLatestStatus(bot);
                            const meta = getStatusMeta(statusCode);
                            const StatusIcon = meta.icon;
                            return (
                                <div key={bot.id} className="card" style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: "16px" }}>
                                    <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                        <StatusIcon size={18} color={meta.color} />
                                    </div>
                                    <div style={{ flex: 1, overflow: "hidden" }}>
                                        <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {getMeetingUrl(bot)}
                                        </div>
                                        <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                                            {bot.created_at ? format(parseISO(bot.created_at), "EEE, MMM d · h:mm a") : ""}
                                            {bot.bot_name ? ` · ${bot.bot_name}` : ""}
                                        </div>
                                    </div>
                                    <span className={`badge ${meta.badge}`}>{meta.label}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
