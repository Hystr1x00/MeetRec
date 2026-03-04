"use client";

import { useState } from "react";
import { UploadCloud, FileVideo, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function UploadPage() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [roomName, setRoomName] = useState("");
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<{ type: "success" | "error"; msg: string } | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setResult(null);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setUploading(true);
        setResult(null);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("roomName", roomName);

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Upload failed");
            }

            setResult({ type: "success", msg: "Video berhasil diupload dan Transkrip sedang diproses! File akan muncul di menu Recordings dan Transcripts." });
            setFile(null);
            setRoomName("");

            // Redirect to recordings after a short delay
            setTimeout(() => {
                router.push("/recordings");
            }, 3000);

        } catch (error) {
            setResult({ type: "error", msg: error instanceof Error ? error.message : "Terjadi kesalahan" });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="responsive-container">
            <div className="centered-header fade-in">
                <div style={{ display: "inline-flex", background: "rgba(99,102,241,0.1)", borderRadius: "16px", padding: "12px", marginBottom: "16px", marginTop: "20px" }}>
                    <UploadCloud size={36} color="#6366f1" />
                </div>
                <h1 className="page-title" style={{ fontSize: "28px" }}>Upload Recording</h1>
                <p className="page-subtitle" style={{ fontSize: "15px" }}>
                    Rekam meeting secara lokal di Jitsi, lalu upload ke sini untuk menghasilkan Transkrip otomatis menggunakan AI.
                </p>
            </div>

            <div className="responsive-card fade-in" style={{ maxWidth: "500px", margin: "0 auto" }}>
                <form onSubmit={handleUpload} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

                    {/* File Dropzone / Input */}
                    <div>
                        <label className="input-label" style={{ fontSize: "14px", fontWeight: 500 }}>Pilih File Video *</label>
                        <div style={{
                            border: "2px dashed var(--border)",
                            borderRadius: "12px",
                            padding: "32px",
                            textAlign: "center",
                            background: "var(--bg-secondary)",
                            cursor: "pointer",
                            position: "relative",
                            transition: "all 0.2s"
                        }}>
                            <input
                                type="file"
                                accept="video/mp4,video/webm,video/x-matroska"
                                required
                                onChange={handleFileChange}
                                style={{
                                    position: "absolute",
                                    top: 0, left: 0, width: "100%", height: "100%",
                                    opacity: 0, cursor: "pointer"
                                }}
                            />
                            {file ? (
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                                    <div style={{ background: "rgba(16,185,129,0.1)", padding: "12px", borderRadius: "50%" }}>
                                        <FileVideo size={28} color="#10b981" />
                                    </div>
                                    <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{file.name}</div>
                                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{(file.size / (1024 * 1024)).toFixed(2)} MB</div>
                                    <span style={{ fontSize: "12px", color: "#3b82f6", marginTop: "8px" }}>Klik untuk mengganti file</span>
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                                    <UploadCloud size={32} color="var(--text-muted)" />
                                    <div style={{ fontWeight: 500, color: "var(--text-primary)" }}>Klik atau drag file ke sini</div>
                                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Format yang didukung: MP4, WEBM, MKV</div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="input-label" style={{ fontSize: "14px", fontWeight: 500 }}>Nama Room Jitsi (Opsional)</label>
                        <input
                            className="input"
                            style={{ padding: "12px", fontSize: "15px" }}
                            placeholder="e.g. WeeklyStandup"
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value.replace(/\s+/g, '-'))}
                        />
                    </div>

                    {result && (
                        <div style={{
                            padding: "12px 14px",
                            background: result.type === "success" ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.06)",
                            border: `1px solid ${result.type === "success" ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.15)"}`,
                            borderRadius: "10px",
                            color: result.type === "success" ? "#059669" : "#dc2626",
                            fontSize: "13px", display: "flex", alignItems: "flex-start", gap: "8px"
                        }}>
                            {result.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                            <div>{result.msg}</div>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn-primary"
                        style={{
                            marginTop: "12px", padding: "14px", fontSize: "15px",
                            fontWeight: 600, justifyContent: "center",
                            opacity: (!file || uploading) ? 0.6 : 1,
                            cursor: (!file || uploading) ? "not-allowed" : "pointer"
                        }}
                        disabled={!file || uploading}
                    >
                        {uploading ? (
                            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Mengupload & Ekstrak Transkrip...
                            </span>
                        ) : "Upload Video"}
                    </button>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", textAlign: "center", marginTop: "-8px" }}>
                        Menyertakan teks AI mungkin membutuhkan waktu 10-20 detik bergantung ukuran video.
                    </p>
                </form>
            </div>
        </div>
    );
}
