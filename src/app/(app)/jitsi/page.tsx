"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Video, LogOut } from "lucide-react";
import { format } from "date-fns";

export default function JitsiPage() {
    const [roomName, setRoomName] = useState("");
    const [userName, setUserName] = useState("");
    const [joined, setJoined] = useState(false);
    const jitsiContainerRef = useRef<HTMLDivElement>(null);
    const apiRef = useRef<any>(null); // JitsiMeetExternalAPI instance
    const [scriptLoaded, setScriptLoaded] = useState(false);

    useEffect(() => {
        // Load the external api script if it doesn't exist
        const scriptId = "jitsi-external-api";
        if (document.getElementById(scriptId)) {
            setScriptLoaded(true);
            return;
        }

        const script = document.createElement("script");
        script.id = scriptId;
        script.src = "https://jitsi.manajio.com/external_api.js";
        script.onload = () => setScriptLoaded(true);
        script.onerror = () => {
            console.error("Failed to load Jitsi API script");
            // Optional: you could set an error state here
        };
        document.body.appendChild(script);

        return () => {
            if (apiRef.current) {
                apiRef.current.dispose();
            }
        };
    }, []);

    const handleJoin = (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!roomName.trim() || !scriptLoaded) return;

        setJoined(true);

        // Wait for next tick so the container is available
        setTimeout(() => {
            // Check if the API was successfully loaded onto the window object
            // @ts-ignore
            if (typeof window.JitsiMeetExternalAPI !== "function") {
                alert("Gagal memuat Jitsi API. Sepertinya koneksi internet kamu memblokir script Jitsi (ERR_CONNECTION_RESET). Silakan gunakan VPN atau ganti koneksi internet.");
                setJoined(false);
                return;
            }

            if (jitsiContainerRef.current) {
                const domain = "jitsi.manajio.com";
                const options = {
                    roomName: roomName.trim(),
                    width: "100%",
                    height: "100%",
                    parentNode: jitsiContainerRef.current,
                    userInfo: {
                        displayName: userName.trim() || undefined,
                    },
                    configOverwrite: {
                        startWithAudioMuted: true,
                        startWithVideoMuted: true,
                        toolbarButtons: [
                            'camera', 'chat', 'closedcaptions', 'desktop',
                            'fullscreen', 'hangup', 'highlight', 'microphone',
                            'participants-pane', 'profile', 'raisehand',
                            'recording', 'security', 'select-background',
                            'settings', 'shareaudio', 'sharevideo', 'toggle-camera'
                        ],
                    },
                    interfaceConfigOverwrite: {
                        TOOLBAR_BUTTONS: [
                            'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
                            'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
                            'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
                            'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
                            'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone', 'security'
                        ],
                    }
                };

                // Use the loaded API
                // @ts-ignore
                apiRef.current = new window.JitsiMeetExternalAPI(domain, options);
            }
        }, 100);
    };

    const handleLeave = () => {
        if (apiRef.current) {
            apiRef.current.dispose();
            apiRef.current = null;
        }
        setJoined(false);
    };

    return (
        <div style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column" }}>
            {joined ? (
                // In-Meeting View
                <div style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100%", position: "absolute", top: 0, left: 0, zIndex: 50, background: "#000" }}>
                    <div style={{ padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #333", background: "#111" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "white" }}>
                            <Video size={20} color="#3b82f6" />
                            <h2 style={{ fontSize: "16px", fontWeight: 600, margin: 0 }}>{roomName}</h2>
                            <span className="badge badge-info" style={{ marginLeft: "10px" }}>jitsi.manajio.com</span>
                        </div>
                        <button
                            onClick={handleLeave}
                            style={{
                                display: "flex", alignItems: "center", gap: "8px",
                                background: "#ef4444", border: "1px solid #dc2626",
                                color: "white", padding: "8px 16px", borderRadius: "8px",
                                cursor: "pointer", fontWeight: 600, fontSize: "14px",
                            }}
                        >
                            <LogOut size={16} /> Leave
                        </button>
                    </div>
                    {/* The div where Jitsi injects its iframe */}
                    <div
                        ref={jitsiContainerRef}
                        style={{ flex: 1, width: "100%", height: "100%", background: "#000" }}
                    />
                </div>
            ) : (
                // Join View
                <div className="responsive-container">
                    <div className="centered-header fade-in">
                        <div style={{ display: "inline-flex", background: "rgba(59,130,246,0.1)", borderRadius: "16px", padding: "12px", marginBottom: "16px", marginTop: "20px" }}>
                            <Video size={36} color="#3b82f6" />
                        </div>
                        <h1 className="page-title" style={{ fontSize: "28px" }}>Join Jitsi Meet</h1>
                        <p className="page-subtitle" style={{ fontSize: "15px" }}>
                            Enter a room name to join or create a video conference on <strong>jitsi.manajio.com</strong>
                        </p>
                    </div>

                    <div className="responsive-card fade-in">
                        <form onSubmit={handleJoin} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            <div>
                                <label className="input-label" style={{ fontSize: "14px", fontWeight: 500 }}>Room Name *</label>
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

                            <button
                                type="submit"
                                className="btn-primary"
                                style={{
                                    marginTop: "12px", padding: "14px", fontSize: "15px",
                                    fontWeight: 600, justifyContent: "center",
                                    opacity: (!roomName.trim() || !scriptLoaded) ? 0.6 : 1,
                                    cursor: (!roomName.trim() || !scriptLoaded) ? "not-allowed" : "pointer"
                                }}
                                disabled={!roomName.trim() || !scriptLoaded}
                            >
                                {!scriptLoaded ? (
                                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Loading SDK...
                                    </span>
                                ) : "Join Meeting"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
