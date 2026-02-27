import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { recallGet, RecallApiError } from "@/lib/recall";
import { TranscriptEntry, TranscriptWord, TranscriptTimestamp } from "@/types";

interface RecallTranscriptListResponse {
    results: any[];
    count?: number;
    next?: string | null;
}

/** Safely extracts a numeric timestamp (relative seconds) from a v2 object or number */
function getTs(ts: TranscriptTimestamp | number | undefined): number {
    if (ts === undefined) return 0;
    if (typeof ts === "number") return ts;
    return ts.relative ?? 0;
}

// GET /api/bots/[id]/transcript — get transcript entries for a bot
export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // ── Final Robust v2 Approach ───────────────────────────────────────────
    // 1. Get the bot's direct detail to discover ITS specific recordings.
    const botDetailPath = `/bot/${id}/`;

    try {
        const botData = await recallGet<any>(botDetailPath);

        let utterances: any[] = [];

        // 2. Look for the latest recording that has a transcript shortcut
        const latestRecording = (botData.recordings || [])
            .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .find((r: any) => r.media_shortcuts?.transcript?.data?.download_url);

        if (latestRecording) {
            const downloadUrl = latestRecording.media_shortcuts.transcript.data.download_url;
            console.log(`[api/transcript] Following bot-specific download_url: ${downloadUrl}`);
            const res = await fetch(downloadUrl);
            if (res.ok) {
                utterances = await res.json();
            }
        } else {
            // 3. Fallback: If no S3 link in recordings, try the workspace-wide search but filter strictly.
            console.log(`[api/transcript] No S3 link in bot recordings. Trying fallback search for ${id}`);
            const searchData = await recallGet<RecallTranscriptListResponse>(`/transcript/?bot_id=${id}`);
            const record = (searchData.results || []).find(r => r.data?.download_url && (r.id === id || r.data.download_url.includes(id)));
            if (record) {
                const res = await fetch(record.data.download_url);
                if (res.ok) utterances = await res.json();
            }
        }

        // Normalize for frontend compatibility
        const normalized = utterances.map((entry: any) => {
            let start = getTs(entry.start_time ?? entry.start_timestamp);
            let end = getTs(entry.end_time ?? entry.end_timestamp);

            // Correct timestamps from words if necessary
            if (start === 0 && entry.words?.length > 0) {
                start = getTs(entry.words[0].start_time ?? entry.words[0].start_timestamp);
            }
            if (end === 0 && entry.words?.length > 0) {
                end = getTs(entry.words[entry.words.length - 1].end_time ?? entry.words[entry.words.length - 1].end_timestamp);
            }

            let speakerName = "Unknown Speaker";
            if (entry.participant && typeof entry.participant === "object") {
                speakerName = entry.participant.name || entry.participant.display_name || `Speaker ${entry.participant.id || ""}`;
            } else if (typeof entry.speaker === "string" && entry.speaker.trim()) {
                speakerName = entry.speaker;
            } else if (typeof entry.participant === "string") {
                speakerName = entry.participant;
            }

            const words: TranscriptWord[] = (entry.words || []).map((word: any) => ({
                text: word.text || "",
                start_timestamp: getTs(word.start_time ?? word.start_timestamp),
                end_timestamp: getTs(word.end_time ?? word.end_timestamp),
                confidence: word.confidence
            }));

            if (words.length === 0 && entry.text) {
                words.push({ text: entry.text, start_timestamp: start, end_timestamp: end });
            }

            return {
                speaker: speakerName,
                words,
                is_final: entry.is_final ?? true,
                start_timestamp: start,
                end_timestamp: end,
                language: entry.language ?? null,
                original_transcript_id: entry.id || ""
            };
        });

        return NextResponse.json({ entries: normalized });
    } catch (error) {
        if (error instanceof RecallApiError && error.status === 404) {
            return NextResponse.json({ entries: [] });
        }
        const message = error instanceof Error ? error.message : "Failed to fetch transcript";
        console.error("[api/bots/transcript] GET error:", message);
        return NextResponse.json({ error: message, entries: [] }, { status: 500 });
    }
}
