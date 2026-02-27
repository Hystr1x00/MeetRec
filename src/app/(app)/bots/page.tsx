"use client";

import { useState, useEffect } from "react";
import { format, parseISO, addHours } from "date-fns";
import {
    Bot as BotIcon, Send, Link as LinkIcon, Clock, CheckCircle2,
    Loader2, AlertCircle, Video, Plus, ExternalLink, Calendar,
    Users, Trash2
} from "lucide-react";
import { Bot, BotStatusCode, SendBotPayload, getMeetingUrl } from "@/types";

// ─── helpers ────────────────────────────────────────────────────────────────
function getLatestStatus(bot: Bot): BotStatusCode {
    const c = bot.status_changes;
    return c?.length ? c[c.length - 1].code : ("ready" as BotStatusCode);
}

const STATUS_META: Record<string, { label: string; badge: string }> = {
    done: { label: "Done", badge: "badge-success" },
    analysis_done: { label: "Done", badge: "badge-success" },
    in_call_recording: { label: "Recording", badge: "badge-info" },
    in_call_not_recording: { label: "In Call", badge: "badge-info" },
    joining_call: { label: "Joining", badge: "badge-warning" },
    in_waiting_room: { label: "Waiting", badge: "badge-warning" },
    fatal: { label: "Failed", badge: "badge-muted" },
    ready: { label: "Scheduled", badge: "badge-muted" },
};
function StatusBadge({ code }: { code: string }) {
    const { label, badge } = STATUS_META[code] ?? { label: code, badge: "badge-muted" };
    return <span className={`badge ${badge}`}>{label}</span>;
}

function toLocalISO(d: Date) {
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

// ─── main component ──────────────────────────────────────────────────────────
type Tab = "create" | "url";

export default function BotsPage() {
    const [tab, setTab] = useState<Tab>("create");
    const [bots, setBots] = useState<Bot[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<{ type: "success" | "partial" | "error"; msg: string; link?: string } | null>(null);

    // ── Create & Record form state ──
    const now = new Date();
    const defStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0);
    const defEnd = addHours(defStart, 1);
    const [createForm, setCreateForm] = useState({
        title: "", description: "", botName: "MeetRec Bot",
        startLocal: toLocalISO(defStart), endLocal: toLocalISO(defEnd),
        attendeeInput: "", attendees: [] as string[],
    });

    // ── Send to URL form state ──
    const [urlForm, setUrlForm] = useState<SendBotPayload & { joinLocal: string; joinNow: boolean }>({
        meeting_url: "", bot_name: "MeetRec Bot",
        join_at: new Date(now.getTime() + 15 * 60000).toISOString(),
        joinLocal: toLocalISO(new Date(now.getTime() + 15 * 60000)),
        joinNow: false,
    });

    useEffect(() => {
        fetch("/api/bots")
            .then(r => r.json())
            .then(d => { setBots(d.bots ?? []); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    // ── Instant Meeting submit ──
    const handleInstantMeeting = async () => {
        const title = `Instant Meeting - ${format(new Date(), "HH:mm")}`;
        setSubmitting(true); setResult(null);
        try {
            const res = await fetch("/api/meetings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    description: "Created via Instant Meeting button.",
                    startDateTime: new Date().toISOString(),
                    endDateTime: addHours(new Date(), 1).toISOString(),
                    bot_name: createForm.botName,
                }),
            });
            const data = await res.json();
            if (res.status === 201) {
                setResult({ type: "success", msg: "Instant meeting created and bot joining!", link: data.hangoutLink });
                if (data.bot) setBots(prev => [data.bot, ...prev]);
            } else if (res.status === 207) {
                setResult({ type: "partial", msg: `Meet created but bot failed: ${data.botError}`, link: data.hangoutLink });
            } else {
                setResult({ type: "error", msg: data.error ?? "Failed to create instant meeting." });
            }
        } catch (e) {
            setResult({ type: "error", msg: e instanceof Error ? e.message : "Unknown error." });
        } finally {
            setSubmitting(false);
        }
    };

    // ── Create & Record submit ──
    const handleCreate = async () => {
        if (!createForm.title.trim()) { setResult({ type: "error", msg: "Meeting title is required." }); return; }
        setSubmitting(true); setResult(null);
        try {
            const res = await fetch("/api/meetings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: createForm.title,
                    description: createForm.description,
                    startDateTime: new Date(createForm.startLocal).toISOString(),
                    endDateTime: new Date(createForm.endLocal).toISOString(),
                    attendees: createForm.attendees,
                    bot_name: createForm.botName,
                }),
            });
            const data = await res.json();
            if (res.status === 201) {
                setResult({ type: "success", msg: "Google Meet created and bot scheduled!", link: data.hangoutLink });
                if (data.bot) setBots(prev => [data.bot, ...prev]);
                setCreateForm(f => ({ ...f, title: "", description: "", attendees: [] }));
            } else if (res.status === 207) {
                setResult({ type: "partial", msg: `Meet created but bot failed: ${data.botError}`, link: data.hangoutLink });
            } else {
                setResult({ type: "error", msg: data.error ?? "Failed to create meeting." });
            }
        } catch (e) {
            setResult({ type: "error", msg: e instanceof Error ? e.message : "Unknown error." });
        } finally {
            setSubmitting(false);
        }
    };

    // ── Send to URL submit ──
    const handleSendUrl = async () => {
        if (!urlForm.meeting_url.trim()) { setResult({ type: "error", msg: "Meeting URL is required." }); return; }
        setSubmitting(true); setResult(null);
        try {
            const payload: SendBotPayload = {
                meeting_url: urlForm.meeting_url,
                bot_name: urlForm.bot_name || "MeetRec Bot",
                ...(!urlForm.joinNow && { join_at: urlForm.join_at }),
            };
            const res = await fetch("/api/bots", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Failed to send bot");
            setResult({ type: "success", msg: "Bot sent!", link: urlForm.meeting_url });
            setBots(prev => [data.bot, ...prev]);
            setUrlForm(f => ({ ...f, meeting_url: "" }));
        } catch (e) {
            setResult({ type: "error", msg: e instanceof Error ? e.message : "Failed." });
        } finally {
            setSubmitting(false);
        }
    };

    const addAttendee = () => {
        const e = createForm.attendeeInput.trim();
        if (e && !createForm.attendees.includes(e))
            setCreateForm(f => ({ ...f, attendees: [...f.attendees, e], attendeeInput: "" }));
    };

    // ─── render ───────────────────────────────────────────────────────────────
    return (
        <div style={{ padding: "36px 40px", maxWidth: "1100px" }}>
            <div className="page-header fade-in">
                <div>
                    <h1 className="page-title">Meeting Bots</h1>
                    <p className="page-subtitle">Create a Google Meet or paste any URL — the bot records and transcribes automatically.</p>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" }}>
                {/* ── Left: form card ── */}
                <div className="card fade-in" style={{ padding: "28px" }}>
                    {/* Tabs */}
                    <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
                        <button
                            className="btn-primary"
                            onClick={handleInstantMeeting}
                            disabled={submitting}
                            style={{ flex: 1, padding: "12px", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", border: "none", boxShadow: "0 4px 12px rgba(16,185,129,0.2)" }}
                        >
                            {submitting ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Plus size={16} />}
                            Instant Meeting
                        </button>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                        <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
                        <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>or schedule below</span>
                        <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
                    </div>

                    <div style={{ display: "flex", gap: "4px", background: "var(--bg-secondary)", borderRadius: "10px", padding: "4px", marginBottom: "24px" }}>
                        {([["create", Calendar, "Create & Record"], ["url", LinkIcon, "Send to URL"]] as const).map(([id, Icon, label]) => (
                            <button
                                key={id}
                                onClick={() => { setTab(id); setResult(null); }}
                                style={{
                                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                                    padding: "9px 12px", borderRadius: "8px", border: "none", fontSize: "13px",
                                    fontWeight: tab === id ? 600 : 400, cursor: "pointer", transition: "all 0.2s",
                                    background: tab === id ? "white" : "transparent",
                                    color: tab === id ? "var(--text-primary)" : "var(--text-muted)",
                                    boxShadow: tab === id ? "0 1px 4px rgba(15,23,42,0.1)" : "none",
                                }}
                            >
                                <Icon size={14} /> {label}
                            </button>
                        ))}
                    </div>

                    {/* ── Tab: Create & Record ── */}
                    {tab === "create" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div>
                                <label className="input-label">Meeting Title *</label>
                                <input className="input" placeholder="e.g. Weekly Standup"
                                    value={createForm.title}
                                    onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))} />
                            </div>
                            <div>
                                <label className="input-label">Description (optional)</label>
                                <textarea className="input" rows={2} style={{ resize: "vertical" }}
                                    placeholder="Agenda or notes..."
                                    value={createForm.description}
                                    onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))} />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <div>
                                    <label className="input-label">Start</label>
                                    <input type="datetime-local" className="input"
                                        value={createForm.startLocal}
                                        onChange={e => setCreateForm(f => ({ ...f, startLocal: e.target.value }))} />
                                </div>
                                <div>
                                    <label className="input-label">End</label>
                                    <input type="datetime-local" className="input"
                                        value={createForm.endLocal}
                                        onChange={e => setCreateForm(f => ({ ...f, endLocal: e.target.value }))} />
                                </div>
                            </div>
                            <div>
                                <label className="input-label">Bot Name</label>
                                <input className="input" placeholder="MeetRec Bot"
                                    value={createForm.botName}
                                    onChange={e => setCreateForm(f => ({ ...f, botName: e.target.value }))} />
                            </div>
                            <div>
                                <label className="input-label">Attendees</label>
                                <div style={{ display: "flex", gap: "8px" }}>
                                    <input className="input" placeholder="email@example.com"
                                        value={createForm.attendeeInput}
                                        onChange={e => setCreateForm(f => ({ ...f, attendeeInput: e.target.value }))}
                                        onKeyDown={e => e.key === "Enter" && addAttendee()} />
                                    <button className="btn-ghost" onClick={addAttendee} style={{ flexShrink: 0 }}><Plus size={15} /></button>
                                </div>
                                {createForm.attendees.length > 0 && (
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
                                        {createForm.attendees.map(email => (
                                            <div key={email} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "3px 10px", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "999px", fontSize: "12px", color: "#2563eb" }}>
                                                <Users size={10} /> {email}
                                                <button onClick={() => setCreateForm(f => ({ ...f, attendees: f.attendees.filter(e => e !== email) }))}
                                                    style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", padding: 0, display: "flex" }}>
                                                    <Trash2 size={10} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0, display: "flex", gap: "5px", alignItems: "center" }}>
                                <BotIcon size={11} /> Google Meet will be created and the bot will join automatically at the start time.
                            </p>
                            {renderFeedback()}
                            <button className="btn-primary" onClick={handleCreate} disabled={submitting} style={{ width: "100%", justifyContent: "center" }}>
                                {submitting ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Calendar size={15} />}
                                {submitting ? "Creating..." : "Create & Send Bot"}
                            </button>
                        </div>
                    )}

                    {/* ── Tab: Send to URL ── */}
                    {tab === "url" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div>
                                <label className="input-label">Meeting URL *</label>
                                <div style={{ position: "relative" }}>
                                    <LinkIcon size={14} color="var(--text-muted)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                                    <input className="input" placeholder="https://meet.google.com/... or zoom.us/j/..."
                                        value={urlForm.meeting_url}
                                        onChange={e => setUrlForm(f => ({ ...f, meeting_url: e.target.value }))}
                                        style={{ paddingLeft: "36px" }} />
                                </div>
                                <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "5px" }}>
                                    Google Meet, Zoom, Microsoft Teams, and more.
                                </p>
                            </div>
                            <div>
                                <label className="input-label">Bot Name</label>
                                <input className="input" placeholder="MeetRec Bot"
                                    value={urlForm.bot_name}
                                    onChange={e => setUrlForm(f => ({ ...f, bot_name: e.target.value }))} />
                            </div>
                            <div>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                                    <label className="input-label" style={{ margin: 0 }}>Join Time</label>
                                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-secondary)", cursor: "pointer" }}>
                                        <input type="checkbox" checked={urlForm.joinNow}
                                            onChange={e => setUrlForm(f => ({ ...f, joinNow: e.target.checked }))} />
                                        Join immediately
                                    </label>
                                </div>
                                {!urlForm.joinNow && (
                                    <>
                                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                            <Clock size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                                            <input type="datetime-local" className="input" value={urlForm.joinLocal}
                                                onChange={e => setUrlForm(f => ({ ...f, joinLocal: e.target.value, join_at: new Date(e.target.value).toISOString() }))} />
                                        </div>
                                        <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "5px" }}>Must be at least 10 min in the future.</p>
                                    </>
                                )}
                            </div>
                            {renderFeedback()}
                            <button className="btn-primary" onClick={handleSendUrl} disabled={submitting} style={{ width: "100%", justifyContent: "center" }}>
                                {submitting ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={15} />}
                                {submitting ? "Sending..." : "Send Bot"}
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Right: bot list ── */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)" }}>All Bots</h2>
                    {loading
                        ? [1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: "78px", borderRadius: "12px" }} />)
                        : bots.length === 0
                            ? (
                                <div className="card" style={{ padding: "32px", textAlign: "center" }}>
                                    <BotIcon size={32} color="var(--text-muted)" style={{ margin: "0 auto 10px" }} />
                                    <div style={{ color: "var(--text-secondary)", fontSize: "14px" }}>No bots yet</div>
                                </div>
                            )
                            : bots.map(bot => {
                                const code = getLatestStatus(bot);
                                return (
                                    <div key={bot.id} className="card fade-in" style={{ padding: "16px 18px" }}>
                                        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                                            <div style={{ flex: 1, overflow: "hidden" }}>
                                                <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "5px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                    {getMeetingUrl(bot)}
                                                </div>
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                                    <StatusBadge code={code} />
                                                    {bot.created_at && (
                                                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                                                            {format(parseISO(bot.created_at), "MMM d, h:mm a")}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                                                {/* Check plural recordings array for video mixed download url */}
                                                {bot.recordings?.some(r => r.media_shortcuts?.video_mixed?.data?.download_url) && (
                                                    <div style={{ fontSize: "12px", padding: "6px 10px", color: "#6366f1", background: "rgba(99,102,241,0.08)", borderRadius: "6px", display: "flex", alignItems: "center" }}>
                                                        <Video size={12} />
                                                    </div>
                                                )}
                                                <a href={getMeetingUrl(bot)} target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ fontSize: "12px", padding: "6px 10px" }}>
                                                    <ExternalLink size={12} />
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                    }
                </div>
            </div>
        </div>
    );

    function renderFeedback() {
        if (!result) return null;
        const colors = {
            success: { bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)", text: "#059669" },
            partial: { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", text: "#d97706" },
            error: { bg: "rgba(239,68,68,0.06)", border: "rgba(239,68,68,0.15)", text: "#dc2626" },
        }[result.type];
        const Icon = result.type === "success" ? CheckCircle2 : AlertCircle;
        return (
            <div style={{ padding: "12px 14px", background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: "10px", color: colors.text, fontSize: "13px", display: "flex", alignItems: "flex-start", gap: "8px" }}>
                <Icon size={15} style={{ flexShrink: 0, marginTop: "1px" }} />
                <div>
                    {result.msg}
                    {result.link && (
                        <div style={{ marginTop: "4px" }}>
                            <a href={result.link} target="_blank" rel="noopener noreferrer" style={{ color: colors.text, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                Open Meeting <ExternalLink size={11} />
                            </a>
                        </div>
                    )}
                </div>
            </div>
        );
    }
}
