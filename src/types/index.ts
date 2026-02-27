import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
    interface Session {
        access_token: string;
        refresh_token: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        access_token?: string;
        refresh_token?: string;
        expires_at?: number;
    }
}

// ─── Recall.ai Bot Types ──────────────────────────────────────────────────────

export type BotStatusCode =
    | "ready"
    | "joining_call"
    | "in_waiting_room"
    | "in_call_not_recording"
    | "in_call_recording"
    | "call_ended"
    | "done"
    | "fatal"
    | "analysis_done";

export interface BotStatus {
    code: BotStatusCode;
    message?: string;
    created_at?: string;
}

export interface RecordingFile {
    id: string;
    created_at: string;
    is_default: boolean;
    recording_id: string;
    download_url?: string | null;
    file_size?: number | null;
    started_at?: string | null;
    ended_at?: string | null;
    duration?: number | null;
}

export interface BotRecording {
    id: string;
    started_at: string | null;
    completed_at: string | null;
    expires_at: string | null;
    created_at: string;
    media_shortcuts: {
        video_mixed?: { data: { download_url: string | null } };
        audio_mixed?: { data: { download_url: string | null } };
    };
}

export interface BotMeetingUrl {
    meeting_id: string;
    platform: string;
}

export interface Bot {
    id: string;
    /** Recall.ai returns the original URL string on creation,
     *  but {meeting_id, platform} on list/get responses. */
    meeting_url: string | BotMeetingUrl;
    bot_name: string;
    status_changes: BotStatus[];
    join_at: string | null;
    recordings: BotRecording[];
    created_at: string;
    started_at: string | null;
    ended_at: string | null;
}

/** Safely extracts a full URL from either form of meeting_url */
export function getMeetingUrl(bot: Bot): string {
    if (typeof bot.meeting_url === "string") return bot.meeting_url;
    const { meeting_id, platform } = bot.meeting_url;
    switch (platform) {
        case "google_meet":
            return `https://meet.google.com/${meeting_id}`;
        case "zoom":
            return `https://zoom.us/j/${meeting_id}`;
        case "microsoft_teams":
            return `https://teams.microsoft.com/l/meetup-join/${meeting_id}`;
        default:
            // Fallback: return the meeting_id as-is (at least shows something)
            return meeting_id;
    }
}

export interface TranscriptTimestamp {
    relative: number;
    absolute: string;
}

export interface TranscriptWord {
    text: string;
    start_timestamp: TranscriptTimestamp | number;
    end_timestamp: TranscriptTimestamp | number;
    confidence?: number;
}

export interface TranscriptParticipant {
    id: number;
    name: string;
    is_host: boolean;
    platform: string;
    extra_data: any;
}

export interface TranscriptEntry {
    speaker: string;
    participant?: TranscriptParticipant;
    words: TranscriptWord[];
    is_final: boolean;
    start_timestamp: TranscriptTimestamp | number;
    end_timestamp: TranscriptTimestamp | number;
    language: string | null;
    original_transcript_id: string;
    text?: string;
}

export interface SendBotPayload {
    meeting_url: string;
    bot_name?: string;
    join_at?: string;
}
