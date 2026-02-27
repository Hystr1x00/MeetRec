"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
    LayoutDashboard,
    Bot,
    Video,
    FileText,
    LogOut,
    ChevronRight,
} from "lucide-react";

const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/bots", icon: Bot, label: "Recall Bots" },
    { href: "/jitsi", icon: Video, label: "Jitsi Meet" },
    { href: "/recordings", icon: Video, label: "Recordings" },
    { href: "/transcripts", icon: FileText, label: "Transcripts" },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();

    return (
        <aside
            style={{
                width: "240px",
                minHeight: "100vh",
                background: "var(--sidebar-bg)",
                borderRight: "1px solid var(--border)",
                display: "flex",
                flexDirection: "column",
                flexShrink: 0,
                position: "sticky",
                top: 0,
                height: "100vh",
                boxShadow: "1px 0 0 rgba(15,23,42,0.06)",
            }}
        >
            {/* Logo */}
            <div
                style={{
                    padding: "24px 20px 20px",
                    borderBottom: "1px solid var(--border)",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                        style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "10px",
                            background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 4px 12px rgba(59,130,246,0.3)",
                        }}
                    >
                        <Video size={18} color="white" />
                    </div>
                    <div>
                        <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>MeetRec</div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Meeting Hub</div>
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: "2px" }}>
                <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", padding: "8px 10px 6px" }}>
                    Menu
                </div>
                {navItems.map(({ href, icon: Icon, label }) => {
                    const isActive = pathname === href;
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={isActive ? "nav-active" : ""}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                padding: "10px 12px",
                                borderRadius: "10px",
                                fontSize: "14px",
                                fontWeight: isActive ? 600 : 400,
                                color: isActive ? "#2563eb" : "var(--text-secondary)",
                                textDecoration: "none",
                                transition: "all 0.15s ease",
                                borderLeft: isActive ? "2px solid #3b82f6" : "2px solid transparent",
                                background: isActive ? "rgba(59,130,246,0.08)" : "transparent",
                            }}
                            onMouseEnter={(e) => {
                                if (!isActive) {
                                    (e.currentTarget as HTMLAnchorElement).style.background = "var(--bg-secondary)";
                                    (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-primary)";
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive) {
                                    (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                                    (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-secondary)";
                                }
                            }}
                        >
                            <Icon size={17} />
                            <span style={{ flex: 1 }}>{label}</span>
                            {isActive && <ChevronRight size={14} style={{ opacity: 0.4 }} />}
                        </Link>
                    );
                })}
            </nav>

            {/* User + sign out */}
            <div
                style={{
                    padding: "16px",
                    borderTop: "1px solid var(--border)",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                    {session?.user?.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={session.user.image}
                            alt="avatar"
                            style={{ width: "32px", height: "32px", borderRadius: "50%", border: "2px solid rgba(59,130,246,0.25)" }}
                        />
                    ) : (
                        <div
                            style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "50%",
                                background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "13px",
                                fontWeight: 700,
                                color: "white",
                            }}
                        >
                            {session?.user?.name?.charAt(0) ?? "U"}
                        </div>
                    )}
                    <div style={{ overflow: "hidden" }}>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {session?.user?.name ?? "User"}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {session?.user?.email ?? ""}
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "9px 12px",
                        background: "rgba(239,68,68,0.06)",
                        border: "1px solid rgba(239,68,68,0.12)",
                        borderRadius: "8px",
                        color: "#dc2626",
                        fontSize: "13px",
                        fontWeight: 500,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.1)";
                    }}
                    onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.06)";
                    }}
                >
                    <LogOut size={14} />
                    Sign Out
                </button>
            </div>
        </aside>
    );
}
