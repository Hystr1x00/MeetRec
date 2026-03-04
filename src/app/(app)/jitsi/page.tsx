"use client";

import { useState, useEffect } from "react";
import { Video, ExternalLink, Copy, Check, RefreshCw, Calendar, Trash2, Clock } from "lucide-react";

interface SavedMeeting {
    id: string;
    roomName: string;
    userName: string;
    createdAt: string;
}

export default function JitsiPage() {
    const [roomName, setRoomName] = useState("");
    const [userName, setUserName] = useState("");
    const [copied, setCopied] = useState(false);
    const [savedMeetings, setSavedMeetings] = useState<SavedMeeting[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem("jitsi_meetings");
        if (saved) {
            try {
                setSavedMeetings(JSON.parse(saved));
            } catch (e) { }
        }
    }, []);

    const saveMeeting = (room: string, user: string) => {
        const newMeeting: SavedMeeting = {
            id: Date.now().toString(),
            roomName: room,
            userName: user,
            createdAt: new Date().toISOString()
        };
        const updated = [newMeeting, ...savedMeetings.filter(m => m.roomName !== room)].slice(0, 50);
        setSavedMeetings(updated);
        localStorage.setItem("jitsi_meetings", JSON.stringify(updated));
    };

    const deleteMeeting = (id: string) => {
        const updated = savedMeetings.filter(m => m.id !== id);
        setSavedMeetings(updated);
        localStorage.setItem("jitsi_meetings", JSON.stringify(updated));
    };

    const generateRandomRoom = () => {
        const randomString = Math.random().toString(36).substring(2, 12);
        setRoomName(`meeting-${randomString}`);
    };

    const copyToClipboard = () => {
        if (!roomName.trim()) return;
        const url = `https://jitsi.manajio.com/${roomName.trim()}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSchedule = () => {
        if (!roomName.trim()) return;
        saveMeeting(roomName.trim(), userName.trim());
        setRoomName("");
        setUserName("");
        alert("Meeting berhasil ditambahkan ke list Scheduled Meetings!");
    };

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!roomName.trim()) return;

        saveMeeting(roomName.trim(), userName.trim());
        let url = `https://jitsi.manajio.com/${roomName.trim()}`;
        if (userName.trim()) {
            url += `#userInfo.displayName="${encodeURIComponent(userName.trim())}"`;
        }
        window.open(url, "_blank");
    };

    const openMeeting = (room: string, user: string) => {
        let url = `https://jitsi.manajio.com/${room}`;
        if (user.trim()) {
            url += `#userInfo.displayName="${encodeURIComponent(user.trim())}"`;
        }
        window.open(url, "_blank");
    };

    return (
        <div style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column" }}>
            <div className="responsive-container">
                <div className="centered-header fade-in">
                    <div style={{ display: "inline-flex", background: "rgba(59,130,246,0.1)", borderRadius: "16px", padding: "12px", marginBottom: "16px", marginTop: "20px" }}>
                        <Video size={36} color="#3b82f6" />
                    </div>
                    <h1 className="page-title" style={{ fontSize: "28px" }}>Join Jitsi Meet</h1>
                    <p className="page-subtitle" style={{ fontSize: "15px", maxWidth: "450px", margin: "0 auto" }}>
                        Enter a room name to join or create a video conference. Jitsi akan <strong>terbuka di tab baru</strong> agar fitur Download Recording bisa berjalan normal.
                    </p>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "24px", alignItems: "flex-start", marginTop: "30px" }}>
                    {/* Left: Form */}
                    <div className="responsive-card fade-in" style={{ flex: "1 1 400px", margin: 0 }}>
                        <form onSubmit={handleJoin} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                                    <label className="input-label" style={{ fontSize: "14px", fontWeight: 500, margin: 0 }}>Room Name *</label>
                                    <button
                                        type="button"
                                        onClick={generateRandomRoom}
                                        style={{
                                            display: "flex", alignItems: "center", gap: "4px",
                                            fontSize: "12px", color: "#3b82f6", background: "none",
                                            border: "none", cursor: "pointer", padding: 0
                                        }}
                                    >
                                        <RefreshCw size={12} />
                                        Generate Random
                                    </button>
                                </div>
                                <input
                                    required
                                    className="input"
                                    style={{ padding: "12px", fontSize: "15px" }}
                                    placeholder="e.g. WeeklyStandup"
                                    value={roomName}
                                    onChange={(e) => setRoomName(e.target.value.replace(/\s+/g, '-'))}
                                />
                                <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px" }}>Spacing will be converted to hyphens.</p>
                            </div>

                            <div>
                                <label className="input-label" style={{ fontSize: "14px", fontWeight: 500 }}>Your Name (optional)</label>
                                <input
                                    className="input"
                                    style={{ padding: "12px", fontSize: "15px" }}
                                    placeholder="e.g. John Doe"
                                    value={userName}
                                    onChange={(e) => setUserName(e.target.value)}
                                />
                            </div>

                            {roomName.trim() && (
                                <div style={{ background: "var(--bg-card-alt, #f8fafc)", border: "1px solid var(--border, #e2e8f0)", borderRadius: "10px", padding: "12px", marginTop: "5px" }}>
                                    <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: "8px" }}>
                                        Your Meeting URL
                                    </label>
                                    <div style={{ display: "flex", gap: "8px", flexDirection: "column" }}>
                                        <div style={{ display: "flex", gap: "8px" }}>
                                            <input
                                                readOnly
                                                className="input"
                                                style={{ padding: "10px", fontSize: "14px", flex: 1, backgroundColor: "var(--bg-card, #ffffff)", color: "var(--text-secondary)", cursor: "default" }}
                                                value={`https://jitsi.manajio.com/${roomName.trim()}`}
                                            />
                                            <button
                                                type="button"
                                                onClick={copyToClipboard}
                                                style={{
                                                    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                                                    padding: "0 16px", background: copied ? "#10b981" : "#e2e8f0",
                                                    color: copied ? "white" : "var(--text-primary)", borderRadius: "8px", border: "1px solid var(--border)",
                                                    cursor: "pointer", fontWeight: 500, fontSize: "14px",
                                                    transition: "all 0.2s"
                                                }}
                                            >
                                                {copied ? <Check size={16} /> : <Copy size={16} />}
                                                {copied ? "Copied" : "Copy"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: "10px", padding: "12px", display: "flex", gap: "10px", marginTop: "5px" }}>
                                <div style={{ color: "#f59e0b", marginTop: "2px" }}><ExternalLink size={18} /></div>
                                <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                                    Wajib klik tombol biru di bawah agar Jitsi terbuka di tab baru. Jika pakai <i>IFrame</i>, Keamanan Browser otomatis memblokir download hasil record Anda. Setelah meeting selesai, hasil record bisa langsung di-upload ke menu <strong>Upload Video</strong>.
                                </div>
                            </div>

                            <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                                <button
                                    type="button"
                                    onClick={handleSchedule}
                                    className="btn-primary"
                                    style={{
                                        flex: 1, padding: "14px", fontSize: "15px",
                                        fontWeight: 600, justifyContent: "center",
                                        background: "#f8fafc", color: "#3b82f6", border: "1px solid #3b82f6",
                                        opacity: (!roomName.trim()) ? 0.6 : 1,
                                        cursor: (!roomName.trim()) ? "not-allowed" : "pointer"
                                    }}
                                    disabled={!roomName.trim()}
                                >
                                    Schedule Meeting
                                </button>

                                <button
                                    type="submit"
                                    className="btn-primary"
                                    style={{
                                        flex: 1, padding: "14px", fontSize: "15px",
                                        fontWeight: 600, justifyContent: "center",
                                        opacity: (!roomName.trim()) ? 0.6 : 1,
                                        cursor: (!roomName.trim()) ? "not-allowed" : "pointer"
                                    }}
                                    disabled={!roomName.trim()}
                                >
                                    Buka Jitsi di Tab Baru
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Right: List */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: "1 1 400px", minWidth: "0" }}>
                        <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)" }}>Scheduled Meetings</h2>
                        {savedMeetings.length === 0 ? (
                            <div className="card" style={{ padding: "32px", textAlign: "center" }}>
                                <Video size={32} color="var(--text-muted)" style={{ margin: "0 auto 10px" }} />
                                <div style={{ color: "var(--text-secondary)", fontSize: "14px" }}>No scheduled meetings yet</div>
                            </div>
                        ) : (
                            savedMeetings.map(meeting => (
                                <div key={meeting.id} className="card fade-in" style={{ padding: "16px 18px" }}>
                                    <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                                        <div style={{ flex: 1, overflow: "hidden" }}>
                                            <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "5px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                https://jitsi.manajio.com/{meeting.roomName}
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                                <span className="badge badge-success">Scheduled</span>
                                                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                                                    <Clock size={11} />
                                                    {new Date(meeting.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' })}
                                                </span>
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                                            <button onClick={() => {
                                                navigator.clipboard.writeText(`https://jitsi.manajio.com/${meeting.roomName}`);
                                                alert("Link copied!");
                                            }} className="btn-ghost" title="Copy Link" style={{ fontSize: "12px", padding: "6px 10px", color: "#3b82f6" }}>
                                                <Copy size={12} />
                                            </button>
                                            <a href={`https://jitsi.manajio.com/${meeting.roomName}`} target="_blank" rel="noopener noreferrer" className="btn-ghost" title="Join Meeting" style={{ fontSize: "12px", padding: "6px 10px" }}>
                                                <ExternalLink size={12} />
                                            </a>
                                            <button onClick={() => deleteMeeting(meeting.id)} className="btn-ghost" title="Delete from list" style={{ fontSize: "12px", padding: "6px 10px", color: "#dc2626" }}>
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
