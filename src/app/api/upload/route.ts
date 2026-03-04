import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

// Simple UUID alternative for Edge/Node 18+ without depending on 'uuid' package
const generateUUID = () => crypto.randomUUID();

export async function POST(request: Request) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;
        const roomName = formData.get("roomName") as string;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Save to public/uploads directory
        const uploadDir = join(process.cwd(), "public", "uploads");
        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (e) {
            // Ignore if directory exists
        }

        const fileExtension = file.name.split('.').pop() || 'webm';
        const fileName = `${generateUUID()}.${fileExtension}`;
        const filePath = join(uploadDir, fileName);

        await writeFile(filePath, buffer);

        const videoUrl = `/uploads/${fileName}`;

        let durationSec = 0;
        try {
            const { getVideoDuration } = await import('@/lib/transcribe');
            durationSec = await getVideoDuration(filePath);
        } catch (err) {
            console.error("Failed to get duration:", err);
        }

        const startedAt = new Date();
        const completedAt = new Date(startedAt.getTime() + (durationSec * 1000));

        // Create a custom bot-like object to represent this manual upload
        const manualUploadData = {
            id: `manual_${generateUUID()}`,
            bot_name: "Manual Upload",
            created_at: startedAt.toISOString(),
            status_changes: [{ code: "done", created_at: startedAt.toISOString() }],
            meeting_url: roomName ? `https://jitsi.manajio.com/${roomName}` : "Manual Upload",
            recordings: [
                {
                    started_at: startedAt.toISOString(),
                    completed_at: completedAt.toISOString(),
                    media_shortcuts: {
                        video_mixed: {
                            data: {
                                download_url: videoUrl
                            }
                        }
                    }
                }
            ],
            is_manual_upload: true // Custom flag
        };

        // In a real app, we would save this to a database.
        // For now, since we fetch directly from recall API, we need to store 
        // local uploads somewhere. Let's save them to a local JSON file.
        const dbDir = join(process.cwd(), "data");
        try {
            await mkdir(dbDir, { recursive: true });
        } catch (e) { }

        const dbPath = join(dbDir, "manual_uploads.json");
        let uploads = [];
        try {
            const fileData = await require("fs/promises").readFile(dbPath, "utf-8");
            uploads = JSON.parse(fileData);
        } catch (e) {
            // File doesn't exist yet
        }

        uploads.push(manualUploadData);
        await writeFile(dbPath, JSON.stringify(uploads, null, 2));

        // Trigger transcription (awaited so it doesn't get killed by Next.js edge/serverless container)
        try {
            const { processManualUploadTranscription } = await import('@/lib/transcribe');
            await processManualUploadTranscription(manualUploadData.id, videoUrl);
        } catch (err: any) {
            console.error("Transcription failed during upload:", err);
            try {
                await require("fs/promises").writeFile(
                    join(process.cwd(), "tmp", "transcription_err.log"),
                    String(err) + (err.stack ? '\n' + err.stack : '')
                );
            } catch (e) { }
            // We ignore it here so the upload still succeeds
        }

        return NextResponse.json({ success: true, entry: manualUploadData });

    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Failed to upload video" }, { status: 500 });
    }
}
