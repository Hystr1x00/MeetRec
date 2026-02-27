"use client";

import { signIn } from "next-auth/react";
import { Video, FileText, Calendar, Shield } from "lucide-react";

export default function LoginPage() {
    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "radial-gradient(ellipse at 20% 50%, rgba(59,130,246,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(99,102,241,0.06) 0%, transparent 60%), #f8fafc",
                padding: "24px",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* Background decoration */}
            <div
                style={{
                    position: "absolute",
                    top: "15%",
                    left: "10%",
                    width: "300px",
                    height: "300px",
                    borderRadius: "50%",
                    background: "rgba(59,130,246,0.05)",
                    filter: "blur(80px)",
                    pointerEvents: "none",
                }}
            />
            <div
                style={{
                    position: "absolute",
                    bottom: "15%",
                    right: "10%",
                    width: "350px",
                    height: "350px",
                    borderRadius: "50%",
                    background: "rgba(99,102,241,0.05)",
                    filter: "blur(80px)",
                    pointerEvents: "none",
                }}
            />

            <div
                className="fade-in"
                style={{ display: "flex", gap: "80px", alignItems: "center", maxWidth: "1000px", width: "100%" }}
            >
                {/* Left side — branding */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "32px" }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
                            <div
                                style={{
                                    width: "48px",
                                    height: "48px",
                                    borderRadius: "14px",
                                    background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    boxShadow: "0 8px 24px rgba(59,130,246,0.3)",
                                }}
                            >
                                <Video size={24} color="white" />
                            </div>
                            <span style={{ fontSize: "20px", fontWeight: 700, color: "#0f172a" }}>MeetRec</span>
                        </div>
                        <h1
                            className="gradient-text"
                            style={{ fontSize: "42px", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-1px" }}
                        >
                            Your Meetings,
                            <br />
                            Fully Recorded.
                        </h1>
                        <p style={{ color: "#64748b", fontSize: "16px", lineHeight: 1.7, marginTop: "16px" }}>
                            Schedule Google Meet sessions, access recordings, and review transcripts — all in one
                            beautiful workspace.
                        </p>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {[
                            { icon: Calendar, label: "Schedule Meetings", desc: "Create Google Meet sessions instantly" },
                            { icon: Video, label: "Access Recordings", desc: "Watch past meetings anytime" },
                            { icon: FileText, label: "Meeting Transcripts", desc: "Timestamped transcripts for review" },
                        ].map(({ icon: Icon, label, desc }) => (
                            <div key={label} style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                                <div
                                    style={{
                                        width: "36px",
                                        height: "36px",
                                        borderRadius: "10px",
                                        background: "rgba(59,130,246,0.08)",
                                        border: "1px solid rgba(59,130,246,0.15)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                    }}
                                >
                                    <Icon size={16} color="#3b82f6" />
                                </div>
                                <div>
                                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>{label}</div>
                                    <div style={{ fontSize: "13px", color: "#94a3b8" }}>{desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right side — login card */}
                <div
                    className="glass"
                    style={{
                        width: "380px",
                        flexShrink: 0,
                        borderRadius: "20px",
                        padding: "40px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "24px",
                    }}
                >
                    <div style={{ textAlign: "center" }}>
                        <div
                            style={{
                                width: "56px",
                                height: "56px",
                                borderRadius: "16px",
                                background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                margin: "0 auto 16px",
                                boxShadow: "0 8px 24px rgba(59,130,246,0.3)",
                            }}
                        >
                            <Shield size={24} color="white" />
                        </div>
                        <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a" }}>Welcome back</h2>
                        <p style={{ fontSize: "14px", color: "#94a3b8", marginTop: "6px" }}>
                            Sign in to access your meetings
                        </p>
                    </div>

                    <div className="divider" style={{ width: "100%" }} />

                    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "12px" }}>
                        <button
                            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                            style={{
                                width: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "12px",
                                padding: "13px 20px",
                                background: "white",
                                color: "#1e293b",
                                border: "1px solid rgba(15,23,42,0.1)",
                                borderRadius: "12px",
                                fontSize: "15px",
                                fontWeight: 600,
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                boxShadow: "0 2px 8px rgba(15,23,42,0.08)",
                            }}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 20px rgba(15,23,42,0.12)";
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 8px rgba(15,23,42,0.08)";
                            }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Continue with Google
                        </button>
                    </div>

                    <p style={{ fontSize: "12px", color: "#94a3b8", textAlign: "center", lineHeight: 1.6 }}>
                        By signing in, you grant MeetRec access to your Google Calendar and Meet recordings to provide
                        the service.
                    </p>
                </div>
            </div>
        </div>
    );
}
